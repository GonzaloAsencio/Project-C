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

  // Trigger level-up animation when level increments
  useEffect(() => {
    if (level > prevLevelRef.current && barRef.current) {
      barRef.current.classList.remove("xpbar-levelup")
      // Force reflow to restart animation
      void barRef.current.offsetWidth
      barRef.current.classList.add("xpbar-levelup")
    }
    prevLevelRef.current = level
  }, [level])

  const xpInCurrentLevel = XP_PER_LEVEL - xpToNextLevel
  const fillPercent = Math.min(100, Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100))

  return (
    <>
      <style>{`
        .xpbar-root {
          width: 100%;
          box-sizing: border-box;
          padding: 0.5rem 0;
        }
        .xpbar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
          font-size: 0.85rem;
          color: var(--text-h, #08060d);
        }
        .xpbar-level {
          font-weight: 700;
          font-size: 1rem;
          color: var(--accent, #aa3bff);
        }
        .xpbar-track {
          width: 100%;
          height: 14px;
          background: var(--border, #e5e4e7);
          border-radius: 7px;
          overflow: hidden;
          position: relative;
        }
        .xpbar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent, #aa3bff), #ff6bff);
          border-radius: 7px;
          transition: width 0.4s ease;
          will-change: width;
        }
        .xpbar-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text, #6b6375);
          margin-top: 0.25rem;
        }
        @keyframes xpbar-levelup-flash {
          0%   { box-shadow: 0 0 0 0 rgba(170,59,255,0.8); transform: scaleY(1); }
          30%  { box-shadow: 0 0 0 8px rgba(170,59,255,0.4); transform: scaleY(1.3); }
          60%  { box-shadow: 0 0 0 16px rgba(170,59,255,0); transform: scaleY(0.9); }
          100% { box-shadow: 0 0 0 0 rgba(170,59,255,0); transform: scaleY(1); }
        }
        .xpbar-levelup .xpbar-track {
          animation: xpbar-levelup-flash 0.6s ease forwards;
        }
      `}</style>
      <div className="xpbar-root" ref={barRef} aria-label={`Nivel ${level}, ${currentXP} XP`}>
        <div className="xpbar-header">
          <span className="xpbar-level">Nivel {level}</span>
          <span>{currentXP} XP</span>
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
        <div className="xpbar-footer">
          <span>{xpInCurrentLevel} / {XP_PER_LEVEL} XP</span>
          <span>{xpToNextLevel} para nivel {level + 1}</span>
        </div>
      </div>
    </>
  )
}
