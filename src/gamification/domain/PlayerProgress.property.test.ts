import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { PlayerProgress } from './PlayerProgress'

/**
 * Property 1: Invariante de rango XP
 * Validates: Requirements 3.2, 3.3
 *
 * Para cualquier secuencia de addXP(amount) con amount >= 0,
 * xp siempre ∈ [0, 960]
 */
describe('PlayerProgress - Property 1: Invariante de rango XP', () => {
  it('xp siempre está en [0, 960] tras cualquier secuencia de addXP con amount >= 0', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 10000 })),
        (amounts) => {
          const player = new PlayerProgress('test-uid', 0, 1)
          for (const amount of amounts) {
            player.addXP(amount)
            if (player.xp < 0 || player.xp > 960) return false
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
 * Para cualquier xp ∈ [0, 960],
 * level = Math.floor(xp / 100) + 1 ∈ [1, 10]
 */
describe('PlayerProgress - Property 2: Consistencia nivel–XP', () => {
  it('para cualquier xp en [0,960], el nivel calculado coincide con la fórmula y cae en [1,10]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 960 }),
        (xp) => {
          const player = new PlayerProgress('test-uid', xp, 1)
          player.addXP(0)

          const expectedLevel = Math.floor(player.xp / 100) + 1
          return (
            player.level === expectedLevel &&
            player.level >= 1 &&
            player.level <= 10
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
 * TP → +70, Parcial → +200, Asistencia → +20 (sujeto al cap)
 */
describe('PlayerProgress - Property 3: XP correcto por tipo de actividad', () => {
  it('aplica el XP correcto por actividad y respeta el cap de 960', () => {
    const xpByActivity = {
      TP: 70,
      Parcial: 200,
      Asistencia: 20,
    } as const

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 960 }),
        fc.constantFrom<'TP' | 'Parcial' | 'Asistencia'>('TP', 'Parcial', 'Asistencia'),
        (initialXp, activityType) => {
          const initialLevel = Math.floor(initialXp / 100) + 1
          const player = new PlayerProgress('test-uid', initialXp, initialLevel)

          const amount = xpByActivity[activityType]
          const expectedXP = Math.min(initialXp + amount, 960)

          player.addXP(amount)

          return player.xp === expectedXP
        }
      )
    )
  })
})
