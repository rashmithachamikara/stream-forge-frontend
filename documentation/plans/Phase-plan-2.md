# Phase 2: Real Video Detail + Playback Metadata

## Goal

Replace mock video detail metadata with backend video detail data while keeping the existing HLS player and controls.

## Checklist

- [X] Add typed DTOs and mappers for `VideoDetailDto`.
- [X] Add API method for `GET /api/v1/videos/{videoId}`.
- [X] Update `/videos/[id]` to load real detail data.
- [X] Use backend `thumbnailUrl` and `playbackManifestUrl` when present.
- [X] Keep fallback URL helpers for manifest/thumbnail only when backend fields are missing.
- [X] Render backend metadata:
  - [X] title
  - [X] description
  - [X] uploader
  - [X] category
  - [X] tags
  - [X] visibility
  - [X] status
  - [X] view count
  - [X] created/updated dates
- [X] Add role-aware visibility for management actions.
- [X] Keep unsupported actions disabled or hidden.

## Acceptance Criteria

- [X] `/videos/{videoId}` renders backend metadata.
- [X] HLS playback still works.
- [X] Invalid or missing IDs show a useful error state instead of crashing.
- [X] Viewer users do not see edit/delete/archive/access management actions.

## Tests

- [X] Run `npx tsc --noEmit`.
- [X] Run `npm run build`.
- [ ] Manually verify detail pages for Ready, Processing, and invalid videos.
