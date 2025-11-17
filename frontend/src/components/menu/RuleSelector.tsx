import { GameRuleType } from '../../types/game'

interface Rule {
  id: GameRuleType
  name: string
  description: string
  icon: string
  enabled: boolean
}

const RULES: Rule[] = [
  {
    id: 'classic_rps',
    name: 'Classic RPS',
    description: '通常のじゃんけん',
    icon: '✊✋✌️',
    enabled: true,
  },
  {
    id: 'achi_muite_hoi',
    name: 'Achi Muite Hoi',
    description: 'あっちむいてホイ',
    icon: '👆👇👈👉',
    enabled: false,
  },
  {
    id: 'ido_janken',
    name: 'Ido Janken',
    description: '井戸じゃんけん',
    icon: '🪨📄✂️🕳️',
    enabled: false,
  },
]

interface RuleSelectorProps {
  onSelect: (rule: GameRuleType) => void
}

export const RuleSelector = ({ onSelect }: RuleSelectorProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="w-full max-w-4xl">
        <h1 className="mb-8 text-center text-5xl font-bold text-white">
          JankenHub
        </h1>
        <p className="mb-12 text-center text-xl text-white">
          ルールを選択してください
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {RULES.map((rule) => (
            <button
              key={rule.id}
              onClick={() => rule.enabled && onSelect(rule.id)}
              disabled={!rule.enabled}
              className={`
                rounded-lg p-8 shadow-lg transition-all
                ${
                  rule.enabled
                    ? 'bg-white hover:scale-105 hover:shadow-xl'
                    : 'cursor-not-allowed bg-gray-300 opacity-50'
                }
              `}
            >
              <div className="mb-4 text-6xl">{rule.icon}</div>
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                {rule.name}
              </h3>
              <p className="text-sm text-gray-600">{rule.description}</p>
              {!rule.enabled && (
                <p className="mt-2 text-xs text-gray-500">Coming Soon...</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
