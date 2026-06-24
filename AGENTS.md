# AGENTS.md

This file is for coding agents working in the `stream-forge-frontend` repository.

## Project Summary

Stream Forge frontend is a Next.js 16 App Router application using a domain-feature structure.

- Routing lives in `app/`
- Domain code lives in `features/`
- App-wide shared code lives in `shared/`
- Reusable UI primitives live in `components/ui/`
- Global styles live in `styles/`
- API contracts and backend notes live in `api-reference/`

This repo is already migrated away from a page-heavy structure. Keep route files thin and put page logic inside features.

## Stack

- Next.js `16.2.6`
- React `19.2.0`
- TypeScript
- Tailwind CSS v4
- Radix UI / shadcn primitives
- Recharts for charts
- `hls.js` for browser HLS playback
- Local file dependency: `@streamforge/js-sdk` from `../stream-forge-backend/sdk/js-sdk`

## Important Commands

- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

Lint is configured through [`eslint.config.mjs`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/eslint.config.mjs).

## Design

Before making meaningful UI changes, read [`DESIGN.md`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/DESIGN.md).

Treat `DESIGN.md` as the primary design-direction document for this repo. `AGENTS.md` summarizes engineering and integration expectations, but it does not replace the product/design guidance in `DESIGN.md`.

## Architecture Rules

### 1. Keep routes thin

Each route in `app/**/page.tsx` should mostly import and render a feature page component.

Examples:
- video pages belong under `features/videos`
- admin pages belong under `features/admin`
- dashboard role views belong under `features/dashboard`

### 2. Centralize API calls

Use [`shared/lib/api.ts`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/shared/lib/api.ts) as the single source for backend requests.

Do not scatter raw `fetch()` calls through pages/components unless there is a very strong reason.

### 3. Put shared app behavior in `shared/`

Use `shared/components` for app-wide building blocks such as:
- `DashboardLayout`
- `Header`
- `ProtectedRoute`
- `AuthenticatedThumbnail`

Use `shared/hooks` for generic hooks and `shared/lib` for utilities and integration code.

### 4. Keep generated UI infra in `components/ui`

Do not move shadcn/Radix primitives into feature folders unless there is a deliberate system-wide redesign.

## Auth Model

Auth is real, not mocked.

- Auth state is managed in [`features/auth/AuthContext.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/features/auth/AuthContext.tsx)
- Tokens are stored in `localStorage`
- `apiClient` stores the current bearer token
- login: `/api/v1/auth/login`
- refresh: `/api/v1/auth/refresh`
- current user: `/api/v1/auth/me`

Frontend roles are:
- `admin`
- `editor`
- `viewer`

There is also a view-switching concept in the shell UI. Do not assume the visible dashboard/sidebar always matches the user’s highest backend role.

## Media / Video Notes

### HLS playback

Video playback uses HLS:
- `VideoPlayer` in [`features/videos/components/VideoPlayer.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/features/videos/components/VideoPlayer.tsx)
- `hls.js` is used for non-native browsers

There is an interim auth workaround in the player that adds bearer headers through `hls.js` requests. Treat that as temporary infrastructure, not a final media-auth design.

### Authenticated thumbnails

Thumbnail requests may require JWT auth.

Use [`shared/components/AuthenticatedThumbnail.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/shared/components/AuthenticatedThumbnail.tsx) instead of plain `<img>` for protected backend thumbnails.

### Uploads

Uploads are wired through the local JS SDK:
- package: `@streamforge/js-sdk`
- wrapper: `features/videos/lib/uploadClient`
- upload page: `features/videos/pages/upload/UploadVideoPage.tsx`

If SDK typings/runtime change, rebuild the SDK in the backend repo before expecting the frontend to pick them up.

## Analytics Notes

Playback analytics ingestion is frontend-configurable through env vars in [`.env.example`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/.env.example).

Current ingestion happens from the video player, not as a general app-wide event system.

Admin analytics reporting is wired to backend endpoints and rendered from `features/admin/pages/analytics`.

## Environment Variables

Known public env vars include:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ANALYTICS_INGESTION_ENABLED`
- `NEXT_PUBLIC_ANALYTICS_SEND_ANONYMOUS`
- `NEXT_PUBLIC_ANALYTICS_TRACK_PAUSE`
- `NEXT_PUBLIC_ANALYTICS_TRACK_SEEK`
- `NEXT_PUBLIC_ANALYTICS_TRACK_CLOSE`
- `NEXT_PUBLIC_ANALYTICS_ENDPOINT_BASE_URL`

Rules:
- `NEXT_PUBLIC_API_URL` should be the API origin only
- analytics endpoint override changes the base URL only, not the path shape
- missing boolean analytics flags default to enabled behavior

## Existing Feature Areas

Main implemented domains:

- `features/auth`
- `features/videos`
- `features/admin`
- `features/dashboard`
- `features/playlists`
- `features/bookmarks`
- `features/notifications`

When adding new behavior, prefer extending the owning feature instead of introducing new cross-cutting folders.

## Current Conventions

### Styling

- Tailwind-first styling
- Use existing spacing, density, and muted-card patterns
- Prefer icons from `lucide-react`
- Avoid ad hoc visual systems when the page already has an established pattern
- Follow `DESIGN.md` before introducing layout, color, density, or component-pattern changes

### Types

- Keep feature-owned types near the feature
- Keep only truly cross-feature types in `types/` or shared type modules

### State and effects

- Avoid synchronous `setState` patterns directly inside effects when an async wrapper or derived state will do
- Keep effects narrow and dependency-correct

### Errors

- Return structured API responses from `apiClient`
- Surface user-visible errors in the page UI instead of swallowing them silently

## Files Worth Checking Before Big Changes

- [`shared/lib/api.ts`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/shared/lib/api.ts)
- [`features/auth/AuthContext.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/features/auth/AuthContext.tsx)
- [`shared/components/DashboardLayout.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/shared/components/DashboardLayout.tsx)
- [`shared/components/Header.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/shared/components/Header.tsx)
- [`features/videos/components/VideoPlayer.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/features/videos/components/VideoPlayer.tsx)
- [`DESIGN.md`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/DESIGN.md)
- [`EXECUTION_PLAN.md`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/EXECUTION_PLAN.md)
- `documentation/plans/*`
- `api-reference/stream-forge.yaml`

## Agent Guidance

- Preserve the current route structure
- Prefer structural consistency over clever abstractions
- Reuse `apiClient`, `DashboardLayout`, `AuthenticatedThumbnail`, and feature-local helpers before inventing new patterns
- Run `npm run lint` after edits
- Run `npm run build` for changes that affect routing, typing, player behavior, auth, or shared components

## Avoid

- Duplicating backend request logic outside `shared/lib/api.ts`
- Replacing authenticated thumbnail/video access with unauthenticated shortcuts
- Moving shared primitives out of `components/ui` just for organization
- Introducing mock data for flows that are already backed by the API, unless explicitly asked
