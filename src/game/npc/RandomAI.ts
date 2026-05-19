// Easy 難易度: 完全ランダム NPC (Issue #6)。
// 3 手 / 4 手 / 4 方向すべて等確率で選ぶ。最弱・初心者向け。

import type { Direction, GameRuleType, Hand, IdoHand } from '../types'
import { AIRandomSource, NpcAI, OpponentMove, defaultRandom } from './types'

const HANDS_3: Hand[] = ['rock', 'paper', 'scissors']
const HANDS_4: IdoHand[] = ['rock', 'paper', 'scissors', 'well']
const DIRS: Direction[] = ['up', 'down', 'left', 'right']

export class RandomAI implements NpcAI {
  readonly difficulty = 'easy' as const
  private readonly random: AIRandomSource

  constructor(random: AIRandomSource = defaultRandom) {
    this.random = random
  }

  chooseHand(
    rule: GameRuleType,
    _opponentHistory?: OpponentMove[]
  ): Hand | IdoHand {
    void _opponentHistory
    if (rule === 'ido_janken') {
      const idx = Math.floor(this.random.next() * HANDS_4.length)
      return HANDS_4[Math.min(idx, HANDS_4.length - 1)]
    }
    const idx = Math.floor(this.random.next() * HANDS_3.length)
    return HANDS_3[Math.min(idx, HANDS_3.length - 1)]
  }

  chooseDirection(_opponentHistory?: OpponentMove[]): Direction {
    void _opponentHistory
    const idx = Math.floor(this.random.next() * DIRS.length)
    return DIRS[Math.min(idx, DIRS.length - 1)]
  }
}
