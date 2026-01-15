# MyChurchCalling - Backend

This folder contains all server-side (Convex) code for the MyChurchCalling application.

## Structure

```
backend/
└── convex/
    ├── _generated/      # Auto-generated Convex types
    ├── schema.ts        # Database schema definitions
    ├── http.ts          # HTTP route handlers
    ├── workos.ts        # WorkOS authentication integration
    ├── localAuth.ts     # Local username/password authentication
    ├── admin.ts         # Admin functions (roles, audit logs, bin)
    └── messages.ts      # Chat/messaging functions
```

## Key Files

| File | Purpose |
|------|---------|
| `schema.ts` | Defines all database tables (users, roles, callings, auditLogs, recycleBin) |
| `http.ts` | Maps HTTP routes to handler functions |
| `workos.ts` | WorkOS SSO integration and user management |
| `localAuth.ts` | Username/password login system |
| `admin.ts` | Audit logging, recycle bin, roles/callings CRUD |

## Running Locally

```bash
# From project root
npx convex dev
```

## Deploying

```bash
npx convex deploy
```

## Environment Variables

Set these in your Convex dashboard:
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_REDIRECT_URI`
- `APP_URL`
- `ADMIN_EMAIL` (for bootstrap admin)
