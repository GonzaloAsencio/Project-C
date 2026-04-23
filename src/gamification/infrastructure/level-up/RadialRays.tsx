import { motion } from "framer-motion"

const RAYS = Array.from({ length: 24 }, (_, i) => i)

export function RadialRays() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      <motion.div
        className="relative w-[600px] h-[600px]"
        initial={{ rotate: 0, scale: 0 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{
          rotate: { duration: 120, repeat: Infinity, ease: "linear" },
          scale: { duration: 0.8, ease: "easeOut" },
        }}
      >
        {RAYS.map((i) => {
          const isLong = i % 2 === 0
          const angle = i * 15
          const length = isLong ? 150 : 100
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: `${length}px`,
                height: "1px",
                left: "50%",
                top: "50%",
                transformOrigin: "0 50%",
                transform: `rotate(${angle}deg)`,
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: isLong ? 0.35 : 0.15, scaleX: 1 }}
              transition={{ delay: 0.2 + i * 0.02, duration: 0.5 }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(90deg,
                    oklch(0.92 0.08 90 / 0.5) 0%,
                    oklch(0.95 0.05 85 / 0.15) 60%,
                    transparent 100%
                  )`,
                }}
              />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Central soft glow */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: `radial-gradient(circle,
            oklch(0.95 0.05 85 / 0.3) 0%,
            oklch(0.92 0.05 90 / 0.1) 40%,
            transparent 70%
          )`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [1, 1.1, 1], opacity: 1 }}
        transition={{
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.5 },
        }}
      />
    </div>
  )
}
