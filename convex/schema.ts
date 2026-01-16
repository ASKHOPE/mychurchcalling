import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// SCHEMA VALIDATION DISABLED - Clear sundayAssignments table in dashboard, then re-enable
export default defineSchema({
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(),
        email: v.optional(v.string()),
        picture: v.optional(v.string()),
        role: v.optional(v.string()),
        calling: v.optional(v.string()),
    }).index("by_token", ["tokenIdentifier"]),

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

    hymnIndex: defineTable({
        number: v.number(),
        title: v.string(),
        category: v.string(),
        url: v.optional(v.string()),
        isFavorite: v.optional(v.boolean()),
    })
        .index("by_number", ["number"])
        .index("by_category", ["category"]),

    cfmIndex: defineTable({
        year: v.number(),
        weekNumber: v.number(),
        weekRange: v.string(),
        scriptureBlock: v.string(),
        lessonTitle: v.string(),
        url: v.string(),
        book: v.optional(v.string()),
    })
        .index("by_year", ["year"])
        .index("by_year_week", ["year", "weekNumber"]),

    gospelPrinciplesIndex: defineTable({
        number: v.number(),
        title: v.string(),
        url: v.string(),
        category: v.optional(v.string()),
    })
        .index("by_number", ["number"]),

    conferenceTalkIndex: defineTable({
        title: v.string(),
        speaker: v.string(),
        conferenceSession: v.string(),
        year: v.number(),
        month: v.string(),
        url: v.string(),
        topic: v.optional(v.string()),
    })
        .index("by_year", ["year"])
        .index("by_speaker", ["speaker"]),

    delegationIndex: defineTable({
        calling: v.string(),
        assignedPerson: v.string(),
        organization: v.string(),
        startDate: v.optional(v.string()),
        notes: v.optional(v.string()),
        permissions: v.array(v.string()),
        isActive: v.boolean(),
    })
        .index("by_calling", ["calling"])
        .index("by_organization", ["organization"]),

    // Use v.any() temporarily to allow old data
    sundayAssignments: defineTable({
        year: v.number(),
        month: v.number(),
        monthName: v.optional(v.string()),
        sundayNumber: v.number(),
        date: v.string(),
        weekRange: v.optional(v.string()),
        hymns: v.optional(v.any()),
        sacrament: v.optional(v.any()),
        sacramentMeeting: v.optional(v.any()),
        talks: v.optional(v.any()),
        speakers: v.optional(v.any()),
        sundaySchool: v.optional(v.any()),
        eldersQuorum: v.optional(v.any()),
        elderQuorum: v.optional(v.any()),
        reliefSociety: v.optional(v.any()),
        youngWomen: v.optional(v.any()),
        youngMen: v.optional(v.any()),
        primary: v.optional(v.any()),
        status: v.string(),
        createdBy: v.optional(v.string()),
        updatedBy: v.optional(v.string()),
        updatedAt: v.number(),
        notes: v.optional(v.string()),
    })
        .index("by_date", ["date"])
        .index("by_year_month", ["year", "month"])
        .index("by_status", ["status"]),

    messages: defineTable({
        body: v.string(),
        author: v.string(),
        userId: v.optional(v.id("users")),
    }).index("by_user", ["userId"]),

    roles: defineTable({
        name: v.string(),
        description: v.string(),
        permissions: v.array(v.string()),
    }).index("by_name", ["name"]),

    callings: defineTable({
        name: v.string(),
        category: v.string(),
    }).index("by_name", ["name"]),

    recycleBin: defineTable({
        type: v.string(),
        originalId: v.string(),
        data: v.any(),
        deletedAt: v.number(),
        deletedBy: v.string(),
        expiresAt: v.number(),
    }).index("by_type", ["type"]).index("by_expires", ["expiresAt"]),

    auditLogs: defineTable({
        action: v.string(),
        actor: v.string(),
        target: v.string(),
        description: v.string(),
        timestamp: v.number(),
        metadata: v.optional(v.any()),
    }).index("by_timestamp", ["timestamp"]),

    // Old hymns table (for compatibility)
    hymns: defineTable({
        number: v.number(),
        title: v.string(),
        category: v.string(),
        url: v.optional(v.string()),
        isFavorite: v.optional(v.boolean()),
    }),

    // Old members table
    members: defineTable({
        name: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        callings: v.optional(v.array(v.string())),
        isActive: v.optional(v.boolean()),
        notes: v.optional(v.string()),
    }),

    // Old CFM lessons
    cfmLessons: defineTable({
        year: v.number(),
        week: v.number(),
        title: v.string(),
        scripture: v.string(),
        dateRange: v.string(),
        summary: v.optional(v.string()),
    }),

    announcementsIndex: defineTable({
        content: v.string(),
        type: v.string(), // "recurring" | "specific"
        targetDate: v.optional(v.string()), // YYYY-MM-DD
        active: v.boolean(),
        category: v.optional(v.string()),
    }).index("by_type", ["type"]).index("by_active", ["active"]),

    meetingTypesIndex: defineTable({
        name: v.string(),
        label: v.string(),
        icon: v.optional(v.string()),
        subtypes: v.optional(v.array(v.string())),
        active: v.boolean(),
    }).index("by_name", ["name"]),
});
