import { motion } from "framer-motion"

export function DefeatBadge() {
  return (
    <motion.div
      className="relative flex items-center justify-center w-40 h-40"
      initial={{ scale: 0.8, opacity: 0, y: -30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
    >
      {/* Soft cold glow behind */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: `radial-gradient(circle, 
            oklch(0.4 0.02 230 / 0.2) 0%,
            transparent 70%
          )`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Diamond frame — cold, muted */}
      <motion.div
        className="absolute w-36 h-36"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="defeatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="oklch(0.55 0.02 230 / 0.5)" />
              <stop offset="50%"  stopColor="oklch(0.45 0.02 240 / 0.3)" />
              <stop offset="100%" stopColor="oklch(0.55 0.02 230 / 0.5)" />
            </linearGradient>
          </defs>

          <motion.path
            d="M50 8 L92 50 L50 92 L8 50 Z"
            fill="none"
            stroke="url(#defeatGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 1.2, ease: "easeInOut" }}
          />
          <path d="M50 20 L80 50 L50 80 L20 50 Z" fill="none" stroke="oklch(0.5 0.02 230 / 0.15)" strokeWidth="0.5" />

          <path d="M50 5 L53 8 L50 11 L47 8 Z"   fill="oklch(0.6 0.02 230 / 0.3)" />
          <path d="M95 50 L92 53 L89 50 L92 47 Z" fill="oklch(0.6 0.02 230 / 0.3)" />
          <path d="M50 95 L47 92 L50 89 L53 92 Z" fill="oklch(0.6 0.02 230 / 0.3)" />
          <path d="M5 50 L8 47 L11 50 L8 53 Z"   fill="oklch(0.6 0.02 230 / 0.3)" />
        </svg>
      </motion.div>

      {/* Crescent moon */}
      <motion.svg
        className="relative w-14 h-14"
        viewBox="0 0 64 64"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
      >
        <defs>
          <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="oklch(0.75 0.03 230)" />
            <stop offset="100%" stopColor="oklch(0.5 0.02 240)" />
          </linearGradient>
          <mask id="crescentMask">
            <circle cx="32" cy="32" r="20" fill="white" />
            <circle cx="40" cy="28" r="16" fill="black" />
          </mask>
        </defs>

        <motion.circle
          cx="32" cy="32" r="20"
          fill="url(#moonGradient)"
          mask="url(#crescentMask)"
          animate={{ opacity: [0.7, 0.5, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.path
          d="M20 20 Q12 32 20 44"
          fill="none"
          stroke="oklch(0.8 0.02 230 / 0.3)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        <motion.circle cx="48" cy="16" r="1.5" fill="oklch(0.7 0.02 230 / 0.5)"
          animate={{ opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }} />
        <motion.circle cx="52" cy="28" r="1"   fill="oklch(0.6 0.02 230 / 0.4)"
          animate={{ opacity: [0.4, 0.1, 0.4] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} />
        <motion.circle cx="46" cy="40" r="1"   fill="oklch(0.6 0.02 230 / 0.3)"
          animate={{ opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
      </motion.svg>

      {/* Floating dust particles around badge */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 60
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              top:  `calc(50% + ${Math.sin(angle) * radius}px)`,
              background: "oklch(0.6 0.02 230 / 0.4)",
            }}
            animate={{ y: [0, 10, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        )
      })}
    </motion.div>
  )
}
