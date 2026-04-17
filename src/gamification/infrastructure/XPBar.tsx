import { useEffect, useRef } from "react"

export interface XPBarProps {
  currentXP: number
  level: number
  xpToNextLevel: number
}

const XP_PER_LEVEL = 100

export default function XPBar({ currentXP, level, xpToNextLevel }: XPBarProps) {
  const prevLevelRef = useRef(level)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (level > prevLevelRef.current && barRef.current) {
      barRef.current.classList.remove("xpbar-levelup")
      void barRef.current.offsetWidth
      barRef.current.classList.add("xpbar-levelup")
    }
    prevLevelRef.current = level
  }, [level])

  const xpInCurrentLevel = XP_PER_LEVEL - xpToNextLevel
  const fillPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)))
  const isMaxLevel = level >= 10

  return (
    <>
      <style>{`
        .xpbar-root { width: 100%; }

        .xpbar-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.6rem;
        }

        .xpbar-level-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: #fff;
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          font-size: 0.85rem; font-weight: 800;
          box-shadow: 0 4px 12px rgba(168,85,247,0.4);
        }

        .xpbar-xp-value {
          font-size: 0.9rem; font-weight: 700;
          color: #6b7280;
        }

        .xpbar-track {
          width: 100%; height: 18px;
          background: rgba(0,0,0,0.08);
          border-radius: 9px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .xpbar-fill {
          height: 100%;
          background: linear-gradient(90deg, #a855f7, #06b6d4, #4ade80);
          background-size: 200% 100%;
          border-radius: 9px;
          transition: width 0.5s cubic-bezier(0.34,1.56,0.64,1);
          will-change: width;
          position: relative;
          animation: xpbar-shimmer 2s linear infinite;
        }

        @keyframes xpbar-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .xpbar-fill::after {
          content: '';
          position: absolute; top: 2px; left: 4px; right: 4px; height: 4px;
          background: rgba(255,255,255,0.4);
          border-radius: 2px;
        }

        .xpbar-footer {
          display: flex; justify-content: space-between;
          font-size: 0.75rem; color: #9ca3af; font-weight: 600;
          margin-top: 0.4rem;
        }

        @keyframes xpbar-levelup-flash {
          0%   { transform: scaleY(1); filter: brightness(1); }
          25%  { transform: scaleY(1.4); filter: brightness(1.8); }
          50%  { transform: scaleY(0.9); filter: brightness(1.2); }
          75%  { transform: scaleY(1.1); filter: brightness(1.4); }
          100% { transform: scaleY(1); filter: brightness(1); }
        }

        .xpbar-levelup .xpbar-track {
          animation: xpbar-levelup-flash 0.7s ease forwards;
        }

        .xpbar-max {
          text-align: center;
          font-size: 0.8rem; font-weight: 700;
          color: #a855f7;
          margin-top: 0.4rem;
        }
      `}</style>

      <div className="xpbar-root" ref={barRef} aria-label={`Nivel ${level}, ${currentXP} XP`}>
        <div className="xpbar-header">
          <span className="xpbar-level-badge">⭐ Nivel {level}</span>
          <span className="xpbar-xp-value">{currentXP} / 960 XP</span>
        </div>

        <div className="xpbar-track">
          <div
            className="xpbar-fill"
            style={{ width: `${fillPercent}%` }}
            role="progressbar"
            aria-valuenow={currentXP}
            aria-valuemin={0}
            aria-valuemax={960}
          />
        </div>

        {isMaxLevel ? (
          <div className="xpbar-max">🏆 ¡Nivel máximo alcanzado!</div>
        ) : (
          <div className="xpbar-footer">
            <span>{xpInCurrentLevel} / {XP_PER_LEVEL} XP este nivel</span>
            <span>{xpToNextLevel} XP para nivel {level + 1}</span>
          </div>
        )}
      </div>
    </>
  )
}
