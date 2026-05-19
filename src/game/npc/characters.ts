// NPC キャラクター定義 (Issue #6)。
// CLAUDE.md のキャラ名案から 6 体ピックし、affinity (推し手系統) と推奨難易度を紐付ける。
// シーン側 (RuleSelectScene 等) はこのリストから対戦相手を選ぶ。

import type { NpcCharacter } from './types'

export const NPC_CHARACTERS: NpcCharacter[] = [
  {
    id: 'julius',
    name: 'ユリウス・シザー',
    icon: '✂',
    affinity: 'scissors',
    themeColor: 0xef4444,
    recommendedDifficulty: 'easy',
  },
  {
    id: 'samurai',
    name: 'ハサミ侍',
    icon: '🗡',
    affinity: 'scissors',
    themeColor: 0xb91c1c,
    recommendedDifficulty: 'hard',
  },
  {
    id: 'rocky',
    name: 'ロッキー・バルボア',
    icon: '🥊',
    affinity: 'rock',
    themeColor: 0x78350f,
    recommendedDifficulty: 'easy',
  },
  {
    id: 'granite',
    name: 'グラニット伯爵',
    icon: '🪨',
    affinity: 'rock',
    themeColor: 0x57534e,
    recommendedDifficulty: 'normal',
  },
  {
    id: 'origami',
    name: '折り紙マスター',
    icon: '🦢',
    affinity: 'paper',
    themeColor: 0xfbbf24,
    recommendedDifficulty: 'normal',
  },
  {
    id: 'leafy',
    name: 'リーフィ',
    icon: '🍃',
    affinity: 'paper',
    themeColor: 0x22c55e,
    recommendedDifficulty: 'hard',
  },
]
