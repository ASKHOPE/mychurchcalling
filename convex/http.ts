import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import {
    login, callback, signOut, home, refresh,
    listUsers, inviteUser, updateUser,
    softDeleteUser, permanentDeleteUser, restoreUser,
    listEvents, listBin,
    listRoles, listCallings, createRole, createCalling
} from "./workos";

const http = httpRouter();

// CORS helper
const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// ============================================
// LOCAL AUTH
// ============================================

const localLogin = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const { username, password } = await request.json();
    const result = await ctx.runMutation(api.localAuth.login, { username, password });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const localRegister = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const { username, password, name, email } = await request.json();
    const result = await ctx.runMutation(api.localAuth.register, { username, password, name, email });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const localCreateUser = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const { username, password, name, email, role, calling } = await request.json();
    const result = await ctx.runMutation(api.localAuth.createUser, { username, password, name, email, role, calling });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const localListUsers = httpAction(async (ctx) => {
    const users = await ctx.runQuery(api.localAuth.listLocalUsers);
    return new Response(JSON.stringify({ users }), { headers: corsHeaders });
});

// ============================================
// ASSIGNMENTS API
// ============================================

const getAssignmentsByMonth = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || "2026");
    const month = parseInt(url.searchParams.get("month") || "1");
    const assignments = await ctx.runQuery(api.assignments.getByMonth, { year, month });
    return new Response(JSON.stringify({ assignments }), { headers: corsHeaders });
});

const getAssignmentByDate = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || "";
    const assignment = await ctx.runQuery(api.assignments.getByDate, { date });
    return new Response(JSON.stringify({ assignment }), { headers: corsHeaders });
});

const getUpcomingAssignments = httpAction(async (ctx) => {
    const assignments = await ctx.runQuery(api.assignments.getUpcoming);
    return new Response(JSON.stringify({ assignments }), { headers: corsHeaders });
});

const createAssignment = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const data = await request.json();
    const id = await ctx.runMutation(api.assignments.create, data);
    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
});

const updateAssignment = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const data = await request.json();
    const result = await ctx.runMutation(api.assignments.update, data);
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const deleteAssignment = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const { id } = await request.json();
    const result = await ctx.runMutation(api.assignments.remove, { id });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

// ============================================
// REFERENCE INDEXES API
// ============================================

// Hymns
const getHymns = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || undefined;
    const hymns = await ctx.runQuery(api.referenceIndexes.getHymns, { category });
    return new Response(JSON.stringify({ hymns }), { headers: corsHeaders });
});

const addHymn = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const data = await request.json();
    const id = await ctx.runMutation(api.referenceIndexes.addHymn, data);
    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
});

// CFM Lessons
const getCfmLessons = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || "2026");
    const lessons = await ctx.runQuery(api.referenceIndexes.getCfmLessons, { year });
    return new Response(JSON.stringify({ lessons }), { headers: corsHeaders });
});

// Gospel Principles
const getGospelPrinciples = httpAction(async (ctx) => {
    const principles = await ctx.runQuery(api.referenceIndexes.getGospelPrinciples);
    return new Response(JSON.stringify({ principles }), { headers: corsHeaders });
});

// Conference Talks
const getConferenceTalks = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : undefined;
    const talks = await ctx.runQuery(api.referenceIndexes.getConferenceTalks, { year });
    return new Response(JSON.stringify({ talks }), { headers: corsHeaders });
});

// Delegation
const getDelegations = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const organization = url.searchParams.get("organization") || undefined;
    const delegations = await ctx.runQuery(api.referenceIndexes.getDelegations, { organization });
    return new Response(JSON.stringify({ delegations }), { headers: corsHeaders });
});

// Master Seed - Seeds all indexes
const seedAllData = httpAction(async (ctx) => {
    const results = {
        hymns: await ctx.runMutation(api.referenceIndexes.seedHymnIndex),
        cfm: await ctx.runMutation(api.referenceIndexes.seedCfmIndex),
        gospelPrinciples: await ctx.runMutation(api.referenceIndexes.seedGospelPrinciples),
        conferenceTalks: await ctx.runMutation(api.referenceIndexes.seedConferenceTalks),
        delegation: await ctx.runMutation(api.referenceIndexes.seedDelegation),
        announcements: await ctx.runMutation(api.referenceIndexes.seedAnnouncements),
        meetingTypes: await ctx.runMutation(api.referenceIndexes.seedMeetingTypes),
        assignments: await ctx.runMutation(api.assignments.seed2026),
    };
    return new Response(JSON.stringify(results), { headers: corsHeaders });
});

// Meeting Types
const getMeetingTypes = httpAction(async (ctx) => {
    const types = await ctx.runQuery(api.referenceIndexes.getMeetingTypes);
    return new Response(JSON.stringify({ types }), { headers: corsHeaders });
});

const updateMeetingType = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const data = await request.json();
    await ctx.runMutation(api.referenceIndexes.updateMeetingType, data);
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
});

// Announcements
const getAnnouncements = httpAction(async (ctx) => {
    const announcements = await ctx.runQuery(api.referenceIndexes.getAnnouncements);
    return new Response(JSON.stringify({ announcements }), { headers: corsHeaders });
});

const createAnnouncement = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const data = await request.json();
    const id = await ctx.runMutation(api.referenceIndexes.addAnnouncement, data);
    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
});

// ============================================
// ROUTES
// ============================================

// WorkOS Auth
http.route({ path: "/login", method: "GET", handler: login });
http.route({ path: "/callback", method: "GET", handler: callback });
http.route({ path: "/sign-out", method: "GET", handler: signOut });
http.route({ path: "/auth/refresh", method: "POST", handler: refresh });
http.route({ path: "/auth/refresh", method: "OPTIONS", handler: refresh });

// Local Auth
http.route({ path: "/local/login", method: "POST", handler: localLogin });
http.route({ path: "/local/login", method: "OPTIONS", handler: localLogin });
http.route({ path: "/local/register", method: "POST", handler: localRegister });
http.route({ path: "/local/register", method: "OPTIONS", handler: localRegister });
http.route({ path: "/local/users", method: "GET", handler: localListUsers });
http.route({ path: "/local/users", method: "POST", handler: localCreateUser });
http.route({ path: "/local/users", method: "OPTIONS", handler: localCreateUser });

// Users
http.route({ path: "/users", method: "GET", handler: listUsers });
http.route({ path: "/users/invite", method: "POST", handler: inviteUser });
http.route({ path: "/users/invite", method: "OPTIONS", handler: inviteUser });
http.route({ path: "/users/update", method: "POST", handler: updateUser });
http.route({ path: "/users/update", method: "OPTIONS", handler: updateUser });
http.route({ path: "/users/delete", method: "POST", handler: softDeleteUser });
http.route({ path: "/users/delete", method: "OPTIONS", handler: softDeleteUser });
http.route({ path: "/users/permanent-delete", method: "POST", handler: permanentDeleteUser });
http.route({ path: "/users/permanent-delete", method: "OPTIONS", handler: permanentDeleteUser });
http.route({ path: "/users/restore", method: "POST", handler: restoreUser });
http.route({ path: "/users/restore", method: "OPTIONS", handler: restoreUser });

// Admin
http.route({ path: "/admin/events", method: "GET", handler: listEvents });
http.route({ path: "/admin/bin", method: "GET", handler: listBin });
http.route({ path: "/admin/roles", method: "GET", handler: listRoles });
http.route({ path: "/admin/roles", method: "POST", handler: createRole });
http.route({ path: "/admin/roles", method: "OPTIONS", handler: createRole });
http.route({ path: "/admin/callings", method: "GET", handler: listCallings });
http.route({ path: "/admin/callings", method: "POST", handler: createCalling });
http.route({ path: "/admin/callings", method: "OPTIONS", handler: createCalling });

// Assignments
http.route({ path: "/assignments", method: "GET", handler: getAssignmentsByMonth });
http.route({ path: "/assignments/date", method: "GET", handler: getAssignmentByDate });
http.route({ path: "/assignments/upcoming", method: "GET", handler: getUpcomingAssignments });
http.route({ path: "/assignments", method: "POST", handler: createAssignment });
http.route({ path: "/assignments", method: "OPTIONS", handler: createAssignment });
http.route({ path: "/assignments/update", method: "POST", handler: updateAssignment });
http.route({ path: "/assignments/update", method: "OPTIONS", handler: updateAssignment });
http.route({ path: "/assignments/delete", method: "POST", handler: deleteAssignment });
http.route({ path: "/assignments/delete", method: "OPTIONS", handler: deleteAssignment });

// Reference Indexes
http.route({ path: "/indexes/hymns", method: "GET", handler: getHymns });
http.route({ path: "/indexes/hymns", method: "POST", handler: addHymn });
http.route({ path: "/indexes/hymns", method: "OPTIONS", handler: addHymn });
http.route({ path: "/indexes/cfm", method: "GET", handler: getCfmLessons });
http.route({ path: "/indexes/gospel-principles", method: "GET", handler: getGospelPrinciples });
http.route({ path: "/indexes/conference-talks", method: "GET", handler: getConferenceTalks });
http.route({ path: "/indexes/delegation", method: "GET", handler: getDelegations });
http.route({ path: "/indexes/announcements", method: "GET", handler: getAnnouncements });
http.route({ path: "/indexes/announcements", method: "POST", handler: createAnnouncement });
http.route({ path: "/indexes/announcements", method: "OPTIONS", handler: createAnnouncement });

http.route({ path: "/indexes/meeting-types", method: "GET", handler: getMeetingTypes });
http.route({ path: "/indexes/meeting-types", method: "POST", handler: updateMeetingType });
http.route({ path: "/indexes/meeting-types", method: "OPTIONS", handler: updateMeetingType });

// Seed all data
http.route({ path: "/seed", method: "GET", handler: seedAllData });

// Default
http.route({ path: "/", method: "GET", handler: home });

export default http;
