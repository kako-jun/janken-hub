// Normal 難易度: 出現確率に偏り (affinity) を持たせた NPC (Issue #6)。
// キャラごとの「推し手」を尊重しつつ、完全ループに陥らないよう他の手も一定確率で混ぜる。

import type { Direction, GameRuleType, Hand, IdoHand } from '../types'
import { AIRandomSource, NpcAI, OpponentMove, defaultRandom } from './types'

const HANDS_3: Hand[] = ['rock', 'paper', 'scissors']
const DIRS: Direction[] = ['up', 'down', 'left', 'right']

/**
 * 重み配列から index を引く。
 * weights は合計 1.0 前後を想定 (内部で正規化する)。
 */
const pickWeighted = (random: AIRandomSource, weights: number[]): number => {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = random.next() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return i
  }
  return weights.length - 1
}

export class WeightedAI implements NpcAI {
  readonly difficulty = 'normal' as const
  private readonly affinity: 'rock' | 'paper' | 'scissors'
  private readonly random: AIRandomSource

  constructor(
    affinity: 'rock' | 'paper' | 'scissors' = 'rock',
    random: AIRandomSource = defaultRandom
  ) {
    this.affinity = affinity
    this.random = random
  }

  private hand3Weights(): number[] {
    // 基本 rock 35 / paper 33 / scissors 32 をベースに、affinity に +15、他は均等に -7.5
    const base: Record<Hand, number> = {
      rock: 0.35,
      paper: 0.33,
      scissors: 0.32,
    }
    const w: number[] = []
    for (const h of HANDS_3) {
      if (h === this.affinity) w.push(base[h] + 0.15)
      else w.push(base[h] - 0.075)
    }
    return w
  }

  chooseHand(
    rule: GameRuleType,
    _opponentHistory?: OpponentMove[]
  ): Hand | IdoHand {
    void _opponentHistory
    if (rule === 'ido_janken') {
      // well は 20% 固定、残り 80% を 3 手の重み付き分配で割り当てる
      const wellProb = 0.2
      if (this.random.next() < wellProb) return 'well'
      const idx = pickWeighted(this.random, this.hand3Weights())
      return HANDS_3[idx]
    }
    const idx = pickWeighted(this.random, this.hand3Weights())
    return HANDS_3[idx]
  }

  chooseDirection(_opponentHistory?: OpponentMove[]): Direction {
    void _opponentHistory
    // 方向は affinity と無関係なので等確率
    const idx = Math.floor(this.random.next() * DIRS.length)
    return DIRS[Math.min(idx, DIRS.length - 1)]
  }
}
