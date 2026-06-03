# Phase 4: Editor Management

## Goal

Replace the editor dashboard mock list with real owned-video management using `/api/v1/me/videos` and video mutation endpoints.

## Checklist

- [ ] Add API method for `GET /api/v1/me/videos`.
- [ ] Replace editor dashboard mock videos with owned backend videos.
- [ ] Add editor filters:
  - [ ] status
  - [ ] visibility
  - [ ] search
  - [ ] sort
  - [ ] pagination
- [ ] Add API method for `PATCH /api/v1/videos/{videoId}`.
- [ ] Add edit metadata dialog for supported fields.
- [ ] Add API method for `POST /api/v1/videos/{videoId}/archive`.
- [ ] Add API method for `DELETE /api/v1/videos/{videoId}`.
- [ ] Wire archive/delete actions with confirmation.
- [ ] Show video statuses: Uploading, Processing, Ready, Failed, Deleted.

## Acceptance Criteria

- [ ] Editor dashboard shows videos owned by the signed-in editor.
- [ ] Metadata edits persist after refresh.
- [ ] Archive/delete actions call backend and update the list.
- [ ] Processing/failed videos are visibly distinguishable from ready videos.

## Tests

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Manually verify editor dashboard as editor.
- [ ] Manually verify role protection still blocks viewers.
