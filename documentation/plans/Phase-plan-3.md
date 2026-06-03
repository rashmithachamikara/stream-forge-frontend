# Phase 3: Upload Metadata + Processing Status

## Goal

Send full supported upload metadata through the SDK upload session flow and show backend processing state after upload.

## Checklist

- [X] Extend frontend upload wrapper types to include supported API metadata.
- [X] Send upload session fields:
  - [X] `title`
  - [X] `description`
  - [X] `totalSize`
  - [X] `contentType`
  - [X] `categoryId`
  - [X] `visibility`
  - [X] `tagIds`
- [X] Replace free-text category inputs with API-backed category selection.
- [X] Replace free-text tag inputs with API-backed tag selection.
- [X] Route to returned `videoId` after upload completion.
- [X] Add API method for `GET /api/v1/videos/{videoId}/processing-status`.
- [X] Show processing status on the upload success state or video detail page.
- [ ] Optionally add upload session history from `GET /api/v1/me/upload-sessions`.

## Acceptance Criteria

- [X] Upload creates a backend session with category, tags, and visibility.
- [X] Upload progress remains real SDK progress.
- [X] Upload completion links to the real video detail route.
- [X] Processing status renders for non-ready videos.

## Tests

- [X] Run `npx tsc --noEmit`.
- [X] Run `npm run build`.
- [ ] Manually upload a video as editor/admin.
- [ ] Verify backend receives metadata in the upload session request.
