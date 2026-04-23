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

interface UserDoc {
  avatarClass?: string | null
  xp?: number
  level?: number
  xpToNextLevel?: number
  processedEvalIds?: string[]
  role?: Role
  displayName?: string
  email?: string
}

const XP_KEYS = ["xp", "level", "xpToNextLevel", "processedEvalIds"] as const
const PLAYABLE_CLASSES = ["berserker", "guerrero", "maga", "arquera", "asesina", "paladin", "sacerdote"] as const

function isTeacher(auth: AuthContext): boolean {
  return auth.role === "teacher"
}

function isPlayableAvatarClass(value: unknown): boolean {
  return typeof value === "string" && PLAYABLE_CLASSES.includes(value as (typeof PLAYABLE_CLASSES)[number])
}

function changedKeys(before: UserDoc, after: UserDoc): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  return [...keys].filter((k) => !Object.is(before[k as keyof UserDoc], after[k as keyof UserDoc]))
}

function canCreateUser(uid: string, auth: AuthContext): boolean {
  return auth.uid === uid || isTeacher(auth)
}

function canUpdateUser(uid: string, auth: AuthContext, before: UserDoc, after: UserDoc): boolean {
  if (isTeacher(auth)) return true
  if (auth.uid !== uid) return false

  const affected = changedKeys(before, after)

  const onlyXpKeys =
    affected.length > 0 &&
    affected.every((k) => (XP_KEYS as readonly string[]).includes(k))

  if (onlyXpKeys) return true

  const avatarOnly = affected.length === 1 && affected[0] === "avatarClass"
  if (!avatarOnly) return false

  const wasMissing = !("avatarClass" in before) || before.avatarClass == null
  return wasMissing && isPlayableAvatarClass(after.avatarClass)
}

describe("FirestoreRules — Property 10: Restricción de escritura por rol", () => {
  it("student solo puede crear su propio users/{uid}", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.string({ minLength: 1, maxLength: 28 }),
        (authUid, targetUid) => {
          const auth: AuthContext = { uid: authUid, role: "student" }
          return canCreateUser(targetUid, auth) === (authUid === targetUid)
        }
      )
    )
  })

  it("teacher puede crear users/{uid} de cualquier alumno", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.string({ minLength: 1, maxLength: 28 }),
        (teacherUid, targetUid) => {
          const auth: AuthContext = { uid: teacherUid, role: "teacher" }
          return canCreateUser(targetUid, auth)
        }
      )
    )
  })

  it("student puede actualizar solo campos de XP en su propio doc", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.integer({ min: 0, max: 960 }),
        fc.integer({ min: 1, max: 10 }),
        (uid, xp, level) => {
          const auth: AuthContext = { uid, role: "student" }
          const before: UserDoc = {
            avatarClass: null,
            xp: 0,
            level: 1,
            xpToNextLevel: 100,
            processedEvalIds: [],
            role: "student",
          }
          const after: UserDoc = {
            ...before,
            xp,
            level,
            xpToNextLevel: Math.max(0, level * 100 - xp),
            processedEvalIds: ["session_1"],
          }
          return canUpdateUser(uid, auth, before, after)
        }
      )
    )
  })

  it("student puede setear avatarClass una sola vez cuando es null", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.constantFrom(...PLAYABLE_CLASSES),
        (uid, avatarClass) => {
          const auth: AuthContext = { uid, role: "student" }
          const before: UserDoc = { avatarClass: null }
          const after: UserDoc = { avatarClass }
          return canUpdateUser(uid, auth, before, after)
        }
      )
    )
  })

  it("student no puede cambiar avatarClass si ya estaba definida", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.constantFrom(...PLAYABLE_CLASSES),
        fc.constantFrom(...PLAYABLE_CLASSES),
        (uid, originalClass, nextClass) => {
          const auth: AuthContext = { uid, role: "student" }
          const before: UserDoc = { avatarClass: originalClass }
          const after: UserDoc = { avatarClass: nextClass }
          return canUpdateUser(uid, auth, before, after) === false
        }
      )
    )
  })

  it("student no puede setear avatarClass invalida", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.string().filter((v) => !PLAYABLE_CLASSES.includes(v as (typeof PLAYABLE_CLASSES)[number])),
        (uid, invalidClass) => {
          const auth: AuthContext = { uid, role: "student" }
          const before: UserDoc = { avatarClass: null }
          const after: UserDoc = { avatarClass: invalidClass }
          return canUpdateUser(uid, auth, before, after) === false
        }
      )
    )
  })

  it("student no puede actualizar XP de otro users/{uid}", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.string({ minLength: 1, maxLength: 28 }).filter((v) => v.length > 0),
        fc.integer({ min: 0, max: 960 }),
        (authUid, targetUid, xp) => {
          fc.pre(authUid !== targetUid)
          const auth: AuthContext = { uid: authUid, role: "student" }
          const before: UserDoc = { xp: 0, level: 1, xpToNextLevel: 100, processedEvalIds: [] }
          const after: UserDoc = { xp, level: 1, xpToNextLevel: Math.max(0, 100 - xp), processedEvalIds: [] }
          return canUpdateUser(targetUid, auth, before, after) === false
        }
      )
    )
  })

  it("student no puede modificar avatarClass y XP en la misma operacion", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.constantFrom(...PLAYABLE_CLASSES),
        fc.integer({ min: 0, max: 960 }),
        (uid, avatarClass, xp) => {
          const auth: AuthContext = { uid, role: "student" }
          const before: UserDoc = { avatarClass: null, xp: 0, level: 1, xpToNextLevel: 100, processedEvalIds: [] }
          const after: UserDoc = {
            avatarClass,
            xp,
            level: 1,
            xpToNextLevel: Math.max(0, 100 - xp),
            processedEvalIds: ["attendance_1"],
          }
          return canUpdateUser(uid, auth, before, after) === false
        }
      )
    )
  })

  it("teacher puede actualizar cualquier campo de users", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 28 }),
        fc.string({ minLength: 1, maxLength: 28 }),
        (teacherUid, targetUid) => {
          const auth: AuthContext = { uid: teacherUid, role: "teacher" }
          const before: UserDoc = { avatarClass: null, role: "student", displayName: "A", email: "a@a.com" }
          const after: UserDoc = { avatarClass: "maga", role: "student", displayName: "B", email: "b@b.com" }
          return canUpdateUser(targetUid, auth, before, after)
        }
      )
    )
  })
})
