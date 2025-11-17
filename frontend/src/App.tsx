import { useState, useEffect } from 'react'
import { RuleSelector } from './components/menu/RuleSelector'
import { GameBoard } from './components/game/GameBoard'
import { websocketService } from './services/websocketService'
import { GameSession, GameRuleType } from './types/game'

type GameState = 'menu' | 'loading' | 'playing'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [session, setSession] = useState<GameSession | null>(null)

  useEffect(() => {
    // WebSocket接続
    websocketService.connect('ws://localhost:8080/ws')

    // セッション作成完了イベントを監視
    websocketService.on('SESSION_CREATED', (data: any) => {
      const newSession: GameSession = {
        id: data.session.id,
        ruleType: data.session.ruleType,
        player1: data.session.player1,
        player2: data.session.player2,
        currentRound: data.session.currentRound,
        score: data.session.score,
        createdAt: new Date().toISOString(),
      }
      setSession(newSession)
      setGameState('playing')
    })

    return () => {
      websocketService.disconnect()
    }
  }, [])

  const handleRuleSelect = (ruleType: GameRuleType) => {
    setGameState('loading')

    // WebSocketでセッション作成リクエスト
    websocketService.send('CREATE_SESSION', {
      playerName: 'Player',
      ruleType,
    })
  }

  const handleBackToMenu = () => {
    setSession(null)
    setGameState('menu')
  }

  return (
    <>
      {gameState === 'menu' && <RuleSelector onSelect={handleRuleSelect} />}

      {gameState === 'loading' && (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="text-3xl font-bold text-white">
            ゲームを準備中...
          </div>
        </div>
      )}

      {gameState === 'playing' && session && (
        <GameBoard session={session} onBack={handleBackToMenu} />
      )}
    </>
  )
}

export default App
