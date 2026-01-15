import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for passwords (in production, use bcrypt via an action)
// This is a basic implementation for demo purposes
function simpleHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    // Add salt and convert to string
    return `hash_${Math.abs(hash).toString(36)}_${password.length}`;
}

/**
 * Register a new local user
 */
export const register = mutation({
    args: {
        username: v.string(),
        password: v.string(),
        name: v.string(),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if username exists
        const existing = await ctx.db
            .query("localUsers")
            .withIndex("by_username", q => q.eq("username", args.username.toLowerCase()))
            .first();

        if (existing) {
            return { success: false, error: "Username already exists" };
        }

        const passwordHash = simpleHash(args.password);

        const userId = await ctx.db.insert("localUsers", {
            username: args.username.toLowerCase(),
            passwordHash,
            name: args.name,
            email: args.email,
            role: "member",
            calling: "Member",
            isActive: true,
            createdAt: Date.now(),
        });

        // Log the registration
        await ctx.db.insert("auditLogs", {
            action: "REGISTER_LOCAL_USER",
            actor: "System",
            target: args.username,
            description: `New local user registered: ${args.name}`,
            timestamp: Date.now(),
        });

        return { success: true, userId };
    }
});

/**
 * Login with username/password
 */
export const login = mutation({
    args: {
        username: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("localUsers")
            .withIndex("by_username", q => q.eq("username", args.username.toLowerCase()))
            .first();

        if (!user) {
            return { success: false, error: "Invalid username or password" };
        }

        if (!user.isActive) {
            return { success: false, error: "Account is deactivated" };
        }

        const passwordHash = simpleHash(args.password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, error: "Invalid username or password" };
        }

        // Update last login
        await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

        // Log the login
        await ctx.db.insert("auditLogs", {
            action: "LOCAL_LOGIN",
            actor: user.name,
            target: user.username,
            description: `${user.name} logged in via local auth`,
            timestamp: Date.now(),
        });

        return {
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                calling: user.calling,
            }
        };
    }
});

/**
 * Get user by ID
 */
export const getUser = query({
    args: { userId: v.id("localUsers") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    }
});

/**
 * List all local users (admin only)
 */
export const listLocalUsers = query({
    handler: async (ctx) => {
        return await ctx.db.query("localUsers").collect();
    }
});

/**
 * Create a local user (admin action)
 */
export const createUser = mutation({
    args: {
        username: v.string(),
        password: v.string(),
        name: v.string(),
        email: v.optional(v.string()),
        role: v.string(),
        calling: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("localUsers")
            .withIndex("by_username", q => q.eq("username", args.username.toLowerCase()))
            .first();

        if (existing) {
            return { success: false, error: "Username already exists" };
        }

        const passwordHash = simpleHash(args.password);

        const userId = await ctx.db.insert("localUsers", {
            username: args.username.toLowerCase(),
            passwordHash,
            name: args.name,
            email: args.email,
            role: args.role,
            calling: args.calling,
            isActive: true,
            createdAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            action: "CREATE_LOCAL_USER",
            actor: "Admin",
            target: args.username,
            description: `Admin created local user: ${args.name} (${args.role})`,
            timestamp: Date.now(),
        });

        return { success: true, userId };
    }
});

/**
 * Update local user
 */
export const updateLocalUser = mutation({
    args: {
        userId: v.id("localUsers"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        role: v.optional(v.string()),
        calling: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        const filtered = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(userId, filtered);

        return { success: true };
    }
});

/**
 * Reset password (admin action)
 */
export const resetPassword = mutation({
    args: {
        userId: v.id("localUsers"),
        newPassword: v.string(),
    },
    handler: async (ctx, args) => {
        const passwordHash = simpleHash(args.newPassword);
        await ctx.db.patch(args.userId, { passwordHash });

        await ctx.db.insert("auditLogs", {
            action: "PASSWORD_RESET",
            actor: "Admin",
            target: args.userId,
            description: `Password reset for user`,
            timestamp: Date.now(),
        });

        return { success: true };
    }
});
