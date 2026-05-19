// MemoryAI: 履歴から最頻手を読んでカウンターを返すか、履歴なしのときに fall back するか検証する。

import { describe, expect, it } from 'vitest'
import { MemoryAI } from './MemoryAI'
import type { AIRandomSource, OpponentMove } from './types'

const fixed = (values: number[]): AIRandomSource => {
  let i = 0
  return { next: () => values[i++ % values.length] }
}

describe('MemoryAI', () => {
  it('difficulty は hard', () => {
    expect(new MemoryAI().difficulty).toBe('hard')
  })

  describe('chooseHand', () => {
    it('履歴 0 件 → RandomAI に fall back (r=0.0 で rock)', () => {
      const ai = new MemoryAI(fixed([0.0]))
      expect(ai.chooseHand('classic_rps', [])).toBe('rock')
    })

    it('履歴 undefined でも fall back', () => {
      const ai = new MemoryAI(fixed([0.0]))
      expect(ai.chooseHand('classic_rps')).toBe('rock')
    })

    it('履歴 1 件 (< MEMORY_WINDOW) → RandomAI と同じ結果 (r=0.5 で paper)', () => {
      // RandomAI: floor(0.5 * 3) = 1 → HANDS_3[1] = 'paper'
      const ai = new MemoryAI(fixed([0.5]))
      expect(ai.chooseHand('classic_rps', [{ hand: 'rock' }])).toBe('paper')
    })

    it('履歴 4 件 (< MEMORY_WINDOW) でも RandomAI に委譲 (paper 連打でも読まない)', () => {
      // 真面目に読めば paper → scissors が返るはずだが、サンプルが薄いので fall back
      const ai = new MemoryAI(fixed([0.5]))
      const history: OpponentMove[] = [
        { hand: 'paper' },
        { hand: 'paper' },
        { hand: 'paper' },
        { hand: 'paper' },
      ]
      expect(ai.chooseHand('classic_rps', history)).toBe('paper')
    })

    it('[rock,rock,rock,rock,rock] → paper を返す', () => {
      const history: OpponentMove[] = [
        { hand: 'rock' },
        { hand: 'rock' },
        { hand: 'rock' },
        { hand: 'rock' },
        { hand: 'rock' },
      ]
      expect(new MemoryAI().chooseHand('classic_rps', history)).toBe('paper')
    })

    it('[scissors,scissors,scissors,paper,paper] → 最頻 scissors → rock', () => {
      const history: OpponentMove[] = [
        { hand: 'scissors' },
        { hand: 'scissors' },
        { hand: 'scissors' },
        { hand: 'paper' },
        { hand: 'paper' },
      ]
      expect(new MemoryAI().chooseHand('classic_rps', history)).toBe('rock')
    })

    it('履歴 5 件超でも直近 5 件だけ見る', () => {
      const history: OpponentMove[] = [
        { hand: 'paper' },
        { hand: 'paper' },
        { hand: 'paper' },
        { hand: 'rock' },
        { hand: 'rock' },
        { hand: 'rock' },
        { hand: 'rock' },
        { hand: 'rock' },
      ]
      // 直近 5 = [paper, rock, rock, rock, rock] → 最頻 rock → paper
      expect(new MemoryAI().chooseHand('classic_rps', history)).toBe('paper')
    })

    it('ido_janken: 相手 well 連発 → paper を返す', () => {
      const history: OpponentMove[] = [
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
      ]
      expect(new MemoryAI().chooseHand('ido_janken', history)).toBe('paper')
    })

    it('opponent が well を連発した場合のカウンター手 (COUNTER["well"]="paper")', () => {
      // ido_janken で相手が well を 5 連発したとき、最頻 well → COUNTER["well"] = "paper"。
      // classic_rps では well 自体が発生しないが、テーブルの値域には well が含まれないので
      // 追加の fall back は不要 (常に rock/paper/scissors が返る)。
      const history: OpponentMove[] = [
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
      ]
      expect(new MemoryAI().chooseHand('ido_janken', history)).toBe('paper')
    })
  })

  describe('chooseDirection', () => {
    it('履歴 0 件 → fall back (r=0.0 で up)', () => {
      const ai = new MemoryAI(fixed([0.0]))
      expect(ai.chooseDirection([])).toBe('up')
    })

    it('最頻方向を返す', () => {
      const history: OpponentMove[] = [
        { direction: 'left' },
        { direction: 'left' },
        { direction: 'left' },
        { direction: 'up' },
        { direction: 'down' },
      ]
      expect(new MemoryAI().chooseDirection(history)).toBe('left')
    })
  })

  describe('reset', () => {
    it('reset() は例外なく呼べる', () => {
      const ai = new MemoryAI()
      expect(() => ai.reset()).not.toThrow()
    })
  })
})
