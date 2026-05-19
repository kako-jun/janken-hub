// @vitest-environment jsdom
//
// AchiMuiteHoiScene 単体テスト (Issue #9)。
//
// 確率は ai オプションを差し替えて完全決定論化する。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AchiMuiteHoiScene,
  ACHI_COUNTDOWN_TOTAL_MS,
  JANKEN_COUNTDOWN_TOTAL_MS,
} from './AchiMuiteHoiScene'
import type { SceneExitParam } from '../Scene'
import { NPC_CHARACTERS } from '../npc'
import type { AIRandomSource, NpcAI } from '../npc'
import type { Direction, Hand } from '../types'

const fixedRandom = (value: number): AIRandomSource => ({
  next: () => value,
})

const dispatchKey = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

/** janken の hand と achi の direction を制御できる固定 AI。 */
const fixedAi = (hand: Hand, dir: Direction): NpcAI => ({
  difficulty: 'easy',
  chooseHand: () => hand,
  chooseDirection: () => dir,
})

/**
 * 1 set (janken → achi) を完全に進めるヘルパ。
 * 入力 (key) は呼び出し側で済ませた前提で、時間だけ進める。
 */
const advanceOneJankenAchiSet = (scene: AchiMuiteHoiScene): void => {
  // janken: countdown → reveal → flash → (achiCountdown へ)
  scene.update(JANKEN_COUNTDOWN_TOTAL_MS + 50) // countdown → reveal
  scene.update(500) // reveal → flash
  scene.update(700) // flash → afterFlash (= achiCountdown へ)
}

const advanceAchiPhase = (scene: AchiMuiteHoiScene): void => {
  // achi: countdown → reveal → flash → after
  scene.update(ACHI_COUNTDOWN_TOTAL_MS + 50)
  scene.update(500)
  scene.update(700)
}

describe('AchiMuiteHoiScene (Issue #9)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('enter() 直後は phase=jankenCountdown, score=0-0, attacker=undefined', () => {
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('scissors', 'up'),
    })
    scene.enter()
    const s = scene.getDebugSnapshot()
    expect(s.phase).toBe('jankenCountdown')
    expect(s.score).toEqual({ p1: 0, p2: 0 })
    expect(s.attacker).toBeUndefined()
    expect(s.playerHand).toBeUndefined()
    expect(s.playerDir).toBeUndefined()
    scene.destroyScene()
  })

  it('janken プレイヤー勝ち → achi 一致 → 1 point', () => {
    // AI: scissors / up を返す。プレイヤー: rock / up
    // → janken: rock vs scissors = win (attacker=p1)
    // → achi:   playerDir=up, npcDir=up = 一致 → p1 point
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('scissors', 'up'),
    })
    scene.enter()
    dispatchKey('1') // rock
    advanceOneJankenAchiSet(scene)

    // achiCountdown 中のはず
    let s = scene.getDebugSnapshot()
    expect(s.phase).toBe('achiCountdown')
    expect(s.attacker).toBe('p1')
    expect(s.playerHand).toBe('rock')
    expect(s.npcHand).toBe('scissors')
    expect(s.lastJankenResult).toBe('win')

    dispatchKey('ArrowUp') // up
    advanceAchiPhase(scene)

    s = scene.getDebugSnapshot()
    expect(s.score).toEqual({ p1: 1, p2: 0 })
    // 1 point ではまだ matchEnd ではない (BEST_OF=2)。次の janken へ。
    // 直後は resetForJankenRound で lastAchiResult はクリアされている。
    expect(s.phase).toBe('jankenCountdown')
    expect(s.lastAchiResult).toBeUndefined()
    scene.destroyScene()
  })

  it('janken draw → 再 janken (point 変わらず)', () => {
    // AI: rock / up。プレイヤー: rock → draw → 再 janken。
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('rock', 'up'),
    })
    scene.enter()
    dispatchKey('1') // rock vs rock = draw
    advanceOneJankenAchiSet(scene)

    const s = scene.getDebugSnapshot()
    expect(s.score).toEqual({ p1: 0, p2: 0 })
    expect(s.phase).toBe('jankenCountdown')
    expect(s.lastJankenResult).toBeUndefined() // resetForJankenRound でクリア
    expect(s.attacker).toBeUndefined()
    scene.destroyScene()
  })

  it('janken プレイヤー勝ち → achi 不一致 → 再 janken (point 変わらず)', () => {
    // AI: scissors / down。プレイヤー: rock / up。
    // janken: win, attacker=p1。achi: up vs down = 不一致 → point 動かず。
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('scissors', 'down'),
    })
    scene.enter()
    dispatchKey('1') // rock
    advanceOneJankenAchiSet(scene)
    dispatchKey('ArrowUp')
    advanceAchiPhase(scene)

    const s = scene.getDebugSnapshot()
    expect(s.score).toEqual({ p1: 0, p2: 0 })
    expect(s.phase).toBe('jankenCountdown')
    scene.destroyScene()
  })

  it('janken プレイヤー負け → NPC が attacker → 一致なら NPC point', () => {
    // AI: paper / left。プレイヤー: rock / up。
    // janken: rock vs paper = lose, attacker=p2。
    // achi: attackerDir=npcDir=left, defenderDir=playerDir=up → 不一致 → point 動かず。
    // 一致パターンを試すため: AI=paper/up + プレイヤー=rock/up → npc 一致 → p2 point。
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('paper', 'up'),
    })
    scene.enter()
    dispatchKey('1') // rock
    advanceOneJankenAchiSet(scene)
    expect(scene.getDebugSnapshot().attacker).toBe('p2')

    dispatchKey('ArrowUp')
    advanceAchiPhase(scene)

    const s = scene.getDebugSnapshot()
    expect(s.score).toEqual({ p1: 0, p2: 1 })
    scene.destroyScene()
  })

  it('2 point 先取で matchEnd → exit({next:result, result:win})', () => {
    // AI: scissors / up。プレイヤー: rock / up を 2 連続 → 2 連勝で matchEnd。
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('scissors', 'up'),
    })
    scene.enter()
    const exitParams: SceneExitParam[] = []
    scene.setExitHandler(p => exitParams.push(p))

    // セット 1: win + 一致 → 1 point
    dispatchKey('1')
    advanceOneJankenAchiSet(scene)
    dispatchKey('ArrowUp')
    advanceAchiPhase(scene)
    expect(scene.getDebugSnapshot().score).toEqual({ p1: 1, p2: 0 })

    // セット 2: win + 一致 → 2 point → matchEnd
    dispatchKey('1')
    advanceOneJankenAchiSet(scene)
    dispatchKey('ArrowUp')
    advanceAchiPhase(scene)

    const sMatch = scene.getDebugSnapshot()
    expect(sMatch.phase).toBe('matchEnd')
    expect(sMatch.score).toEqual({ p1: 2, p2: 0 })

    // 1000ms 経過で exit
    scene.update(1100)
    expect(exitParams).toHaveLength(1)
    expect(exitParams[0].next).toBe('result')
    expect(exitParams[0].result).toBe('win')

    scene.destroyScene()
  })

  it('4 矢印キーすべてが setPlayerDir に届く', () => {
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('scissors', 'up'),
    })
    scene.enter()
    // achiCountdown まで進める
    dispatchKey('1')
    advanceOneJankenAchiSet(scene)
    expect(scene.getDebugSnapshot().phase).toBe('achiCountdown')

    // 各矢印キー
    dispatchKey('ArrowUp')
    expect(scene.getDebugSnapshot().playerDir).toBe('up')
    dispatchKey('ArrowDown')
    expect(scene.getDebugSnapshot().playerDir).toBe('down')
    dispatchKey('ArrowLeft')
    expect(scene.getDebugSnapshot().playerDir).toBe('left')
    dispatchKey('ArrowRight')
    expect(scene.getDebugSnapshot().playerDir).toBe('right')

    scene.destroyScene()
  })

  it('destroyScene() で後続 keydown が落ちない', () => {
    const scene = new AchiMuiteHoiScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
      ai: fixedAi('scissors', 'up'),
    })
    scene.enter()
    scene.destroyScene()
    expect(scene.destroyed).toBe(true)
    expect(() => {
      dispatchKey('1')
      dispatchKey('ArrowUp')
    }).not.toThrow()
  })
})
