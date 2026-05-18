import { describe, expect, it } from 'vitest'
import { initWithState } from './state'

describe('initWithState (Issue #3)', () => {
  it('引数なしで classic_rps の初期状態を返す (phase=title, bestOf=3)', () => {
    const s = initWithState()
    expect(s.phase).toBe('title')
    expect(s.rule).toBe('classic_rps')
    expect(s.ruleState.kind).toBe('classic_rps')
    if (s.ruleState.kind === 'classic_rps') {
      expect(s.ruleState.data.bestOf).toBe(3)
    }
    expect(s.score).toEqual({ p1: 0, p2: 0 })
    expect(s.round).toBe(0)
    expect(s.player1.isNPC).toBe(false)
    expect(s.player2.isNPC).toBe(true)
    expect(s.player2.npcDifficulty).toBe('easy')
  })

  it('rule を glico に切り替えると ruleState が glico デフォルト (p1=0, p2=0, goal=30) になる', () => {
    const s = initWithState({ rule: 'glico' })
    expect(s.rule).toBe('glico')
    expect(s.ruleState.kind).toBe('glico')
    if (s.ruleState.kind === 'glico') {
      expect(s.ruleState.data).toEqual({ p1Pos: 0, p2Pos: 0, goal: 30 })
    }
  })

  it('rule と ruleState の kind が不一致なら ruleState はルール用デフォルトに置き換わる', () => {
    const s = initWithState({
      rule: 'achi_muite_hoi',
      ruleState: { kind: 'classic_rps', data: { bestOf: 5 } },
    })
    expect(s.ruleState.kind).toBe('achi_muite_hoi')
    if (s.ruleState.kind === 'achi_muite_hoi') {
      expect(s.ruleState.data.phase).toBe('janken')
    }
  })

  it('rule と一致する ruleState はそのまま採用 (例: bestOf=5)', () => {
    const s = initWithState({
      rule: 'classic_rps',
      ruleState: { kind: 'classic_rps', data: { bestOf: 5 } },
    })
    expect(s.ruleState.kind).toBe('classic_rps')
    if (s.ruleState.kind === 'classic_rps') {
      expect(s.ruleState.data.bestOf).toBe(5)
    }
  })

  it('player1 / player2 の部分上書きが効く (name 等)', () => {
    const s = initWithState({
      player1: { id: 'p1', name: 'Alice', isNPC: false },
      player2: { id: 'p2', name: 'BotBob', isNPC: true, npcDifficulty: 'hard' },
    })
    expect(s.player1.name).toBe('Alice')
    expect(s.player2.name).toBe('BotBob')
    expect(s.player2.npcDifficulty).toBe('hard')
  })

  it('score を部分上書きできる', () => {
    const s = initWithState({ score: { p1: 2, p2: 1 } })
    expect(s.score).toEqual({ p1: 2, p2: 1 })
  })

  it('phase / round / lastResult を上書きできる (リスタート途中復元用途)', () => {
    const s = initWithState({
      phase: 'playing',
      round: 3,
      lastResult: 'win',
    })
    expect(s.phase).toBe('playing')
    expect(s.round).toBe(3)
    expect(s.lastResult).toBe('win')
  })

  it('ido_janken に切り替えると ido_janken デフォルト (bestOf=3) になる', () => {
    const s = initWithState({ rule: 'ido_janken' })
    expect(s.ruleState.kind).toBe('ido_janken')
    if (s.ruleState.kind === 'ido_janken') {
      expect(s.ruleState.data.bestOf).toBe(3)
    }
  })
})
