import { EvaluationApprovedEvent } from "./events"

export type EvaluationStatus = "Victory" | "Defeat" | "Pending"

export class Evaluation {
  constructor(
    readonly id: string,
    readonly studentUid: string,
    readonly type: "TP" | "Parcial",
    readonly index: number,
    public status: EvaluationStatus,
    public score: number
  ) {}

  approve(score: number): EvaluationApprovedEvent {
    this.status = "Victory"
    this.score = score
    return new EvaluationApprovedEvent(this.studentUid, this.type, this.index, score)
  }
}
