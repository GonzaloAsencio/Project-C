import { describe, expect, it } from "vitest"
import { canEnterStudentPanel, needsClassSelection } from "./onboardingGate"

describe("onboardingGate", () => {
  it("requires class selection when avatarClass is null or undefined", () => {
    expect(needsClassSelection(null)).toBe(true)
    expect(needsClassSelection(undefined)).toBe(true)
  })

  it("does not require class selection for legacy avatar classes", () => {
    expect(needsClassSelection("Sword")).toBe(false)
    expect(needsClassSelection("Axe")).toBe(false)
    expect(needsClassSelection("Dagger")).toBe(false)
    expect(needsClassSelection("Bow")).toBe(false)
    expect(needsClassSelection("Magic")).toBe(false)
  })

  it("does not require class selection for new playable avatar classes", () => {
    expect(needsClassSelection("berserker")).toBe(false)
    expect(needsClassSelection("guerrero")).toBe(false)
    expect(needsClassSelection("maga")).toBe(false)
    expect(needsClassSelection("arquera")).toBe(false)
    expect(needsClassSelection("asesina")).toBe(false)
    expect(needsClassSelection("paladin")).toBe(false)
    expect(needsClassSelection("sacerdote")).toBe(false)
  })

  it("blocks or allows panel access consistently", () => {
    expect(canEnterStudentPanel(null)).toBe(false)
    expect(canEnterStudentPanel(undefined)).toBe(false)
    expect(canEnterStudentPanel("maga")).toBe(true)
    expect(canEnterStudentPanel("Sword")).toBe(true)
  })
})
