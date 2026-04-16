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
    console.log('[AddXP] Received EvaluationApproved:', payload)
    
    // Idempotency: skip if already processed
    if (this.processedEvalIds.has(payload.evalId)) {
      console.log('[AddXP] Already processed, skipping:', payload.evalId)
      return
    }

    this.processedEvalIds.add(payload.evalId)

    try {
      const progress = await this.progressRepo.getProgress(payload.studentUid)
      console.log('[AddXP] Current progress:', { uid: progress.uid, xp: progress.xp, level: progress.level })
      
      progress.addXP(payload.xpReward)
      console.log('[AddXP] After adding XP:', { uid: progress.uid, xp: progress.xp, level: progress.level, reward: payload.xpReward })
      
      await this.progressRepo.saveProgress(progress)
      console.log('[AddXP] Progress saved successfully')
    } catch (error) {
      console.error('[AddXP] Error processing event:', error)
      throw error
    }
  }

  /** Manually add XP to a student (e.g. for class attendance) */
  async execute(studentUid: string, amount: number): Promise<void> {
    const progress = await this.progressRepo.getProgress(studentUid)
    progress.addXP(amount)
    await this.progressRepo.saveProgress(progress)
  }
}
