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
        passwordHash: v.string(),
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

    // ============================================
    // SUNDAY TEACHING ASSIGNMENTS
    // ============================================

    // Sunday Assignments - Main table for each Sunday's assignments
    sundayAssignments: defineTable({
        year: v.number(),                    // 2026
        month: v.number(),                   // 1-12
        sundayNumber: v.number(),            // 1st, 2nd, 3rd, 4th, 5th Sunday
        date: v.string(),                    // "2026-01-05" ISO format

        // Sacrament Meeting
        sacrament: v.object({
            conductingLeader: v.optional(v.string()),
            openingHymn: v.optional(v.string()),
            sacramentHymn: v.optional(v.string()),
            interludeHymn: v.optional(v.string()),
            closingHymn: v.optional(v.string()),
            specialHymn: v.optional(v.string()),
            openingPrayer: v.optional(v.string()),
            closingPrayer: v.optional(v.string()),
            speakers: v.array(v.object({
                name: v.string(),
                topic: v.optional(v.string()),
                duration: v.optional(v.number()), // minutes
            })),
            announcements: v.optional(v.string()),
        }),

        // Sunday School
        sundaySchool: v.object({
            topic: v.string(),               // Come Follow Me topic
            scripture: v.optional(v.string()), // e.g., "1 Nephi 1-7"
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),

        // Quorum/Relief Society Classes
        elderQuorum: v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),

        reliefSociety: v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),

        youngWomen: v.optional(v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),

        youngMen: v.optional(v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),

        primary: v.optional(v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),

        // Metadata
        status: v.string(),                  // "draft", "confirmed", "completed"
        createdBy: v.optional(v.string()),
        updatedAt: v.number(),
        notes: v.optional(v.string()),
    })
        .index("by_date", ["date"])
        .index("by_year_month", ["year", "month"])
        .index("by_status", ["status"]),

    // Hymn Library
    hymns: defineTable({
        number: v.number(),                  // Hymn number
        title: v.string(),
        category: v.string(),                // "Opening", "Sacrament", "Closing", "Special"
        isFavorite: v.optional(v.boolean()),
    }).index("by_number", ["number"]).index("by_category", ["category"]),

    // Come Follow Me Lessons
    cfmLessons: defineTable({
        year: v.number(),
        week: v.number(),
        title: v.string(),
        scripture: v.string(),
        dateRange: v.string(),               // "January 6-12"
        summary: v.optional(v.string()),
    }).index("by_year_week", ["year", "week"]),

    // Member directory (for speaker/teacher assignments)
    members: defineTable({
        name: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        callings: v.array(v.string()),
        isActive: v.boolean(),
        notes: v.optional(v.string()),
    }).index("by_name", ["name"]),

    // ============================================
    // EXISTING TABLES
    // ============================================

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
