# StreamForge API Integration Execution Plan

## Checklist

- [X] Phase 1: API Foundation + Video Library
  - Details: [Phase 1 Plan](documentation/plans/Phase-plan-1.md)
- [X] Phase 2: Real Video Detail + Playback Metadata
  - Details: [Phase 2 Plan](documentation/plans/Phase-plan-2.md)
- [X] Phase 3: Upload Metadata + Processing Status
  - Details: [Phase 3 Plan](documentation/plans/Phase-plan-3.md)
- [X] Phase 4: Editor Management
  - Details: [Phase 4 Plan](documentation/plans/Phase-plan-4.md)
- [X] Phase 5: Access Grants + Admin Read Views
  - Details: [Phase 5 Plan](documentation/plans/Phase-plan-5.md)

## Global Checks

- [X] Run `npx tsc --noEmit` after each phase.
- [X] Run `npm run build` after each phase.
- [X] Keep `NEXT_PUBLIC_API_URL` as the API origin only, without `/api/v1`.
- [X] Keep route URLs unchanged.
- [X] Keep role protection intact.
- [X] Keep mock data only as fallback/dev seed after Phase 1.

## Backlog

- [ ] Replace the interim `hls.js` bearer-header playback workaround with a proper media-auth solution such as signed playback URLs or cookie-backed protected media access.
- [ ] Bookmarks Page: Category filtering, sorting and grouping by video are implemented on the client side (frontend). Needs native category filtering and grouping support from backend API later.
