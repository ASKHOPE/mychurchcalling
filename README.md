# MyChurchCalling

A church ward management application built with Tauri, Vite, Convex, and WorkOS.

## 📁 Project Structure

```
tauri-app/
├── backend/           # Server-side code (Convex)
│   └── convex/        # Database functions & API
│
├── frontend/          # Client-side code (Vite + TypeScript)
│   ├── src/           # Source files
│   │   ├── api/       # API service layer
│   │   ├── auth/      # Authentication
│   │   ├── components/# UI components
│   │   ├── pages/     # Page views
│   │   ├── styles/    # CSS stylesheets
│   │   └── utils/     # Utilities
│   └── index.html     # Entry point
│
├── shared/            # Shared between frontend/backend
│   └── types/         # TypeScript interfaces
│
├── src-tauri/         # Tauri native code (Rust)
└── dist/              # Build output
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm
- Rust (for Tauri builds)

### Setup
```bash
# Install dependencies
bun install

# Start Convex backend
npx convex dev

# Start frontend dev server
bun run dev

# Build for production
bun run build
```

## 🔧 Development

### Frontend Only
To modify the UI, work in the `frontend/` folder. See `frontend/README.md` for details.

### Backend Only
To modify the API/database, work in `backend/convex/`. See `backend/README.md` for details.

### Shared Types
Types used by both frontend and backend are in `shared/types/`.

## 🔐 Authentication

- **WorkOS SSO**: Enterprise users authenticate via WorkOS
- **Local Auth**: Ward members use username/password stored in Convex

## 📝 Features

- ✅ User Management (invite, edit, archive, delete)
- ✅ Roles & Callings Configuration
- ✅ 30-Day Recycle Bin
- ✅ Audit Log Timeline
- ✅ Local Username/Password Login
- ✅ WorkOS SSO Integration

## 📄 License

Private - All rights reserved
