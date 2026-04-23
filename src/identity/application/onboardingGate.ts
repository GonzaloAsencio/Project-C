import type { AvatarClass } from "../domain/User"

export function needsClassSelection(avatarClass: AvatarClass | null | undefined): boolean {
  return avatarClass == null
}

export function canEnterStudentPanel(avatarClass: AvatarClass | null | undefined): boolean {
  return !needsClassSelection(avatarClass)
}
