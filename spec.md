# 91 Club

## Current State
- WinGo color prediction game with 60-second rounds
- Virtual wallet (₹1,000 starting balance)
- Username/password auth (principal-based identity)
- `finalizePeriod` is admin-only so regular users cannot trigger round finalization — meaning bets never resolve and the wallet never updates from game results
- User data stored in a Motoko `List` where `find` returns the FIRST match; updates are appended as new records, so balance changes never reflect correctly
- Header shows `profile.balance` from a 30-second stale query, not live balance

## Requested Changes (Diff)

### Add
- Win/loss toast notification after each round ends (showing result number, outcome, and amount won/lost)
- Animated balance change in Header (green flash on win, red flash on loss)
- Live wallet display in Header using a fast-polling balance hook
- Result reveal overlay in WinGoPage showing the drawn number and color after each round

### Modify
- Backend: Change user storage from List to Map (keyed by Principal) so balance updates are correct
- Backend: Change `finalizePeriod` from admin-only to user-accessible (any registered user can trigger)
- Backend: Keep random result generation via `Time.now() % 10`
- Frontend Header: Use `useBalance()` hook (fast poll) instead of stale profile.balance
- Frontend WinGoPage: After finalization, fetch updated bets, detect win/loss, show result
- Frontend useQueries: Reduce balance staleTime to 5s, refetchInterval to 8s

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend using Map for user storage, period storage, and bet storage; remove admin check from finalizePeriod
2. Update `Header.tsx` to import and use `useBalance()` with animated balance display
3. Update `WinGoPage.tsx` to track pending bets locally, after finalization fetch `getMyBets` to find resolved bets, show result overlay and win/loss toasts
4. Update `useQueries.ts` to reduce staleTime/refetchInterval for balance
5. Validate and deploy
