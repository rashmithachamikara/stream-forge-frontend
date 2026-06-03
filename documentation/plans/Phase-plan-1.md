# Phase 1: API Foundation + Video Library

## Goal

Replace the mock video library with real paged data from the updated StreamForge API while establishing stable API types and mappers for later phases.

## Checklist

- [ ] Add shared API support for `/api/v1` paths.
- [ ] Add typed DTOs and mapped domain models for video summaries, categories, tags, and paged responses.
- [ ] Add API methods for:
  - [ ] `GET /api/v1/videos`
  - [ ] `GET /api/v1/categories`
  - [ ] `GET /api/v1/tags`
- [ ] Replace `mockVideos` usage in `/videos` with real API data.
- [ ] Default viewer library query to `status=Ready` and `visibility=Public`.
- [ ] Wire search, category, tag, sort, page, and page size to backend query params.
- [ ] Preserve grid/list view mode.
- [ ] Preserve navigation to `/videos/{videoId}`.
- [ ] Add loading, error, and empty states.

## Acceptance Criteria

- [ ] `/videos` loads real backend videos.
- [ ] Search and filters call the backend instead of filtering only in memory.
- [ ] Pagination reflects backend `totalCount`, `totalPages`, `hasNextPage`, and `hasPreviousPage`.
- [ ] Cards use backend thumbnail URLs when available.
- [ ] Video cards route to real backend video IDs.

## Tests

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Manually verify `/videos` with backend running.
