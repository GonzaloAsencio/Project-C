# Project-C — Convenciones del Proyecto

## Stack
- React 18 + TypeScript 5 + Vite 5
- Firebase 10 (Auth, Firestore, Hosting)
- React Router 6
- Vitest + fast-check (property-based testing)
- canvas-confetti (lazy import solo en victorias)

## Convenciones de Naming

### Archivos
- Componentes React: `PascalCase.tsx` (ej: `StudentPanel.tsx`)
- Casos de uso: `PascalCase.ts` (ej: `ApproveEvaluation.ts`)
- Entidades de dominio: `PascalCase.ts` (ej: `PlayerProgress.ts`)
- Tests: `*.property.test.ts` para PBT, `*.test.ts` para unit tests
- Adaptadores: `Firebase{Name}.ts` (ej: `FirebaseAuthAdapter.ts`, `FirestoreProgressRepo.ts`)

### IDs de documentos Firestore
- Usuarios: UID de Firebase Auth
- Evaluaciones: `{uid}_{evalKey}` (ej: `abc123_tp1`, `abc123_parcial2`)
- Outbox: UUID generado con `crypto.randomUUID()`

### Claves de evaluación
- `tp1`, `tp2` → TPs (type: "TP", index: 1/2)
- `parcial1`, `parcial2` → Parciales (type: "Parcial", index: 1/2)

## Firestore — Estructura de Colecciones

```
users/{uid}
  displayName: string
  email: string
  role: "student" | "teacher"
  avatarClass: "Sword" | "Axe" | "Dagger" | "Bow" | "Magic"
  level: number        // 1-10
  xp: number           // 0-960
  xpToNextLevel: number
  gradesSummary: {
    tp1: { status, score }
    tp2: { status, score }
    parcial1: { status, score }
    parcial2: { status, score }
  }

evaluations/{uid}_{evalKey}
  studentUid: string
  type: "TP" | "Parcial"
  index: number
  status: "Victory" | "Defeat" | "Pending"
  score: number  // 0-10

outbox/{uuid}
  id: string
  type: string  // "EvaluationApproved"
  payload: object
  status: "pending" | "processed"
  createdAt: number
```

## XP Economy
| Actividad       | XP  |
|-----------------|-----|
| TP aprobado     | +70 |
| Parcial aprobado| +200|
| Asistencia      | +20 |
| **Máximo**      | **960** |

Fórmula de nivel: `Math.floor(xp / 100) + 1` → rango [1, 10]

## Reglas de Firestore (resumen)
- `users`: cualquier auth puede leer su propio doc; solo teachers pueden update/delete; cualquier auth puede crear su propio doc
- `evaluations`: teachers pueden leer/update/delete todo; students pueden leer las suyas; cualquier auth puede crear evaluaciones propias (seed al registrarse)
- `outbox`: cualquier usuario autenticado puede leer/escribir

## Comandos frecuentes
```bash
# Dev server
npm run dev

# Tests (single run)
npx vitest --run

# Build
npm run build

# Deploy reglas Firestore (desde cmd, no PowerShell)
firebase deploy --only firestore:rules

# Deploy hosting
firebase deploy --only hosting
```

## Wiring de la app (main.tsx)
1. `FirestoreProgressRepo` instanciado
2. `new AddXP(progressRepo, eventBus)` — registra handler en EventBus
3. `window.addEventListener('online', () => outboxService.recoverPending())` — recupera eventos pending al reconectar

## Flujo de aprobación de evaluación
1. Profesor cambia estado en `TeacherPanel`
2. `UpdateGrade.execute(evalId, status, score)` — transacción atómica en Firestore
3. Si status === "Victory": `OutboxService.enqueue(EvaluationApprovedEvent)`
4. `OutboxService.processAll()` — emite evento en `EventBus`
5. `AddXP.handleEvaluationApproved()` — suma XP al alumno
6. `FirestoreProgressRepo.saveProgress()` — actualiza `xp` y `level` en Firestore
7. `StudentPanel` recibe cambio via `onSnapshot` — actualiza UI en tiempo real
