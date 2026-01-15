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
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const { username, password } = await request.json();
    const result = await ctx.runMutation(api.localAuth.login, { username, password });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const localRegister = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const { username, password, name, email } = await request.json();
    const result = await ctx.runMutation(api.localAuth.register, { username, password, name, email });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const localCreateUser = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
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
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const data = await request.json();
    const id = await ctx.runMutation(api.assignments.create, data);
    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
});

const updateAssignment = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const data = await request.json();
    const result = await ctx.runMutation(api.assignments.update, data);
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

const deleteAssignment = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const { id } = await request.json();
    const result = await ctx.runMutation(api.assignments.remove, { id });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

// Hymns
const getHymns = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || undefined;
    const hymns = await ctx.runQuery(api.assignments.getHymns, { category });
    return new Response(JSON.stringify({ hymns }), { headers: corsHeaders });
});

const addHymn = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const data = await request.json();
    const id = await ctx.runMutation(api.assignments.addHymn, data);
    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
});

// Members
const getMembers = httpAction(async (ctx) => {
    const members = await ctx.runQuery(api.assignments.getMembers);
    return new Response(JSON.stringify({ members }), { headers: corsHeaders });
});

const addMember = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const data = await request.json();
    const id = await ctx.runMutation(api.assignments.addMember, data);
    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
});

// Seed
const seedData = httpAction(async (ctx) => {
    const hymnsResult = await ctx.runMutation(api.assignments.seedHymns);
    const assignmentsResult = await ctx.runMutation(api.assignments.seed2026Assignments);
    return new Response(JSON.stringify({ hymns: hymnsResult, assignments: assignmentsResult }), { headers: corsHeaders });
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

// Local Auth Routes
http.route({ path: "/local/login", method: "POST", handler: localLogin });
http.route({ path: "/local/login", method: "OPTIONS", handler: localLogin });
http.route({ path: "/local/register", method: "POST", handler: localRegister });
http.route({ path: "/local/register", method: "OPTIONS", handler: localRegister });
http.route({ path: "/local/users", method: "GET", handler: localListUsers });
http.route({ path: "/local/users", method: "POST", handler: localCreateUser });
http.route({ path: "/local/users", method: "OPTIONS", handler: localCreateUser });

// WorkOS Users
http.route({ path: "/users", method: "GET", handler: listUsers });
http.route({ path: "/users/invite", method: "POST", handler: inviteUser });
http.route({ path: "/users/invite", method: "OPTIONS", handler: inviteUser });
http.route({ path: "/users/update", method: "POST", handler: updateUser });
http.route({ path: "/users/update", method: "OPTIONS", handler: updateUser });

// Bin & Archive
http.route({ path: "/users/delete", method: "POST", handler: softDeleteUser });
http.route({ path: "/users/delete", method: "OPTIONS", handler: softDeleteUser });
http.route({ path: "/users/permanent-delete", method: "POST", handler: permanentDeleteUser });
http.route({ path: "/users/permanent-delete", method: "OPTIONS", handler: permanentDeleteUser });
http.route({ path: "/users/restore", method: "POST", handler: restoreUser });
http.route({ path: "/users/restore", method: "OPTIONS", handler: restoreUser });

// Admin / Audit / Config
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

// Hymns
http.route({ path: "/hymns", method: "GET", handler: getHymns });
http.route({ path: "/hymns", method: "POST", handler: addHymn });
http.route({ path: "/hymns", method: "OPTIONS", handler: addHymn });

// Members
http.route({ path: "/members", method: "GET", handler: getMembers });
http.route({ path: "/members", method: "POST", handler: addMember });
http.route({ path: "/members", method: "OPTIONS", handler: addMember });

// Seed data
http.route({ path: "/seed", method: "GET", handler: seedData });

// Default
http.route({ path: "/", method: "GET", handler: home });

export default http;
