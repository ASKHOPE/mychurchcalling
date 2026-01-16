import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// SUNDAY ASSIGNMENTS - FULL CRUD
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
        monthName: v.string(),
        sundayNumber: v.number(),
        date: v.string(),
        weekRange: v.string(),
        hymns: v.object({
            opening: v.optional(v.object({
                hymnNumber: v.number(),
                title: v.string(),
                url: v.optional(v.string()),
            })),
            sacrament: v.optional(v.object({
                hymnNumber: v.number(),
                title: v.string(),
                url: v.optional(v.string()),
            })),
            interlude: v.optional(v.object({
                hymnNumber: v.number(),
                title: v.string(),
                url: v.optional(v.string()),
            })),
            special: v.optional(v.object({
                hymnNumber: v.number(),
                title: v.string(),
                url: v.optional(v.string()),
            })),
            closing: v.optional(v.object({
                hymnNumber: v.number(),
                title: v.string(),
                url: v.optional(v.string()),
            })),
        }),
        sacramentMeeting: v.object({
            conductingLeader: v.optional(v.string()),
            presiding: v.optional(v.string()),
            openingPrayer: v.optional(v.string()),
            closingPrayer: v.optional(v.string()),
            announcements: v.optional(v.string()),
        }),
        talks: v.array(v.object({
            speakerName: v.string(),
            organization: v.optional(v.string()),
            topic: v.optional(v.string()),
            sourceType: v.optional(v.string()),
            sourceTitle: v.optional(v.string()),
            sourceUrl: v.optional(v.string()),
            duration: v.optional(v.number()),
            order: v.number(),
        })),
        sundaySchool: v.object({
            lessonType: v.string(),
            scriptureBlock: v.string(),
            lessonTitle: v.optional(v.string()),
            lessonUrl: v.optional(v.string()),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
        eldersQuorum: v.object({
            classType: v.string(),
            lessonType: v.string(),
            principleSelected: v.optional(v.string()),
            principleUrl: v.optional(v.string()),
            conferenceTalkSelected: v.optional(v.string()),
            conferenceTalkUrl: v.optional(v.string()),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
        reliefSociety: v.object({
            classType: v.string(),
            lessonType: v.string(),
            principleSelected: v.optional(v.string()),
            principleUrl: v.optional(v.string()),
            conferenceTalkSelected: v.optional(v.string()),
            conferenceTalkUrl: v.optional(v.string()),
            instructor: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
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
        hymns: v.optional(v.any()),
        sacramentMeeting: v.optional(v.any()),
        talks: v.optional(v.any()),
        sundaySchool: v.optional(v.any()),
        eldersQuorum: v.optional(v.any()),
        reliefSociety: v.optional(v.any()),
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

/**
 * Seed 2026 assignments with linked reference data
 */
export const seed2026 = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("sundayAssignments").first();
        if (existing) return { message: "Assignments already exist" };

        // Get hymns for reference
        const openingHymn = await ctx.db.query("hymnIndex").withIndex("by_number", q => q.eq("number", 2)).first();
        const sacramentHymn = await ctx.db.query("hymnIndex").withIndex("by_number", q => q.eq("number", 175)).first();
        const closingHymn = await ctx.db.query("hymnIndex").withIndex("by_number", q => q.eq("number", 116)).first();

        // Get CFM lessons
        const cfmLessons = await ctx.db.query("cfmIndex").withIndex("by_year", q => q.eq("year", 2026)).collect();

        const sundays2026Jan = [
            { date: "2026-01-04", sundayNumber: 1, weekRange: "Dec 30 - Jan 5", weekNum: 1 },
            { date: "2026-01-11", sundayNumber: 2, weekRange: "Jan 6-12", weekNum: 2 },
            { date: "2026-01-18", sundayNumber: 3, weekRange: "Jan 13-19", weekNum: 3 },
            { date: "2026-01-25", sundayNumber: 4, weekRange: "Jan 20-26", weekNum: 4 },
        ];

        for (const sunday of sundays2026Jan) {
            const cfm = cfmLessons.find(l => l.weekNumber === sunday.weekNum);

            await ctx.db.insert("sundayAssignments", {
                year: 2026,
                month: 1,
                monthName: "January",
                sundayNumber: sunday.sundayNumber,
                date: sunday.date,
                weekRange: sunday.weekRange,
                hymns: {
                    opening: openingHymn ? { hymnNumber: openingHymn.number, title: openingHymn.title, url: openingHymn.url } : undefined,
                    sacrament: sacramentHymn ? { hymnNumber: sacramentHymn.number, title: sacramentHymn.title, url: sacramentHymn.url } : undefined,
                    closing: closingHymn ? { hymnNumber: closingHymn.number, title: closingHymn.title, url: closingHymn.url } : undefined,
                },
                sacramentMeeting: {
                    conductingLeader: undefined,
                    openingPrayer: undefined,
                    closingPrayer: undefined,
                },
                talks: [
                    { speakerName: "TBD", topic: "Faith in Christ", order: 1 }
                ],
                sundaySchool: {
                    lessonType: "Come Follow Me",
                    scriptureBlock: cfm?.scriptureBlock || "1 Nephi 1-5",
                    lessonTitle: cfm?.lessonTitle,
                    lessonUrl: cfm?.url,
                    instructor: "TBD",
                },
                eldersQuorum: {
                    classType: "EQ",
                    lessonType: "Come Follow Me",
                    principleSelected: cfm?.scriptureBlock,
                    instructor: "EQ Presidency",
                },
                reliefSociety: {
                    classType: "RS",
                    lessonType: "Come Follow Me",
                    principleSelected: cfm?.scriptureBlock,
                    instructor: "RS Presidency",
                },
                status: "draft",
                updatedAt: Date.now(),
            });
        }

        return { message: "Seeded January 2026 assignments with linked references" };
    },
});
