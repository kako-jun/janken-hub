// Classic RPS 判定の全 9 パターンを網羅 (Issue #7)。
//
// 表でまとめると見落としやすいので、勝/負/分の 3 ブロックに分けてベタ書きで検証する。

import { describe, expect, it } from 'vitest'
import { judgeClassicRps } from './classic_rps'

describe('judgeClassicRps (Issue #7)', () => {
  describe('draw (同じ手)', () => {
    it('rock vs rock → draw', () => {
      expect(judgeClassicRps('rock', 'rock')).toBe('draw')
    })
    it('paper vs paper → draw', () => {
      expect(judgeClassicRps('paper', 'paper')).toBe('draw')
    })
    it('scissors vs scissors → draw', () => {
      expect(judgeClassicRps('scissors', 'scissors')).toBe('draw')
    })
  })

  describe('win (p1 勝ち)', () => {
    it('rock vs scissors → win', () => {
      expect(judgeClassicRps('rock', 'scissors')).toBe('win')
    })
    it('scissors vs paper → win', () => {
      expect(judgeClassicRps('scissors', 'paper')).toBe('win')
    })
    it('paper vs rock → win', () => {
      expect(judgeClassicRps('paper', 'rock')).toBe('win')
    })
  })

  describe('lose (p1 負け)', () => {
    it('scissors vs rock → lose', () => {
      expect(judgeClassicRps('scissors', 'rock')).toBe('lose')
    })
    it('paper vs scissors → lose', () => {
      expect(judgeClassicRps('paper', 'scissors')).toBe('lose')
    })
    it('rock vs paper → lose', () => {
      expect(judgeClassicRps('rock', 'paper')).toBe('lose')
    })
  })
})
