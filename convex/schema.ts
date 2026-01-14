import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(), // Extracted from WorkOS token
        email: v.optional(v.string()),
        picture: v.optional(v.string()),
    }).index("by_token", ["tokenIdentifier"]),

    messages: defineTable({
        body: v.string(),
        author: v.string(),
        userId: v.optional(v.id("users")),
    }).index("by_user", ["userId"]),
});
