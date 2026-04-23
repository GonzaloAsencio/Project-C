import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  deleteUser,
  getAuth,
} from "firebase/auth"
import { getApps, initializeApp } from "firebase/app"
import { doc, getDoc, writeBatch } from "firebase/firestore"
import { app, auth, db } from "../../shared/firebase"
import { User } from "../domain/User"
import type { Role, AvatarClass } from "../domain/User"
import { PLAYABLE_AVATAR_CLASSES } from "../domain/avatarClasses"

const SECONDARY_APP_NAME = "project-c-teacher-creator"

// Evaluation seed config
const EVAL_SEED = [
  { key: "tp1",      type: "TP",      index: 1 },
  { key: "tp2",      type: "TP",      index: 2 },
  { key: "parcial1", type: "Parcial", index: 1 },
  { key: "parcial2", type: "Parcial", index: 2 },
] as const

function getSecondaryAuth() {
  const appInstance = getApps().find((a) => a.name === SECONDARY_APP_NAME) ?? initializeApp(app.options, SECONDARY_APP_NAME)
  return getAuth(appInstance)
}

function toUser(docData: unknown, uid: string, fallbackEmail: string): User {
  const data = (docData ?? {}) as { role?: Role; avatarClass?: AvatarClass | null; email?: string }
  if (!data.role) {
    throw Object.assign(new Error("User role not found"), { code: "auth/user-doc-invalid" })
  }
  return new User(uid, data.email ?? fallbackEmail, data.role, data.avatarClass ?? null)
}

export class FirebaseAuthAdapter {
  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid
    const userDoc = await getDoc(doc(db, "users", uid))
    if (!userDoc.exists()) {
      throw Object.assign(new Error("User document not found"), { code: "auth/user-doc-missing" })
    }
    return toUser(userDoc.data(), uid, email)
  }

  async registerTeacher(email: string, password: string, displayName: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid

    const batch = writeBatch(db)

    // Create user document
    batch.set(doc(db, "users", uid), {
      displayName,
      email,
      role: "teacher",
      avatarClass: null,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gradesSummary: {},
      processedEvalIds: [],
    })

    await batch.commit()
    return new User(uid, email, "teacher", null)
  }

  async createStudentByTeacher(input: {
    displayName: string
    email: string
    password: string
  }): Promise<{ uid: string }> {
    const secondaryAuth = getSecondaryAuth()
    const { displayName, email, password } = input

    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const uid = credential.user.uid

    const batch = writeBatch(db)
    batch.set(doc(db, "users", uid), {
      displayName,
      email,
      role: "student",
      avatarClass: null,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gradesSummary: {},
      processedEvalIds: [],
    })

    for (const ev of EVAL_SEED) {
      batch.set(doc(db, "evaluations", `${uid}_${ev.key}`), {
        studentUid: uid,
        type: ev.type,
        index: ev.index,
        status: "Pending",
        score: 0,
      })
    }

    try {
      await batch.commit()
    } catch (error) {
      try {
        await deleteUser(credential.user)
      } catch {
        // If cleanup fails, the teacher can recreate Firestore profile manually.
      }
      throw error
    } finally {
      await firebaseSignOut(secondaryAuth)
    }

    return { uid }
  }

  async completeStudentAvatarClass(uid: string, avatarClass: string): Promise<void> {
    if (!PLAYABLE_AVATAR_CLASSES.includes(avatarClass as (typeof PLAYABLE_AVATAR_CLASSES)[number])) {
      throw new Error("Invalid class selected")
    }
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      throw Object.assign(new Error("User document not found"), { code: "auth/user-doc-missing" })
    }
    const current = userSnap.data() as { avatarClass?: AvatarClass | null }
    if (current.avatarClass) return
    const batch = writeBatch(db)
    batch.update(userRef, { avatarClass })
    await batch.commit()
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth)
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null)
        return
      }
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      callback(toUser(userDoc.data(), firebaseUser.uid, firebaseUser.email ?? ""))
    })
  }
}
