import { describe, expect, it } from "vitest"
import * as fc from "fast-check"
import {
  buildStudentEvaluationDocs,
  buildStudentUserDoc,
  buildTeacherUserDoc,
  isValidTemporaryPassword,
} from "./studentProvisioning"

describe("studentProvisioning", () => {
  it("buildStudentUserDoc creates pending-profile student defaults", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.emailAddress(),
        (displayName, email) => {
          const doc = buildStudentUserDoc({ displayName, email })
          return (
            doc.displayName === displayName &&
            doc.email === email &&
            doc.role === "student" &&
            doc.avatarClass === null &&
            doc.level === 1 &&
            doc.xp === 0 &&
            doc.xpToNextLevel === 100 &&
            Array.isArray(doc.processedEvalIds) &&
            doc.processedEvalIds.length === 0
          )
        }
      )
    )
  })

  it("buildTeacherUserDoc creates teacher defaults", () => {
    const doc = buildTeacherUserDoc({ displayName: "Profesor", email: "profe@escuela.com" })
    expect(doc.role).toBe("teacher")
    expect(doc.avatarClass).toBe(null)
    expect(doc.level).toBe(1)
    expect(doc.xpToNextLevel).toBe(100)
  })

  it("buildStudentEvaluationDocs always creates the 4 initial evaluations", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 24 }), (uid) => {
        const docs = buildStudentEvaluationDocs(uid)
        const ids = docs.map((d) => d.id)
        return (
          docs.length === 4 &&
          ids.includes(`${uid}_tp1`) &&
          ids.includes(`${uid}_tp2`) &&
          ids.includes(`${uid}_parcial1`) &&
          ids.includes(`${uid}_parcial2`) &&
          docs.every((d) => d.data.status === "Pending" && d.data.score === 0)
        )
      })
    )
  })

  it("isValidTemporaryPassword enforces minimum length", () => {
    expect(isValidTemporaryPassword("12345")).toBe(false)
    expect(isValidTemporaryPassword("123456")).toBe(true)
    expect(isValidTemporaryPassword("   123456   ")).toBe(true)
    expect(isValidTemporaryPassword("      ")).toBe(false)
  })
})
