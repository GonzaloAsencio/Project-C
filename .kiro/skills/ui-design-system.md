# UI Design System — Neo-Pop / Street-Cyberpunk

## Identidad Visual del Proyecto

Project-C usa un estilo **Neo-Pop / Street-Cyberpunk**: colores vibrantes sobre fondos oscuros, tipografía bold, bordes con glow, animaciones snappy. El panel del alumno es inmersivo (RPG), el panel del profesor es funcional pero con personalidad.

## Paleta de Colores

```css
/* Fondos */
--bg-dark:     #0d0d1a;   /* fondo principal oscuro */
--bg-card:     #1a1a2e;   /* cards y contenedores */
--bg-surface:  #16213e;   /* superficies secundarias */

/* Acentos */
--accent:      #aa3bff;   /* púrpura principal */
--accent-cyan: #00d4ff;   /* cyan secundario */
--accent-pink: #ff3b9a;   /* rosa para alertas/combate */
--accent-gold: #ffd700;   /* dorado para XP/nivel */

/* Semánticos */
--victory:     #4ade80;   /* verde victoria */
--defeat:      #f87171;   /* rojo derrota */
--pending:     #facc15;   /* amarillo pendiente */

/* Texto */
--text-primary: #f1f5f9;
--text-muted:   #94a3b8;
--text-dark:    #08060d;
```

## Tipografía

- Fuente principal: sistema (`font-family: inherit`) o Google Fonts `Rajdhani` / `Orbitron` para títulos
- Títulos: `font-weight: 800`, `letter-spacing: 0.05em`
- Usar `clamp()` para tamaños responsivos: `font-size: clamp(1rem, 2.5vw, 1.5rem)`
- Texto en caps para labels: `text-transform: uppercase; letter-spacing: 0.08em`

## Componentes Base

### Cards
```css
.card {
  background: var(--bg-card);
  border: 1px solid rgba(170, 59, 255, 0.3);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 
              inset 0 1px 0 rgba(255,255,255,0.05);
}
```

### Botones
```css
.btn-primary {
  background: linear-gradient(135deg, #aa3bff, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(170, 59, 255, 0.4);
}
.btn-primary:active { transform: translateY(0); }
```

### Inputs / Selects
```css
.input {
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(170, 59, 255, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(170, 59, 255, 0.15);
  outline: none;
}
```

### Badges de estado
```css
.badge-victory { background: #4ade80; color: #000; }
.badge-defeat  { background: #f87171; color: #000; }
.badge-pending { background: #facc15; color: #000; }

.badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Animaciones

### Principios
- Usar `transform` y `opacity` — nunca animar `width`, `height`, `top`, `left`
- Duración: 150ms para micro-interacciones, 300ms para transiciones, 600ms para celebraciones
- Easing: `ease` para entradas, `ease-out` para salidas, `cubic-bezier(0.34, 1.56, 0.64, 1)` para bounces

### Animaciones comunes
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--accent); }
  50%       { box-shadow: 0 0 24px var(--accent), 0 0 48px var(--accent); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes level-up {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.4); filter: brightness(1.5); }
  60%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

### Sprites CSS (pixel art)
```css
/* Para sprites de personajes/enemigos */
.sprite {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  animation: sprite-walk 0.5s steps(4) infinite;
}

@keyframes sprite-walk {
  from { background-position: 0 0; }
  to   { background-position: -256px 0; } /* 4 frames × 64px */
}
```

## Layout

### Mobile-first
- Diseñar primero para 320px, escalar con media queries
- Breakpoints: `sm: 320px`, `md: 768px`, `lg: 1024px`
- Usar `min-height: 100svh` (safe viewport height para móviles)
- Usar `rem` y `%` para tamaños, evitar `px` fijos

### Grid y Flex
- Flex para componentes lineales (nav, cards en fila)
- Grid para layouts 2D (tabla, galería de cards)
- `gap` en lugar de `margin` entre elementos de flex/grid

## Modo Combate (Dungeon Mode)

Cuando `combatMode === true`:
- Fondo: `background: #0d0d1a` con overlay de textura
- Texto: colores claros sobre oscuro
- Borde de cards: `rgba(255, 59, 154, 0.4)` (rosa/magenta)
- Título pulsante en rojo: animación `pulse-red`
- EnemySprite ocupa ancho completo en mobile

## Panel del Profesor

- Fondo con gradiente vibrante (no blanco plano)
- Header con gradiente `#667eea → #764ba2`
- Tabla con fondo blanco/claro para contraste con el header
- Celdas editables con border visible y hover state
- Indicadores de estado con colores semánticos (verde/rojo/amarillo)
