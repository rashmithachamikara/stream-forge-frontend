# Phase 1: API Foundation + Video Library

## Goal

Replace the mock video library with real paged data from the updated StreamForge API while establishing stable API types and mappers for later phases.

## Checklist

- [X] Add shared API support for `/api/v1` paths.
- [X] Add typed DTOs and mapped domain models for video summaries, categories, tags, and paged responses.
- [X] Add API methods for:
  - [X] `GET /api/v1/videos`
  - [X] `GET /api/v1/categories`
  - [X] `GET /api/v1/tags`
- [X] Replace `mockVideos` usage in `/videos` with real API data.
- [X] Default viewer library query to `status=Ready` and `visibility=Public`.
- [X] Wire search, category, tag, sort, page, and page size to backend query params.
- [X] Preserve grid/list view mode.
- [X] Preserve navigation to `/videos/{videoId}`.
- [X] Add loading, error, and empty states.

## Acceptance Criteria

- [X] `/videos` loads real backend videos.
- [X] Search and filters call the backend instead of filtering only in memory.
- [X] Pagination reflects backend `totalCount`, `totalPages`, `hasNextPage`, and `hasPreviousPage`.
- [X] Cards use backend thumbnail URLs when available.
- [X] Video cards route to real backend video IDs.

## Tests

- [X] Run `npx tsc --noEmit`.
- [X] Run `npm run build`.
- [ ] Manually verify `/videos` with backend running.
