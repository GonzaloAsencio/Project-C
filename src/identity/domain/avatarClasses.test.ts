import { describe, expect, it } from "vitest"
import {
  PLAYABLE_AVATAR_CLASSES,
  getAvatarVisual,
  isPlayableAvatarClass,
  type AvatarClass,
} from "./avatarClasses"

describe("avatarClasses", () => {
  it("accepts all playable classes", () => {
    for (const avatarClass of PLAYABLE_AVATAR_CLASSES) {
      expect(isPlayableAvatarClass(avatarClass)).toBe(true)
    }
  })

  it("rejects invalid playable class values", () => {
    expect(isPlayableAvatarClass("wizard")).toBe(false)
    expect(isPlayableAvatarClass("")).toBe(false)
    expect(isPlayableAvatarClass(null)).toBe(false)
    expect(isPlayableAvatarClass(undefined)).toBe(false)
  })

  it("returns a visual for each playable class", () => {
    for (const avatarClass of PLAYABLE_AVATAR_CLASSES) {
      const visual = getAvatarVisual(avatarClass)
      expect(visual.key).toBe(avatarClass)
      expect(visual.label.length).toBeGreaterThan(0)
      expect(visual.subtitle.length).toBeGreaterThan(0)
      expect(visual.gradient.includes("linear-gradient")).toBe(true)
    }
  })

  it("supports legacy classes for existing users", () => {
    const legacyClasses: AvatarClass[] = ["Sword", "Axe", "Dagger", "Bow", "Magic"]
    for (const legacyClass of legacyClasses) {
      const visual = getAvatarVisual(legacyClass)
      expect(visual.key).toBe(legacyClass)
      expect(visual.label).toBe(legacyClass)
    }
  })

  it("falls back to a default visual when class is missing or unknown", () => {
    const fromNull = getAvatarVisual(null)
    const fromUndefined = getAvatarVisual(undefined)
    const fromUnknown = getAvatarVisual("unknown-class" as AvatarClass)

    expect(fromNull.key).toBe("maga")
    expect(fromUndefined.key).toBe("maga")
    expect(fromUnknown.key).toBe("maga")
  })
})
