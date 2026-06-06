# Phase 5: Access Grants + Admin Read Views

## Goal

Add real access grant management for videos and make admin user listing read from the backend.

## Checklist

- [X] Add typed DTOs and mappers for:
  - [X] `AccessGrantDto`
  - [X] `UserProfileDto`
- [X] Add API method for `GET /api/v1/videos/{videoId}/access`.
- [X] Add API method for `POST /api/v1/videos/{videoId}/access`.
- [X] Add API method for `DELETE /api/v1/videos/{videoId}/access/{accessControlId}`.
- [X] Add API method for `GET /api/v1/users`.
- [X] Add access grant dialog for editor/admin users.
- [X] Let editor/admin users grant `View`, `Embed`, or `Download`.
- [X] Support user-based grants using existing backend users.
- [X] Display returned share tokens when present.
- [X] Replace admin user mock list with real backend users.
- [X] Keep admin user create/update/delete disabled until matching API endpoints exist.

## Acceptance Criteria

- [X] Editor/admin can list access grants for a video.
- [X] Editor/admin can create a user grant for an existing user.
- [X] Editor/admin can delete an existing grant.
- [X] Admin user page lists real users and supports backend filters.
- [X] Unsupported admin user write actions are not exposed as working API actions.

## Tests

- [X] Run `npx tsc --noEmit`.
- [X] Run `npm run build`.
- [ ] Manually create and delete a video access grant.
- [ ] Manually verify admin users page with search/role/isActive filters.
