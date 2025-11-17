import { Hand } from '../../types/game'

interface HandButtonProps {
  hand: Hand
  emoji: string
  onClick: (hand: Hand) => void
  disabled?: boolean
}

export const HandButton = ({
  hand,
  emoji,
  onClick,
  disabled = false,
}: HandButtonProps) => {
  const getHandName = (hand: Hand): string => {
    const names = {
      rock: 'グー',
      paper: 'パー',
      scissors: 'チョキ',
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
