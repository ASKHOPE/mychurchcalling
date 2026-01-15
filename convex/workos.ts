import { httpAction } from "./_generated/server";
import { WorkOS } from "@workos-inc/node";
import { api } from "./_generated/api";

// Initialize WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const clientId = process.env.WORKOS_CLIENT_ID!;
const APP_URL = process.env.APP_URL || "https://mychurchcalling.netlify.app";

/**
 * Helper to log events to the database.
 */
async function logEvent(ctx: any, action: string, target: string, description: string, actor = "Admin") {
  await ctx.runMutation(api.admin.logEvent, { action, actor, target, description });
}

export const login = httpAction(async () => {
  const redirectUri = process.env.WORKOS_REDIRECT_URI!;
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "authkit", redirectUri, clientId,
  });
  return new Response(null, { status: 302, headers: { Location: authorizationUrl } });
});

export const callback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  try {
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({ code, clientId });
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    const currentRole = (user.metadata?.role as any) || (isAdmin ? "admin" : "member");

    // If first login and is admin, update WorkOS metadata automatically
    if (isAdmin && !user.metadata?.role) {
      await workos.userManagement.updateUser({
        userId: user.id,
        metadata: { ...user.metadata, role: "admin" }
      });
    }

    const sessionData = {
      isAuthenticated: true,
      isLoading: false,
      user: {
        _id: user.id,
        _creationTime: Date.now(),
        name: userName,
        email: user.email,
        picture: user.profilePictureUrl || null,
        tokenIdentifier: `workos|${user.id}`,
        role: currentRole,
        calling: (user.metadata?.calling as any) || (isAdmin ? "Bishop" : "Member"),
        isArchived: !!user.metadata?.isArchived,
        lastLoginAt: Date.now(),
      },
      accessToken,
    };

    const encodedSession = btoa(JSON.stringify(sessionData)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedRefresh = btoa(refreshToken).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const redirectUrl = new URL(APP_URL);
    redirectUrl.searchParams.set("session", encodedSession);
    redirectUrl.searchParams.set("refresh", encodedRefresh);

    await logEvent(ctx, "LOGIN", user.id, `${userName} logged in.`);

    return new Response(null, { status: 302, headers: { Location: redirectUrl.toString() } });
  } catch (error) {
    return new Response(null, { status: 302, headers: { Location: APP_URL } });
  }
});

export const listUsers = httpAction(async (ctx) => {
  try {
    const { data: users } = await workos.userManagement.listUsers();
    // Filter out users who are "deleted" (in bin)
    const activeUsers = users.filter(u => !u.metadata?.deletedAt);

    return new Response(JSON.stringify({
      users: activeUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        role: u.metadata?.role || 'member',
        calling: u.metadata?.calling || 'Member',
        isArchived: !!u.metadata?.isArchived,
        status: u.emailVerified ? 'active' : 'pending',
        lastActive: u.updatedAt,
      }))
    }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return new Response(JSON.stringify({ users: [] }), { status: 200 });
  }
});

export const updateUser = httpAction(async (ctx, request) => {
  const { userId, role, calling, isArchived, name } = await request.json();
  try {
    const user = await workos.userManagement.updateUser({
      userId,
      metadata: {
        role,
        calling,
        isArchived: isArchived ? "true" : ""
      }
    });

    await logEvent(ctx, "UPDATE_USER", userId, `Updated user permissions/role: ${role}, ${calling}. Archived: ${!!isArchived}`);

    return new Response(JSON.stringify({ success: true, user }), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 });
  }
});

/**
 * Soft Delete (Move to Bin)
 */
export const softDeleteUser = httpAction(async (ctx, request) => {
  const { userId, deletedBy } = await request.json();
  try {
    const user = await workos.userManagement.getUser(userId);
    const deletedAt = Date.now();

    // Mark as deleted in WorkOS metadata
    await workos.userManagement.updateUser({
      userId,
      metadata: { ...user.metadata, deletedAt: deletedAt.toString() }
    });

    // Add to Convex Recycle Bin for 30-day tracking
    await ctx.runMutation(api.admin.addToBin, {
      type: "user",
      originalId: userId,
      data: { ...user, name: `${user.firstName} ${user.lastName}` },
      deletedBy: deletedBy || "Admin"
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Soft delete failed" }), { status: 500 });
  }
});

/**
 * Permanent Delete
 */
export const permanentDeleteUser = httpAction(async (ctx, request) => {
  const { userId } = await request.json();
  try {
    await workos.userManagement.deleteUser(userId);
    await logEvent(ctx, "PERMANENT_DELETE", userId, `User permanently deleted from system.`);
    return new Response(JSON.stringify({ success: true }), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Permanent delete failed" }), { status: 500 });
  }
});

/**
 * Restore from Bin
 */
export const restoreUser = httpAction(async (ctx, request) => {
  const { userId } = await request.json();
  try {
    const user = await workos.userManagement.getUser(userId);
    const metadata = { ...user.metadata };
    delete metadata.deletedAt;

    await workos.userManagement.updateUser({ userId, metadata });

    // Remove from Convex Bin (find by originalId)
    // Note: For simplicity, we assume the client might pass binId or we query it
    // In this implementation, we'll just log it.
    await logEvent(ctx, "RESTORE_USER", userId, `User restored from recycle bin.`);

    return new Response(JSON.stringify({ success: true }), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Restore failed" }), { status: 500 });
  }
});

/**
 * List Events (Timeline)
 */
export const listEvents = httpAction(async (ctx) => {
  const logs = await ctx.runQuery(api.admin.getLogs);
  return new Response(JSON.stringify({ logs }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});

/**
 * List Bin Items
 */
export const listBin = httpAction(async (ctx) => {
  const items = await ctx.runQuery(api.admin.getBin);
  return new Response(JSON.stringify({ items }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});

export const signOut = httpAction(async () => {
  const redirectUrl = new URL(APP_URL);
  redirectUrl.searchParams.set("signout", "true");
  return new Response(null, { status: 302, headers: { Location: redirectUrl.toString() } });
});

export const refresh = httpAction(async (ctx, request) => {
  const { refreshToken } = await request.json();
  try {
    const result = await workos.userManagement.authenticateWithRefreshToken({ refreshToken, clientId });
    return new Response(JSON.stringify({ accessToken: result.accessToken, refreshToken: result.refreshToken }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Refresh failed" }), { status: 401 });
  }
});

export const inviteUser = httpAction(async (ctx, request) => {
  const { email } = await request.json();
  try {
    const invitation = await workos.userManagement.sendInvitation({ email });
    await logEvent(ctx, "INVITE_USER", email, `Sent invitation to ${email}`);
    return new Response(JSON.stringify(invitation), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invite failed" }), { status: 500 });
  }
});

export const home = httpAction(async () => {
  return new Response(`⛪ MyChurchCalling AuthKit`, { headers: { "Content-Type": "text/plain" } });
});

/**
 * List dynamic roles
 */
export const listRoles = httpAction(async (ctx) => {
  const roles = await ctx.runQuery(api.admin.getRoles);
  return new Response(JSON.stringify({ roles }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});

/**
 * List dynamic callings
 */
export const listCallings = httpAction(async (ctx) => {
  const callings = await ctx.runQuery(api.admin.getCallings);
  return new Response(JSON.stringify({ callings }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});

/**
 * Add new role
 */
export const createRole = httpAction(async (ctx, request) => {
  const { name, description, permissions } = await request.json();
  const roleId = await ctx.runMutation(api.admin.addRole, { name, description, permissions });
  return new Response(JSON.stringify({ success: true, roleId }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});

/**
 * Add new calling
 */
export const createCalling = httpAction(async (ctx, request) => {
  const { name, category } = await request.json();
  const callingId = await ctx.runMutation(api.admin.addCalling, { name, category });
  return new Response(JSON.stringify({ success: true, callingId }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});
