# Phase 3: Upload Metadata + Processing Status

## Goal

Send full supported upload metadata through the SDK upload session flow and show backend processing state after upload.

## Checklist

- [ ] Extend frontend upload wrapper types to include supported API metadata.
- [ ] Send upload session fields:
  - [ ] `title`
  - [ ] `description`
  - [ ] `totalSize`
  - [ ] `contentType`
  - [ ] `categoryId`
  - [ ] `visibility`
  - [ ] `tagIds`
- [ ] Replace free-text category inputs with API-backed category selection.
- [ ] Replace free-text tag inputs with API-backed tag selection.
- [ ] Route to returned `videoId` after upload completion.
- [ ] Add API method for `GET /api/v1/videos/{videoId}/processing-status`.
- [ ] Show processing status on the upload success state or video detail page.
- [ ] Optionally add upload session history from `GET /api/v1/me/upload-sessions`.

## Acceptance Criteria

- [ ] Upload creates a backend session with category, tags, and visibility.
- [ ] Upload progress remains real SDK progress.
- [ ] Upload completion links to the real video detail route.
- [ ] Processing status renders for non-ready videos.

## Tests

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Manually upload a video as editor/admin.
- [ ] Verify backend receives metadata in the upload session request.
