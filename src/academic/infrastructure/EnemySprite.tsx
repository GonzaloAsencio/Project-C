export interface EnemySpriteProps {
  isDefeated: boolean
  enemyType: "tp1" | "tp2" | "parcial1" | "parcial2"
}

// Each enemy type maps to a distinct color/shape via CSS.
// In a real project these would be sprite sheets; here we use CSS-only
// placeholder sprites that animate with steps() + transform.
const ENEMY_CONFIG: Record<
  EnemySpriteProps["enemyType"],
  { label: string; color: string; frames: number }
> = {
  tp1:      { label: "TP 1",      color: "#4ade80", frames: 4 },
  tp2:      { label: "TP 2",      color: "#facc15", frames: 4 },
  parcial1: { label: "Parcial 1", color: "#f87171", frames: 6 },
  parcial2: { label: "Parcial 2", color: "#c084fc", frames: 6 },
}

export default function EnemySprite({ isDefeated, enemyType }: EnemySpriteProps) {
  const cfg = ENEMY_CONFIG[enemyType]
  // Each frame is 64px wide; total sprite sheet width = frames * 64
  const sheetWidth = cfg.frames * 64

  return (
    <>
      <style>{`
        .enemy-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }

        /* Sprite container — clips to one 64×64 frame */
        .enemy-sprite {
          width: 64px;
          height: 64px;
          position: relative;
          overflow: hidden;
          image-rendering: pixelated;
          /* Scale up for visibility */
          transform: scale(2);
          transform-origin: top center;
          margin-bottom: 64px; /* compensate scale */
        }

        /* The "sprite sheet" is a single div whose background-color
           simulates the enemy. We animate translateX to cycle frames. */
        .enemy-frames {
          width: ${sheetWidth}px;
          height: 64px;
          display: flex;
          will-change: transform;
        }

        .enemy-frame {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
          border-radius: 8px;
          position: relative;
        }

        /* Idle walk animation: steps through frames */
        @keyframes enemy-walk {
          from { transform: translateX(0); }
          to   { transform: translateX(-${sheetWidth - 64}px); }
        }

        .enemy-frames--idle {
          animation: enemy-walk ${cfg.frames * 0.15}s steps(${cfg.frames - 1}, end) infinite;
        }

        /* Defeat animation: fall + fade */
        @keyframes enemy-defeat {
          0%   { transform: translateX(0) rotate(0deg);   opacity: 1; }
          40%  { transform: translateX(16px) rotate(30deg); opacity: 0.8; }
          100% { transform: translateX(0) rotate(90deg);  opacity: 0; }
        }

        .enemy-frames--defeated {
          animation: enemy-defeat 0.7s ease-in forwards;
        }

        .enemy-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-h, #08060d);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Full-width on sm breakpoint (≥320px base) */
        @media (max-width: 767px) {
          .enemy-root {
            width: 100%;
          }
          .enemy-sprite {
            transform: scale(3);
            margin-bottom: 128px;
          }
        }
      `}</style>
      <div
        className="enemy-root"
        role="img"
        aria-label={`Enemigo: ${cfg.label}${isDefeated ? " (derrotado)" : ""}`}
      >
        <div className="enemy-sprite">
          <div
            className={`enemy-frames ${isDefeated ? "enemy-frames--defeated" : "enemy-frames--idle"}`}
          >
            {Array.from({ length: cfg.frames }).map((_, i) => (
              <div
                key={i}
                className="enemy-frame"
                style={{
                  background: cfg.color,
                  opacity: 0.85 + (i % 2) * 0.15,
                  // Slight shape variation per frame to simulate animation
                  borderRadius: i % 2 === 0 ? "8px 8px 4px 4px" : "4px 4px 8px 8px",
                }}
              />
            ))}
          </div>
        </div>
        <span className="enemy-label">{cfg.label}</span>
      </div>
    </>
  )
}
