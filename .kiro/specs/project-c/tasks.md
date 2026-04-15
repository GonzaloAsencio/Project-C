# Implementation Plan: Project-C

## Overview

Implementación incremental de la aplicación web gamificada Project-C usando React + TypeScript + Vite + Firebase. Se sigue la arquitectura hexagonal con tres contextos acotados (Identity, Gamification, Academic) y se construye de adentro hacia afuera: dominio → aplicación → infraestructura → UI.

## Tasks

- [x] 1. Scaffolding del proyecto y estructura de módulos
  - Inicializar proyecto con `npm create vite@latest project-c -- --template react-ts`
  - Crear estructura de carpetas: `src/identity/`, `src/gamification/`, `src/academic/`, `src/shared/`
  - Configurar `vitest` y `fast-check` en `vite.config.ts`
  - Instalar dependencias: `firebase`, `react-router-dom`, `canvas-confetti`, `fast-check`, `vitest`
  - _Requirements: 10.1_

- [x] 2. Dominio: Identity Context
  - [x] 2.1 Implementar entidades y value objects de Identity
    - Crear `src/identity/domain/User.ts` con clase `User`, tipos `Role` y `AvatarClass`
    - _Requirements: 1.1, 2.1, 2.2_

- [x] 3. Dominio: Gamification Context
  - [x] 3.1 Implementar `PlayerProgress` y eventos de dominio
    - Crear `src/gamification/domain/PlayerProgress.ts` con método `addXP(amount)`
    - Crear `src/gamification/domain/events.ts` con `XPAddedEvent` y `LevelUpEvent`
    - Aplicar cap de 960 XP y fórmula `Math.floor(xp / 100) + 1`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Property test: Invariante de rango XP (Property 1)
    - **Property 1: Invariante de rango XP**
    - **Validates: Requirements 3.2, 3.3**
    - Para cualquier secuencia de `addXP(amount)` con `amount ≥ 0`, `xp` siempre ∈ [0, 960]

  - [x]* 3.3 Property test: Consistencia nivel–XP (Property 2)
    - **Property 2: Consistencia nivel–XP**
    - **Validates: Requirements 3.1, 3.4, 8.3**
    - Para cualquier `xp` ∈ [0, 960], `level = Math.floor(xp / 100) + 1` ∈ [1, 10]

  - [x]* 3.4 Property test: XP correcto por tipo de actividad (Property 3)
    - **Property 3: XP correcto por tipo de actividad**
    - **Validates: Requirements 3.5, 3.6, 3.7**
    - TP → +70, Parcial → +200, Asistencia → +20 (sujeto al cap)

- [x] 4. Dominio: Academic Context
  - [x] 4.1 Implementar entidad `Evaluation` y evento `EvaluationApprovedEvent`
    - Crear `src/academic/domain/Evaluation.ts` con método `approve(score)`
    - Crear `src/academic/domain/events.ts` con `EvaluationApprovedEvent` (xpReward: TP=70, Parcial=200)
    - _Requirements: 4.1, 4.2, 3.5, 3.6_

- [x] 5. Shared Kernel: EventBus y BaseEntity
  - [x] 5.1 Implementar `EventBus` basado en `EventEmitter`
    - Crear `src/shared/EventBus.ts` con métodos `on`, `emit`, `off`
    - _Requirements: 4.3_

  - [x] 5.2 Implementar `OutboxService`
    - Crear `src/shared/OutboxService.ts` con métodos `enqueue`, `processAll`, `recoverPending`
    - Persistir eventos en Firestore `outbox/{id}` con estado `pending`/`processed`
    - _Requirements: 4.2, 4.5, 11.1, 11.2, 11.3_

  - [ ]* 5.3 Property test: Persistencia de eventos Outbox (Property 7)
    - **Property 7: Persistencia de eventos Outbox**
    - **Validates: Requirements 11.1, 11.2**
    - Todo evento encolado aparece en `outbox/{id}` con estado `pending` antes de procesarse y `processed` después

  - [ ]* 5.4 Property test: Recuperación de eventos pending (Property 8)
    - **Property 8: Recuperación de eventos pending al reconectar**
    - **Validates: Requirements 4.5, 11.3**
    - Al reconectar, todos los eventos con estado `pending` son recuperados y reemitidos

- [ ] 6. Checkpoint — Dominio y Shared Kernel
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Infraestructura: Firebase adapters
  - [ ] 7.1 Configurar Firebase y crear `FirebaseAuthAdapter`
    - Crear `src/shared/firebase.ts` con inicialización de Firebase App, Auth y Firestore
    - Crear `src/identity/infrastructure/FirebaseAuthAdapter.ts` con `signIn`, `signOut`, `onAuthStateChanged`
    - _Requirements: 1.1, 1.2_

  - [ ] 7.2 Implementar `FirestoreProgressRepo`
    - Crear `src/gamification/infrastructure/FirestoreProgressRepo.ts` con `getProgress`, `saveProgress`
    - _Requirements: 3.1, 8.3_

  - [ ] 7.3 Implementar `FirestoreEvalRepo`
    - Crear `src/academic/infrastructure/FirestoreEvalRepo.ts` con `getEvaluations`, `updateEvaluation`
    - _Requirements: 4.1, 7.1_

  - [ ] 7.4 Escribir reglas de seguridad de Firestore
    - Crear `firestore.rules` con reglas que permitan escritura en `evaluations` y `users` solo a `role: "teacher"`
    - Alumnos solo pueden leer su propio documento
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 7.5 Property test: Restricción de escritura por rol (Property 10)
    - **Property 10: Restricción de escritura en Firestore por rol**
    - **Validates: Requirements 2.3, 2.5**
    - Para cualquier usuario con `role !== "teacher"`, escritura en `evaluations` o `users` es rechazada (usar Firebase Emulator)

- [ ] 8. Casos de uso: Application Layer
  - [ ] 8.1 Implementar `LoginUser` use case
    - Crear `src/identity/application/LoginUser.ts`
    - _Requirements: 1.1, 1.2_

  - [ ] 8.2 Implementar `ApproveEvaluation` use case
    - Crear `src/academic/application/ApproveEvaluation.ts`
    - Actualizar evaluación en Firestore y encolar `EvaluationApprovedEvent` en `OutboxService`
    - Actualizar `gradesSummary` en el documento del usuario de forma atómica
    - _Requirements: 4.1, 4.2, 4.4, 8.1_

  - [ ] 8.3 Implementar `AddXP` use case con idempotencia
    - Crear `src/gamification/application/AddXP.ts`
    - Verificar si el `evalId` ya fue procesado antes de sumar XP
    - Suscribirse al `EventBus` para recibir `EvaluationApproved`
    - _Requirements: 4.3, 4.6, 11.4_

  - [ ]* 8.4 Property test: Idempotencia del handler AddXP (Property 4)
    - **Property 4: Idempotencia del handler AddXP**
    - **Validates: Requirements 4.6, 11.4**
    - Procesar el mismo `EvaluationApproved` N veces produce el mismo XP final que procesarlo una vez

  - [ ] 8.5 Implementar `GetStudentDashboard` use case
    - Crear `src/academic/application/GetStudentDashboard.ts`
    - Retornar `{user, evaluations, combatMode}` donde `combatMode = evaluations.some(e => e.status === "Pending")`
    - _Requirements: 5.1, 5.2, 6.1_

- [ ] 9. Checkpoint — Application Layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. UI: Routing, Auth y Route Guards
  - [ ] 10.1 Configurar React Router con rutas protegidas
    - Crear `src/App.tsx` con `BrowserRouter`, rutas `/`, `/student`, `/teacher`
    - Crear `src/shared/RouteGuard.tsx` que verifica autenticación y rol antes de renderizar
    - Redirigir usuarios no autenticados a `/login`; redirigir por rol incorrecto al panel correcto
    - Cargar `StudentPanel` y `TeacherPanel` con `React.lazy()`
    - _Requirements: 1.3, 1.4, 2.1, 2.2, 10.1_

  - [ ]* 10.2 Property test: Control de acceso universal (Property 9)
    - **Property 9: Control de acceso universal (Route Guard)**
    - **Validates: Requirements 1.3**
    - Para cualquier ruta protegida, un usuario no autenticado siempre es redirigido a `/login`

  - [ ] 10.3 Implementar `AuthUI` (Login/Register)
    - Crear `src/identity/infrastructure/AuthUI.tsx` con formulario de email/contraseña
    - Mostrar mensaje de error descriptivo en credenciales inválidas
    - _Requirements: 1.1, 1.2_

- [ ] 11. UI: Componentes del Student Panel
  - [ ] 11.1 Implementar componente `XPBar`
    - Crear `src/gamification/infrastructure/XPBar.tsx`
    - Mostrar XP actual, nivel y XP al siguiente nivel
    - Disparar animación CSS de subida de nivel cuando `level` incrementa
    - _Requirements: 5.2, 5.4_

  - [ ] 11.2 Implementar componente `EnemySprite`
    - Crear `src/academic/infrastructure/EnemySprite.tsx`
    - Animación CSS con `steps()` y `transform` para sprites de `tp1`, `tp2`, `parcial1`, `parcial2`
    - Mostrar estado `isDefeated` con animación de derrota
    - _Requirements: 6.2, 6.3, 6.4, 9.6_

  - [ ] 11.3 Implementar `StudentPanel`
    - Crear `src/identity/infrastructure/StudentPanel.tsx`
    - Suscribirse a `onSnapshot` del documento del usuario para actualizaciones en tiempo real
    - Renderizar avatar con `AvatarClass` y animación CSS de sprite
    - Activar layout "mazmorra" + `EnemySprite` cuando `combatMode === true`
    - Disparar animación de victoria y cargar `canvas-confetti` de forma lazy al recibir `EvaluationApproved`
    - Layout mobile-first: una columna en `sm`, avatar centrado, `XPBar` debajo, evaluaciones en cards apiladas
    - En `sm`, `EnemySprite` ocupa ancho completo
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.5, 9.1, 9.6, 10.4_

  - [ ]* 11.4 Property test: Combat_Mode equivale a evaluaciones Pending (Property 5)
    - **Property 5: Combat_Mode equivale a evaluaciones Pending**
    - **Validates: Requirements 6.1, 6.5**
    - `combatMode === evaluations.some(e => e.status === "Pending")` para cualquier lista de evaluaciones

- [ ] 12. UI: Teacher Panel
  - [ ] 12.1 Implementar `TeacherPanel`
    - Crear `src/academic/infrastructure/TeacherPanel.tsx`
    - Suscribirse a `onSnapshot` de `users` filtrado por `role: "student"`
    - Renderizar tabla con nombre, nivel, XP y estado/puntaje de TP1, TP2, Parcial1, Parcial2
    - Mostrar indicador "guardando..." durante escritura; revertir celda y mostrar "No se pudo guardar" en error
    - Scroll horizontal (`overflow-x: auto`) en `sm`; ocultar columnas no críticas en `sm`, mostrar todas en `md`/`lg`
    - Área de toque mínima 44×44px en celdas editables
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 4.4, 9.2, 9.3, 9.4, 9.5, 10.3_

  - [ ]* 12.2 Property test: Renderizado completo del Teacher Panel (Property 6)
    - **Property 6: Renderizado completo del Teacher Panel**
    - **Validates: Requirements 7.5**
    - Para cualquier lista de alumnos, el panel renderizado incluye nombre, nivel, XP y estado/puntaje de cada evaluación

- [ ] 13. Checkpoint — UI completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Integración y wiring final
  - [ ] 14.1 Conectar casos de uso con adaptadores de infraestructura
    - Instanciar y conectar `FirebaseAuthAdapter`, `FirestoreProgressRepo`, `FirestoreEvalRepo`, `OutboxService` y `EventBus` en el punto de entrada de la app (`src/main.tsx`)
    - Registrar el handler `AddXP` en el `EventBus` al iniciar la app
    - Iniciar `OutboxService.recoverPending()` al reconectar (listener `onLine`)
    - _Requirements: 4.3, 4.5, 11.3_

  - [ ] 14.2 Configurar Firebase Hosting y `firebase.json`
    - Crear `firebase.json` con configuración de Hosting apuntando a `dist/`
    - Crear `.firebaserc` con el project ID
    - _Requirements: (infraestructura de deploy)_

  - [ ]* 14.3 Tests de integración: flujo ApproveEvaluation → AddXP
    - Usar Firebase Emulator Suite para verificar el flujo completo desde aprobación hasta actualización de XP
    - Verificar que `onSnapshot` del `TeacherPanel` refleja cambios al modificar un documento
    - Verificar recuperación de eventos `pending` al reconectar
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 7.2, 11.3_

- [ ] 15. Checkpoint final — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada task referencia requerimientos específicos para trazabilidad
- Los property tests usan `fast-check`; los unit tests usan `vitest`
- Los tests de integración requieren Firebase Emulator Suite (`firebase emulators:start`)
- Las animaciones de sprites usan CSS `steps()` y `transform` para evitar reflows del DOM
- `canvas-confetti` se importa dinámicamente (`import()`) solo al disparar el evento de victoria
