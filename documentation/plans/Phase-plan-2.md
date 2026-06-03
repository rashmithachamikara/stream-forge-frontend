# Phase 2: Real Video Detail + Playback Metadata

## Goal

Replace mock video detail metadata with backend video detail data while keeping the existing HLS player and controls.

## Checklist

- [ ] Add typed DTOs and mappers for `VideoDetailDto`.
- [ ] Add API method for `GET /api/v1/videos/{videoId}`.
- [ ] Update `/videos/[id]` to load real detail data.
- [ ] Use backend `thumbnailUrl` and `playbackManifestUrl` when present.
- [ ] Keep fallback URL helpers for manifest/thumbnail only when backend fields are missing.
- [ ] Render backend metadata:
  - [ ] title
  - [ ] description
  - [ ] uploader
  - [ ] category
  - [ ] tags
  - [ ] visibility
  - [ ] status
  - [ ] view count
  - [ ] created/updated dates
- [ ] Add role-aware visibility for management actions.
- [ ] Keep unsupported actions disabled or hidden.

## Acceptance Criteria

- [ ] `/videos/{videoId}` renders backend metadata.
- [ ] HLS playback still works.
- [ ] Invalid or missing IDs show a useful error state instead of crashing.
- [ ] Viewer users do not see edit/delete/archive/access management actions.

## Tests

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Manually verify detail pages for Ready, Processing, and invalid videos.
