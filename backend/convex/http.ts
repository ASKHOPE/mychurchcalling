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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// Local Auth - Login
const localLogin = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const { username, password } = await request.json();
    const result = await ctx.runMutation(api.localAuth.login, { username, password });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

// Local Auth - Register
const localRegister = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const { username, password, name, email } = await request.json();
    const result = await ctx.runMutation(api.localAuth.register, { username, password, name, email });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

// Local Auth - Create User (Admin)
const localCreateUser = httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const { username, password, name, email, role, calling } = await request.json();
    const result = await ctx.runMutation(api.localAuth.createUser, { username, password, name, email, role, calling });
    return new Response(JSON.stringify(result), { headers: corsHeaders });
});

// Local Auth - List Users
const localListUsers = httpAction(async (ctx) => {
    const users = await ctx.runQuery(api.localAuth.listLocalUsers);
    return new Response(JSON.stringify({ users }), { headers: corsHeaders });
});

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

// Default
http.route({ path: "/", method: "GET", handler: home });

export default http;
