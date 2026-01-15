# MyChurchCalling - Frontend

This folder contains all client-side (UI) code. Modify files here to change the look and behavior of the app.

## Structure

```
frontend/
├── src/
│   ├── api/           # API service layer (calls to backend)
│   ├── auth/          # Authentication logic
│   ├── components/    # Reusable UI components
│   ├── pages/         # Full page views
│   ├── layouts/       # Layout wrappers (future)
│   ├── hooks/         # Custom React-style hooks (future)
│   ├── stores/        # State management (future)
│   ├── styles/        # CSS stylesheets
│   ├── utils/         # Utility functions
│   └── main.ts        # Application entry point
├── public/            # Static assets (favicon, images)
└── index.html         # HTML entry point
```

## Quick Guide

### To modify a page:
Edit files in `src/pages/`:
- `Home.ts` - Dashboard
- `Users.ts` - User management
- `Login.ts` - Login screen
- `Config.ts` - Roles & Callings settings
- `Bin.ts` - Recycle bin
- `Logs.ts` - Audit log timeline

### To modify UI components:
Edit files in `src/components/`:
- `Menu.ts` - Sidebar navigation
- `Tags.ts` - Role/calling badges
- `ui.ts` - Common UI elements

### To change styles:
Edit files in `src/styles/`:
- `base.css` - Typography, colors, variables
- `components.css` - Button, input, card styles
- `pages.css` - Page-specific styles
- `animations.css` - Transitions and animations

### To add a new page:
1. Create `src/pages/NewPage.ts`
2. Add route in `src/main.ts`
3. Add menu item in `src/components/Menu.ts`
4. Add type to `shared/types/index.ts`

## Running Locally

```bash
# From project root
bun run dev
```

## Path Aliases

Use these shortcuts in imports:
- `@components/` → `src/components/`
- `@pages/` → `src/pages/`
- `@api/` → `src/api/`
- `@styles/` → `src/styles/`
- `@utils/` → `src/utils/`
- `@shared/` → `shared/` (shared types)
