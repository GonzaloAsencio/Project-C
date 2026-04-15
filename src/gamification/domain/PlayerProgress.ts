import { LevelUpEvent } from "./events"

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
    this.xp = Math.min(this.xp + amount, 960)
    this.level = Math.floor(this.xp / 100) + 1
    return this.level > prevLevel ? new LevelUpEvent(this.uid, this.level) : null
  }
}
