export class XPAddedEvent {
  readonly type = "XPAdded"
  readonly uid: string
  readonly amount: number
  readonly newXP: number

  constructor(uid: string, amount: number, newXP: number) {
    this.uid = uid
    this.amount = amount
    this.newXP = newXP
  }
}

export class LevelUpEvent {
  readonly type = "LevelUp"
  readonly uid: string
  readonly newLevel: number

  constructor(uid: string, newLevel: number) {
    this.uid = uid
    this.newLevel = newLevel
  }
}
