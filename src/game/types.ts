// janken-hub の状態モデル (Issue #3)。
//
// React/FastAPI 版の types/game.ts (Player, GameSession 構造) を踏襲しつつ、
// PixiJS 版では「シーン外でも引き回せる純粋データ」として GameState に統合する。
// シーンは GameState を読んで描画するだけ、ルールエンジンは GameState を遷移させる役割分担。

/** じゃんけんの手 (基本3種) */
export type Hand = 'rock' | 'paper' | 'scissors'

/** 井戸じゃんけん用の手 (3種 + 井戸) */
export type IdoHand = Hand | 'well'

/** あっちむいてホイの方向 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/** ラウンドの勝敗結果 */
export type RoundResult = 'win' | 'lose' | 'draw'

/** ゲームフェーズ (シーン間で共有する大まかな進行) */
export type GamePhase = 'title' | 'rule_select' | 'playing' | 'result'

/** MVP で実装する 4 ルール */
export type GameRuleType =
  | 'classic_rps'
  | 'ido_janken'
  | 'achi_muite_hoi'
  | 'glico'

/** NPC の難易度。MVP は easy のみ実装。 */
export type NpcDifficulty = 'easy' | 'normal' | 'hard'

/** プレイヤー (人間 or NPC) の状態 */
export interface PlayerState {
  id: string
  name: string
  isNPC: boolean
  /** ラウンドで選択した手 (未選択なら undefined) */
  hand?: Hand | IdoHand
  /** あっちむいてホイで選択した方向 */
  direction?: Direction
  /** NPC の場合の難易度 */
  npcDifficulty?: NpcDifficulty
}

// --- 各ルール固有のステート ---

/** Glico (階段じゃんけん) の進行 */
export interface GlicoState {
  p1Pos: number
  p2Pos: number
  goal: number
}

/** あっちむいてホイの 2 段階フェーズ */
export interface AchiMuiteState {
  /** janken: 手を出す段階, direction: 勝者が方向で攻める段階 */
  phase: 'janken' | 'direction'
  /** 直前のじゃんけんで勝った側 (direction フェーズで攻め手を出す側) */
  attacker?: 'p1' | 'p2'
}

/** 通常じゃんけん (3 本先取など) のステート */
export interface ClassicRpsState {
  /** 先取本数 (デフォルト 3) */
  bestOf: number
}

/** 井戸じゃんけん。Classic 同様 best-of で進む */
export interface IdoJankenState {
  bestOf: number
}

/** ルール別ステートの判別共用体 */
export type RuleState =
  | { kind: 'classic_rps'; data: ClassicRpsState }
  | { kind: 'ido_janken'; data: IdoJankenState }
  | { kind: 'achi_muite_hoi'; data: AchiMuiteState }
  | { kind: 'glico'; data: GlicoState }

/** ラウンドごとのスコア (どちらが何勝したか) */
export interface Score {
  p1: number
  p2: number
}

/** ゲーム全体の状態 (シーン横断の正本) */
export interface GameState {
  phase: GamePhase
  rule: GameRuleType
  ruleState: RuleState
  player1: PlayerState
  player2: PlayerState
  score: Score
  round: number
  /** 最終結果 (player1 視点) */
  lastResult?: RoundResult
}
