// NPC モジュール公開 API (Issue #6)。
// シーン側からは createAI(difficulty, opts) で AI インスタンスを作るのが主導線。
// 個別クラスも export しておき、テストやキャラ別チューニングで直接呼べるようにする。

import type { NpcDifficulty } from '../types'
import { MemoryAI } from './MemoryAI'
import { RandomAI } from './RandomAI'
import { WeightedAI } from './WeightedAI'
import type { AIRandomSource, NpcAI } from './types'

export * from './types'
export * from './characters'
export { RandomAI } from './RandomAI'
export { WeightedAI } from './WeightedAI'
export { MemoryAI } from './MemoryAI'
export { CharacterDisplay } from './CharacterDisplay'

export const createAI = (
  difficulty: NpcDifficulty,
  opts?: { affinity?: 'rock' | 'paper' | 'scissors'; random?: AIRandomSource }
): NpcAI => {
  switch (difficulty) {
    case 'easy':
      return new RandomAI(opts?.random)
    case 'normal':
      return new WeightedAI(opts?.affinity ?? 'rock', opts?.random)
    case 'hard':
      return new MemoryAI(opts?.random)
  }
}
