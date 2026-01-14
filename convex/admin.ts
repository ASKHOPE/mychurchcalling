import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log a system event.
 */
export const logEvent = mutation({
    args: {
        action: v.string(),
        actor: v.string(),
        target: v.string(),
        description: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("auditLogs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

/**
 * Add an item to the recycle bin.
 */
export const addToBin = mutation({
    args: {
        type: v.string(),
        originalId: v.string(),
        data: v.any(),
        deletedBy: v.string(),
    },
    handler: async (ctx, args) => {
        const deletedAt = Date.now();
        const expiresAt = deletedAt + (30 * 24 * 60 * 60 * 1000); // 30 days

        await ctx.db.insert("recycleBin", {
            ...args,
            deletedAt,
            expiresAt,
        });

        // Log the deletion
        await ctx.db.insert("auditLogs", {
            action: "SOFT_DELETE",
            actor: args.deletedBy,
            target: `${args.type}:${args.originalId}`,
            description: `Moved ${args.type} to bin: ${args.originalId}`,
            timestamp: deletedAt,
        });
    },
});

/**
 * Restore an item from the recycle bin.
 */
export const restoreFromBin = mutation({
    args: { binId: v.id("recycleBin") },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.binId);
        if (!item) throw new Error("Item not found in bin");

        await ctx.db.delete(args.binId);

        await ctx.db.insert("auditLogs", {
            action: "RESTORE",
            actor: "System/Admin",
            target: `${item.type}:${item.originalId}`,
            description: `Restored ${item.type} from bin: ${item.originalId}`,
            timestamp: Date.now(),
        });

        return item.data;
    }
});

/**
 * Get all recycle bin items.
 */
export const getBin = query({
    handler: async (ctx) => {
        return await ctx.db.query("recycleBin").order("desc").collect();
    },
});

/**
 * Get system audit logs.
 */
export const getLogs = query({
    handler: async (ctx) => {
        return await ctx.db.query("auditLogs").order("desc").take(50);
    },
});

/**
 * Cleanup expired items (Cron candidate).
 */
export const cleanupBin = mutation({
    handler: async (ctx) => {
        const now = Date.now();
        const expired = await ctx.db
            .query("recycleBin")
            .withIndex("by_expires")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        for (const item of expired) {
            await ctx.db.delete(item._id);
            await ctx.db.insert("auditLogs", {
                action: "PERMANENT_DELETE_AUTO",
                actor: "System",
                target: `${item.type}:${item.originalId}`,
                description: `Permanently deleted expired ${item.type}: ${item.originalId}`,
                timestamp: now,
            });
        }
        return expired.length;
    },
});
