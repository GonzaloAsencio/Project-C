import { AnimatePresence, motion } from "framer-motion"
import { LevelBadge } from "./LevelBadge"
import { Particles } from "./Particles"
import { RadialRays } from "./RadialRays"
import { Sparkles } from "./Sparkles"

export interface LevelUpModalProps {
  open: boolean
  prevLevel: number
  nextLevel: number
  onClose: () => void
}

export function LevelUpModal({ open, nextLevel, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[400] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={`¡Subiste al nivel ${nextLevel}!`}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: "rgba(6, 4, 14, 0.85)" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Radial light rays — full screen, behind content */}
          <RadialRays />

          {/* Floating particles — full screen */}
          <Particles />

          {/* Main content — floats in center */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-8 px-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {/* Sparkles around badge */}
            <Sparkles />

            {/* Level badge */}
            <LevelBadge level={nextLevel} />

            {/* Text */}
            <motion.div
              className="text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <h1
                className="text-4xl md:text-5xl font-black tracking-wider"
                style={{
                  color: "oklch(0.88 0.08 85)",
                  textShadow: `
                    0 0 20px oklch(0.88 0.08 85 / 0.5),
                    0 0 40px oklch(0.88 0.08 85 / 0.3),
                    0 2px 4px oklch(0 0 0 / 0.3)
                  `,
                }}
              >
                LEVEL UP!
              </h1>
              <motion.p
                className="text-sm mt-2 tracking-widest"
                style={{ color: "oklch(0.75 0.04 85 / 0.8)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                NIVEL DE PERSONAJE
              </motion.p>
            </motion.div>

            {/* Button */}
            <motion.button
              onClick={onClose}
              className="mt-2 px-10 py-3 rounded-xl font-bold text-base tracking-widest uppercase transition-all duration-300 cursor-pointer"
              style={{
                background: "oklch(0.92 0.05 85 / 0.15)",
                color: "oklch(0.88 0.06 85)",
                border: "1px solid oklch(0.85 0.06 85 / 0.3)",
                boxShadow: "0 0 20px oklch(0.88 0.06 85 / 0.1)",
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, type: "spring" }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px oklch(0.88 0.06 85 / 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
              autoFocus
            >
              TAP TO CONTINUE
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
