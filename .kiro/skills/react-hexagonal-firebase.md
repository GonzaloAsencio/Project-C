# React + Arquitectura Hexagonal + Firebase — Mejores Prácticas

## Arquitectura Hexagonal (Ports & Adapters)

### Estructura de módulos
Cada contexto acotado sigue esta estructura estricta:
```
src/{context}/
  domain/        # Entidades, value objects, eventos de dominio — CERO dependencias externas
  application/   # Casos de uso — solo depende del dominio y ports (interfaces)
  infrastructure/ # Adaptadores concretos (Firebase, React UI) — implementa los ports
  index.ts       # Barrel export público del contexto
```

### Reglas de dependencia
- `domain` → no importa nada externo
- `application` → solo importa `domain` y tipos de ports
- `infrastructure` → puede importar `application`, `domain`, Firebase SDK, React
- Nunca importar de `infrastructure` en `domain` o `application`
- Los contextos se comunican solo a través del `shared/EventBus`, nunca directamente

### Casos de uso
- Un caso de uso = una clase con método `execute()`
- Reciben dependencias por constructor (inyección de dependencias)
- No usan `async/await` en el constructor, solo en `execute()`
- Lanzan errores tipados, nunca `console.error` en producción

### Entidades de dominio
- Clases con lógica de negocio pura (sin Firebase, sin React)
- Métodos que retornan eventos de dominio cuando hay cambios de estado
- Invariantes validadas en el constructor o en los métodos

## React — Mejores Prácticas

### Componentes
- Componentes funcionales siempre, nunca clases
- Un componente = una responsabilidad
- Props tipadas con interfaces explícitas, nunca `any`
- Extraer sub-componentes cuando un componente supera ~100 líneas
- `React.lazy()` para code splitting en rutas

### Hooks
- Custom hooks para lógica reutilizable (`useAuth`, `useStudentData`)
- `useEffect` con cleanup siempre que haya suscripciones (`onSnapshot`, `eventBus.on`)
- Dependencias de `useEffect` completas y correctas
- `useState` con tipos explícitos: `useState<User | null>(null)`

### Performance
- `React.memo` para componentes que reciben props estables
- `useCallback` para handlers pasados como props a listas
- Evitar crear objetos/arrays en el render (moverlos fuera del componente)
- Animaciones con CSS `transform` y `opacity`, nunca con JS que cause reflow

### Patrones a evitar
- No usar `useEffect` para derivar estado — usar variables calculadas directamente
- No mutar estado directamente — siempre `setState(prev => ...)`
- No hacer fetch en el render — siempre en `useEffect` o en el caso de uso

## Firebase — Mejores Prácticas

### Firestore
- Desnormalizar datos para lecturas rápidas (ej: `gradesSummary` en el doc del usuario)
- Usar `onSnapshot` solo donde se necesita tiempo real; `getDoc`/`getDocs` para lecturas únicas
- Siempre cancelar suscripciones `onSnapshot` en el cleanup del `useEffect`
- Usar `runTransaction` para escrituras atómicas multi-documento
- Usar `writeBatch` para escrituras múltiples no dependientes entre sí
- IDs de documentos descriptivos: `{uid}_tp1` en lugar de UUIDs cuando sea posible

### Seguridad
- Nunca confiar solo en el cliente — validar en Firestore Security Rules
- El campo `role` en el documento del usuario es la fuente de verdad para permisos
- Usar `get()` en las rules para verificar el rol del usuario que hace la request
- Separar `allow create` de `allow update/delete` para control granular

### Auth
- `onAuthStateChanged` en un solo lugar (AuthContext/Provider)
- Nunca leer el rol del JWT — leerlo siempre del documento de Firestore
- Manejar el estado `loading: true` mientras se resuelve la auth inicial

### Outbox Pattern
- Persistir eventos en Firestore antes de emitirlos (garantía at-least-once)
- Handlers de eventos deben ser idempotentes (verificar si ya procesaron el evento)
- Recuperar eventos `pending` al reconectar (`window.addEventListener('online', ...)`)
