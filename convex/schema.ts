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

    messages: defineTable({
        body: v.string(),
        author: v.string(),
        userId: v.optional(v.id("users")),
    }).index("by_user", ["userId"]),

    // Dynamic Application Roles/Permissions
    roles: defineTable({
        name: v.string(), // e.g. "admin", "leader"
        description: v.string(),
        permissions: v.array(v.string()), // e.g. ["manage_users", "view_logs"]
    }).index("by_name", ["name"]),

    // Church Callings (Ministries)
    callings: defineTable({
        name: v.string(), // e.g. "Bishop"
        category: v.string(), // e.g. "Priesthood", "Relief Society"
    }).index("by_name", ["name"]),

    // For soft-deleted items (Users, etc.)
    recycleBin: defineTable({
        type: v.string(), // "user"
        originalId: v.string(), // WorkOS ID or Convex ID
        data: v.any(), // Serialized object data
        deletedAt: v.number(), // Timestamp
        deletedBy: v.string(), // Admin name/email
        expiresAt: v.number(), // deletedAt + 30 days
    }).index("by_type", ["type"]).index("by_expires", ["expiresAt"]),

    // System event log (Audit Trail)
    auditLogs: defineTable({
        action: v.string(), // "CREATE_USER", "UPDATE_ROLE", "ARCHIVE_USER", etc.
        actor: v.string(), // Who did it
        target: v.string(), // What was changed
        description: v.string(), // Human readable change
        timestamp: v.number(),
        metadata: v.optional(v.any()), // JSON of changes
    }).index("by_timestamp", ["timestamp"]),
});
