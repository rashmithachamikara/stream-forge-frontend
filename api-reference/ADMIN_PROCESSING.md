## Technical frontend contract

### Viewer-facing transcription APIs

#### 1. List transcription artifacts for a video
`GET /api/v1/videos/{videoId}/transcriptions`

Response:
```json
[
  {
    "id": "uuid",
    "videoId": "uuid",
    "language": "en",
    "format": "VTT",
    "status": "Completed",
    "source": "local-faster-whisper",
    "correlationId": "string|null",
    "workerJobId": "string|null",
    "model": "string|null",
    "failureReason": "string|null",
    "createdAt": "2026-06-29T10:00:00Z",
    "updatedAt": "2026-06-29T10:01:00Z",
    "liveStatus": {
      "status": "running",
      "progressPercent": 42,
      "stage": "transcribing",
      "message": "string|null",
      "language": "en",
      "startedAt": "2026-06-29T10:00:00Z",
      "completedAt": null,
      "mediaDurationSeconds": 3600,
      "transcribedUntilSeconds": 1512
    }
  }
]
```

Notes:
- one row per `(videoId, language, format)`
- `liveStatus` may be `null`
- `status` currently: `Pending | Processing | Completed | Failed`

#### 2. List grouped transcription jobs for one video
`GET /api/v1/videos/{videoId}/transcription-jobs`

Response:
```json
[
  {
    "jobKey": "string",
    "videoId": "uuid",
    "language": "en",
    "status": "Processing",
    "source": "local-faster-whisper",
    "correlationId": "string|null",
    "workerJobId": "string|null",
    "model": "string|null",
    "failureReason": "string|null",
    "createdAt": "2026-06-29T10:00:00Z",
    "updatedAt": "2026-06-29T10:01:00Z",
    "liveStatus": {
      "status": "running",
      "progressPercent": 42,
      "stage": "transcribing",
      "message": "string|null",
      "language": "en",
      "startedAt": "2026-06-29T10:00:00Z",
      "completedAt": null,
      "mediaDurationSeconds": 3600,
      "transcribedUntilSeconds": 1512
    },
    "artifacts": [
      {
        "id": "uuid",
        "format": "VTT",
        "status": "Processing",
        "failureReason": null,
        "createdAt": "2026-06-29T10:00:00Z",
        "updatedAt": "2026-06-29T10:01:00Z"
      }
    ]
  }
]
```

Notes:
- one grouped job can contain multiple artifacts such as `VTT` and `SRT`
- grouped `status` may also be `Partial`

#### 3. Get single transcription status
`GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/status`

Response:
same shape as one item from `/transcriptions`

#### 4. Get transcription artifact file
`GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}`
`GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/content`

Response:
- streamed file content
- content type:
  - `text/vtt`
  - `application/x-subrip`

Notes:
- use for player captions and downloads
- not a structured transcript JSON endpoint

#### 5. Get structured transcript chunks
`GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/chunks`

Response:
```json
[
  {
    "chunkId": "uuid",
    "videoId": "uuid",
    "transcriptionId": "uuid",
    "language": "en",
    "startSeconds": 12.4,
    "endSeconds": 18.9,
    "content": "Transcript text"
  }
]
```

Notes:
- primary endpoint for transcript panel rendering
- if transcription is a sibling artifact for same video/language, backend may resolve shared chunks

#### 6. Search transcript chunks
`GET /api/v1/videos/{videoId}/transcript-search?q=term&page=1&pageSize=20&language=en`

Response:
```json
{
  "items": [
    {
      "chunkId": "uuid",
      "videoId": "uuid",
      "transcriptionId": "uuid",
      "language": "en",
      "startSeconds": 12.4,
      "endSeconds": 18.9,
      "content": "Matched transcript text"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
}
```

---

### Viewer-facing transcription POST

#### 7. Request transcription
`POST /api/v1/videos/{videoId}/transcriptions`

Request:
```json
{
  "language": "en",
  "outputFormats": ["VTT", "SRT"]
}
```

Response:
currently returns the transcription artifact rows:
```json
[
  {
    "id": "uuid",
    "videoId": "uuid",
    "language": "en",
    "format": "VTT",
    "status": "Pending",
    "source": "local-faster-whisper",
    "correlationId": "string|null",
    "workerJobId": "string|null",
    "model": "string|null",
    "failureReason": null,
    "createdAt": "2026-06-29T10:00:00Z",
    "updatedAt": "2026-06-29T10:00:00Z",
    "liveStatus": null
  }
]
```

Notes:
- does not create duplicate rows for same `(videoId, language, format)`
- reuses existing row keys
- active orphan rows are now reconciled before blocking a new request

---

## Admin transcription settings API

### 8. Get transcription settings
`GET /api/v1/admin/settings/transcription`

Response:
```json
{
  "enabled": true,
  "autoTranscribeOnReady": true,
  "provider": "local-faster-whisper",
  "defaultLanguage": "en",
  "outputFormats": ["vtt", "srt"],
  "model": "small",
  "device": "cpu",
  "computeType": "int8",
  "beamSize": 5,
  "enableVad": true,
  "enableWordTimestamps": false
}
```

### 9. Update transcription settings
`PUT /api/v1/admin/settings/transcription`

Request:
```json
{
  "enabled": true,
  "autoTranscribeOnReady": true,
  "provider": "local-faster-whisper",
  "defaultLanguage": "en",
  "outputFormats": ["vtt", "srt"],
  "model": "small",
  "device": "cpu",
  "computeType": "int8",
  "beamSize": 5,
  "enableVad": true,
  "enableWordTimestamps": false
}
```

Response:
same shape as GET

Notes:
- flat settings shape for now
- backed by `SystemSettings`
- admin-only

---

## Admin transcription processing APIs

### 10. List transcription jobs
`GET /api/v1/admin/processing/transcription-jobs`
`GET /api/v1/admin/processing/transcription-jobs?status=Processing`

Response:
array of `VideoTranscriptionJobDto`
```json
[
  {
    "jobKey": "string",
    "videoId": "uuid",
    "language": "en",
    "status": "Processing",
    "source": "local-faster-whisper",
    "correlationId": "string|null",
    "workerJobId": "string|null",
    "model": "string|null",
    "failureReason": "string|null",
    "createdAt": "2026-06-29T10:00:00Z",
    "updatedAt": "2026-06-29T10:01:00Z",
    "liveStatus": null,
    "artifacts": [
      {
        "id": "uuid",
        "format": "VTT",
        "status": "Processing",
        "failureReason": null,
        "createdAt": "2026-06-29T10:00:00Z",
        "updatedAt": "2026-06-29T10:01:00Z"
      }
    ]
  }
]
```

### 11. Get single transcription job
`GET /api/v1/admin/processing/transcription-jobs/{jobKey}`

Response:
single `VideoTranscriptionJobDto`

### 12. Retry transcription job
`POST /api/v1/admin/processing/transcription-jobs/{jobKey}/retry`

Response:
single `VideoTranscriptionJobDto`

Notes:
- cannot retry if already `Pending` or `Processing`

### 13. Resync transcription job
`POST /api/v1/admin/processing/transcription-jobs/{jobKey}/resync`

Response:
single `VideoTranscriptionJobDto`

Notes:
- may reconcile DB state from worker state or finalize completed callback ingestion

---

## Admin video processing APIs

### 14. List video processing jobs
`GET /api/v1/admin/processing/video-jobs`
`GET /api/v1/admin/processing/video-jobs?status=Failed`

Response:
```json
[
  {
    "jobKey": "uuid",
    "videoId": "uuid",
    "videoTitle": "Video title",
    "jobType": "Transcode",
    "status": "Failed",
    "progress": 75,
    "errorMessage": "ffmpeg failed",
    "createdAt": "2026-06-29T10:00:00Z",
    "startedAt": "2026-06-29T10:00:10Z",
    "completedAt": "2026-06-29T10:05:00Z",
    "videoStatus": "Failed"
  }
]
```

Notes:
- no `updatedAt` field
- current status filter values: `Pending | Processing | Completed | Failed`

### 15. Get single video processing job
`GET /api/v1/admin/processing/video-jobs/{jobKey}`

Response:
single `AdminVideoProcessingJobDto`

### 16. Retry video processing job
`POST /api/v1/admin/processing/video-jobs/{jobKey}/retry`

Response:
single `AdminVideoProcessingJobDto`

Behavior:
- resets job to `Pending`
- marks video `Processing`
- re-enqueues Hangfire processing

### 17. Resync video processing job
`POST /api/v1/admin/processing/video-jobs/{jobKey}/resync`

Response:
single `AdminVideoProcessingJobDto`

Behavior:
- `Pending`/`Processing` -> ensures video is `Processing`
- `Failed` -> ensures video is `Failed`
- `Completed` -> marks video `Ready` if HLS output and default thumbnail exist

---

## Status values

### Transcription row status
- `Pending`
- `Processing`
- `Completed`
- `Failed`

### Grouped transcription job status
- `Pending`
- `Processing`
- `Completed`
- `Failed`
- `Partial`

### Transcription live worker status
- `accepted`
- `queued`
- `running`
- `completed`
- `failed`

### Video processing job status
- `Pending`
- `Processing`
- `Completed`
- `Failed`

### Video status relevant to processing/transcription admin views
- `Uploading`
- `Processing`
- `Ready`
- `Failed`
- `Deleted`

---

## Authorization contract

### User-facing transcription endpoints
Use normal video-view authorization:
- owner/admin/editor access as applicable
- valid `shareToken` where supported by video view rules

### Admin settings and admin processing endpoints
- admin role only
- no share token flow

---

## Endpoint usage contract

### Use these for transcript reader
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/chunks`

### Use these for caption playback/download
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}`
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/content`

### Use these for transcript search
- `GET /api/v1/videos/{videoId}/transcript-search`

### Use these for artifact discovery and status
- `GET /api/v1/videos/{videoId}/transcriptions`
- `GET /api/v1/videos/{videoId}/transcription-jobs`
- `GET /api/v1/videos/{videoId}/transcriptions/{transcriptionId}/status`

### Use these for admin operations
- `/api/v1/admin/settings/transcription`
- `/api/v1/admin/processing/transcription-jobs/...`
- `/api/v1/admin/processing/video-jobs/...`

That’s the current API contract without product guidance layered on top.