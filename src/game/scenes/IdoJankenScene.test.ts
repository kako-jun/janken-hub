// @vitest-environment jsdom
//
// IdoJankenScene 単体テスト (Issue #8)。
//
// ClassicRpsScene.test.ts を踏襲。4 ボタン (select1-4) と 'well' 込みの判定
// を中心に検証する。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IdoJankenScene, COUNTDOWN_TOTAL_MS } from './IdoJankenScene'
import type { SceneExitParam } from '../Scene'
import { NPC_CHARACTERS } from '../npc'
import type { AIRandomSource, NpcAI } from '../npc'

const fixedRandom = (value: number): AIRandomSource => ({
  next: () => value,
})

const dispatchKey = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

describe('IdoJankenScene (Issue #8)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('enter() 直後は phase=countdown, round=1, score=0-0', () => {
    const scene = new IdoJankenScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    const s = scene.getDebugSnapshot()
    expect(s.phase).toBe('countdown')
    expect(s.round).toBe(1)
    expect(s.score).toEqual({ p1: 0, p2: 0 })
    expect(s.playerHand).toBeUndefined()
    expect(s.npcHand).toBeUndefined()
    scene.destroyScene()
  })

  it('select1-4 すべてで playerHand が確定する (countdown 中)', () => {
    // それぞれ独立した scene で検証 (state がリセットされるよう)。
    const expectations: Array<
      [string, 'rock' | 'scissors' | 'paper' | 'well']
    > = [
      ['1', 'rock'],
      ['2', 'scissors'],
      ['3', 'paper'],
      ['4', 'well'],
    ]
    for (const [key, expected] of expectations) {
      const scene = new IdoJankenScene({
        random: fixedRandom(0),
        character: NPC_CHARACTERS[0],
      })
      scene.enter()
      dispatchKey(key)
      expect(scene.getDebugSnapshot().playerHand).toBe(expected)
      scene.destroyScene()
    }
  })

  it('プレイヤー未選択時は救済ランダムで playerHand が埋まる (4 手から)', () => {
    const scene = new IdoJankenScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    scene.update(COUNTDOWN_TOTAL_MS + 100)
    const s = scene.getDebugSnapshot()
    expect(s.phase).toBe('reveal')
    expect(s.playerHand).toBeDefined()
    // 4 手のいずれかであること。
    expect(['rock', 'scissors', 'paper', 'well']).toContain(s.playerHand)
    scene.destroyScene()
  })

  it('固定 AI rock + プレイヤー well で 2 連勝 → matchEnd → exit(win) [決定論]', () => {
    const fixedAi: NpcAI = {
      difficulty: 'easy',
      chooseHand: () => 'rock',
      chooseDirection: () => 'up',
    }
    const scene = new IdoJankenScene({
      random: fixedRandom(0.5),
      character: NPC_CHARACTERS[0],
      ai: fixedAi,
    })
    scene.enter()
    const exitParams: SceneExitParam[] = []
    scene.setExitHandler(p => exitParams.push(p))

    // ラウンド 1: well vs rock → win
    dispatchKey('4')
    scene.update(COUNTDOWN_TOTAL_MS + 100)
    scene.update(500) // reveal → flash
    scene.update(700) // flash → afterFlash

    expect(scene.getDebugSnapshot().score).toEqual({ p1: 1, p2: 0 })
    expect(scene.getDebugSnapshot().phase).toBe('countdown')
    expect(scene.getDebugSnapshot().round).toBe(2)

    // ラウンド 2: well vs rock → win → matchEnd
    dispatchKey('4')
    scene.update(COUNTDOWN_TOTAL_MS + 100)
    scene.update(500)
    scene.update(700)

    const sMatch = scene.getDebugSnapshot()
    expect(sMatch.phase).toBe('matchEnd')
    expect(sMatch.score).toEqual({ p1: 2, p2: 0 })

    scene.update(1100)
    expect(exitParams).toHaveLength(1)
    expect(exitParams[0].next).toBe('result')
    expect(exitParams[0].result).toBe('win')

    scene.destroyScene()
  })

  it('固定 AI paper + プレイヤー well で 2 連敗 → matchEnd → exit(lose) [決定論]', () => {
    // paper > well なので、プレイヤーが well を出し続けると 2 連敗で lose。
    const fixedAi: NpcAI = {
      difficulty: 'easy',
      chooseHand: () => 'paper',
      chooseDirection: () => 'up',
    }
    const scene = new IdoJankenScene({
      random: fixedRandom(0.5),
      character: NPC_CHARACTERS[0],
      ai: fixedAi,
    })
    scene.enter()
    const exitParams: SceneExitParam[] = []
    scene.setExitHandler(p => exitParams.push(p))

    // ラウンド 1: well vs paper → lose
    dispatchKey('4')
    scene.update(COUNTDOWN_TOTAL_MS + 100)
    scene.update(500)
    scene.update(700)

    expect(scene.getDebugSnapshot().score).toEqual({ p1: 0, p2: 1 })

    // ラウンド 2: well vs paper → lose → matchEnd
    dispatchKey('4')
    scene.update(COUNTDOWN_TOTAL_MS + 100)
    scene.update(500)
    scene.update(700)

    const sMatch = scene.getDebugSnapshot()
    expect(sMatch.phase).toBe('matchEnd')
    expect(sMatch.score).toEqual({ p1: 0, p2: 2 })

    scene.update(1100)
    expect(exitParams).toHaveLength(1)
    expect(exitParams[0].next).toBe('result')
    expect(exitParams[0].result).toBe('lose')

    scene.destroyScene()
  })

  it('destroyScene() で Scene が destroyed になり、後続 keydown が落ちない', () => {
    const scene = new IdoJankenScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    scene.destroyScene()
    expect(scene.destroyed).toBe(true)
    expect(() => dispatchKey('1')).not.toThrow()
    expect(() => dispatchKey('4')).not.toThrow()
  })
})
