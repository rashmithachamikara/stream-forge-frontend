# Phase 6 Plan: Video Transcriptions + Admin Transcription Operations

## Summary

Wire the new transcription API into the frontend in a way that fits the existing feature-based structure and current video-processing UX.

This phase should cover:

- per-video transcription request and status visibility
- transcript viewing, player captions, and transcript search on the watch experience
- admin transcription settings

This should build on the existing `features/videos`, `features/admin`, and `shared/lib/api.ts` patterns instead of introducing a parallel system.

This phase is intentionally focused on the **user-facing transcription experience** and **admin transcription settings**. The broader cross-job Processing surface is deferred.

## Scope

### In scope

- API client methods and types for the new transcription endpoints
- watch-page transcription status, transcript viewing, and player captions
- transcript search with seek-to-timestamp behavior
- admin transcription settings read/update UI
- manage-page transcription visibility and retry affordances
- reuse of the current processing-status polling pattern where transcription status is active

### Out of scope

- full transcript editor workflows
- unified admin/editor Processing page for transcode + transcription tracking
- grouped processing dashboards for mixed transcode + transcription monitoring
- notification automation unless the existing API already emits suitable notification records
- generalized cross-video global transcript search

## Backend Surface To Wire

### Admin processing

- `GET /api/v1/admin/processing/transcription-jobs`
- `GET /api/v1/admin/processing/transcription-jobs/{jobKey}`
- `POST /api/v1/admin/processing/transcription-jobs/{jobKey}/retry`
- `POST /api/v1/admin/processing/transcription-jobs/{jobKey}/resync`

### Admin settings

- `GET /api/v1/admin/transcription/settings`
- `PUT /api/v1/admin/transcription/settings`

### Video transcriptions

- `GET /api/v1/videos/{videoId}/transcriptions`
- `POST /api/v1/videos/{videoId}/transcriptions`
- `GET /api/v1/videos/{videoId}/transcription-jobs`
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/status`
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}`
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/content`
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/chunks`
- `GET /api/v1/videos/{videoId}/transcript-search`

### Internal callback

- `POST /internal/transcriptions/callback`

Frontend should not call the internal callback endpoint, but the schema additions are useful for understanding job/result modeling.

## Implementation Plan

### 1. Shared API and types

- Add transcription DTO/domain types in the owning feature areas:
  - transcription settings and admin job models in `features/admin/types.ts`
  - per-video transcription models, transcript chunk models, and transcript search models in `features/videos/types.ts`
- Add `apiClient` methods in `shared/lib/api.ts`
- Support optional `shareToken` parameters on transcription read/search endpoints where exposed by the API
- Normalize transcription statuses into frontend-friendly buckets:
  - persisted active: `Pending`, `Processing`
  - live active: `queued`, `running`
  - success: `Completed`, `completed`
  - failed: `Failed`, `failed`
  - mixed/grouped: `Partial`
- Treat `accepted` as a submit-response concept, not the main steady-state polling state for list/status rendering

### 1A. Exact endpoint-to-UX mapping

- `GET /transcriptions`
  - artifact discovery
  - language/format options
  - status display
  - primary default selection
- `GET /transcriptions/{transcriptionId}` and `GET /content`
  - file-oriented artifact retrieval only
  - player caption tracks
  - direct downloads / direct file viewing
- `GET /chunks`
  - primary readable transcript panel source
  - timestamp-linked transcript rows
  - full transcript reading for the selected artifact
- `GET /transcript-search`
  - search/navigation endpoint
  - matched-row targeting
  - not the primary full-transcript read source

### 2. Watch page transcription support

- Extend [`VideoDetailPage.tsx`](/abs/path/C:/Files/Shared/Software%20Projects/Stream%20Forge/stream-forge-frontend/features/videos/pages/detail/VideoDetailPage.tsx) with a transcription section
- Video playback remains available once video processing is `Ready`, even if transcription is still active
- Show:
  - no transcript state
  - requested/pending/running state
  - failed state
  - available transcript state
- Add request-transcription action for `admin` and `editor`
- Add transcript content viewer using `/transcriptions/{transcriptionId}/chunks` as the primary transcript-reading source
- Use `/transcriptions` to discover artifacts and select the primary transcription
- Use `/transcriptions/{transcriptionId}` or `/content` for artifact fetch/download/player-track use only
- Add transcript search UI with result timestamps
- Clicking a transcript search result should:
  - seek the video player to the matched timestamp
  - open the transcript panel if hidden
  - highlight the matched transcript row/chunk
  - not auto-play by default
- Add player caption-track support as part of this phase:
  - language-selectable when multiple caption artifacts exist
  - `VTT` preferred over `SRT` for player-facing caption use
- Add user-facing caption download actions for completed artifacts
- Caption fetch/download should be available to anyone who can watch the video, including valid `shareToken` viewers where supported by the endpoint
- Transcript panel should live above playlist/related videos on the watch page
- Transcript reader should render timestamp-linked rows from structured chunk data, not raw caption-file parsing

### 3. Processing/progress behavior

- Reuse the current background-job UX pattern:
  - initial status fetch
  - polling while a transcription is in an active state
- Prefer the same mental model already used for video processing on:
  - watch page
  - manage page
- Poll only while status is active and stop when status is terminal
- Recommended active polling conditions:
  - persisted row state: `Pending`, `Processing`
  - live worker state when present: `queued`, `running`
- Recommended terminal stop conditions:
  - `Completed`
  - `Failed`
  - grouped/admin mixed state: `Partial`
- Recommended intervals:
  - watch/manage: every 5-10 seconds while active
  - a future admin jobs page: every 3-5 seconds while active
- Render richer transcription live-status fields when available:
  - `status`
  - `progressPercent`
  - `stage`
  - `message`
  - `language`
  - `startedAt`
  - `completedAt`
  - `mediaDurationSeconds`
  - `transcribedUntilSeconds`

### 4. Manage page transcription visibility

- Add a transcription subsection or card to the video manage page
- Show current/latest transcription status
- Show available transcripts and basic metadata
- Add request/retry entry points for `admin` and `editor`
- Retry ownership rule:
  - admins can act broadly
  - editors can retry failures on their own videos

### 5. Admin transcription settings UI

- Add settings UI for:
  - enabled
  - autoTranscribeOnReady
  - provider
  - defaultLanguage
  - outputFormats
  - model
  - device
  - computeType
  - beamSize
  - enableVad
  - enableWordTimestamps
- Keep it aligned with the current admin settings design language

### 6. Share-token support review

- Where watch/transcript access supports `shareToken`, thread it through the frontend if there is already a shared/restricted playback flow using route/query-based token access
- If that flow is not yet established in the frontend, keep this support minimal and avoid inventing a new share UI in this phase
- Apply share-token aware behavior to:
  - transcript chunk reads
  - transcript search
  - caption fetch/download
- Safe product rule: if the viewer can watch the video, the viewer can fetch the user-facing caption artifact for that video

### 7. Primary transcription selection

- Support multiple languages and formats per video
- Derive one primary default selection with this priority order:
  1. user-preferred language
  2. completed over non-completed
  3. preferred format: `VTT` over `SRT`
  4. newest `UpdatedAt`
  5. newest `CreatedAt`
  6. stable final fallback: smallest / lexicographically earliest `Id`
- If two completed `VTT` artifacts exist in the same language, use the same tie-break order above
- UI behavior:
  - transcript reader: language-selectable
  - player captions: language-selectable
  - downloads: format-selectable

### 8. Explicit non-goals for this phase

- Do not build the transcript reader by parsing `VTT` or `SRT` as the primary UX contract
- Do not assume there is only one transcription per video
- Do not auto-play when a search result is clicked
- Do not introduce the full Processing page in this phase
- Do not make caption downloads admin/editor-only

## Public Interfaces

### `shared/lib/api.ts`

Add methods equivalent to:

- `getAdminTranscriptionJobs(filters)`
- `getAdminTranscriptionJob(jobKey)`
- `retryAdminTranscriptionJob(jobKey)`
- `resyncAdminTranscriptionJob(jobKey)`
- `getAdminTranscriptionSettings()`
- `updateAdminTranscriptionSettings(payload)`
- `getVideoTranscriptions(videoId, options?)`
- `requestVideoTranscription(videoId, payload)`
- `getVideoTranscriptionJobs(videoId, options?)`
- `getVideoTranscriptionStatus(videoId, transcriptionId, options?)`
- `getVideoTranscription(videoId, transcriptionId, options?)`
- `getVideoTranscriptionContent(videoId, transcriptionId, options?)`
- `getVideoTranscriptionChunks(videoId, transcriptionId, options?)`
- `searchVideoTranscript(videoId, filters)`

### Feature types

Add frontend-safe types for:

- transcription settings
- transcription job
- transcription artifact
- transcript chunk
- transcription live status
- transcription record
- transcript search result

## UX Notes

- Use the existing `Progress` component and current processing-card language where possible
- Place transcript UI above playlist/related videos on the watch page
- Keep transcript UI secondary to playback, not visually dominant over the video itself
- Use timestamp-linked rows as the primary transcript reading UX
- Do not make raw VTT/SRT parsing the primary transcript reader contract in this phase
- The readable transcript panel should be powered by structured chunk rows, not raw artifact text

## Deferred Processing Surface

- A dedicated `Processing` page/surface is intentionally deferred to a later phase/subphase
- When that later work happens:
  - admins should get a `Processing` sidebar item
  - editors should get a reachable processing surface in the editor portal as a `Processing` tab
  - editor visibility should be limited to their own videos
- Unified transcode + transcription job tracking should be designed there, not forced into this phase
- That later phase should cover:
  - grouped transcription job views
  - mixed `Partial` state presentation
  - transcode + transcription coordination in one operational surface
  - editor-scoped processing visibility

## Test Plan

- Run `npx tsc --noEmit`
- Run `npm run lint`
- Run `npm run build`

### Manual checks

- request a transcription for a video
- confirm requested/running/completed/failed states render correctly
- confirm polling updates active transcription state
- confirm video playback remains available once video processing is `Ready`, even if transcription is still active
- open transcript chunk content successfully
- search transcript content and confirm seek + panel-open + highlight behavior
- verify player captions can load from completed artifacts
- verify `VTT` is preferred over `SRT` when both are available
- verify caption download works for normal viewers and valid `shareToken` viewers where supported
- verify primary transcription selection follows the documented heuristic
- retry a failed job
- view and update admin transcription settings

## Assumptions

- The backend transcription endpoints are authenticated with the same general auth model already used in the frontend
- Transcription read/search endpoints that accept `shareToken` do not require a separate frontend share experience in this phase
- The current video-processing progress UX is the baseline pattern for transcription progress until a more specialized transcription UX is needed
- `/transcriptions/{transcriptionId}/chunks` is the primary structured transcript-reading endpoint for this phase
- `/transcriptions/{transcriptionId}/content` remains an artifact/file-oriented endpoint, not the main transcript-reader payload
