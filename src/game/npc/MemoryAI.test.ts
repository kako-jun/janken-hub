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
      ]
      expect(new MemoryAI().chooseHand('ido_janken', history)).toBe('paper')
    })

    it('classic_rps で COUNTER が well になるケースは fall back', () => {
      // classic_rps では well は出ないので、相手履歴に well が混じってもそのまま COUNTER=paper
      // (well 自体が classic では発生しないが、防御テストとして history に well を入れる)
      const history: OpponentMove[] = [
        { hand: 'well' },
        { hand: 'well' },
        { hand: 'well' },
      ]
      // 最頻 well → COUNTER=paper → classic_rps では well ではないので OK
      expect(new MemoryAI().chooseHand('classic_rps', history)).toBe('paper')
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
