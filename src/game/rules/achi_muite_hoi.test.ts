// Achi Muite Hoi 方向判定の全 16 ペア (4x4) を網羅 (Issue #9)。
//
// 一致 4 件 → 'win', 不一致 12 件 → 'lose' を table-driven で確認する。

import { describe, expect, it } from 'vitest'
import { judgeAchiPhase } from './achi_muite_hoi'
import type { Direction, RoundResult } from '../types'

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

describe('judgeAchiPhase (Issue #9)', () => {
  // 全 16 ペアを table-driven で生成。
  // expected は attacker===defender なら 'win', それ以外 'lose'。
  const cases: {
    attacker: Direction
    defender: Direction
    expected: RoundResult
  }[] = DIRECTIONS.flatMap(a =>
    DIRECTIONS.map(d => ({
      attacker: a,
      defender: d,
      expected: (a === d ? 'win' : 'lose') as RoundResult,
    }))
  )

  for (const c of cases) {
    it(`attacker=${c.attacker} vs defender=${c.defender} → ${c.expected}`, () => {
      expect(judgeAchiPhase(c.attacker, c.defender)).toBe(c.expected)
    })
  }

  it('一致は 4 件 (= 方向数) / 不一致は 12 件', () => {
    const wins = cases.filter(c => c.expected === 'win')
    const loses = cases.filter(c => c.expected === 'lose')
    expect(wins).toHaveLength(4)
    expect(loses).toHaveLength(12)
  })
})
