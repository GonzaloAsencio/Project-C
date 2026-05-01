import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { PlayerProgress } from './PlayerProgress'
import { ATTENDANCE_XP_REWARD, MAX_LEVEL, MAX_XP, buildEvaluationXPRewards } from './xpPolicy'
import { DEFAULT_COLUMNS } from '../../shared/useEvalColumns'

/**
 * Property 1: Invariante de rango XP
 * Validates: Requirements 3.2, 3.3
 *
 * Para cualquier secuencia de addXP(amount) con amount >= 0,
 * xp siempre ∈ [0, MAX_XP]
 */
describe('PlayerProgress - Property 1: Invariante de rango XP', () => {
  it('xp siempre está en [0, MAX_XP] tras cualquier secuencia de addXP con amount >= 0', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 10000 })),
        (amounts) => {
          const player = new PlayerProgress('test-uid', 0, 1)
          for (const amount of amounts) {
            player.addXP(amount)
            if (player.xp < 0 || player.xp > MAX_XP) return false
          }
          return true
        }
      )
    )
  })
})

/**
 * Property 2: Consistencia nivel–XP
 * Validates: Requirements 3.1, 3.4, 8.3
 *
 * Para cualquier xp ∈ [0, MAX_XP],
 * level = min(MAX_LEVEL, Math.floor(xp / 100) + 1)
 */
describe('PlayerProgress - Property 2: Consistencia nivel–XP', () => {
  it('para cualquier xp en [0, MAX_XP], el nivel calculado coincide con la fórmula y cae en [1, MAX_LEVEL]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_XP }),
        (xp) => {
          const player = new PlayerProgress('test-uid', xp, 1)
          player.addXP(0)

          const expectedLevel = Math.min(MAX_LEVEL, Math.floor(player.xp / 100) + 1)
          return (
            player.level === expectedLevel &&
            player.level >= 1 &&
            player.level <= MAX_LEVEL
          )
        }
      )
    )
  })
})

/**
 * Property 3: XP correcto por tipo de actividad
 * Validates: Requirements 3.5, 3.6, 3.7
 *
 * Las recompensas dinámicas para evaluaciones y asistencia se aplican respetando el cap.
 */
describe('PlayerProgress - Property 3: XP correcto por tipo de actividad', () => {
  it('aplica recompensas válidas y respeta el cap de MAX_XP', () => {
    const rewards = buildEvaluationXPRewards(DEFAULT_COLUMNS)
    const rewardSamples = [
      rewards.tp1 ?? 0,
      rewards.tp2 ?? 0,
      rewards.parcial1 ?? 0,
      rewards.parcial2 ?? 0,
      ATTENDANCE_XP_REWARD,
    ] as const

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_XP }),
        fc.constantFrom(...rewardSamples),
        (initialXp, rewardAmount) => {
          const initialLevel = Math.floor(initialXp / 100) + 1
          const player = new PlayerProgress('test-uid', initialXp, initialLevel)

          const expectedXP = Math.min(initialXp + rewardAmount, MAX_XP)

          player.addXP(rewardAmount)

          return player.xp === expectedXP
        }
      )
    )
  })
})
