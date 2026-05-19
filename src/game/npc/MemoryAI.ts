// Hard 難易度: 直近 N 手の opponent 履歴から最頻手を読んでカウンターを返す NPC (Issue #6)。
// 履歴が足りないときは RandomAI に委譲して無理に決め打ちしない。

import type { Direction, GameRuleType, Hand, IdoHand } from '../types'
import { RandomAI } from './RandomAI'
import { AIRandomSource, NpcAI, OpponentMove, defaultRandom } from './types'

const MEMORY_WINDOW = 5

/**
 * ido_janken も含めた「相手の手 → こちらが出すべき勝ち手」テーブル。
 * 通常じゃんけん: rock < paper < scissors < rock
 * 井戸の追加ルール: well は rock/scissors に勝ち、paper に負ける。
 *   なので相手が well を出してくるなら paper を返す。
 */
const COUNTER: Record<Hand | IdoHand, Hand | IdoHand> = {
  rock: 'paper',
  paper: 'scissors',
  scissors: 'rock',
  well: 'paper',
}

export class MemoryAI implements NpcAI {
  readonly difficulty = 'hard' as const
  private readonly fallback: RandomAI

  constructor(random: AIRandomSource = defaultRandom) {
    this.fallback = new RandomAI(random)
  }

  reset(): void {
    // 履歴は呼び出し側から渡る設計なので内部状態は持たない。
    // 将来内部統計を持たせる場合の hook として残す。
  }

  chooseHand(
    rule: GameRuleType,
    opponentHistory?: OpponentMove[]
  ): Hand | IdoHand {
    const recent = (opponentHistory ?? [])
      .slice(-MEMORY_WINDOW)
      .map(m => m.hand)
      .filter((h): h is Hand | IdoHand => Boolean(h))

    if (recent.length === 0) return this.fallback.chooseHand(rule)

    const counts = new Map<Hand | IdoHand, number>()
    for (const h of recent) counts.set(h, (counts.get(h) ?? 0) + 1)

    // 最頻手 (tie のときは最初に見つかった方を優先)
    let topHand: Hand | IdoHand | undefined
    let topCount = -1
    for (const [h, c] of counts) {
      if (c > topCount) {
        topCount = c
        topHand = h
      }
    }
    if (!topHand) return this.fallback.chooseHand(rule)

    const counter = COUNTER[topHand]
    // classic_rps では well は出せないので fall back
    if (rule !== 'ido_janken' && counter === 'well') {
      return this.fallback.chooseHand(rule)
    }
    return counter
  }

  chooseDirection(opponentHistory?: OpponentMove[]): Direction {
    const recent = (opponentHistory ?? [])
      .slice(-MEMORY_WINDOW)
      .map(m => m.direction)
      .filter((d): d is Direction => Boolean(d))

    if (recent.length === 0) return this.fallback.chooseDirection()

    const counts = new Map<Direction, number>()
    for (const d of recent) counts.set(d, (counts.get(d) ?? 0) + 1)

    let topDir: Direction | undefined
    let topCount = -1
    for (const [d, c] of counts) {
      if (c > topCount) {
        topCount = c
        topDir = d
      }
    }
    return topDir ?? this.fallback.chooseDirection()
  }
}
