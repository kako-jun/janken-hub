// NPC モジュール公開 API (Issue #6)。
// シーン側からは createAI(difficulty, opts) で AI インスタンスを作るのが主導線。
// 個別クラスも export しておき、テストやキャラ別チューニングで直接呼べるようにする。

import type { NpcDifficulty } from '../types'
import { MemoryAI } from './MemoryAI'
import { RandomAI } from './RandomAI'
import { WeightedAI } from './WeightedAI'
import type { AIRandomSource, NpcAI, NpcCharacter } from './types'

// 注意: ここで export している `./types` は NPC AI 専用の型 (AIRandomSource / OpponentMove
// / NpcAI / NpcCharacter 等) であり、`../types` (GameState / Hand / Direction など
// game 全体共有の型) とは別物。シーン側は両方を別 import する必要がある。
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

/**
 * NpcCharacter から AI インスタンスを直接組み立てるヘルパ。
 * `createAI(c.recommendedDifficulty, { affinity: c.affinity, random })` の薄いラッパー。
 * シーン側で `const ai = createAIFromCharacter(character)` と書けば、
 * 推奨難易度 + affinity の組を毎回手で取り出さずに済む。
 */
export const createAIFromCharacter = (
  character: NpcCharacter,
  random?: AIRandomSource
): NpcAI =>
  createAI(character.recommendedDifficulty, {
    affinity: character.affinity,
    random,
  })
