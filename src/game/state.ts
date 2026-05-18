// GameState のファクトリと initWithState (Issue #3)。
//
// テスト / シーンリスタート時に、デフォルト値からの「部分上書き」で初期状態を作れるようにする。
// シーン側は initWithState() を呼ぶだけで、ルール固有ステートまで安全な既定値が入る。

import {
  AchiMuiteState,
  ClassicRpsState,
  GameRuleType,
  GameState,
  GlicoState,
  IdoJankenState,
  PlayerState,
  RuleState,
} from './types'

const DEFAULT_BEST_OF = 3
const DEFAULT_GLICO_GOAL = 30

const defaultRuleState = (rule: GameRuleType): RuleState => {
  switch (rule) {
    case 'classic_rps':
      return {
        kind: 'classic_rps',
        data: { bestOf: DEFAULT_BEST_OF } satisfies ClassicRpsState,
      }
    case 'ido_janken':
      return {
        kind: 'ido_janken',
        data: { bestOf: DEFAULT_BEST_OF } satisfies IdoJankenState,
      }
    case 'achi_muite_hoi':
      return {
        kind: 'achi_muite_hoi',
        data: { phase: 'janken' } satisfies AchiMuiteState,
      }
    case 'glico':
      return {
        kind: 'glico',
        data: {
          p1Pos: 0,
          p2Pos: 0,
          goal: DEFAULT_GLICO_GOAL,
        } satisfies GlicoState,
      }
  }
}

/** ルール用に整合した RuleState を返す。指定 rule と合わない RuleState は破棄してデフォルトに戻す。 */
const reconcileRuleState = (
  rule: GameRuleType,
  given: RuleState | undefined
): RuleState => {
  if (!given) return defaultRuleState(rule)
  if (given.kind !== rule) return defaultRuleState(rule)
  return given
}

const defaultPlayer = (id: string, isNPC: boolean): PlayerState => ({
  id,
  name: isNPC ? 'NPC' : 'You',
  isNPC,
  npcDifficulty: isNPC ? 'easy' : undefined,
})

const createDefaultState = (rule: GameRuleType): GameState => ({
  phase: 'title',
  rule,
  ruleState: defaultRuleState(rule),
  player1: defaultPlayer('p1', false),
  player2: defaultPlayer('p2', true),
  score: { p1: 0, p2: 0 },
  round: 0,
})

/**
 * 部分上書きで GameState を作る。
 *
 * - rule を上書きしたら ruleState は自動で整合する (kind 不一致なら新ルール用デフォルトに戻す)
 * - 何も渡さなければ classic_rps の初期状態
 *
 * 用途: テストの fixture / シーンリスタート / セーブデータからの復元
 */
export const initWithState = (partial: Partial<GameState> = {}): GameState => {
  const rule = partial.rule ?? 'classic_rps'
  const base = createDefaultState(rule)
  return {
    ...base,
    ...partial,
    rule,
    ruleState: reconcileRuleState(rule, partial.ruleState),
    player1: { ...base.player1, ...(partial.player1 ?? {}) },
    player2: { ...base.player2, ...(partial.player2 ?? {}) },
    score: { ...base.score, ...(partial.score ?? {}) },
  }
}
