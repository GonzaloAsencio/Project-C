export type Role = "student" | "teacher"

export type AvatarClass = "Sword" | "Axe" | "Dagger" | "Bow" | "Magic"

export class User {
  constructor(
    readonly uid: string,
    readonly email: string,
    readonly role: Role,
    readonly avatarClass: AvatarClass
  ) {}
}
