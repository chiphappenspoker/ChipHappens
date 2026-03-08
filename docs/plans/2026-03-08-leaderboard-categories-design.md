# Leaderboard categories and carousel — design

**Date:** 2026-03-08  
**Status:** Approved  
**Goal:** Add multiple leaderboard categories (Total PnL, PnL per session, Largest PnL, # of Sessions, Win rate) with carousel navigation (swipe + arrows + dots), positive-only filtering, poker-rank symbols for rank 1–13, and persistent group selection shared with the payout calculator.

---

## 1. Data layer

- **Extend `get_group_leaderboard`** (new Supabase migration): add two columns to the returned table:
  - `avg_profit` — average PnL per session for that user in the group/date range (e.g. per-session sum of `net_result` then average).
  - `max_session_profit` — largest PnL in a single session (max of per-session profit per user in the group/date range).
- **Extend `LeaderboardRow`** in `src/lib/types.ts`: add `avg_profit: number` and `max_session_profit: number`.
- **`getGroupLeaderboard`** in `src/lib/data/stats.ts`: map and return the new fields; keep a single RPC call.

---

## 2. Categories and filtering (positive-only)

| Category | Sort by | Filter (exclude) | # of Sessions rule |
|----------|--------|-------------------|---------------------|
| Total PnL | `total_profit` desc | `total_profit <= 0` | — |
| PnL per session | `avg_profit` desc | `avg_profit <= 0` | — |
| Largest PnL (single session) | `max_session_profit` desc | `max_session_profit <= 0` | — |
| # of Sessions | `total_sessions` desc | none | Show all with ≥1 session (Option A) |
| Win rate | `win_rate` desc | `win_rate <= 0` | Show only > 0% |

- Win rate = `(win_count / total_sessions) * 100`; if `total_sessions === 0`, treat as 0 and exclude from Win rate table.
- Filtering and sorting are done **client-side** on the same `LeaderboardRow[]` from the RPC.

---

## 3. Table columns (simple: Rank + Name + Main metric)

Each category shows **only three columns**: Rank, Name, and the main metric. No Sessions, W, L, or Win % in the table body.

| Category | Column 1 | Column 2 | Column 3 |
|----------|----------|----------|----------|
| Total PnL | Rank | Name | Profit |
| PnL per session | Rank | Name | Avg profit/session |
| Largest PnL (single session) | Rank | Name | Largest session PnL |
| # of Sessions | Rank | Name | Sessions |
| Win rate | Rank | Name | Win % |

Currency and formatting as today (`fmt`, group currency) where the metric is money.

---

## 4. Rank display (poker card symbols)

- **Ranks 1–13:** Use poker card symbols: **A** (1), **K** (2), **Q** (3), **J** (4), **10**, **9**, **8**, **7**, **6**, **5**, **4**, **3**, **2** (13).
- **Rank 14 and above:** Use normal numbers: **14**, **15**, **16**, …

Implement as a small helper, e.g. `formatLeaderboardRank(rank: number): string`, used in all five tables.

---

## 5. Group selection persistence

- **Source of truth:** Same as payout calculator — `PAYOUT_STORAGE_KEY` in localStorage, field `selectedGroupId`.
- **Leaderboard page:**
  - **Initialize:** On load, set leaderboard group from `getLocalStorage(PAYOUT_STORAGE_KEY)?.selectedGroupId ?? ''`. If user already selected a group on the payout calculator (or previously on leaderboard), that group is pre-selected.
  - **On change:** When the user changes the group in the leaderboard dropdown, persist it: update localStorage (`setLocalStorage(PAYOUT_STORAGE_KEY, { ...existing, selectedGroupId: groupId })`) and dispatch `SELECTED_GROUP_CHANGED_EVENT` with the new `selectedGroupId` so payout and sidepot calculators stay in sync.
- **Listen for external changes:** Subscribe to `SELECTED_GROUP_CHANGED_EVENT` (e.g. when user picks a group from SelectGroupModal or from another page) and update leaderboard’s group state so it stays in sync when user switches group elsewhere.

---

## 6. UI structure (carousel + dots)

- **Page layout:** Group selector, time period, then the leaderboard block (unchanged).
- **Leaderboard block:**
  - **Header row:** Current category title (e.g. “Total PnL”) and optional “1 of 5” text.
  - **Dots:** Five dots for the five categories; current = filled/highlighted, others muted; clickable to jump to that category; `aria-label` and `aria-current` for accessibility.
  - **Arrows:** Left and right buttons (chevrons) beside the table area; rolling: last → first, first → last.
  - **Swipe:** Touch swipe left/right on the table/card area advances/rewinds one category with rolling.
  - **Table:** One table at a time; columns = Rank, Name, Main metric only. Reuse existing table styling (e.g. `page-payout-table`).

---

## 7. Accessibility and behaviour

- Arrows and dots are focusable; keyboard left/right can move category when focus is in the carousel.
- Empty state: if after filtering a category has zero rows, show a short message (e.g. “No players with positive [metric] in this period”) instead of an empty table.

---

## 8. Implementation notes

- **Swipe:** Small touch handler (touchstart/touchmove/touchend) with distance threshold, or a lightweight lib (e.g. react-swipeable) if already in the project.
- **Rolling index:** `currentIndex = (currentIndex + delta + 5) % 5` for next/prev.
- **Category order:** Total PnL, PnL per session, Largest PnL, # of Sessions, Win rate (fixed order for dots and carousel).
