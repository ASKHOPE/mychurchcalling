import { httpRouter } from "convex/server";
import {
    login, callback, signOut, home, refresh,
    listUsers, inviteUser, updateUser,
    softDeleteUser, permanentDeleteUser, restoreUser,
    listEvents, listBin
} from "./workos";

const http = httpRouter();

// Auth
http.route({ path: "/login", method: "GET", handler: login });
http.route({ path: "/callback", method: "GET", handler: callback });
http.route({ path: "/sign-out", method: "GET", handler: signOut });
http.route({ path: "/auth/refresh", method: "POST", handler: refresh });
http.route({ path: "/auth/refresh", method: "OPTIONS", handler: refresh });

// Users
http.route({ path: "/users", method: "GET", handler: listUsers });
http.route({ path: "/users/invite", method: "POST", handler: inviteUser });
http.route({ path: "/users/invite", method: "OPTIONS", handler: inviteUser });
http.route({ path: "/users/update", method: "POST", handler: updateUser });
http.route({ path: "/users/update", method: "OPTIONS", handler: updateUser });

// Bin & Archive & CRUD Extended
http.route({ path: "/users/delete", method: "POST", handler: softDeleteUser }); // Now soft delete
http.route({ path: "/users/delete", method: "OPTIONS", handler: softDeleteUser });

http.route({ path: "/users/permanent-delete", method: "POST", handler: permanentDeleteUser });
http.route({ path: "/users/permanent-delete", method: "OPTIONS", handler: permanentDeleteUser });

http.route({ path: "/users/restore", method: "POST", handler: restoreUser });
http.route({ path: "/users/restore", method: "OPTIONS", handler: restoreUser });

// Admin / Audit
http.route({ path: "/admin/events", method: "GET", handler: listEvents });
http.route({ path: "/admin/bin", method: "GET", handler: listBin });

// Default
http.route({ path: "/", method: "GET", handler: home });

export default http;
