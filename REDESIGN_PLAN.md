# Stream Forge Redesign Plan

This file tracks the redesign work needed to align the current Next.js app with the reference Stream Forge design.

## Status

- [x] Phase 1: Foundation and tokens
- [x] Phase 2: Shared primitives and app shell
- [x] Phase 3: Global pattern migration
- [ ] Phase 4: Page-by-page reskin
- [ ] Phase 5: Final cleanup and verification

## Completed

### 1. Foundation and Tokens

- [x] Replaced the old global theme values with the reference-style OKLCH token system in `app/globals.css`
- [x] Switched the app font stack to `Inter` and `JetBrains Mono` in `app/layout.tsx`
- [x] Wired theme support at the root with `next-themes`
- [x] Removed the old gradient-based global visual direction as the default design language
- [x] Established the new base visual rules for borders, radius, foreground/background balance, and mono technical typography

### 2. Shared Primitives and Shell

- [x] Reworked shared primitives to better match the reference style:
  - `Button`
  - `Card`
  - `Table`
  - `Badge`
  - `Input`
  - `Textarea`
  - `Select`
  - `Tabs`
  - `DropdownMenu`
  - `Avatar`
  - `Dialog`
  - `Alert`
  - `Progress`
- [x] Replaced the old sidebar-first shell with a reference-style sticky top header and secondary tab row
- [x] Preserved role/view logic while moving navigation into the top shell
- [x] Added mobile header-owned navigation instead of the persistent desktop sidebar
- [x] Kept the reference search bar intentionally excluded

### 3. Global Pattern Migration

- [x] Added reusable shared video UI patterns:
  - `VideoCard`
  - `VideoVisibilityBadge`
  - `VideoStatusBadge`
- [x] Updated the viewer dashboard to use the new reference-aligned shared card and spacing approach
- [x] Updated the video library to use the shared video card system
- [x] Updated the watch/detail page to use semantic visibility/status badges and improved shared surface patterns
- [x] Updated the editor dashboard away from gradient-heavy local card styling toward shared video presentation
- [x] Updated notifications to use semantic badge/icon styling instead of ad hoc page-local blue/green classes
- [x] Updated manage-video overview/status surfaces to use shared alerts, progress, and semantic badges
- [x] Improved playlists styling toward the reference system and reduced older loud CTA/shadow treatment
- [x] Tightened the shared library card to look closer to the reference:
  - removed outer framed card styling
  - removed description from library cards
  - used uploader initials from name
  - hid `Ready` status
  - added reference-like uploader/views/relative-time line
  - made visibility icon optional and hid it in the library card

## Remaining

### 4. Page-by-Page Reskin

- [ ] Bring the watch page layout fully in line with the reference around the player:
  - denser title/meta row
  - cleaner tabs
  - more reference-like related content layout
  - less old-style panel framing
- [ ] Finish playlists page polish so it fully reads as reference-quality rather than transitional
- [ ] Finish notifications page polish where spacing and page composition still differ from the reference
- [ ] Reskin login to match the new shell/system more closely
- [ ] Reskin upload page to match the reference system
- [ ] Reskin admin users page
- [ ] Reskin admin analytics page
- [ ] Reskin admin taxonomy page
- [ ] Reskin admin settings page
- [ ] Reskin remaining editor/admin dashboard sections that still use older spacing or local visual conventions
- [ ] Review bookmarks and unauthorized pages for final consistency with the redesign system

### 5. Final Cleanup and Verification

- [ ] Remove remaining page-local visual leftovers:
  - old gradients
  - ad hoc blue/green semantic classes
  - heavy shadows where not intended
  - inconsistent border emphasis
- [ ] Ensure technical values consistently use `font-mono`
- [ ] Run a final grep cleanup for hardcoded presentation classes
- [ ] Verify light mode and dark mode across the main flows
- [ ] Verify desktop, tablet, and smaller mobile widths
- [ ] Verify role-based shell behavior for admin, editor, and viewer
- [ ] Verify no regressions in routes, auth, dialogs, actions, uploads, comments, bookmarks, and notifications

## Recommended Next Order

1. [ ] Watch page
2. [ ] Playlists
3. [ ] Notifications
4. [ ] Admin settings
5. [ ] Remaining admin pages
6. [ ] Final cleanup and verification
