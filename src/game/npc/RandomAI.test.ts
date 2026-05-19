// RandomAI: 乱数を DI で固定して、各レンジが期待する手 / 方向にマップされるか検証する。

import { describe, expect, it } from 'vitest'
import { RandomAI } from './RandomAI'
import type { AIRandomSource } from './types'

const fixed = (values: number[]): AIRandomSource => {
  let i = 0
  return { next: () => values[i++ % values.length] }
}

describe('RandomAI', () => {
  it('difficulty は easy', () => {
    expect(new RandomAI().difficulty).toBe('easy')
  })

  describe('chooseHand (classic_rps = 3 手)', () => {
    it('r=0.0 → rock', () => {
      expect(new RandomAI(fixed([0.0])).chooseHand('classic_rps')).toBe('rock')
    })
    it('r=0.4 → paper', () => {
      expect(new RandomAI(fixed([0.4])).chooseHand('classic_rps')).toBe('paper')
    })
    it('r=0.8 → scissors', () => {
      expect(new RandomAI(fixed([0.8])).chooseHand('classic_rps')).toBe(
        'scissors'
      )
    })
    it('r=0.9999 でも index 範囲外にならない (clamp)', () => {
      expect(new RandomAI(fixed([0.9999])).chooseHand('classic_rps')).toBe(
        'scissors'
      )
    })
  })

  describe('chooseHand (ido_janken = 4 手)', () => {
    it('r=0.0 → rock', () => {
      expect(new RandomAI(fixed([0.0])).chooseHand('ido_janken')).toBe('rock')
    })
    it('r=0.3 → paper', () => {
      expect(new RandomAI(fixed([0.3])).chooseHand('ido_janken')).toBe('paper')
    })
    it('r=0.6 → scissors', () => {
      expect(new RandomAI(fixed([0.6])).chooseHand('ido_janken')).toBe(
        'scissors'
      )
    })
    it('r=0.8 → well', () => {
      expect(new RandomAI(fixed([0.8])).chooseHand('ido_janken')).toBe('well')
    })
  })

  describe('chooseDirection', () => {
    it('r=0.0 → up', () => {
      expect(new RandomAI(fixed([0.0])).chooseDirection()).toBe('up')
    })
    it('r=0.3 → down', () => {
      expect(new RandomAI(fixed([0.3])).chooseDirection()).toBe('down')
    })
    it('r=0.6 → left', () => {
      expect(new RandomAI(fixed([0.6])).chooseDirection()).toBe('left')
    })
    it('r=0.8 → right', () => {
      expect(new RandomAI(fixed([0.8])).chooseDirection()).toBe('right')
    })
  })

  it('1000 回サンプルしてもクラッシュせず、Math.random で動く', () => {
    const ai = new RandomAI()
    for (let i = 0; i < 1000; i++) {
      ai.chooseHand('classic_rps')
      ai.chooseHand('ido_janken')
      ai.chooseDirection()
    }
  })
})
