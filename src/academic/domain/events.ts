export class EvaluationApprovedEvent {
  readonly type = "EvaluationApproved"
  readonly studentUid: string
  readonly evalType: "TP" | "Parcial"
  readonly evalIndex: number
  readonly score: number
  readonly xpReward: number

  constructor(
    studentUid: string,
    evalType: "TP" | "Parcial",
    evalIndex: number,
    score: number
  ) {
    this.studentUid = studentUid
    this.evalType = evalType
    this.evalIndex = evalIndex
    this.score = score
    this.xpReward = evalType === "TP" ? 70 : 200
  }
}
