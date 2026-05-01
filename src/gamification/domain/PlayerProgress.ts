import { LevelUpEvent } from "./events"
import { MAX_LEVEL, MAX_XP } from "./xpPolicy"

export class PlayerProgress {
  readonly uid: string
  xp: number
  level: number

  constructor(uid: string, xp: number, level: number) {
    this.uid = uid
    this.xp = xp
    this.level = level
  }

  addXP(amount: number): LevelUpEvent | null {
    const prevLevel = this.level
    this.xp = Math.min(this.xp + amount, MAX_XP)
    this.level = Math.min(MAX_LEVEL, Math.floor(this.xp / 100) + 1)
    return this.level > prevLevel ? new LevelUpEvent(this.uid, this.level) : null
  }
}
