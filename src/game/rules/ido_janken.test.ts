// Ido Janken 判定の全 16 ペア (4x4) を網羅 (Issue #8)。

import { describe, expect, it } from 'vitest'
import { judgeIdoJanken } from './ido_janken'
import type { IdoHand, RoundResult } from '../types'

interface Case {
  p1: IdoHand
  p2: IdoHand
  expected: RoundResult
}

const cases: Case[] = [
  // draw 4 件
  { p1: 'rock', p2: 'rock', expected: 'draw' },
  { p1: 'paper', p2: 'paper', expected: 'draw' },
  { p1: 'scissors', p2: 'scissors', expected: 'draw' },
  { p1: 'well', p2: 'well', expected: 'draw' },

  // win 6 件
  { p1: 'rock', p2: 'scissors', expected: 'win' },
  { p1: 'scissors', p2: 'paper', expected: 'win' },
  { p1: 'paper', p2: 'rock', expected: 'win' },
  { p1: 'well', p2: 'rock', expected: 'win' },
  { p1: 'well', p2: 'scissors', expected: 'win' },
  { p1: 'paper', p2: 'well', expected: 'win' },

  // lose 6 件
  { p1: 'scissors', p2: 'rock', expected: 'lose' },
  { p1: 'paper', p2: 'scissors', expected: 'lose' },
  { p1: 'rock', p2: 'paper', expected: 'lose' },
  { p1: 'rock', p2: 'well', expected: 'lose' },
  { p1: 'scissors', p2: 'well', expected: 'lose' },
  { p1: 'well', p2: 'paper', expected: 'lose' },
]

describe('judgeIdoJanken (Issue #8)', () => {
  it('全 16 ペアを網羅している', () => {
    expect(cases).toHaveLength(16)
  })

  it('期待値の内訳: draw 4 / win 6 / lose 6', () => {
    const draw = cases.filter(c => c.expected === 'draw').length
    const win = cases.filter(c => c.expected === 'win').length
    const lose = cases.filter(c => c.expected === 'lose').length
    expect(draw).toBe(4)
    expect(win).toBe(6)
    expect(lose).toBe(6)
  })

  for (const c of cases) {
    it(`${c.p1} vs ${c.p2} → ${c.expected}`, () => {
      expect(judgeIdoJanken(c.p1, c.p2)).toBe(c.expected)
    })
  }
})
