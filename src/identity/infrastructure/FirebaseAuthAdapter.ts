import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../../shared/firebase"
import { User } from "../domain/User"
import type { Role, AvatarClass } from "../domain/User"

const AVATAR_CLASSES: AvatarClass[] = ["Sword", "Axe", "Dagger", "Bow", "Magic"]

export class FirebaseAuthAdapter {
  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid
    const userDoc = await getDoc(doc(db, "users", uid))
    if (!userDoc.exists()) {
      throw Object.assign(new Error("User document not found"), { code: "auth/user-doc-missing" })
    }
    const data = userDoc.data() as { role: Role; avatarClass: AvatarClass }
    return new User(uid, email, data.role, data.avatarClass)
  }

  async register(
    email: string,
    password: string,
    displayName: string,
    role: Role,
    avatarClass?: AvatarClass
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid
    const chosenAvatar = avatarClass ?? AVATAR_CLASSES[Math.floor(Math.random() * AVATAR_CLASSES.length)]
    const userDoc = {
      displayName,
      email,
      role,
      avatarClass: chosenAvatar,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gradesSummary: {},
    }
    await setDoc(doc(db, "users", uid), userDoc)
    return new User(uid, email, role, chosenAvatar)
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
      const data = userDoc.data() as { role: Role; avatarClass: AvatarClass }
      callback(new User(firebaseUser.uid, firebaseUser.email ?? "", data.role, data.avatarClass))
    })
  }
}
