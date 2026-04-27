# CLAUDE.md

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run test      # Run all tests once (vitest --run)
npx vitest --run <path>   # Run a single test file
```

## Stack

React 19 + TypeScript + Vite + Firebase (Auth + Firestore). Tailwind CSS v4 + CSS Modules co-located. Use `cn()` from `src/shared/cn.ts` for class merging.

React 19: `ref` is a plain prop (no `forwardRef`); `use()` replaces `useContext()`.

Tests: Vitest + fast-check (property-based). Co-located with source files.

## Bounded contexts

`src/` splits into three bounded contexts + shared:
- `identity/` — Auth, user domain, StudentPanel, onboarding
- `academic/` — Evaluation, TeacherPanel, AttendanceService
- `gamification/` — XP/level logic, cinematic modals (LevelUpModal, VictoryModal, DefeatModal)
- `shared/` — firebase.ts, AuthContext, EventBus, RouteGuard, services.ts

## Non-obvious decisions

**XP is student-claimed, not auto-awarded.** Teacher approval only updates `gradesSummary`. The student clicks "Ver resultado" → `progressRepo.addXPIdempotent()` fires client-side (Victory only). No XP on approval, no XP on Defeat.

**Outbox infrastructure is dormant.** `OutboxService`, `EventBus`, `AddXP` are wired in `main.tsx` but `ApproveEvaluation` no longer enqueues events. The `online` listener calls `outboxService.recoverPending()` for stale docs only.

**XP cap is exact by design.** 960 = 14 classes × 20 + 2 TPs × 70 + 2 Parcials × 200. `PlayerProgress` enforces this hard cap.

**`evalId` format:** `"{studentUid}_{tp|parcial}{index}"` — e.g. `"abc123_tp1"`. `UpdateGrade.parseEvalId()` decodes it.

**Firestore student attendance query must include `selfRegistration == true`.** A date-range-only query is rejected because it could hypothetically return docs the student can't read. See `useActiveAttendanceSession`.

**`avatarClass` is set only once.** Firestore rule enforces write only when `resource.data.avatarClass == null`. New students start `null` until `FirstLoginClassSelection` completes.

**Singleton services:** Always import from `src/shared/services.ts` — never instantiate `FirestoreProgressRepo`, `AttendanceService`, or `OutboxService` directly in components.

**`GradeCell` auto-status on blur:** score ≥ 4 → `"Victory"`, score < 4 → `"Defeat"`. Manual override via status dropdown remains available.

**`isDungeon`** (combat mode) is recomputed client-side: `columns.some(c => grades[c.key]?.status === "Pending")`. `"Waiting"` status does NOT trigger combat mode — only `"Pending"` does.

**`useStudentData` XP/level events** use null-initialized refs (`prevXpRef`, `prevLevelRef`) to skip the first snapshot — events fire on changes, not on initial load.

**Animation primitives** (`RadialRays`, `Particles`, `Sparkles`) live in `gamification/level-up/` but are shared across all three cinematic modals — not level-up-exclusive.

**Attendance XP is never reverted.** Unmark/clear/delete does not subtract XP. The "✕ Limpiar" confirm dialog warns about this explicitly.

<!-- autoskills:start -->
<!-- autoskills:end -->
