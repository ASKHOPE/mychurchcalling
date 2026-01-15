import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(),
        email: v.optional(v.string()),
        picture: v.optional(v.string()),
        role: v.optional(v.string()),
        calling: v.optional(v.string()),
    }).index("by_token", ["tokenIdentifier"]),

    // Local user accounts (username/password based)
    localUsers: defineTable({
        username: v.string(),
        passwordHash: v.string(), // bcrypt hash
        email: v.optional(v.string()),
        name: v.string(),
        role: v.string(),
        calling: v.string(),
        isActive: v.boolean(),
        createdAt: v.number(),
        lastLoginAt: v.optional(v.number()),
    }).index("by_username", ["username"]),

    messages: defineTable({
        body: v.string(),
        author: v.string(),
        userId: v.optional(v.id("users")),
    }).index("by_user", ["userId"]),

    // Dynamic Application Roles/Permissions
    roles: defineTable({
        name: v.string(),
        description: v.string(),
        permissions: v.array(v.string()),
    }).index("by_name", ["name"]),

    // Church Callings (Ministries)
    callings: defineTable({
        name: v.string(),
        category: v.string(),
    }).index("by_name", ["name"]),

    // For soft-deleted items (Users, etc.)
    recycleBin: defineTable({
        type: v.string(),
        originalId: v.string(),
        data: v.any(),
        deletedAt: v.number(),
        deletedBy: v.string(),
        expiresAt: v.number(),
    }).index("by_type", ["type"]).index("by_expires", ["expiresAt"]),

    // System event log (Audit Trail)
    auditLogs: defineTable({
        action: v.string(),
        actor: v.string(),
        target: v.string(),
        description: v.string(),
        timestamp: v.number(),
        metadata: v.optional(v.any()),
    }).index("by_timestamp", ["timestamp"]),
});
