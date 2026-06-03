# StreamForge API Integration Execution Plan

## Checklist

- [X] Phase 1: API Foundation + Video Library
  - Details: [Phase 1 Plan](documentation/plans/Phase-plan-1.md)
- [ ] Phase 2: Real Video Detail + Playback Metadata
  - Details: [Phase 2 Plan](documentation/plans/Phase-plan-2.md)
- [ ] Phase 3: Upload Metadata + Processing Status
  - Details: [Phase 3 Plan](documentation/plans/Phase-plan-3.md)
- [ ] Phase 4: Editor Management
  - Details: [Phase 4 Plan](documentation/plans/Phase-plan-4.md)
- [ ] Phase 5: Access Grants + Admin Read Views
  - Details: [Phase 5 Plan](documentation/plans/Phase-plan-5.md)

## Global Checks

- [ ] Run `npx tsc --noEmit` after each phase.
- [ ] Run `npm run build` after each phase.
- [ ] Keep `NEXT_PUBLIC_API_URL` as the API origin only, without `/api/v1`.
- [ ] Keep route URLs unchanged.
- [ ] Keep role protection intact.
- [ ] Keep mock data only as fallback/dev seed after Phase 1.
