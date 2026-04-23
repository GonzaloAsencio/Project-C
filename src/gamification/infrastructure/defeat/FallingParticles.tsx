import { motion } from "framer-motion"
import { useMemo } from "react"

export function FallingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      size: 1 + Math.random() * 2,
      opacity: 0.15 + Math.random() * 0.25,
      drift: (Math.random() - 0.5) * 30,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: `oklch(0.7 0.02 230 / ${p.opacity})`,
          }}
          initial={{ y: "-5%", x: 0, opacity: 0 }}
          animate={{
            y: "105%",
            x: p.drift,
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
        />
      ))}

      {/* Larger ash/ember elements */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`ash-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 12}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: `oklch(0.55 0.02 230 / 0.2)`,
          }}
          initial={{ y: "-10%", rotate: 0, opacity: 0 }}
          animate={{
            y: "110%",
            rotate: 360,
            opacity: [0, 0.3, 0.3, 0],
          }}
          transition={{ duration: 12 + i * 2, repeat: Infinity, delay: i * 1.5, ease: "linear" }}
        />
      ))}
    </div>
  )
}
