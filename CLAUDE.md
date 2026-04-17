# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run test      # Run all tests once (vitest --run)
```

To run a single test file:
```bash
npx vitest --run src/gamification/domain/PlayerProgress.property.test.ts
```

## Architecture

This is a **React + TypeScript + Vite** app backed by **Firebase** (Auth + Firestore). It's a gamified grade-tracking system for a classroom: teachers manage evaluations and attendance; students see their progress in a RPG-style UI.

### Bounded contexts (DDD-style)

The `src/` directory is split into three bounded contexts plus shared infrastructure:

- **`identity/`** — Auth (Firebase Auth adapter), user domain model (`User`, `AvatarClass`), login use case, `AuthUI` (login form), `StudentPanel` (student dashboard)
- **`academic/`** — `Evaluation` domain entity, `ApproveEvaluation` use case, `UpdateGrade` use case, `AttendanceService`, `TeacherPanel`, `FirestoreEvalRepo`
- **`gamification/`** — `PlayerProgress` domain entity (XP/level logic), `AddXP` use case (subscribes to `EvaluationApproved` event), `FirestoreProgressRepo`, `XPBar` component
- **`shared/`** — `firebase.ts` (Firestore/Auth init), `AuthContext`, `EventBus`, `OutboxService`, `RouteGuard`, `services.ts` (singleton instances)

### Event-driven XP flow (Outbox pattern)

When a teacher approves an evaluation:
1. `ApproveEvaluation.execute()` writes to Firestore atomically (evaluation + `gradesSummary` on user doc)
2. It enqueues a domain event (`EvaluationApproved`) into the Firestore `outbox` collection
3. `OutboxService.processAll()` reads pending outbox docs and emits them on the in-memory `EventBus`
4. `AddXP` listens on `EventBus` for `EvaluationApproved` and calls `FirestoreProgressRepo.addXPIdempotent()`
5. Idempotency is enforced via `processedEvalIds[]` on the user document (Firestore transaction)

Attendance XP (+20) bypasses the outbox — `AttendanceService.markPresent()` calls `addXPIdempotent` directly with `evalId = "{classId}_{studentUid}"`.

### Firestore data model

| Collection | Key fields |
|---|---|
| `users/{uid}` | `role`, `displayName`, `email`, `avatarClass`, `xp`, `level`, `xpToNextLevel`, `gradesSummary`, `processedEvalIds` |
| `evaluations/{evalId}` | `studentUid`, `type` (`"TP"` \| `"Parcial"`), `index`, `status` (`"Victory"` \| `"Defeat"` \| `"Pending"`), `score` |
| `attendance/{classId}` | `date`, `createdBy`, `presentStudents[]` |
| `outbox/{id}` | `type`, `payload`, `status` (`"pending"` \| `"processed"`), `createdAt` |

Eval keys in `gradesSummary` follow the pattern `tp1`, `tp2`, `parcial1`, `parcial2`.

### Singleton services

`src/shared/services.ts` exports pre-wired singleton instances (`outboxService`, `attendanceService`). Import from there — don't instantiate these classes directly in components.

### Routing & auth

`RouteGuard` reads `user.role` from `AuthContext` and redirects if the role doesn't match. Roles: `"student"` → `/student`, `"teacher"` → `/teacher`.

### Testing

Tests use **Vitest** with **fast-check** for property-based testing. Test files are co-located with the source they test (e.g. `PlayerProgress.property.test.ts` next to `PlayerProgress.ts`). Integration/Firestore rule tests live in `identity/infrastructure/FirestoreRules.property.test.ts`.
