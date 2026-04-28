import { motion, AnimatePresence } from "framer-motion"
import { FallingParticles } from "./FallingParticles"

interface DefeatModalProps {
  open: boolean
  evalName: string
  onClose: () => void
}

export function DefeatModal({ open, evalName, onClose }: DefeatModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[400] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Backdrop — desaturated, cold blue-grey */}
          <motion.div
            className="absolute inset-0"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: `
                radial-gradient(ellipse at 50% 30%, oklch(0.18 0.02 240 / 0.95) 0%, transparent 60%),
                linear-gradient(180deg, oklch(0.12 0.02 250 / 0.98) 0%, oklch(0.08 0.01 240 / 0.98) 100%)
              `,
              backdropFilter: "blur(12px) saturate(0.3)",
            }}
          />

          {/* Soft fog overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            style={{
              background: `
                radial-gradient(ellipse at 30% 70%, oklch(0.25 0.02 230 / 0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 40%, oklch(0.22 0.02 250 / 0.3) 0%, transparent 50%)
              `,
            }}
          />

          {/* Dim cold light from above */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[500px] pointer-events-none"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            style={{
              background: `linear-gradient(180deg, 
                oklch(0.6 0.02 230 / 0.15) 0%,
                oklch(0.5 0.02 240 / 0.08) 40%,
                transparent 100%
              )`,
            }}
          />

          {/* Falling particles */}
          <FallingParticles />

          {/* Main content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-lg text-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            {/* DERROTA text */}
            <motion.div
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            >
              <h1
                className="text-5xl md:text-6xl font-light tracking-[0.3em]"
                style={{
                  color: "oklch(0.75 0.02 230)",
                  textShadow: `
                    0 0 30px oklch(0.6 0.02 230 / 0.3),
                    0 4px 8px oklch(0 0 0 / 0.4)
                  `,
                }}
              >
                DERROTA
              </h1>
              <motion.p
                className="text-sm mt-4 tracking-[0.2em]"
                style={{ color: "oklch(0.55 0.02 230 / 0.7)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {evalName.toUpperCase()}
              </motion.p>
            </motion.div>

            {/* Motivational message */}
            <motion.p
              className="text-center text-sm max-w-xs"
              style={{ color: "oklch(0.6 0.02 230 / 0.6)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              Cada derrota es una lección. Reagrupá tus fuerzas y volvé más fuerte.
            </motion.p>

            {/* Continue hint */}
            <motion.p
              onClick={onClose}
              className="mt-8 text-xs tracking-[0.25em] cursor-pointer select-none uppercase"
              style={{ color: "oklch(0.55 0.02 230 / 0.55)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.35, 0.55] }}
              transition={{ delay: 1.4, duration: 2.4, times: [0, 0.25, 0.6, 1], repeat: Infinity, repeatType: "mirror" }}
              whileHover={{ color: "oklch(0.75 0.02 230 / 0.9)" }}
            >
              Haz click para continuar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
