import { useMemo } from "react"
import { motion } from "framer-motion"

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

export function Sparkles() {
  const sparkles = useMemo<Sparkle[]>(() =>
    Array.from({ length: 15 }, (_, i): Sparkle => ({
      id: i,
      x: (Math.random() - 0.5) * 280,
      y: (Math.random() - 0.5) * 280,
      size: Math.random() * 12 + 6,
      delay: Math.random() * 2,
    })), []
  )

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ x: s.x, y: s.y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.7, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2.5,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
              fill="oklch(0.95 0.04 85)"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
