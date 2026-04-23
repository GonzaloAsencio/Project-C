import { motion } from "framer-motion"

interface Props {
  level: number
}

export function LevelBadge({ level }: Props) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
    >
      {/* Outer glow pulse */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: `radial-gradient(circle,
            oklch(0.95 0.04 85 / 0.25) 0%,
            transparent 70%
          )`,
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Genshin-style diamond frame */}
      <motion.div
        className="absolute w-44 h-44 md:w-52 md:h-52"
        initial={{ scale: 0, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="genshinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.92 0.06 85 / 0.7)" />
              <stop offset="50%" stopColor="oklch(0.98 0.02 85 / 0.3)" />
              <stop offset="100%" stopColor="oklch(0.92 0.06 85 / 0.7)" />
            </linearGradient>
          </defs>

          {/* Main diamond — animated draw */}
          <motion.path
            d="M50 8 L92 50 L50 92 L8 50 Z"
            fill="none"
            stroke="url(#genshinGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          />

          {/* Inner diamond */}
          <path
            d="M50 18 L82 50 L50 82 L18 50 Z"
            fill="none"
            stroke="oklch(0.92 0.05 85 / 0.2)"
            strokeWidth="0.5"
          />

          {/* Corner diamond accents */}
          <path d="M50 4 L54 8 L50 12 L46 8 Z"   fill="oklch(0.95 0.05 85 / 0.5)" />
          <path d="M96 50 L92 54 L88 50 L92 46 Z" fill="oklch(0.95 0.05 85 / 0.5)" />
          <path d="M50 96 L46 92 L50 88 L54 92 Z" fill="oklch(0.95 0.05 85 / 0.5)" />
          <path d="M4 50 L8 46 L12 50 L8 54 Z"   fill="oklch(0.95 0.05 85 / 0.5)" />

          {/* Tick lines at corners */}
          <line x1="50" y1="0"   x2="50" y2="5"   stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
          <line x1="100" y1="50" x2="95" y2="50"  stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
          <line x1="50" y1="100" x2="50" y2="95"  stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
          <line x1="0" y1="50"  x2="5" y2="50"   stroke="oklch(0.95 0.05 85 / 0.4)" strokeWidth="0.5" />
        </svg>
      </motion.div>

      {/* Level number */}
      <motion.span
        className="relative z-10 text-7xl md:text-8xl font-black tracking-tight"
        style={{
          color: "oklch(0.95 0.04 85)",
          textShadow: `
            0 0 40px oklch(0.95 0.04 85 / 0.7),
            0 0 80px oklch(0.92 0.05 85 / 0.4),
            0 2px 4px oklch(0 0 0 / 0.3)
          `,
        }}
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 250, damping: 15 }}
      >
        {level}
      </motion.span>

      {/* Mini floating particles around the number */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 + 30) * (Math.PI / 180)
        const radius = 60
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              top:  `calc(50% + ${Math.sin(angle) * radius}px)`,
              background: "oklch(0.95 0.04 85 / 0.6)",
              boxShadow: "0 0 4px oklch(0.95 0.04 85 / 0.5)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale:   [0.5, 1, 0.5],
              y:       [-10, 10, -10],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        )
      })}
    </motion.div>
  )
}
