export interface EnemySpriteProps {
  isDefeated: boolean
  enemyType: "tp1" | "tp2" | "parcial1" | "parcial2"
}

const ENEMY_CONFIG: Record<
  EnemySpriteProps["enemyType"],
  { label: string; emoji: string; color: string; glow: string; frames: number }
> = {
  tp1:      { label: "TP 1",      emoji: "👾", color: "#4ade80", glow: "rgba(74,222,128,0.5)",  frames: 4 },
  tp2:      { label: "TP 2",      emoji: "🤖", color: "#facc15", glow: "rgba(250,204,21,0.5)",  frames: 4 },
  parcial1: { label: "Parcial 1", emoji: "💀", color: "#f87171", glow: "rgba(248,113,113,0.6)", frames: 6 },
  parcial2: { label: "Parcial 2", emoji: "🐉", color: "#c084fc", glow: "rgba(192,132,252,0.6)", frames: 6 },
}

export default function EnemySprite({ isDefeated, enemyType }: EnemySpriteProps) {
  const cfg = ENEMY_CONFIG[enemyType]

  return (
    <>
      <style>{`
        .enemy-root {
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          width: 100%;
        }

        .enemy-container {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        }

        .enemy-glow-ring {
          width: 120px; height: 120px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 4rem;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
          border: 2px solid var(--enemy-color);
          box-shadow: 0 0 24px var(--enemy-glow), inset 0 0 24px rgba(0,0,0,0.3);
          animation: enemy-float 2s ease-in-out infinite;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .enemy-glow-ring--defeated {
          animation: enemy-defeat 0.8s ease-in forwards;
        }

        @keyframes enemy-float {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-8px) scale(1.05); }
        }

        @keyframes enemy-defeat {
          0%   { transform: rotate(0deg) scale(1); opacity: 1; }
          30%  { transform: rotate(-15deg) scale(1.1); opacity: 0.8; }
          60%  { transform: rotate(20deg) scale(0.8); opacity: 0.4; }
          100% { transform: rotate(90deg) scale(0.3) translateY(20px); opacity: 0; }
        }

        .enemy-hp-bar {
          width: 120px; height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .enemy-hp-fill {
          height: 100%;
          border-radius: 4px;
          background: var(--enemy-color);
          box-shadow: 0 0 8px var(--enemy-glow);
          transition: width 0.5s ease;
          animation: hp-pulse 1.5s ease-in-out infinite;
        }

        @keyframes hp-pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.7; }
        }

        .enemy-label {
          font-size: 0.85rem; font-weight: 800;
          color: var(--enemy-color);
          text-transform: uppercase; letter-spacing: 0.1em;
          text-shadow: 0 0 12px var(--enemy-glow);
        }

        .enemy-defeated-text {
          font-size: 0.85rem; font-weight: 800;
          color: #4ade80;
          text-transform: uppercase; letter-spacing: 0.1em;
          animation: fade-in 0.5s ease 0.5s both;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 767px) {
          .enemy-glow-ring { width: 140px; height: 140px; font-size: 5rem; }
          .enemy-hp-bar { width: 140px; }
        }
      `}</style>

      <div
        className="enemy-root"
        role="img"
        aria-label={`Enemigo: ${cfg.label}${isDefeated ? " (derrotado)" : ""}`}
        style={{
          "--enemy-color": cfg.color,
          "--enemy-glow": cfg.glow,
        } as React.CSSProperties}
      >
        <div className="enemy-container">
          <div className={`enemy-glow-ring${isDefeated ? " enemy-glow-ring--defeated" : ""}`}>
            {cfg.emoji}
          </div>

          {isDefeated
            ? <span className="enemy-defeated-text">¡Derrotado! ✓</span>
            : <span className="enemy-label">{cfg.label}</span>
          }
        </div>
      </div>
    </>
  )
}
