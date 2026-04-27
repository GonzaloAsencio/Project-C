import { motion, AnimatePresence } from "framer-motion"
import { Particles } from "../level-up/Particles"
import { Sparkles } from "../level-up/Sparkles"
import { VictoryBadge } from "./VictoryBadge"

interface VictoryModalProps {
  open: boolean
  evalName: string
  onClose: () => void
}

export function VictoryModal({ open, evalName, onClose }: VictoryModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[400] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "oklch(0.06 0.01 280 / 0.85)",
            }}
          />

          {/* Divine light from above */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[600px] pointer-events-none"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            style={{
              background: `linear-gradient(180deg, 
                oklch(0.95 0.06 85 / 0.4) 0%,
                oklch(0.92 0.05 85 / 0.2) 30%,
                transparent 100%
              )`,
              transformOrigin: "top center",
            }}
          />

          {/* Floating particles */}
          <Particles />

          {/* Main content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-lg"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {/* Sparkles */}
            <Sparkles />

            {/* Victory Badge */}
            <VictoryBadge />

            {/* VICTORY Text */}
            <motion.div
              className="text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <h1
                className="text-5xl md:text-6xl font-black tracking-wider"
                style={{
                  color: "oklch(0.88 0.08 85)",
                  textShadow: `
                    0 0 20px oklch(0.88 0.08 85 / 0.5),
                    0 0 40px oklch(0.88 0.08 85 / 0.3),
                    0 2px 4px oklch(0 0 0 / 0.3)
                  `,
                }}
              >
                VICTORY
              </h1>
              <motion.p
                className="text-sm mt-2 tracking-widest"
                style={{ color: "oklch(0.75 0.04 85 / 0.8)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {evalName.toUpperCase()} COMPLETADO
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
