import type { User } from "../../identity/domain/User"
import type { Evaluation } from "../domain/Evaluation"
import type { FirestoreEvalRepo } from "../infrastructure/FirestoreEvalRepo"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { Role, AvatarClass } from "../../identity/domain/User"
import { User as UserEntity } from "../../identity/domain/User"

interface StudentDashboard {
  user: User
  evaluations: Evaluation[]
  combatMode: boolean
}

export class GetStudentDashboard {
  private evalRepo: FirestoreEvalRepo

  constructor(evalRepo: FirestoreEvalRepo) {
    this.evalRepo = evalRepo
  }

  async execute(uid: string): Promise<StudentDashboard> {
    const [user, evaluations] = await Promise.all([
      this._getUser(uid),
      this.evalRepo.getEvaluations(uid),
    ])

    const combatMode = evaluations.some((e) => e.status === "Pending")

    return { user, evaluations, combatMode }
  }

  private async _getUser(uid: string): Promise<User> {
    const snap = await getDoc(doc(db, "users", uid))
    const data = snap.data() as { email: string; role: Role; avatarClass?: AvatarClass | null }
    return new UserEntity(uid, data.email, data.role, data.avatarClass ?? null)
  }
}
