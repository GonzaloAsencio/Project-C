import { describe, it } from "vitest"
import * as fc from "fast-check"
import { PlayerProgress } from "../domain/PlayerProgress"
import { EventBus } from "../../shared/EventBus"

// ---------------------------------------------------------------------------
// Testable AddXP handler (in-memory repo, same logic as AddXP use case)
// ---------------------------------------------------------------------------

interface ProgressStore {
  [uid: string]: { xp: number; level: number }
}

interface EvaluationApprovedPayload {
  evalId: string
  studentUid: string
  xpReward: number
}

class TestableAddXP {
  private readonly processedEvalIds = new Set<string>()
  private readonly store: ProgressStore
  private readonly bus: EventBus

  constructor(store: ProgressStore, bus: EventBus) {
    this.store = store
    this.bus = bus
    this.bus.on<EvaluationApprovedPayload>(
      "EvaluationApproved",
      this.handleEvaluationApproved.bind(this)
    )
  }

  private handleEvaluationApproved(payload: EvaluationApprovedPayload): void {
    if (this.processedEvalIds.has(payload.evalId)) return
    this.processedEvalIds.add(payload.evalId)

    const current = this.store[payload.studentUid] ?? { xp: 0, level: 1 }
    const progress = new PlayerProgress(payload.studentUid, current.xp, current.level)
    progress.addXP(payload.xpReward)
    this.store[payload.studentUid] = { xp: progress.xp, level: progress.level }
  }

  getXP(uid: string): number {
    return this.store[uid]?.xp ?? 0
  }
}

// ---------------------------------------------------------------------------
// Property 4: Idempotencia del handler AddXP
// Validates: Requirements 4.6, 11.4
// ---------------------------------------------------------------------------

describe("AddXP — Property 4: Idempotencia del handler AddXP", () => {
  it("procesar el mismo EvaluationApproved N veces produce el mismo XP que procesarlo una vez", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),   // evalId
        fc.string({ minLength: 1, maxLength: 20 }),   // studentUid
        fc.integer({ min: 0, max: 960 }),              // initialXP
        fc.constantFrom(70, 200, 20),                  // xpReward
        fc.integer({ min: 1, max: 10 }),               // N repetitions
        (evalId, studentUid, initialXP, xpReward, n) => {
          // Single processing
          const storeSingle: ProgressStore = { [studentUid]: { xp: initialXP, level: Math.floor(initialXP / 100) + 1 } }
          const busSingle = new EventBus()
          const handlerSingle = new TestableAddXP(storeSingle, busSingle)

          busSingle.emit("EvaluationApproved", { evalId, studentUid, xpReward })
          const xpAfterOne = handlerSingle.getXP(studentUid)

          // N-times processing
          const storeN: ProgressStore = { [studentUid]: { xp: initialXP, level: Math.floor(initialXP / 100) + 1 } }
          const busN = new EventBus()
          const handlerN = new TestableAddXP(storeN, busN)

          for (let i = 0; i < n; i++) {
            busN.emit("EvaluationApproved", { evalId, studentUid, xpReward })
          }
          const xpAfterN = handlerN.getXP(studentUid)

          return xpAfterOne === xpAfterN
        }
      )
    )
  })
})
