import { useMemo } from "react"
import { motion } from "framer-motion"

type ParticleColor = "cream" | "soft" | "white"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  color: ParticleColor
}

function getColor(color: ParticleColor): string {
  switch (color) {
    case "cream": return "oklch(0.92 0.06 85)"
    case "soft":  return "oklch(0.85 0.04 90)"
    case "white": return "oklch(0.98 0.01 90)"
  }
}

export function Particles() {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 35 }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 4 + 3,
      color: (["cream", "soft", "white"] as ParticleColor[])[Math.floor(Math.random() * 3)],
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "-10%",
            width: p.size,
            height: p.size,
            backgroundColor: getColor(p.color),
            boxShadow: `0 0 ${p.size}px ${getColor(p.color)}`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [0, -800],
            opacity: [0, 0.6, 0.6, 0],
            x: [0, Math.sin(p.id) * 30],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}
