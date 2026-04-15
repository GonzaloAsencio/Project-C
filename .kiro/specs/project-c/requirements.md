# Requirements Document

## Introduction

Project-C es una aplicación web gamificada para la gestión de aula universitaria. Expone dos paneles: el **Panel del Alumno** (dashboard estilo RPG Neo-Pop/Street-Cyberpunk, mobile-first) y el **Panel del Profesor** (back-office de control en tiempo real). El sistema convierte actividades académicas en experiencia (XP) y niveles, activa un "Modo Combate" cuando el alumno tiene una evaluación pendiente, y permite al profesor editar calificaciones con feedback visual inmediato. El stack es React + TypeScript + Vite + Firebase (Auth, Firestore, Hosting), con arquitectura hexagonal y tres contextos acotados: Identity, Gamification y Academic.

---

## Glossary

- **System**: La aplicación web Project-C en su totalidad.
- **Student_Panel**: El dashboard RPG del alumno (Panel del Alumno).
- **Teacher_Panel**: El back-office del profesor (Panel del Profesor).
- **Auth_UI**: La interfaz de autenticación (login/registro).
- **Progression_Engine**: El motor de dominio que calcula XP y nivel del alumno.
- **Evaluation**: Entidad académica que representa un TP o Parcial con estado Victory/Defeat/Pending.
- **Outbox_Service**: Servicio de infraestructura que garantiza la entrega at-least-once de eventos de dominio.
- **Event_Bus**: Bus de eventos interno (EventEmitter) que comunica los contextos acotados.
- **Route_Guard**: Componente de React Router que verifica el rol del usuario antes de renderizar un panel.
- **XP**: Puntos de experiencia acumulados por el alumno (rango 0–960).
- **Level**: Nivel del alumno derivado del XP: `Math.floor(XP / 100) + 1` (rango 1–10).
- **Combat_Mode**: Estado de la UI del alumno activo cuando existe al menos una evaluación con status "Pending".
- **gradesSummary**: Campo desnormalizado en el documento del usuario que resume el estado de todas sus evaluaciones.
- **Victory**: Estado de una evaluación aprobada.
- **Defeat**: Estado de una evaluación reprobada.
- **Pending**: Estado de una evaluación aún no calificada.
- **AvatarClass**: Clase de personaje del alumno (Sword, Axe, Dagger, Bow, Magic).
- **Firestore_Security_Rules**: Reglas de seguridad de Firestore que controlan permisos de lectura/escritura.

---

## Requirements

### Requirement 1: Autenticación de Usuarios

**User Story:** Como usuario (alumno o profesor), quiero autenticarme con email y contraseña, para que pueda acceder al panel correspondiente a mi rol de forma segura.

#### Acceptance Criteria

1. WHEN un usuario envía credenciales válidas de email y contraseña, THE Auth_UI SHALL autenticar al usuario mediante Firebase Auth y redirigirlo al panel correspondiente a su rol.
2. WHEN un usuario envía credenciales inválidas, THE Auth_UI SHALL mostrar un mensaje de error descriptivo y mantener al usuario en la pantalla de login.
3. WHEN un usuario no autenticado intenta acceder a cualquier ruta protegida, THE Route_Guard SHALL redirigir al usuario a la pantalla de login.
4. THE System SHALL requerir autenticación activa para acceder a cualquier funcionalidad de la aplicación.

---

### Requirement 2: Control de Acceso por Rol

**User Story:** Como sistema, quiero aplicar control de acceso basado en roles, para que los alumnos y profesores solo puedan acceder y modificar los recursos que les corresponden.

#### Acceptance Criteria

1. WHEN un usuario con `role: "student"` intenta acceder a la ruta del Teacher_Panel, THE Route_Guard SHALL redirigir al usuario al Student_Panel.
2. WHEN un usuario con `role: "teacher"` intenta acceder a la ruta del Student_Panel, THE Route_Guard SHALL redirigir al usuario al Teacher_Panel.
3. WHEN un usuario con `role: "student"` intenta escribir en la colección `evaluations` de Firestore, THE Firestore_Security_Rules SHALL rechazar la operación.
4. WHEN un usuario con `role: "student"` intenta leer un documento de otro alumno, THE Firestore_Security_Rules SHALL rechazar la operación.
5. THE Firestore_Security_Rules SHALL permitir escritura en `evaluations` y `users` únicamente a usuarios con `role: "teacher"`.

---

### Requirement 3: Motor de Progresión (XP y Niveles)

**User Story:** Como alumno, quiero que mis actividades académicas se conviertan en XP y niveles, para que pueda ver mi progreso de forma gamificada.

#### Acceptance Criteria

1. WHEN el Progression_Engine recibe una cantidad de XP a sumar, THE Progression_Engine SHALL calcular el nuevo nivel como `Math.floor(XP / 100) + 1`.
2. WHEN el XP resultante superaría 960, THE Progression_Engine SHALL limitar el XP a 960 y calcular el nivel como 10.
3. THE Progression_Engine SHALL mantener el XP del alumno dentro del rango [0, 960] en todo momento.
4. THE Progression_Engine SHALL mantener el nivel del alumno dentro del rango [1, 10] en todo momento.
5. WHEN un TP es aprobado (Victory), THE Progression_Engine SHALL sumar 70 XP al alumno correspondiente.
6. WHEN un Parcial es aprobado (Victory), THE Progression_Engine SHALL sumar 200 XP al alumno correspondiente.
7. WHEN el alumno asiste a una clase regular, THE Progression_Engine SHALL sumar 20 XP al alumno correspondiente.

---

### Requirement 4: Aprobación de Evaluaciones y Eventos de Dominio

**User Story:** Como profesor, quiero aprobar evaluaciones de alumnos, para que el sistema actualice automáticamente el estado gamificado del alumno.

#### Acceptance Criteria

1. WHEN el profesor aprueba una evaluación con un puntaje, THE System SHALL actualizar el estado de la evaluación a "Victory" y el puntaje en Firestore.
2. WHEN la evaluación es actualizada exitosamente en Firestore, THE Outbox_Service SHALL encolar un evento `EvaluationApproved` con el `studentUid`, tipo de evaluación y `xpReward` correspondiente.
3. WHEN el Outbox_Service emite el evento `EvaluationApproved`, THE Event_Bus SHALL notificar al caso de uso `AddXP` para que sume el XP al alumno.
4. WHEN la escritura en Firestore falla, THE Outbox_Service SHALL no encolar el evento y THE Teacher_Panel SHALL mostrar un mensaje de error "No se pudo guardar" y revertir el estado optimista de la celda.
5. WHEN el proceso se interrumpe entre la escritura en Firestore y la emisión del evento, THE Outbox_Service SHALL persistir el evento con estado `pending` en la colección `outbox` y reintentarlo al reconectar.
6. WHEN el handler de `AddXP` recibe un evento `EvaluationApproved` ya procesado para el mismo `evalId`, THE System SHALL ignorar el evento sin sumar XP nuevamente (idempotencia).

---

### Requirement 5: Panel del Alumno (Student Panel)

**User Story:** Como alumno, quiero ver mi dashboard RPG con mi avatar, nivel, XP y evaluaciones, para que pueda conocer mi progreso académico de forma visual y motivadora.

#### Acceptance Criteria

1. WHEN el alumno accede al Student_Panel, THE Student_Panel SHALL mostrar el avatar del alumno con su AvatarClass y animación CSS de sprite correspondiente.
2. WHEN el alumno accede al Student_Panel, THE Student_Panel SHALL mostrar la barra de XP (XPBar) con el XP actual, nivel y XP necesario para el siguiente nivel.
3. WHEN el XP del alumno se actualiza en Firestore, THE Student_Panel SHALL reflejar el nuevo valor mediante `onSnapshot` sin necesidad de recargar la página.
4. WHEN el alumno sube de nivel, THE Student_Panel SHALL disparar una animación de subida de nivel en la XPBar.
5. WHEN el alumno recibe un evento `EvaluationApproved`, THE Student_Panel SHALL disparar la animación de victoria (enemigo desaparece, pose de avatar).

---

### Requirement 6: Modo Combate

**User Story:** Como alumno, quiero que la interfaz active un modo visual dramático cuando tengo una evaluación pendiente, para que sienta la urgencia y motivación de completarla.

#### Acceptance Criteria

1. WHEN el Student_Panel carga y existe al menos una evaluación con status "Pending", THE Student_Panel SHALL activar el Combat_Mode.
2. WHILE el Combat_Mode está activo, THE Student_Panel SHALL renderizar el layout de "mazmorra" con fondo de dungeon y el sprite del EnemySprite correspondiente al tipo de evaluación pendiente.
3. WHILE el Combat_Mode está activo, THE EnemySprite SHALL mostrar la animación de sprite del enemigo asociado al tipo de evaluación (`tp1`, `tp2`, `parcial1`, `parcial2`).
4. WHEN una evaluación pendiente pasa a status "Victory", THE EnemySprite SHALL mostrar el estado `isDefeated` con la animación de derrota del enemigo.
5. WHEN todas las evaluaciones dejan de tener status "Pending", THE Student_Panel SHALL desactivar el Combat_Mode y restaurar el layout normal.

---

### Requirement 7: Panel del Profesor (Teacher Panel)

**User Story:** Como profesor, quiero ver y editar las calificaciones de todos los alumnos en tiempo real, para que pueda gestionar el progreso académico del aula de forma eficiente.

#### Acceptance Criteria

1. WHEN el profesor accede al Teacher_Panel, THE Teacher_Panel SHALL suscribirse a `onSnapshot` de la colección `users` filtrada por `role: "student"`.
2. WHEN Firestore emite un cambio en la colección `users`, THE Teacher_Panel SHALL re-renderizar la tabla con el `gradesSummary` actualizado sin recargar la página.
3. WHEN el profesor edita una celda de estado o puntaje, THE Teacher_Panel SHALL mostrar un indicador "guardando..." durante la escritura en Firestore.
4. WHEN la escritura en Firestore es exitosa, THE Teacher_Panel SHALL ocultar el indicador "guardando..." y reflejar el nuevo estado en la celda.
5. THE Teacher_Panel SHALL mostrar para cada alumno: nombre, nivel, XP y el estado (Victory/Defeat/Pending) y puntaje de cada evaluación (TP1, TP2, Parcial1, Parcial2).
6. THE Teacher_Panel SHALL ser accesible únicamente para usuarios con `role: "teacher"`.

---

### Requirement 8: Consistencia de Datos (gradesSummary)

**User Story:** Como sistema, quiero mantener el `gradesSummary` del usuario consistente con la colección `evaluations`, para que el panel del profesor siempre muestre datos correctos.

#### Acceptance Criteria

1. WHEN una evaluación es aprobada mediante el caso de uso `ApproveEvaluation`, THE System SHALL actualizar el campo `gradesSummary[evalKey]` en el documento del usuario en Firestore de forma atómica con la actualización de la evaluación.
2. WHEN el `gradesSummary` de un alumno es actualizado, THE Teacher_Panel SHALL reflejar el cambio en tiempo real mediante `onSnapshot`.
3. THE System SHALL garantizar que el `level` y `xp` almacenados en el documento del usuario sean siempre consistentes con la fórmula `level = Math.floor(xp / 100) + 1`.

---

### Requirement 9: Diseño Mobile-First y Responsivo

**User Story:** Como alumno o profesor, quiero usar la aplicación desde cualquier dispositivo, para que pueda acceder al panel desde mi teléfono, tablet o computadora.

#### Acceptance Criteria

1. THE Student_Panel SHALL implementar un layout de una columna en el breakpoint `sm` (≥320px) con avatar centrado, XPBar debajo y evaluaciones en cards apiladas.
2. THE Teacher_Panel SHALL implementar scroll horizontal (`overflow-x: auto`) en el breakpoint `sm` para la tabla maestra.
3. WHILE el Teacher_Panel se renderiza en el breakpoint `sm`, THE Teacher_Panel SHALL ocultar las columnas menos críticas de la tabla.
4. WHEN el Teacher_Panel se renderiza en breakpoints `md` (≥768px) o `lg` (≥1024px), THE Teacher_Panel SHALL mostrar todas las columnas de la tabla.
5. THE Teacher_Panel SHALL garantizar un área de toque mínima de 44×44px para todas las celdas editables.
6. WHILE el Combat_Mode está activo en el breakpoint `sm`, THE EnemySprite SHALL ocupar el ancho completo de la pantalla.

---

### Requirement 10: Rendimiento y Carga Diferida

**User Story:** Como usuario, quiero que la aplicación cargue rápidamente, para que no tenga que esperar para acceder a mi panel.

#### Acceptance Criteria

1. THE System SHALL cargar el Student_Panel y el Teacher_Panel con `React.lazy()` para reducir el bundle inicial.
2. THE System SHALL cargar la librería `canvas-confetti` de forma lazy únicamente cuando se dispara el evento de victoria.
3. THE Teacher_Panel SHALL limitar la suscripción `onSnapshot` a documentos con `role: "student"` para evitar leer documentos de profesores.
4. THE Student_Panel SHALL usar animaciones CSS con `steps()` y `transform` para los sprites, evitando reflows del DOM.

---

### Requirement 11: Serialización y Persistencia de Eventos (Outbox)

**User Story:** Como sistema, quiero persistir los eventos de dominio pendientes, para que ningún evento se pierda ante fallos de red o interrupciones del proceso.

#### Acceptance Criteria

1. WHEN el Outbox_Service encola un evento, THE Outbox_Service SHALL persistir el evento en la colección `outbox/{id}` de Firestore con estado `pending`.
2. WHEN el Outbox_Service procesa un evento exitosamente, THE Outbox_Service SHALL marcar el evento como `processed` en Firestore.
3. WHEN la aplicación se reconecta tras una interrupción, THE Outbox_Service SHALL recuperar y reemitir todos los eventos con estado `pending`.
4. FOR ALL eventos `EvaluationApproved` con el mismo `evalId`, el handler `AddXP` SHALL producir el mismo estado final de XP independientemente de cuántas veces sea procesado (idempotencia).
