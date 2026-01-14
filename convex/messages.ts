import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List the most recent messages.
 * Robust security: In a real app, you might restrict this to authenticated users.
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // In a strict app, you might throw an error here.
            // For now, we allow public read but restrict write.
        }
        return await ctx.db
            .query("messages")
            .order("desc")
            .take(50);
    },
});

/**
 * Send a message.
 * Robust security: Strictly requires an authenticated user.
 */
export const send = mutation({
    args: { body: v.string() },
    handler: async (ctx, { body }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to send message");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        await ctx.db.insert("messages", {
            body,
            author: identity.name ?? "Anonymous",
            userId: user?._id,
        });
    },
});
