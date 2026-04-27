import { AnimatePresence, motion } from "framer-motion"
import { LevelBadge } from "./LevelBadge"
import { Particles } from "./Particles"
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

            {/* Continue hint */}
            <motion.p
              onClick={onClose}
              className="mt-12 text-xs tracking-[0.25em] cursor-pointer select-none uppercase"
              style={{ color: "oklch(0.75 0.04 85 / 0.55)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.35, 0.55] }}
              transition={{ delay: 1.0, duration: 2.4, times: [0, 0.25, 0.6, 1], repeat: Infinity, repeatType: "mirror" }}
              whileHover={{ color: "oklch(0.88 0.06 85 / 0.9)" } as object}
            >
              Haz click para continuar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
