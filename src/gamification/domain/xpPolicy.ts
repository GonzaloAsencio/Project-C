export type XPEvalType = "TP" | "Parcial"

export interface XPEvalDescriptor {
  key: string
  type: XPEvalType
}

const EVAL_TYPE_WEIGHTS: Record<XPEvalType, number> = {
  TP: 7,
  Parcial: 20,
}

export const MAX_XP = 1000
export const MAX_LEVEL = 10
export const ATTENDANCE_SESSION_TARGET = 14
export const ATTENDANCE_XP_BUDGET = 280
export const ATTENDANCE_XP_REWARD = Math.floor(ATTENDANCE_XP_BUDGET / ATTENDANCE_SESSION_TARGET)
export const EVALUATION_XP_BUDGET = MAX_XP - ATTENDANCE_XP_BUDGET

interface EvalRewardDraft {
  key: string
  floorReward: number
  fraction: number
}

export function buildEvaluationXPRewards(evaluations: XPEvalDescriptor[]): Record<string, number> {
  if (evaluations.length === 0) return {}

  const weightedTotal = evaluations.reduce((sum, evalItem) => sum + EVAL_TYPE_WEIGHTS[evalItem.type], 0)
  if (weightedTotal <= 0) return {}

  const drafts: EvalRewardDraft[] = evaluations.map((evalItem) => {
    const rawReward = (EVALUATION_XP_BUDGET * EVAL_TYPE_WEIGHTS[evalItem.type]) / weightedTotal
    const floorReward = Math.floor(rawReward)
    return {
      key: evalItem.key,
      floorReward,
      fraction: rawReward - floorReward,
    }
  })

  const rewards: Record<string, number> = {}
  for (const draft of drafts) rewards[draft.key] = draft.floorReward

  const usedBudget = drafts.reduce((sum, draft) => sum + draft.floorReward, 0)
  let remainingBudget = EVALUATION_XP_BUDGET - usedBudget

  if (remainingBudget > 0) {
    const orderedByFraction = [...drafts].sort((a, b) => {
      if (b.fraction !== a.fraction) return b.fraction - a.fraction
      return a.key.localeCompare(b.key)
    })

    let idx = 0
    while (remainingBudget > 0 && orderedByFraction.length > 0) {
      const target = orderedByFraction[idx % orderedByFraction.length]
      rewards[target.key] = (rewards[target.key] ?? 0) + 1
      remainingBudget -= 1
      idx += 1
    }
  }

  return rewards
}
