// NPC AI 共通型 (Issue #6)。
// シーン/ルールエンジンから疎結合に呼べるよう、AI は GameState を直接触らず
// (rule, opponentHistory) だけを入力に「次の手 / 方向」を返す純粋ロジックとして定義する。

import type {
  Hand,
  IdoHand,
  Direction,
  GameRuleType,
  NpcDifficulty,
} from '../types'

/**
 * 0 <= r < 1 を返す乱数源。
 * 本番は Math.random だが、テストでは決定論的に差し替えるための DI 用 interface。
 */
export interface AIRandomSource {
  next(): number
}

/** デフォルト乱数源 (Math.random) */
export const defaultRandom: AIRandomSource = { next: () => Math.random() }

/** 過去ラウンドの相手の手/方向。MemoryAI はこの履歴を読んで予測する。 */
export interface OpponentMove {
  hand?: Hand | IdoHand
  direction?: Direction
}

/**
 * NPC AI の共通インターフェース。
 * 難易度ごとに RandomAI / WeightedAI / MemoryAI を実装する。
 */
export interface NpcAI {
  readonly difficulty: NpcDifficulty
  /** ルールに応じた手を選ぶ。ido_janken のときは IdoHand を返しうる。 */
  chooseHand(
    rule: GameRuleType,
    opponentHistory?: OpponentMove[]
  ): Hand | IdoHand
  /** あっちむいてホイ用の方向を選ぶ。 */
  chooseDirection(opponentHistory?: OpponentMove[]): Direction
  /** 内部状態リセット (MemoryAI 等の統計を持つ場合に使う) */
  reset?(): void
}

/** NPC キャラ定義 (見た目 + AI シード) */
export interface NpcCharacter {
  id: string
  /** 表示名 (まずは日本語単一、将来 i18n 化) */
  name: string
  /** 1〜2 文字程度 (絵文字想定) */
  icon: string
  /** 推し手系統。WeightedAI の bias シードに使う */
  affinity: 'rock' | 'paper' | 'scissors'
  /** テーマカラー (16進)。CharacterDisplay の円色 */
  themeColor: number
  /** 推奨難易度。シーン側が選ぶ参考値 */
  recommendedDifficulty: NpcDifficulty
}
