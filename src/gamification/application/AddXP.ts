import type { EventBus } from "../../shared/EventBus"
import type { FirestoreProgressRepo } from "../infrastructure/FirestoreProgressRepo"

interface EvaluationApprovedPayload {
  evalId: string
  studentUid: string
  xpReward: number
}

export class AddXP {
  private progressRepo: FirestoreProgressRepo
  private eventBus: EventBus
  private readonly processedEvalIds = new Set<string>()

  constructor(progressRepo: FirestoreProgressRepo, eventBus: EventBus) {
    this.progressRepo = progressRepo
    this.eventBus = eventBus
    this.eventBus.on<EvaluationApprovedPayload>(
      "EvaluationApproved",
      this.handleEvaluationApproved.bind(this)
    )
  }

  private async handleEvaluationApproved(payload: EvaluationApprovedPayload): Promise<void> {
    // Idempotency: skip if already processed
    if (this.processedEvalIds.has(payload.evalId)) return

    this.processedEvalIds.add(payload.evalId)

    const progress = await this.progressRepo.getProgress(payload.studentUid)
    progress.addXP(payload.xpReward)
    await this.progressRepo.saveProgress(progress)
  }

  /** Manually add XP to a student (e.g. for class attendance) */
  async execute(studentUid: string, amount: number): Promise<void> {
    const progress = await this.progressRepo.getProgress(studentUid)
    progress.addXP(amount)
    await this.progressRepo.saveProgress(progress)
  }
}
