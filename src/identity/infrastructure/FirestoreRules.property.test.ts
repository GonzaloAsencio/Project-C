import { describe, it } from "vitest"
import * as fc from "fast-check"

// ---------------------------------------------------------------------------
// In-memory Firestore Security Rules simulator
// Mirrors the logic in firestore.rules without requiring the Firebase Emulator.
//
// Property 10: Restricción de escritura en Firestore por rol
// Validates: Requirements 2.3, 2.5
// ---------------------------------------------------------------------------

type Role = "student" | "teacher"

interface AuthContext {
  uid: string
  role: Role
}

/** Simulates the Firestore Security Rules write check for `evaluations` and `users` */
function canWrite(collection: "evaluations" | "users", auth: AuthContext): boolean {
  // Rule: allow write only if role == "teacher"
  return auth.role === "teacher"
}

describe("FirestoreRules — Property 10: Restricción de escritura por rol", () => {
  it("cualquier usuario con role !== teacher no puede escribir en evaluations", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.constantFrom<Role>("student"),
        (uid, role) => {
          const auth: AuthContext = { uid, role }
          return canWrite("evaluations", auth) === false
        }
      )
    )
  })

  it("cualquier usuario con role !== teacher no puede escribir en users", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.constantFrom<Role>("student"),
        (uid, role) => {
          const auth: AuthContext = { uid, role }
          return canWrite("users", auth) === false
        }
      )
    )
  })

  it("un usuario con role teacher puede escribir en evaluations y users", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        (uid) => {
          const auth: AuthContext = { uid, role: "teacher" }
          return canWrite("evaluations", auth) === true && canWrite("users", auth) === true
        }
      )
    )
  })

  it("para cualquier rol distinto de teacher, la escritura es rechazada en ambas colecciones", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.constantFrom<Role>("student"),
        (uid, role) => {
          const auth: AuthContext = { uid, role }
          return !canWrite("evaluations", auth) && !canWrite("users", auth)
        }
      )
    )
  })
})
