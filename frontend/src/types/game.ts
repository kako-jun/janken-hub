// じゃんけんの手（基本3種）
export type Hand = 'rock' | 'paper' | 'scissors'

// 井戸じゃんけん用
export type IdoHand = Hand | 'well'

// あっちむいてホイの方向
export type Direction = 'up' | 'down' | 'left' | 'right'

// じゃんけんの結果
export type GameResult = 'win' | 'lose' | 'draw'

// ゲームルールタイプ
export type GameRuleType =
  | 'classic_rps'
  | 'achi_muite_hoi'
  | 'ido_janken'
  | 'limited_janken'
  | 'arcade_coin'
  | 'glico_game'
  | 'tournament'

// プレイヤー
export interface Player {
  id: string
  name: string
  isNPC: boolean
  hand?: Hand | IdoHand
  direction?: Direction // あっちむいてホイ用
}

// ゲームセッション
export interface GameSession {
  id: string
  ruleType: GameRuleType
  player1: Player
  player2: Player
  currentRound: number
  result?: GameResult
  score: {
    player1: number
    player2: number
  }
  createdAt: string
}

// プレイヤー統計
export interface PlayerStats {
  wins: number
  losses: number
  draws: number
  totalGames: number
  winRate: number
}

// 階段ゲーム用
export interface GlicoGameState {
  player1Position: number
  player2Position: number
  goalPosition: number // デフォルト30
}

// コインゲーム用
export interface CoinGameState {
  player1Coins: number
  player2Coins: number
  targetCoins: number
}

// 限定じゃんけん用
export interface LimitedJankenState {
  player1Remaining: {
    rock: number
    paper: number
    scissors: number
  }
  player2Remaining: {
    rock: number
    paper: number
    scissors: number
  }
}
