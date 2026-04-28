import { EvaluationApprovedEvent } from "./events"

export type EvaluationStatus = "Victory" | "Defeat" | "Pending" | "Waiting"

export class Evaluation {
  readonly id: string
  readonly studentUid: string
  readonly type: "TP" | "Parcial"
  readonly index: number
  public status: EvaluationStatus
  public score: number

  constructor(
    id: string,
    studentUid: string,
    type: "TP" | "Parcial",
    index: number,
    status: EvaluationStatus,
    score: number
  ) {
    this.id = id
    this.studentUid = studentUid
    this.type = type
    this.index = index
    this.status = status
    this.score = score
  }

  approve(score: number): EvaluationApprovedEvent {
    this.status = "Victory"
    this.score = score
    return new EvaluationApprovedEvent(this.studentUid, this.type, this.index, score)
  }
}
