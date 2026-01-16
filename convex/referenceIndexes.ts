import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// HYMN INDEX CRUD
// ============================================

export const getHymns = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.category) {
            return await ctx.db.query("hymnIndex")
                .withIndex("by_category", q => q.eq("category", args.category!))
                .collect();
        }
        return await ctx.db.query("hymnIndex").collect();
    },
});

export const getHymnByNumber = query({
    args: { number: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db.query("hymnIndex")
            .withIndex("by_number", q => q.eq("number", args.number))
            .first();
    },
});

export const addHymn = mutation({
    args: {
        number: v.number(),
        title: v.string(),
        category: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("hymnIndex")
            .withIndex("by_number", q => q.eq("number", args.number))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
            return existing._id;
        }
        return await ctx.db.insert("hymnIndex", { ...args, isFavorite: false });
    },
});

// ============================================
// COME FOLLOW ME INDEX CRUD
// ============================================

export const getCfmLessons = query({
    args: { year: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db.query("cfmIndex")
            .withIndex("by_year", q => q.eq("year", args.year))
            .collect();
    },
});

export const getCfmByWeek = query({
    args: { year: v.number(), weekNumber: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db.query("cfmIndex")
            .withIndex("by_year_week", q => q.eq("year", args.year).eq("weekNumber", args.weekNumber))
            .first();
    },
});

export const addCfmLesson = mutation({
    args: {
        year: v.number(),
        weekNumber: v.number(),
        weekRange: v.string(),
        scriptureBlock: v.string(),
        lessonTitle: v.string(),
        url: v.string(),
        book: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("cfmIndex", args);
    },
});

// ============================================
// GOSPEL PRINCIPLES INDEX CRUD
// ============================================

export const getGospelPrinciples = query({
    handler: async (ctx) => {
        return await ctx.db.query("gospelPrinciplesIndex").collect();
    },
});

export const addGospelPrinciple = mutation({
    args: {
        number: v.number(),
        title: v.string(),
        url: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("gospelPrinciplesIndex", args);
    },
});

// ============================================
// CONFERENCE TALK INDEX CRUD
// ============================================

export const getConferenceTalks = query({
    args: { year: v.optional(v.number()) },
    handler: async (ctx, args) => {
        if (args.year) {
            return await ctx.db.query("conferenceTalkIndex")
                .withIndex("by_year", q => q.eq("year", args.year!))
                .collect();
        }
        return await ctx.db.query("conferenceTalkIndex").collect();
    },
});

export const addConferenceTalk = mutation({
    args: {
        title: v.string(),
        speaker: v.string(),
        conferenceSession: v.string(),
        year: v.number(),
        month: v.string(),
        url: v.string(),
        topic: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("conferenceTalkIndex", args);
    },
});

// ============================================
// DELEGATION INDEX CRUD
// ============================================

export const getDelegations = query({
    args: { organization: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.organization) {
            return await ctx.db.query("delegationIndex")
                .withIndex("by_organization", q => q.eq("organization", args.organization!))
                .filter(q => q.eq(q.field("isActive"), true))
                .collect();
        }
        return await ctx.db.query("delegationIndex")
            .filter(q => q.eq(q.field("isActive"), true))
            .collect();
    },
});

export const addDelegation = mutation({
    args: {
        calling: v.string(),
        assignedPerson: v.string(),
        organization: v.string(),
        startDate: v.optional(v.string()),
        notes: v.optional(v.string()),
        permissions: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("delegationIndex", { ...args, isActive: true });
    },
});

// ============================================
// SEED REFERENCE DATA
// ============================================

export const seedHymnIndex = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("hymnIndex").first();
        if (existing) return { message: "Hymn index already seeded" };

        const hymns = [
            // Opening Hymns
            { number: 2, title: "The Spirit of God", category: "Opening", url: "https://www.churchofjesuschrist.org/music/library/hymns/the-spirit-of-god" },
            { number: 3, title: "Now Let Us Rejoice", category: "Opening", url: "https://www.churchofjesuschrist.org/music/library/hymns/now-let-us-rejoice" },
            { number: 19, title: "We Thank Thee, O God, for a Prophet", category: "Opening", url: "https://www.churchofjesuschrist.org/music/library/hymns/we-thank-thee-o-god-for-a-prophet" },
            { number: 26, title: "Joseph Smith's First Prayer", category: "Opening", url: "https://www.churchofjesuschrist.org/music/library/hymns/joseph-smiths-first-prayer" },
            { number: 30, title: "Come, Come, Ye Saints", category: "Opening", url: "https://www.churchofjesuschrist.org/music/library/hymns/come-come-ye-saints" },

            // Sacrament Hymns
            { number: 169, title: "As Now We Take the Sacrament", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/as-now-we-take-the-sacrament" },
            { number: 170, title: "God, Our Father, Hear Us Pray", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/god-our-father-hear-us-pray" },
            { number: 171, title: "With Humble Heart", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/with-humble-heart" },
            { number: 172, title: "'Tis Sweet to Sing the Matchless Love", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/tis-sweet-to-sing-the-matchless-love" },
            { number: 173, title: "While of These Emblems We Partake", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/while-of-these-emblems-we-partake" },
            { number: 174, title: "In Remembrance of Thy Suffering", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/in-remembrance-of-thy-suffering" },
            { number: 175, title: "O God, the Eternal Father", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/o-god-the-eternal-father" },
            { number: 176, title: "Tis Sweet To Sing the Matchless Love", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/tis-sweet-to-sing-the-matchless-love" },
            { number: 177, title: "'Tis Sweet to Sing", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/tis-sweet-to-sing" },
            { number: 178, title: "O Lord of Hosts", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/o-lord-of-hosts" },
            { number: 179, title: "Again, Our Dear Redeeming Lord", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/again-our-dear-redeeming-lord" },
            { number: 180, title: "Father in Heaven, We Do Believe", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/father-in-heaven-we-do-believe" },
            { number: 181, title: "Jesus of Nazareth, Savior and King", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/jesus-of-nazareth-savior-and-king" },
            { number: 182, title: "We'll Sing All Hail to Jesus' Name", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/well-sing-all-hail-to-jesus-name" },
            { number: 183, title: "In Remembrance of Thy Suffering", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/in-remembrance-of-thy-suffering" },
            { number: 184, title: "Upon the Cross of Calvary", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/upon-the-cross-of-calvary" },
            { number: 185, title: "Reverently and Meekly Now", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/reverently-and-meekly-now" },
            { number: 186, title: "Again We Meet around the Board", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/again-we-meet-around-the-board" },
            { number: 187, title: "God Loved Us, So He Sent His Son", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/god-loved-us-so-he-sent-his-son" },
            { number: 188, title: "Thy Will, O Lord, Be Done", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/thy-will-o-lord-be-done" },
            { number: 189, title: "O Thou, Before the World Began", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/o-thou-before-the-world-began" },
            { number: 190, title: "In Memory of the Crucified", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/in-memory-of-the-crucified" },
            { number: 191, title: "Behold the Great Redeemer Die", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/behold-the-great-redeemer-die" },
            { number: 192, title: "He Died! The Great Redeemer Died", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/he-died-the-great-redeemer-died" },
            { number: 193, title: "I Stand All Amazed", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/i-stand-all-amazed" },
            { number: 194, title: "There Is a Green Hill Far Away", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/there-is-a-green-hill-far-away" },
            { number: 195, title: "How Great the Wisdom and the Love", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/how-great-the-wisdom-and-the-love" },
            { number: 196, title: "Jesus, Once of Humble Birth", category: "Sacrament", url: "https://www.churchofjesuschrist.org/music/library/hymns/jesus-once-of-humble-birth" },

            // Closing Hymns
            { number: 116, title: "Come, Follow Me", category: "Closing", url: "https://www.churchofjesuschrist.org/music/library/hymns/come-follow-me" },
            { number: 223, title: "Have I Done Any Good?", category: "Closing", url: "https://www.churchofjesuschrist.org/music/library/hymns/have-i-done-any-good" },
            { number: 239, title: "Choose the Right", category: "Closing", url: "https://www.churchofjesuschrist.org/music/library/hymns/choose-the-right" },
            { number: 240, title: "Know This, That Every Soul Is Free", category: "Closing", url: "https://www.churchofjesuschrist.org/music/library/hymns/know-this-that-every-soul-is-free" },

            // Special Hymns
            { number: 85, title: "How Firm a Foundation", category: "Special", url: "https://www.churchofjesuschrist.org/music/library/hymns/how-firm-a-foundation" },
            { number: 136, title: "I Know That My Redeemer Lives", category: "Special", url: "https://www.churchofjesuschrist.org/music/library/hymns/i-know-that-my-redeemer-lives" },
            { number: 301, title: "I Am a Child of God", category: "Special", url: "https://www.churchofjesuschrist.org/music/library/hymns/i-am-a-child-of-god" },
        ];

        for (const hymn of hymns) {
            await ctx.db.insert("hymnIndex", { ...hymn, isFavorite: false });
        }

        return { message: `Seeded ${hymns.length} hymns` };
    },
});

export const seedCfmIndex = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("cfmIndex").first();
        if (existing) return { message: "CFM index already seeded" };

        const lessons = [
            { year: 2026, weekNumber: 1, weekRange: "Dec 30 - Jan 5", scriptureBlock: "Introductory Pages", lessonTitle: "Introductory Pages of the Book of Mormon", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/01", book: "Book of Mormon" },
            { year: 2026, weekNumber: 2, weekRange: "Jan 6-12", scriptureBlock: "1 Nephi 1-5", lessonTitle: "I Will Go and Do", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/02", book: "Book of Mormon" },
            { year: 2026, weekNumber: 3, weekRange: "Jan 13-19", scriptureBlock: "1 Nephi 6-10", lessonTitle: "Armed with Righteousness", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/03", book: "Book of Mormon" },
            { year: 2026, weekNumber: 4, weekRange: "Jan 20-26", scriptureBlock: "1 Nephi 11-15", lessonTitle: "The Love of God", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/04", book: "Book of Mormon" },
            { year: 2026, weekNumber: 5, weekRange: "Jan 27 - Feb 2", scriptureBlock: "1 Nephi 16-22", lessonTitle: "I Will Prepare the Way", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/05", book: "Book of Mormon" },
            { year: 2026, weekNumber: 6, weekRange: "Feb 3-9", scriptureBlock: "2 Nephi 1-5", lessonTitle: "Redemption Through the Holy Messiah", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/06", book: "Book of Mormon" },
            { year: 2026, weekNumber: 7, weekRange: "Feb 10-16", scriptureBlock: "2 Nephi 6-10", lessonTitle: "O How Great the Plan of Our God!", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/07", book: "Book of Mormon" },
            { year: 2026, weekNumber: 8, weekRange: "Feb 17-23", scriptureBlock: "2 Nephi 11-19", lessonTitle: "He Inviteth All to Come unto Him", url: "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/08", book: "Book of Mormon" },
        ];

        for (const lesson of lessons) {
            await ctx.db.insert("cfmIndex", lesson);
        }

        return { message: `Seeded ${lessons.length} CFM lessons` };
    },
});

export const seedGospelPrinciples = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("gospelPrinciplesIndex").first();
        if (existing) return { message: "Gospel Principles already seeded" };

        const principles = [
            { number: 1, title: "Our Heavenly Father", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-1-our-heavenly-father", category: "Godhead" },
            { number: 2, title: "Our Heavenly Family", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-2-our-heavenly-family", category: "Plan of Salvation" },
            { number: 3, title: "Jesus Christ, Our Chosen Leader and Savior", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-3-jesus-christ-our-chosen-leader-and-savior", category: "Godhead" },
            { number: 4, title: "Freedom to Choose", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-4-freedom-to-choose", category: "Agency" },
            { number: 5, title: "The Creation", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-5-the-creation", category: "Creation" },
            { number: 6, title: "The Fall of Adam and Eve", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-6-the-fall-of-adam-and-eve", category: "Plan of Salvation" },
            { number: 7, title: "The Holy Ghost", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-7-the-holy-ghost", category: "Godhead" },
            { number: 8, title: "Praying to Our Heavenly Father", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-8-praying-to-our-heavenly-father", category: "Prayer" },
            { number: 9, title: "Prophets of God", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-9-prophets-of-god", category: "Prophets" },
            { number: 10, title: "Scriptures", url: "https://www.churchofjesuschrist.org/study/manual/gospel-principles/chapter-10-scriptures", category: "Scriptures" },
        ];

        for (const p of principles) {
            await ctx.db.insert("gospelPrinciplesIndex", p);
        }

        return { message: `Seeded ${principles.length} Gospel Principles` };
    },
});

export const seedConferenceTalks = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("conferenceTalkIndex").first();
        if (existing) return { message: "Conference Talks already seeded" };

        const talks = [
            { title: "Jesus Christ Is the Strength of Parents", speaker: "President Russell M. Nelson", conferenceSession: "October 2024 General Conference", year: 2024, month: "October", url: "https://www.churchofjesuschrist.org/study/general-conference/2024/10/47nelson", topic: "Parenting" },
            { title: "Sustaining of General Authorities", speaker: "President Dallin H. Oaks", conferenceSession: "October 2024 General Conference", year: 2024, month: "October", url: "https://www.churchofjesuschrist.org/study/general-conference/2024/10/11oaks", topic: "Church Leadership" },
            { title: "The Powerful, Virtuous Cycle of the Doctrine of Christ", speaker: "Elder Dale G. Renlund", conferenceSession: "October 2024 General Conference", year: 2024, month: "October", url: "https://www.churchofjesuschrist.org/study/general-conference/2024/10/24renlund", topic: "Doctrine of Christ" },
            { title: "Love Thy Neighbour", speaker: "Elder Gary E. Stevenson", conferenceSession: "April 2024 General Conference", year: 2024, month: "April", url: "https://www.churchofjesuschrist.org/study/general-conference/2024/04/23stevenson", topic: "Charity" },
        ];

        for (const talk of talks) {
            await ctx.db.insert("conferenceTalkIndex", talk);
        }

        return { message: `Seeded ${talks.length} Conference Talks` };
    },
});

export const seedDelegation = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("delegationIndex").first();
        if (existing) return { message: "Delegation already seeded" };

        const delegations = [
            { calling: "Bishop", assignedPerson: "TBD", organization: "Bishopric", permissions: ["manage_all", "view_all", "edit_assignments"] },
            { calling: "1st Counselor", assignedPerson: "TBD", organization: "Bishopric", permissions: ["view_all", "edit_assignments"] },
            { calling: "2nd Counselor", assignedPerson: "TBD", organization: "Bishopric", permissions: ["view_all", "edit_assignments"] },
            { calling: "Ward Clerk", assignedPerson: "TBD", organization: "Bishopric", permissions: ["view_all", "edit_assignments", "manage_records"] },
            { calling: "Relief Society President", assignedPerson: "TBD", organization: "Relief Society", permissions: ["view_rs", "edit_rs_assignments"] },
            { calling: "Elders Quorum President", assignedPerson: "TBD", organization: "Elders Quorum", permissions: ["view_eq", "edit_eq_assignments"] },
            { calling: "Sunday School President", assignedPerson: "TBD", organization: "Sunday School", permissions: ["view_ss", "edit_ss_assignments"] },
        ];

        for (const d of delegations) {
            await ctx.db.insert("delegationIndex", { ...d, isActive: true });
        }

        return { message: `Seeded ${delegations.length} Delegations` };
    },
});

// ============================================
// ANNOUNCEMENT INDEX CRUD
// ============================================

export const getAnnouncements = query({
    handler: async (ctx) => {
        return await ctx.db.query("announcementsIndex").collect();
    },
});

export const addAnnouncement = mutation({
    args: {
        content: v.string(),
        type: v.string(),
        targetDate: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("announcementsIndex", { ...args, active: true });
    },
});

export const updateAnnouncementIndex = mutation({
    args: {
        id: v.id("announcementsIndex"),
        content: v.optional(v.string()),
        type: v.optional(v.string()),
        targetDate: v.optional(v.string()),
        category: v.optional(v.string()),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const removeAnnouncementIndex = mutation({
    args: { id: v.id("announcementsIndex") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const seedAnnouncements = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("announcementsIndex").first();
        if (existing) return { message: "Announcements already seeded" };

        const announcements = [
            { content: "Ward Temple Day - Every first Saturday", type: "recurring", category: "Temple", active: true },
            { content: "Youth Activity - Wednesday 7:00 PM", type: "recurring", category: "Youth", active: true },
            { content: "Ward Conference next week", type: "specific", targetDate: "2026-02-01", category: "Meeting", active: true },
        ];

        for (const a of announcements) {
            await ctx.db.insert("announcementsIndex", a);
        }

        return { message: `Seeded ${announcements.length} announcements` };
    },
});

// Master seed function
export const seedAllIndexes = mutation({
    handler: async (ctx) => {
        // This will be called via HTTP
        return { message: "Use individual seed functions or call /seed endpoint" };
    },
});

// ============================================
// MEETING TYPES INDEX CRUD
// ============================================

export const getMeetingTypes = query({
    handler: async (ctx) => {
        return await ctx.db.query("meetingTypesIndex").collect();
    },
});

export const updateMeetingType = mutation({
    args: {
        id: v.id("meetingTypesIndex"),
        subtypes: v.optional(v.array(v.string())),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const seedMeetingTypes = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("meetingTypesIndex").first();
        if (existing) return { message: "Meeting types already seeded" };

        const types = [
            { name: "standard", label: "Standard Meeting", icon: "🕊️", active: true },
            { name: "fast", label: "Fast & Testimony", icon: "🥖", active: true },
            { name: "conference", label: "Conference", icon: "🏛️", subtypes: ["stake", "ward", "special", "apostle"], active: true },
            { name: "devotional", label: "Devotional", icon: "🕯️", subtypes: ["christmas", "easter", "special", "asia-area", "other"], active: true },
        ];

        for (const t of types) {
            await ctx.db.insert("meetingTypesIndex", t);
        }

        return { message: "Seeded meeting types" };
    },
});
