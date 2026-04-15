export class EvaluationApprovedEvent {
  readonly type = "EvaluationApproved"
  readonly xpReward: number

  constructor(
    readonly studentUid: string,
    readonly evalType: "TP" | "Parcial",
    readonly evalIndex: number,
    readonly score: number
  ) {
    this.xpReward = evalType === "TP" ? 70 : 200
  }
}
