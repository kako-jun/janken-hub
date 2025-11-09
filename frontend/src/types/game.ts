// じゃんけんの手
export type Hand = 'rock' | 'paper' | 'scissors'

// じゃんけんの結果
export type GameResult = 'win' | 'lose' | 'draw'

// プレイヤー
export interface Player {
  id: string
  name: string
  hand?: Hand
}

// ゲームセッション
export interface GameSession {
  id: string
  player1: Player
  player2: Player | null
  result?: GameResult
  createdAt: string
}

// ゲーム統計
export interface PlayerStats {
  wins: number
  losses: number
  draws: number
  totalGames: number
}
