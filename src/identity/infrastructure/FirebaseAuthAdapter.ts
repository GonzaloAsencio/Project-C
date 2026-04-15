import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../shared/firebase"
import { User } from "../domain/User"
import type { Role, AvatarClass } from "../domain/User"

export class FirebaseAuthAdapter {
  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid
    const userDoc = await getDoc(doc(db, "users", uid))
    const data = userDoc.data() as { role: Role; avatarClass: AvatarClass }
    return new User(uid, email, data.role, data.avatarClass)
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
