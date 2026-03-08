# Leaderboard categories and carousel — implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add five leaderboard categories (Total PnL, PnL per session, Largest PnL, # of Sessions, Win rate) with carousel (swipe + arrows + dots), simple tables (Rank + Name + main metric), poker-rank symbols for ranks 1–13, positive-only filtering, and persistent group selection shared with the payout calculator.

**Architecture:** Extend the existing `get_group_leaderboard` RPC and `LeaderboardRow` type with `avg_profit` and `max_session_profit`. Leaderboard page keeps one fetch; client-side filtering/sorting per category. Single carousel state (current index 0–4); dots and arrows and swipe update index with rolling wrap. Rank formatting and group persistence are small, testable units.

**Tech Stack:** Next.js (App Router), React, Supabase RPC, existing localStorage/events (`PAYOUT_STORAGE_KEY`, `SELECTED_GROUP_CHANGED_EVENT`), existing table/CSS.

**Design reference:** `docs/plans/2026-03-08-leaderboard-categories-design.md`

---

## Task 1: Rank formatting helper and tests

**Files:**
- Create: `src/lib/calc/leaderboard-rank.ts`
- Create: `src/lib/calc/leaderboard-rank.test.ts`

**Step 1: Write the failing test**

In `src/lib/calc/leaderboard-rank.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatLeaderboardRank } from './leaderboard-rank';

describe('formatLeaderboardRank', () => {
  it('returns A for rank 1', () => {
    expect(formatLeaderboardRank(1)).toBe('A');
  });
  it('returns K,Q,J for ranks 2,3,4', () => {
    expect(formatLeaderboardRank(2)).toBe('K');
    expect(formatLeaderboardRank(3)).toBe('Q');
    expect(formatLeaderboardRank(4)).toBe('J');
  });
  it('returns 10,9,8,7,6,5,4,3,2 for ranks 5-13', () => {
    expect(formatLeaderboardRank(5)).toBe('10');
    expect(formatLeaderboardRank(6)).toBe('9');
    expect(formatLeaderboardRank(7)).toBe('8');
    expect(formatLeaderboardRank(8)).toBe('7');
    expect(formatLeaderboardRank(9)).toBe('6');
    expect(formatLeaderboardRank(10)).toBe('5');
    expect(formatLeaderboardRank(11)).toBe('4');
    expect(formatLeaderboardRank(12)).toBe('3');
    expect(formatLeaderboardRank(13)).toBe('2');
  });
  it('returns numeric string for rank 14 and above', () => {
    expect(formatLeaderboardRank(14)).toBe('14');
    expect(formatLeaderboardRank(15)).toBe('15');
    expect(formatLeaderboardRank(99)).toBe('99');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/calc/leaderboard-rank.test.ts -v`  
Expected: FAIL (module or function not found).

**Step 3: Implement formatLeaderboardRank**

Create `src/lib/calc/leaderboard-rank.ts`:

```ts
const RANK_SYMBOLS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

export function formatLeaderboardRank(rank: number): string {
  if (rank >= 1 && rank <= 13) return RANK_SYMBOLS[rank - 1];
  return String(rank);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/calc/leaderboard-rank.test.ts -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/calc/leaderboard-rank.ts src/lib/calc/leaderboard-rank.test.ts
git commit -m "feat(leaderboard): add formatLeaderboardRank (A-K then 14+)"
```

---

## Task 2: Extend get_group_leaderboard with avg_profit and max_session_profit

**Files:**
- Create: `supabase/migrations/20260308140000_leaderboard_avg_max_session_profit.sql`
- Modify: (none; new migration only)

**Step 1: Add migration**

Create `supabase/migrations/20260308140000_leaderboard_avg_max_session_profit.sql`:

```sql
-- Extend leaderboard with avg_profit (PnL per session) and max_session_profit (largest PnL in a single session).
-- Uses the overload (p_from_date, p_group_id, p_to_date) that the client calls.

create or replace function public.get_group_leaderboard(
  p_from_date date default null,
  p_group_id uuid default null,
  p_to_date date default null
)
returns table (
  user_id uuid,
  display_name text,
  total_profit numeric,
  total_sessions bigint,
  win_count bigint,
  loss_count bigint,
  avg_profit numeric,
  max_session_profit numeric
)
language sql
stable
security invoker
as $$
  select
    gm.user_id,
    p.display_name,
    coalesce(sum(gp.net_result), 0)::numeric as total_profit,
    count(distinct gs.id)::bigint as total_sessions,
    count(*) filter (where gp.net_result > 0)::bigint as win_count,
    count(*) filter (where gp.net_result < 0)::bigint as loss_count,
    coalesce(avg(gp.net_result), 0)::numeric as avg_profit,
    coalesce(max(gp.net_result), 0)::numeric as max_session_profit
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.game_players gp on gp.user_id = gm.user_id
  left join public.game_sessions gs on gs.id = gp.session_id
    and gs.group_id = p_group_id
    and (p_from_date is null or gs.session_date >= p_from_date)
    and (p_to_date is null or gs.session_date <= p_to_date)
  where gm.group_id = p_group_id
  group by gm.user_id, p.display_name;
$$;

grant execute on function public.get_group_leaderboard(date, uuid, date) to authenticated;
notify pgrst, 'reload schema';
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260308140000_leaderboard_avg_max_session_profit.sql
git commit -m "feat(leaderboard): extend get_group_leaderboard with avg_profit, max_session_profit"
```

---

## Task 3: Extend LeaderboardRow and getGroupLeaderboard

**Files:**
- Modify: `src/lib/types.ts` (LeaderboardRow)
- Modify: `src/lib/data/stats.ts` (getGroupLeaderboard mapping)
- Test: `src/lib/data/stats.test.ts` (mock response shape)

**Step 1: Extend LeaderboardRow**

In `src/lib/types.ts`, update `LeaderboardRow` to add:

```ts
avg_profit: number;
max_session_profit: number;
```

**Step 2: Map new fields in getGroupLeaderboard**

In `src/lib/data/stats.ts`, in the RPC response type and the `rows.map` return object, add `avg_profit` and `max_session_profit` (read as number, default 0 if missing for backward compatibility).

**Step 3: Update stats.test.ts**

In `src/lib/data/stats.test.ts`, in the test that mocks RPC data and asserts mapped rows, add `avg_profit` and `max_session_profit` to the mock response and to the expected mapped object so the test still passes.

**Step 4: Run tests**

Run: `npm run test -- src/lib/data/stats.test.ts -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/data/stats.ts src/lib/data/stats.test.ts
git commit -m "feat(leaderboard): LeaderboardRow avg_profit, max_session_profit; map in getGroupLeaderboard"
```

---

## Task 4: Group selection persistence on leaderboard page

**Files:**
- Modify: `src/app/(main)/leaderboard/page.tsx`

**Step 1: Initialize groupId from localStorage**

- Import `getLocalStorage`, `setLocalStorage` from `@/lib/storage/local-storage` and `PAYOUT_STORAGE_KEY`, `SELECTED_GROUP_CHANGED_EVENT` from `@/lib/constants`.
- Replace `useState<string>('')` for groupId with initialization that reads `getLocalStorage<{ selectedGroupId?: string }>(PAYOUT_STORAGE_KEY)?.selectedGroupId ?? ''` (use a function initializer or a useEffect that runs once on mount so it works with SSR: e.g. `useState('')` then in a `useEffect` with `[]`, read from localStorage and set state if `typeof window !== 'undefined'`).

**Step 2: Persist and dispatch when group changes**

- In the group `<select>`'s `onChange`, when the user selects a new value: (1) update state, (2) get current payload from `getLocalStorage(PAYOUT_STORAGE_KEY)`, merge in `selectedGroupId: value || undefined`, call `setLocalStorage(PAYOUT_STORAGE_KEY, merged)`, (3) dispatch `new CustomEvent(SELECTED_GROUP_CHANGED_EVENT, { detail: { selectedGroupId: value || null } })`.

**Step 3: Sync when group is changed elsewhere**

- Add a `useEffect` that subscribes to `SELECTED_GROUP_CHANGED_EVENT` and updates the leaderboard’s group state from `event.detail.selectedGroupId` (use `?? ''` for null). Clean up listener on unmount.

**Step 4: Manual check**

- Load payout page, select a group; go to leaderboard — leaderboard should show that group. Change group on leaderboard; go back to payout — payout should show the new group.

**Step 5: Commit**

```bash
git add src/app/(main)/leaderboard/page.tsx
git commit -m "feat(leaderboard): persist group selection with payout; sync on SELECTED_GROUP_CHANGED_EVENT"
```

---

## Task 5: Category data (filter/sort) and carousel state

**Files:**
- Modify: `src/app/(main)/leaderboard/page.tsx`

**Step 1: Define category config**

- Add a constant array of five categories, e.g. `LEADERBOARD_CATEGORIES`: id, label, sort key, filter predicate. Order: Total PnL, PnL per session, Largest PnL, # of Sessions, Win rate. For each category define: (1) how to sort rows (desc by the relevant field; for Win rate use computed `winRate(row)`), (2) how to filter (exclude rows where the metric is <= 0, except # of Sessions which has no filter; for Win rate exclude <= 0). Implement as a small config array and a function that, given `rows` and category id, returns filtered and sorted rows.

**Step 2: Add carousel index state**

- Add `const [categoryIndex, setCategoryIndex] = useState(0)`. Add a helper to go next/prev with rolling: `setCategoryIndex((i) => (i + delta + 5) % 5)`.

**Step 3: Compute current category and table rows**

- Derive current category from `LEADERBOARD_CATEGORIES[categoryIndex]`. Derive the rows to show for the current category by applying that category’s filter and sort to `rows`. Keep `winRate(row)` helper for Win rate category.

**Step 4: No UI change yet**

- Ensure existing table still renders (e.g. temporarily show the first category’s filtered/sorted rows). Run app and confirm data for “Total PnL” still looks correct and negative-profit players are excluded when viewing Total PnL.

**Step 5: Commit**

```bash
git add src/app/(main)/leaderboard/page.tsx
git commit -m "feat(leaderboard): category filter/sort and carousel index state"
```

---

## Task 6: Simple tables (Rank + Name + main metric) per category

**Files:**
- Modify: `src/app/(main)/leaderboard/page.tsx`

**Step 1: Render one table per category shape**

- Replace the single table with a table that has exactly three columns: Rank, Name, [Main metric]. The main metric column header and cell content depend on current category: Total PnL → “Profit” and `fmt(row.total_profit) + currency`; PnL per session → “Avg/session” and `fmt(row.avg_profit) + currency`; Largest PnL → “Largest session” and `fmt(row.max_session_profit) + currency`; # of Sessions → “Sessions” and `row.total_sessions`; Win rate → “Win %” and `fmt(winRate(row)) + '%'`. Use `formatLeaderboardRank(index + 1)` for the rank column (index is 0-based in the filtered/sorted array).

**Step 2: Empty state**

- If the filtered/sorted list for the current category is empty, show a short message instead of the table, e.g. “No players with positive [category label] in this period” (or “No sessions in this period” for # of Sessions).

**Step 3: Manual check**

- Switch categories via state (temporarily add a dropdown or buttons to change `categoryIndex`) and confirm each table shows only Rank, Name, and the correct metric; negative metrics are excluded.

**Step 4: Commit**

```bash
git add src/app/(main)/leaderboard/page.tsx
git commit -m "feat(leaderboard): simple tables Rank + Name + main metric per category; empty state"
```

---

## Task 7: Dots and arrows UI

**Files:**
- Modify: `src/app/(main)/leaderboard/page.tsx`
- Modify: `src/app/globals.css` (if needed for dot/arrow styling)

**Step 1: Category title and “N of 5”**

- Above the table, render the current category label and “{categoryIndex + 1} of 5” (or “Category 1 of 5” for screen readers).

**Step 2: Dots**

- Render five dots (e.g. buttons or spans with role="tab"). Current dot has `aria-current="true"` and a distinct class (e.g. filled); others are muted. `onClick` on dot `i` calls `setCategoryIndex(i)`. `aria-label`: e.g. “Category 2 of 5, PnL per session” and “Go to Total PnL”.

**Step 3: Arrows**

- Left arrow button: `onClick` => `setCategoryIndex((i) => (i - 1 + 5) % 5)`. Right arrow: `(i + 1) % 5`. Place them on the sides of the table/card (e.g. previous/next). Use chevron characters or inline SVG. `aria-label`: “Previous category”, “Next category”.

**Step 4: Keyboard**

- Optional: on key Down Arrow/Right and Up Arrow/Left when focus is inside the leaderboard card, move category. Can be done with a small `onKeyDown` on the card wrapper that calls the same next/prev logic.

**Step 5: Styles**

- Add minimal CSS for dots (size, gap, filled vs muted) and arrows (size, hover) in `globals.css` or existing leaderboard section so they match the app. Reuse existing button/control styles if possible.

**Step 6: Commit**

```bash
git add src/app/(main)/leaderboard/page.tsx src/app/globals.css
git commit -m "feat(leaderboard): dots and arrows for category navigation; aria labels"
```

---

## Task 8: Swipe support

**Files:**
- Modify: `src/app/(main)/leaderboard/page.tsx`

**Step 1: Touch state**

- Add refs or state for touch start X (and optionally start time). On `touchstart` on the table/card container, record `touchStartX = e.touches[0].clientX`.

**Step 2: Swipe detection**

- On `touchend`, compute `deltaX = e.changedTouches[0].clientX - touchStartX`. If `deltaX < -50` (swipe left), go to next category: `setCategoryIndex((i) => (i + 1) % 5)`. If `deltaX > 50` (swipe right), previous: `setCategoryIndex((i) => (i - 1 + 5) % 5)`. Use `touchmove` only if needed (e.g. prevent default to avoid scroll when intent is swipe); otherwise optional.

**Step 3: Attach listeners**

- Attach `onTouchStart`, `onTouchEnd` (and optional `onTouchMove`) to the same wrapper that contains the table/card (the “carousel” area). Ensure the wrapper has a min-width or touch area so swipe is easy on mobile.

**Step 4: Manual check**

- On a touch device or devtools device mode, swipe left/right and confirm category changes with rolling.

**Step 5: Commit**

```bash
git add src/app/(main)/leaderboard/page.tsx
git commit -m "feat(leaderboard): swipe left/right to change category"
```

---

## Task 9: Leaderboard page tests

**Files:**
- Modify: `src/app/(main)/leaderboard/LeaderboardPage.test.tsx`

**Step 1: Update existing tests**

- Existing tests that assert table columns may expect the old 7 columns; update them to expect the new 3-column layout (Rank, Name, and one metric) and possibly the first category only. Mock `getGroupLeaderboard` to return rows that include `avg_profit` and `max_session_profit`.

**Step 2: Add tests for persistence and categories**

- (Optional) Test that on load, if localStorage has `selectedGroupId`, the select value is that group. Test that changing category (e.g. clicking dot 2) shows the second category’s label or metric header. Test that `formatLeaderboardRank` is used (e.g. first row rank is “A” when one row).

**Step 3: Run tests**

Run: `npm run test -- src/app/\(main\)/leaderboard/ -v`  
Expected: PASS.

**Step 4: Commit**

```bash
git add src/app/(main)/leaderboard/LeaderboardPage.test.tsx
git commit -m "test(leaderboard): update tests for categories and persistence"
```

---

## Task 10: Integration check and docs

**Files:**
- Modify: (none or README if desired)

**Step 1: Full flow**

- Sign in, select group on payout, open leaderboard → same group. Change group on leaderboard, open payout → same group. Cycle all five categories via dots and arrows; swipe on mobile. Confirm empty states for a category with no qualifying players. Confirm rank shows A, K, … 2, 14, 15 for many rows.

**Step 2: Lint and test**

Run: `npm run lint` and `npm run test`  
Expected: no errors.

**Step 3: Commit (if any small fixes)**

- If you made small fixes, commit with message like “chore(leaderboard): lint/test fixes”.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-03-08-leaderboard-categories-plan.md`.

Two execution options:

1. **Subagent-driven (this session)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** — Open a new session with executing-plans and run the plan task-by-task with checkpoints.

Which approach do you want?
