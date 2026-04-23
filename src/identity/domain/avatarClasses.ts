export const PLAYABLE_AVATAR_CLASSES = [
  "berserker",
  "guerrero",
  "maga",
  "arquera",
  "asesina",
  "paladin",
  "sacerdote",
] as const

export type PlayableAvatarClass = (typeof PLAYABLE_AVATAR_CLASSES)[number]

export type LegacyAvatarClass = "Sword" | "Axe" | "Dagger" | "Bow" | "Magic"

export type AvatarClass = PlayableAvatarClass | LegacyAvatarClass

export interface AvatarVisual {
  key: string
  label: string
  subtitle: string
  emoji: string
  gradient: string
  glow: string
  image?: string
}

const LEGACY_AVATAR_VISUALS: Record<LegacyAvatarClass, AvatarVisual> = {
  Sword: {
    key: "Sword",
    label: "Sword",
    subtitle: "Maestro de la Espada",
    emoji: "⚔️",
    gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    glow: "rgba(59,130,246,0.4)",
  },
  Axe: {
    key: "Axe",
    label: "Axe",
    subtitle: "Berserker del Hacha",
    emoji: "🪓",
    gradient: "linear-gradient(135deg,#ef4444,#b91c1c)",
    glow: "rgba(239,68,68,0.4)",
  },
  Dagger: {
    key: "Dagger",
    label: "Dagger",
    subtitle: "Asesino Veloz",
    emoji: "🗡️",
    gradient: "linear-gradient(135deg,#10b981,#065f46)",
    glow: "rgba(16,185,129,0.4)",
  },
  Bow: {
    key: "Bow",
    label: "Bow",
    subtitle: "Arquero de Elite",
    emoji: "🏹",
    gradient: "linear-gradient(135deg,#f59e0b,#b45309)",
    glow: "rgba(245,158,11,0.4)",
  },
  Magic: {
    key: "Magic",
    label: "Magic",
    subtitle: "Hechicero Arcano",
    emoji: "🔮",
    gradient: "linear-gradient(135deg,#a855f7,#7c3aed)",
    glow: "rgba(168,85,247,0.4)",
  },
}

const PLAYABLE_AVATAR_VISUALS: Record<PlayableAvatarClass, AvatarVisual> = {
  berserker: {
    key: "berserker",
    label: "Berserker",
    subtitle: "Furia indomable en primera linea",
    emoji: "🪓",
    gradient: "linear-gradient(135deg,#f97316,#dc2626)",
    glow: "rgba(249,115,22,0.45)",
    image: "/characters/char7.jpg",
  },
  guerrero: {
    key: "guerrero",
    label: "Guerrero",
    subtitle: "Acero y disciplina tactica",
    emoji: "🛡️",
    gradient: "linear-gradient(135deg,#3b82f6,#1e3a8a)",
    glow: "rgba(59,130,246,0.45)",
    image: "/characters/char4.jpg",
  },
  maga: {
    key: "maga",
    label: "Maga",
    subtitle: "Control absoluto de la energia arcana",
    emoji: "✨",
    gradient: "linear-gradient(135deg,#a855f7,#4c1d95)",
    glow: "rgba(168,85,247,0.45)",
    image: "/characters/char1.jpg",
  },
  arquera: {
    key: "arquera",
    label: "Arquera",
    subtitle: "Precision letal a larga distancia",
    emoji: "🏹",
    gradient: "linear-gradient(135deg,#22c55e,#166534)",
    glow: "rgba(34,197,94,0.45)",
    image: "/characters/char2.jpg",
  },
  asesina: {
    key: "asesina",
    label: "Asesina",
    subtitle: "Golpes rapidos desde las sombras",
    emoji: "🗡️",
    gradient: "linear-gradient(135deg,#0f172a,#334155)",
    glow: "rgba(148,163,184,0.45)",
    image: "/characters/char6.jpg",
  },
  paladin: {
    key: "paladin",
    label: "Paladin",
    subtitle: "Defensa sagrada del equipo",
    emoji: "🛡️",
    gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)",
    glow: "rgba(251,191,36,0.5)",
    image: "/characters/char5.jpg",
  },
  sacerdote: {
    key: "sacerdote",
    label: "Sacerdote",
    subtitle: "Soporte y restauracion espiritual",
    emoji: "✚",
    gradient: "linear-gradient(135deg,#06b6d4,#0e7490)",
    glow: "rgba(6,182,212,0.45)",
    image: "/characters/char3.jpg",
  },
}

const DEFAULT_AVATAR_CLASS: PlayableAvatarClass = "maga"

export function isPlayableAvatarClass(value: unknown): value is PlayableAvatarClass {
  return typeof value === "string" && (PLAYABLE_AVATAR_CLASSES as readonly string[]).includes(value)
}

export function getAvatarVisual(avatarClass: AvatarClass | null | undefined): AvatarVisual {
  if (!avatarClass) return PLAYABLE_AVATAR_VISUALS[DEFAULT_AVATAR_CLASS]
  if ((PLAYABLE_AVATAR_VISUALS as Record<string, AvatarVisual>)[avatarClass]) {
    return (PLAYABLE_AVATAR_VISUALS as Record<string, AvatarVisual>)[avatarClass]
  }
  if ((LEGACY_AVATAR_VISUALS as Record<string, AvatarVisual>)[avatarClass]) {
    return (LEGACY_AVATAR_VISUALS as Record<string, AvatarVisual>)[avatarClass]
  }
  return PLAYABLE_AVATAR_VISUALS[DEFAULT_AVATAR_CLASS]
}
