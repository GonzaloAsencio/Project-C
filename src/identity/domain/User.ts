export type Role = "student" | "teacher"

export type {
  AvatarClass,
  LegacyAvatarClass,
  PlayableAvatarClass,
} from "./avatarClasses"
import type { AvatarClass } from "./avatarClasses"

export class User {
  readonly uid: string
  readonly email: string
  readonly role: Role
  readonly avatarClass: AvatarClass | null
  readonly materiaId: string | null

  constructor(
    uid: string,
    email: string,
    role: Role,
    avatarClass: AvatarClass | null,
    materiaId: string | null = null
  ) {
    this.uid = uid
    this.email = email
    this.role = role
    this.avatarClass = avatarClass
    this.materiaId = materiaId
  }
}
