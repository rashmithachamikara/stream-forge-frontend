# Phase 5: Access Grants + Admin Read Views

## Goal

Add real access grant management for videos and make admin user listing read from the backend.

## Checklist

- [ ] Add typed DTOs and mappers for:
  - [ ] `AccessGrantDto`
  - [ ] `UserProfileDto`
- [ ] Add API method for `GET /api/v1/videos/{videoId}/access`.
- [ ] Add API method for `POST /api/v1/videos/{videoId}/access`.
- [ ] Add API method for `DELETE /api/v1/videos/{videoId}/access/{accessControlId}`.
- [ ] Add API method for `GET /api/v1/users`.
- [ ] Add access grant dialog for editor/admin users.
- [ ] Let editor/admin users grant `View`, `Embed`, or `Download`.
- [ ] Support user-based grants using existing backend users.
- [ ] Display returned share tokens when present.
- [ ] Replace admin user mock list with real backend users.
- [ ] Keep admin user create/update/delete disabled until matching API endpoints exist.

## Acceptance Criteria

- [ ] Editor/admin can list access grants for a video.
- [ ] Editor/admin can create a user grant for an existing user.
- [ ] Editor/admin can delete an existing grant.
- [ ] Admin user page lists real users and supports backend filters.
- [ ] Unsupported admin user write actions are not exposed as working API actions.

## Tests

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Manually create and delete a video access grant.
- [ ] Manually verify admin users page with search/role/isActive filters.
