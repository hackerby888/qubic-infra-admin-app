# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR) on localhost:5173
npm run build      # Type-check + build to dist/
npm run lint       # ESLint
npm run preview    # Serve the dist/ build locally
```

There are no tests in this project.

## Environment

Copy `.env` and set the backend URL:
```
VITE_API_SERVER=http://localhost:3000/
```

The backend defaults to `http://localhost:3000` if the env var is unset (`src/consts/api-server.ts`).

## Architecture

**React 19 + TypeScript + Vite** dashboard for managing Qubic network nodes (LiteNodes and BobNodes).

### Entry point & routing (`src/App.tsx`)

The app checks the subdomain at startup. If the hostname starts with `map`, it renders only `<Map />`. Otherwise it renders the full sidebar/nav shell with React Router routes. All routes live in `App.tsx`.

Route structure:
- `/` → Home (real-time node stats)
- `/map` → Global D3 map
- `/logs-realtime` → Real-time log viewer
- `/operator-management/operator` → Admin-only operator management
- `/node-management/my-nodes`, `/manage-servers`, `/cron-jobs`, `/auth`

### Networking (`src/networking/`)

Two wrapper hooks cover all REST calls:
- `useGeneralGet<T>` — wraps `useQuery`, attaches Bearer token, handles 401 → redirect to `/login`
- `useGeneralPost` (default export) — wraps `useMutation`, same auth pattern

A singleton Socket.io client (`socket.ts`) connects to `API_SERVER` on load. The Home page emits `subscribeToRealtimeStats` and listens for `realtimeStatsUpdate` events.

### Auth

JWT stored in `localStorage` via `MyStorage` (`src/utils/storage.ts`). `MyStorage.getUserInfo()` decodes and returns the payload. Role is either `"admin"` or `"operator"` — admin sees the Operator Management sidebar section.

### State management

Zustand stores in `src/stores/`:
- `useSelectedServersStore` — tracks which server IPs are checked in ManageServers; consumed by the nav action components (PowerManagement, DeployManagement, ShellManagement) to target bulk operations

### UI components

`src/components/ui/` contains shadcn/ui components (do not edit these manually — use the shadcn CLI or edit with care). Custom app components live in `src/components/common/`, `src/components/nav/`, and `src/components/sidebar/`.

Path alias `@/` resolves to `src/` (configured in `vite.config.ts`).

### Types

All shared interfaces are in `src/types/type.ts`: `Server`, `LiteNodeTickInfo`, `BobNodeTickInfo`, `CommandLog`, `CronJob`, `LogEvent`, `TickEvent`, etc.
