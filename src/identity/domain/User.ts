export type Role = "student" | "teacher"

export type {
  AvatarClass,
  LegacyAvatarClass,
  PlayableAvatarClass,
} from "./avatarClasses"
import type { AvatarClass } from "./avatarClasses"

export class User {
  constructor(
    readonly uid: string,
    readonly email: string,
    readonly role: Role,
    readonly avatarClass: AvatarClass | null
  ) {}
}
