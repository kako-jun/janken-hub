import { IdoHand } from '../../types/game'

interface IdoHandButtonProps {
  hand: IdoHand
  emoji: string
  onClick: (hand: IdoHand) => void
  disabled?: boolean
}

export const IdoHandButton = ({
  hand,
  emoji,
  onClick,
  disabled = false,
}: IdoHandButtonProps) => {
  const getHandName = (hand: IdoHand): string => {
    const names = {
      rock: 'グー',
      paper: 'パー',
      scissors: 'チョキ',
      well: '井戸',
    }
    return names[hand]
  }

  return (
    <button
      onClick={() => onClick(hand)}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        rounded-2xl p-8 shadow-lg transition-all
        ${
          disabled
            ? 'cursor-not-allowed bg-gray-300 opacity-50'
            : 'bg-white hover:scale-110 hover:shadow-2xl active:scale-95'
        }
      `}
    >
      <div className="mb-2 text-7xl">{emoji}</div>
      <div className="text-xl font-bold text-gray-800">{getHandName(hand)}</div>
    </button>
  )
}
