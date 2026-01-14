import { httpAction } from "./_generated/server";
import { WorkOS } from "@workos-inc/node";

// Initialize WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const clientId = process.env.WORKOS_CLIENT_ID!;

// App URL - use environment variable or default to Netlify
const APP_URL = process.env.APP_URL || "https://mychurchcalling.netlify.app";

/**
 * Login endpoint - redirects to WorkOS AuthKit.
 */
export const login = httpAction(async () => {
  const redirectUri = process.env.WORKOS_REDIRECT_URI!;

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: redirectUri,
    clientId: clientId,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: authorizationUrl },
  });
});

/**
 * Callback endpoint - exchanges code for tokens and redirects to app with session.
 */
export const callback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    const errorRedirect = new URL(APP_URL);
    errorRedirect.searchParams.set("auth_error", error);
    return new Response(null, {
      status: 302,
      headers: { Location: errorRedirect.toString() },
    });
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  try {
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: clientId,
    });

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    // Create session data
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
        role: "member",
        lastLoginAt: Date.now(),
      },
      accessToken: accessToken,
    };

    // Encode session data as URL-safe base64
    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
    const encodedRefreshToken = Buffer.from(refreshToken).toString('base64url');

    // Redirect to app with session data
    const redirectUrl = new URL(APP_URL);
    redirectUrl.searchParams.set("session", encodedSession);
    redirectUrl.searchParams.set("refresh", encodedRefreshToken);

    console.log("Redirecting to:", redirectUrl.toString());

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl.toString() },
    });
  } catch (error) {
    console.error("WorkOS auth error:", error);
    const errorRedirect = new URL(APP_URL);
    errorRedirect.searchParams.set("auth_error", "Authentication failed");
    return new Response(null, {
      status: 302,
      headers: { Location: errorRedirect.toString() },
    });
  }
});

/**
 * Sign-out endpoint - clears session and redirects.
 */
export const signOut = httpAction(async () => {
  const redirectUrl = new URL(APP_URL);
  redirectUrl.searchParams.set("signout", "true");

  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl.toString() },
  });
});

/**
 * Home page
 */
export const home = httpAction(async () => {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MyChurchCalling Auth</title>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .container { text-align: center; padding: 2rem; }
          h1 { background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .btn { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; border: none; padding: 1rem 2rem; border-radius: 10px; text-decoration: none; display: inline-block; margin: 0.5rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⛪ MyChurchCalling</h1>
          <p>Authentication powered by WorkOS</p>
          <br/>
          <a href="/login" class="btn">Sign In with WorkOS</a>
        </div>
      </body>
    </html>
  `, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
});

/**
 * Refresh token endpoint
 */
export const refresh = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const body = await request.json();
  const { refreshToken } = body;

  if (!refreshToken) {
    return new Response(JSON.stringify({ error: "Missing refresh token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const result = await workos.userManagement.authenticateWithRefreshToken({
      refreshToken,
      clientId,
    });

    return new Response(
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Token refresh failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

/**
 * List users from WorkOS
 */
export const listUsers = httpAction(async () => {
  try {
    const { data: users } = await workos.userManagement.listUsers();

    return new Response(
      JSON.stringify({
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          profilePictureUrl: u.profilePictureUrl,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Failed to list users:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users", users: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

/**
 * Invite user via WorkOS
 */
export const inviteUser = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const body = await request.json();
  const { email } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const invitation = await workos.userManagement.sendInvitation({ email });

    return new Response(
      JSON.stringify({
        id: invitation.id,
        email: invitation.email,
        state: invitation.state,
        expiresAt: invitation.expiresAt,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Failed to invite user:", error);
    return new Response(JSON.stringify({ error: "Failed to send invitation" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
