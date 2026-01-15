import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// SUNDAY ASSIGNMENTS CRUD
// ============================================

/**
 * Get all assignments for a specific month/year
 */
export const getByMonth = query({
    args: { year: v.number(), month: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sundayAssignments")
            .withIndex("by_year_month", q => q.eq("year", args.year).eq("month", args.month))
            .collect();
    },
});

/**
 * Get assignment by specific date
 */
export const getByDate = query({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sundayAssignments")
            .withIndex("by_date", q => q.eq("date", args.date))
            .first();
    },
});

/**
 * Get all assignments for a year
 */
export const getByYear = query({
    args: { year: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sundayAssignments")
            .filter(q => q.eq(q.field("year"), args.year))
            .collect();
    },
});

/**
 * Get upcoming assignments (next 4 weeks)
 */
export const getUpcoming = query({
    handler: async (ctx) => {
        const today = new Date().toISOString().split('T')[0];
        return await ctx.db
            .query("sundayAssignments")
            .withIndex("by_date")
            .filter(q => q.gte(q.field("date"), today))
            .order("asc")
            .take(4);
    },
});

/**
 * Create a new Sunday assignment
 */
export const create = mutation({
    args: {
        year: v.number(),
        month: v.number(),
        sundayNumber: v.number(),
        date: v.string(),
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
                duration: v.optional(v.number()),
            })),
            announcements: v.optional(v.string()),
        }),
        sundaySchool: v.object({
            topic: v.string(),
            scripture: v.optional(v.string()),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
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
        status: v.string(),
        createdBy: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("sundayAssignments", {
            ...args,
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            action: "CREATE_ASSIGNMENT",
            actor: args.createdBy || "Admin",
            target: args.date,
            description: `Created assignment for ${args.date}`,
            timestamp: Date.now(),
        });

        return id;
    },
});

/**
 * Update an existing assignment
 */
export const update = mutation({
    args: {
        id: v.id("sundayAssignments"),
        sacrament: v.optional(v.object({
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
                duration: v.optional(v.number()),
            })),
            announcements: v.optional(v.string()),
        })),
        sundaySchool: v.optional(v.object({
            topic: v.string(),
            scripture: v.optional(v.string()),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),
        elderQuorum: v.optional(v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),
        reliefSociety: v.optional(v.object({
            topic: v.string(),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),
        status: v.optional(v.string()),
        notes: v.optional(v.string()),
        updatedBy: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, updatedBy, ...updates } = args;
        const filtered = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });

        await ctx.db.insert("auditLogs", {
            action: "UPDATE_ASSIGNMENT",
            actor: updatedBy || "Admin",
            target: id,
            description: `Updated assignment`,
            timestamp: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Delete an assignment
 */
export const remove = mutation({
    args: { id: v.id("sundayAssignments") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (assignment) {
            await ctx.db.delete(args.id);
            await ctx.db.insert("auditLogs", {
                action: "DELETE_ASSIGNMENT",
                actor: "Admin",
                target: assignment.date,
                description: `Deleted assignment for ${assignment.date}`,
                timestamp: Date.now(),
            });
        }
        return { success: true };
    },
});

// ============================================
// HYMNS
// ============================================

export const getHymns = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.category) {
            return await ctx.db
                .query("hymns")
                .withIndex("by_category", q => q.eq("category", args.category!))
                .collect();
        }
        return await ctx.db.query("hymns").collect();
    },
});

export const addHymn = mutation({
    args: {
        number: v.number(),
        title: v.string(),
        category: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("hymns", { ...args, isFavorite: false });
    },
});

// ============================================
// COME FOLLOW ME LESSONS
// ============================================

export const getCfmLessons = query({
    args: { year: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("cfmLessons")
            .filter(q => q.eq(q.field("year"), args.year))
            .collect();
    },
});

export const addCfmLesson = mutation({
    args: {
        year: v.number(),
        week: v.number(),
        title: v.string(),
        scripture: v.string(),
        dateRange: v.string(),
        summary: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("cfmLessons", args);
    },
});

// ============================================
// MEMBERS
// ============================================

export const getMembers = query({
    handler: async (ctx) => {
        return await ctx.db.query("members").filter(q => q.eq(q.field("isActive"), true)).collect();
    },
});

export const addMember = mutation({
    args: {
        name: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        callings: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("members", {
            ...args,
            isActive: true,
        });
    },
});

// ============================================
// SEED DATA
// ============================================

export const seedHymns = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("hymns").first();
        if (existing) return { message: "Already seeded" };

        const hymns = [
            { number: 2, title: "The Spirit of God", category: "Opening" },
            { number: 3, title: "Now Let Us Rejoice", category: "Opening" },
            { number: 19, title: "We Thank Thee, O God, for a Prophet", category: "Opening" },
            { number: 26, title: "Joseph Smith's First Prayer", category: "Opening" },
            { number: 169, title: "As Now We Take the Sacrament", category: "Sacrament" },
            { number: 170, title: "God, Our Father, Hear Us Pray", category: "Sacrament" },
            { number: 171, title: "With Humble Heart", category: "Sacrament" },
            { number: 172, title: "'Tis Sweet to Sing the Matchless Love", category: "Sacrament" },
            { number: 173, title: "While of These Emblems We Partake", category: "Sacrament" },
            { number: 174, title: "In Remembrance of Thy Suffering", category: "Sacrament" },
            { number: 175, title: "O God, the Eternal Father", category: "Sacrament" },
            { number: 176, title: "'Tis Sweet To Sing", category: "Sacrament" },
            { number: 116, title: "Come, Follow Me", category: "Closing" },
            { number: 223, title: "Have I Done Any Good?", category: "Closing" },
            { number: 239, title: "Choose the Right", category: "Closing" },
            { number: 301, title: "I Am a Child of God", category: "Special" },
            { number: 85, title: "How Firm a Foundation", category: "Special" },
            { number: 136, title: "I Know That My Redeemer Lives", category: "Special" },
        ];

        for (const hymn of hymns) {
            await ctx.db.insert("hymns", { ...hymn, isFavorite: false });
        }

        return { message: "Seeded hymns" };
    },
});

export const seed2026Assignments = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("sundayAssignments").first();
        if (existing) return { message: "Already has assignments" };

        // Get all Sundays in January 2026
        const sundays2026Jan = [
            { date: "2026-01-04", sundayNumber: 1 },
            { date: "2026-01-11", sundayNumber: 2 },
            { date: "2026-01-18", sundayNumber: 3 },
            { date: "2026-01-25", sundayNumber: 4 },
        ];

        for (const sunday of sundays2026Jan) {
            await ctx.db.insert("sundayAssignments", {
                year: 2026,
                month: 1,
                sundayNumber: sunday.sundayNumber,
                date: sunday.date,
                sacrament: {
                    openingHymn: "The Spirit of God (#2)",
                    sacramentHymn: "O God, the Eternal Father (#175)",
                    closingHymn: "Come, Follow Me (#116)",
                    speakers: [
                        { name: "TBD", topic: "Faith in Christ" }
                    ],
                },
                sundaySchool: {
                    topic: "1 Nephi 1-7",
                    scripture: "Come Follow Me",
                },
                elderQuorum: {
                    topic: "1 Nephi 1-7",
                },
                reliefSociety: {
                    topic: "1 Nephi 1-7",
                },
                status: "draft",
                updatedAt: Date.now(),
            });
        }

        return { message: "Seeded January 2026 assignments" };
    },
});
