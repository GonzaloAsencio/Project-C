import { motion } from "framer-motion"

export function VictoryBadge() {
  return (
    <motion.div
      className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Pulsing glow behind */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, 
            oklch(0.92 0.06 85 / 0.3) 0%,
            transparent 70%
          )`,
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Genshin-style diamond frame */}
      <motion.div
        className="absolute w-36 h-36 md:w-44 md:h-44"
        initial={{ scale: 0, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="victoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.92 0.06 85 / 0.7)" />
              <stop offset="50%" stopColor="oklch(0.98 0.02 85 / 0.3)" />
              <stop offset="100%" stopColor="oklch(0.92 0.06 85 / 0.7)" />
            </linearGradient>
          </defs>

          <motion.path
            d="M50 8 L92 50 L50 92 L8 50 Z"
            fill="none"
            stroke="url(#victoryGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <path d="M50 18 L82 50 L50 82 L18 50 Z" fill="none" stroke="oklch(0.92 0.05 85 / 0.2)" strokeWidth="0.5" />

          <path d="M50 4 L54 8 L50 12 L46 8 Z"   fill="oklch(0.95 0.05 85 / 0.5)" />
          <path d="M96 50 L92 54 L88 50 L92 46 Z" fill="oklch(0.95 0.05 85 / 0.5)" />
          <path d="M50 96 L46 92 L50 88 L54 92 Z" fill="oklch(0.95 0.05 85 / 0.5)" />
          <path d="M4 50 L8 46 L12 50 L8 54 Z"   fill="oklch(0.95 0.05 85 / 0.5)" />

          <line x1="50" y1="0"   x2="50" y2="5"  stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
          <line x1="100" y1="50" x2="95" y2="50" stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
          <line x1="50" y1="100" x2="50" y2="95" stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
          <line x1="0" y1="50"  x2="5" y2="50"  stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
        </svg>
      </motion.div>

      {/* Crown icon */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 250, damping: 15 }}
      >
        <svg
          width="48" height="48" viewBox="0 0 24 24" fill="none"
          style={{ filter: "drop-shadow(0 0 20px oklch(0.95 0.04 85 / 0.6))" }}
        >
          <motion.path
            d="M12 2L15 8L22 6L19 13H5L2 6L9 8L12 2Z"
            fill="oklch(0.95 0.04 85)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          />
          <motion.path
            d="M5 14H19V16C19 17.1 18.1 18 17 18H7C5.9 18 5 17.1 5 16V14Z"
            fill="oklch(0.92 0.05 85)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          />
          <circle cx="12" cy="6" r="1.5" fill="oklch(0.98 0.02 85)" />
          <circle cx="8"  cy="7" r="1"   fill="oklch(0.90 0.04 85 / 0.7)" />
          <circle cx="16" cy="7" r="1"   fill="oklch(0.90 0.04 85 / 0.7)" />
        </svg>
      </motion.div>

      {/* Floating particles around badge */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60) * (Math.PI / 180)
        const radius = 55
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px - 3px)`,
              top:  `calc(50% + ${Math.sin(angle) * radius}px - 3px)`,
              background: "oklch(0.95 0.04 85 / 0.6)",
            }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        )
      })}
    </motion.div>
  )
}
