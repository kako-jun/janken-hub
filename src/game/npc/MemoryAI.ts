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

  /**
   * 現在は履歴を引数で受ける純粋ロジックなので内部状態は持たない。
   * 将来 MemoryAI 自体に統計 (例: 相手手の累積分布) を持たせる場合の hook として残す。
   */
  reset(): void {
    // intentionally empty; see JSDoc above.
  }

  chooseHand(
    rule: GameRuleType,
    opponentHistory?: OpponentMove[]
  ): Hand | IdoHand {
    const recent = (opponentHistory ?? [])
      .slice(-MEMORY_WINDOW)
      .map(m => m.hand)
      .filter((h): h is Hand | IdoHand => Boolean(h))

    // 履歴が MEMORY_WINDOW 未満ならサンプルが薄いので RandomAI に委譲する
    // (1〜4 件で読みを決め打ちするとブレが大きく Hard らしさが出ない)
    if (recent.length < MEMORY_WINDOW) return this.fallback.chooseHand(rule)

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

    // COUNTER テーブルの値域は rock/paper/scissors のみで well は出てこないため、
    // classic_rps でも追加 fallback は不要 (相手 well 連発でも返すのは paper)。
    return COUNTER[topHand]
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
