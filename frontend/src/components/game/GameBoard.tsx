import { useState, useEffect } from 'react'
import { Hand, IdoHand, GameSession, GameResult } from '../../types/game'
import { HandButton } from '../ui/HandButton'
import { IdoHandButton } from '../ui/IdoHandButton'
import { websocketService } from '../../services/websocketService'

interface GameBoardProps {
  session: GameSession
  onBack: () => void
}

export const GameBoard = ({ session, onBack }: GameBoardProps) => {
  const [waiting, setWaiting] = useState(false)
  const [lastResult, setLastResult] = useState<{
    playerHand: Hand | IdoHand
    npcHand: Hand | IdoHand
    result: GameResult
  } | null>(null)
  const [currentScore, setCurrentScore] = useState(session.score)

  useEffect(() => {
    // ラウンド結果を受信
    websocketService.on('ROUND_RESULT', (data: any) => {
      setLastResult({
        playerHand: data.player_hand,
        npcHand: data.npc_hand,
        result: data.result,
      })
      setCurrentScore(data.score)
      setWaiting(false)
    })

    return () => {
      websocketService.off('ROUND_RESULT', () => {})
    }
  }, [])

  const handleHandSelect = (hand: Hand | IdoHand) => {
    setWaiting(true)
    setLastResult(null)

    // WebSocketでサーバーに送信
    websocketService.send('PLAY_HAND', {
      sessionId: session.id,
      hand,
    })
  }

  const getResultText = (result: GameResult): string => {
    switch (result) {
      case 'win':
        return 'あなたの勝ち！'
      case 'lose':
        return 'あなたの負け'
      case 'draw':
        return 'あいこ'
    }
  }

  const getResultColor = (result: GameResult): string => {
    switch (result) {
      case 'win':
        return 'text-green-500'
      case 'lose':
        return 'text-red-500'
      case 'draw':
        return 'text-yellow-500'
    }
  }

  const getHandEmoji = (hand: Hand | IdoHand): string => {
    const emojis: Record<Hand | IdoHand, string> = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️',
      well: '🕳️',
    }
    return emojis[hand]
  }

  const getRuleName = (): string => {
    const names = {
      classic_rps: 'Classic RPS',
      achi_muite_hoi: 'Achi Muite Hoi',
      ido_janken: 'Ido Janken',
      limited_janken: 'Limited Janken',
      arcade_coin: 'Arcade Coin',
      glico_game: 'Glico Game',
      tournament: 'Tournament',
    }
    return names[session.ruleType]
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      {/* ヘッダー */}
      <div className="mb-8 flex w-full max-w-4xl items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-lg bg-white px-6 py-3 font-bold text-gray-800 shadow-lg transition-all hover:scale-105"
        >
          ← 戻る
        </button>
        <h2 className="text-2xl font-bold text-white">{getRuleName()}</h2>
        <div className="w-24"></div>
      </div>

      {/* プレイヤー情報 */}
      <div className="mb-8 flex w-full max-w-4xl items-center justify-between">
        {/* プレイヤー1 */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            {session.player1.name}
          </h3>
          <p className="text-sm text-gray-600">YOU</p>
          <div className="mt-2 text-4xl font-bold text-blue-600">
            {currentScore.player1}
          </div>
        </div>

        <div className="text-4xl font-bold text-white">VS</div>

        {/* プレイヤー2（NPC） */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            {session.player2.name}
          </h3>
          <p className="text-sm text-gray-600">NPC</p>
          <div className="mt-2 text-4xl font-bold text-red-600">
            {currentScore.player2}
          </div>
        </div>
      </div>

      {/* 結果表示 */}
      {lastResult && (
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-600">あなた</p>
              <div className="text-7xl">{getHandEmoji(lastResult.playerHand)}</div>
            </div>
            <div className="text-4xl font-bold text-gray-400">vs</div>
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-600">{session.player2.name}</p>
              <div className="text-7xl">{getHandEmoji(lastResult.npcHand)}</div>
            </div>
          </div>
          <div
            className={`text-center text-3xl font-bold ${getResultColor(lastResult.result)}`}
          >
            {getResultText(lastResult.result)}
          </div>
        </div>
      )}

      {/* 手選択ボタン */}
      <div className="flex gap-6">
        {session.ruleType === 'ido_janken' ? (
          <>
            <IdoHandButton
              hand="rock"
              emoji="✊"
              onClick={handleHandSelect}
              disabled={waiting}
            />
            <IdoHandButton
              hand="paper"
              emoji="✋"
              onClick={handleHandSelect}
              disabled={waiting}
            />
            <IdoHandButton
              hand="scissors"
              emoji="✌️"
              onClick={handleHandSelect}
              disabled={waiting}
            />
            <IdoHandButton
              hand="well"
              emoji="🕳️"
              onClick={handleHandSelect}
              disabled={waiting}
            />
          </>
        ) : (
          <>
            <HandButton
              hand="rock"
              emoji="✊"
              onClick={handleHandSelect}
              disabled={waiting}
            />
            <HandButton
              hand="paper"
              emoji="✋"
              onClick={handleHandSelect}
              disabled={waiting}
            />
            <HandButton
              hand="scissors"
              emoji="✌️"
              onClick={handleHandSelect}
              disabled={waiting}
            />
          </>
        )}
      </div>

      {waiting && (
        <div className="mt-8 text-xl font-bold text-white">
          じゃんけん...ポン！
        </div>
      )}
    </div>
  )
}
