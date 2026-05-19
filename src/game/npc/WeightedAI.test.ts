// WeightedAI: affinity に応じた偏りが統計的に出るか、ido_janken の well 確率が ~20% か検証する。
// 乱数源は seeded LCG で stable に。

import { describe, expect, it } from 'vitest'
import { WeightedAI } from './WeightedAI'
import type { AIRandomSource } from './types'

/** 簡易 mulberry32。テスト間で安定した分布を出すために使う。 */
const seeded = (seed: number): AIRandomSource => {
  let s = seed >>> 0
  return {
    next: () => {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

describe('WeightedAI', () => {
  it('difficulty は normal', () => {
    expect(new WeightedAI('rock').difficulty).toBe('normal')
  })

  describe('classic_rps で affinity の手が偏る', () => {
    it('rock affinity → rock が 40% 以上 (N=2000, seed 固定)', () => {
      const ai = new WeightedAI('rock', seeded(42))
      const counts = { rock: 0, paper: 0, scissors: 0, well: 0 }
      for (let i = 0; i < 2000; i++) {
        const h = ai.chooseHand('classic_rps')
        counts[h] += 1
      }
      expect(counts.well).toBe(0)
      expect(counts.rock / 2000).toBeGreaterThan(0.4)
      // 他の手も最低限出る (完全 rock ループにならない)
      expect(counts.paper).toBeGreaterThan(100)
      expect(counts.scissors).toBeGreaterThan(100)
    })

    it('paper affinity → paper が rock/scissors より多い', () => {
      const ai = new WeightedAI('paper', seeded(7))
      const counts = { rock: 0, paper: 0, scissors: 0, well: 0 }
      for (let i = 0; i < 2000; i++) {
        const h = ai.chooseHand('classic_rps')
        counts[h] += 1
      }
      expect(counts.paper).toBeGreaterThan(counts.rock)
      expect(counts.paper).toBeGreaterThan(counts.scissors)
    })
  })

  describe('ido_janken で well が ~20% 程度', () => {
    it('well の出現率が 15%〜25% の範囲に入る (N=2000, seed 固定)', () => {
      const ai = new WeightedAI('rock', seeded(123))
      let wellCount = 0
      for (let i = 0; i < 2000; i++) {
        if (ai.chooseHand('ido_janken') === 'well') wellCount += 1
      }
      const ratio = wellCount / 2000
      expect(ratio).toBeGreaterThan(0.15)
      expect(ratio).toBeLessThan(0.25)
    })
  })

  describe('chooseDirection は方向を返す', () => {
    it('4 方向のいずれか', () => {
      const ai = new WeightedAI('rock', seeded(99))
      const seen = new Set<string>()
      for (let i = 0; i < 100; i++) seen.add(ai.chooseDirection())
      // 100 回も振れば 4 方向すべて出るはず
      expect(seen.size).toBe(4)
    })
  })
})
