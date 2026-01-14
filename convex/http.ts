import { httpRouter } from "convex/server";
import { login, callback, signOut, home, refresh, listUsers, inviteUser } from "./workos";

const http = httpRouter();

// Home page
http.route({
    path: "/",
    method: "GET",
    handler: home,
});

// Auth endpoints
http.route({
    path: "/login",
    method: "GET",
    handler: login,
});

http.route({
    path: "/callback",
    method: "GET",
    handler: callback,
});

// Sign-out redirect (configure this in WorkOS Dashboard)
http.route({
    path: "/sign-out",
    method: "GET",
    handler: signOut,
});

// API endpoints
http.route({
    path: "/auth/refresh",
    method: "POST",
    handler: refresh,
});

http.route({
    path: "/auth/refresh",
    method: "OPTIONS",
    handler: refresh,
});

http.route({
    path: "/users",
    method: "GET",
    handler: listUsers,
});

http.route({
    path: "/users/invite",
    method: "POST",
    handler: inviteUser,
});

http.route({
    path: "/users/invite",
    method: "OPTIONS",
    handler: inviteUser,
});

export default http;
