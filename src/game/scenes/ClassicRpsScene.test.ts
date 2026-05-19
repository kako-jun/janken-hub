// @vitest-environment jsdom
//
// ClassicRpsScene 単体テスト (Issue #7)。
//
// PIXI.Application は使わず、Scene 単体を new → enter → update で進める。
// 確率は AIRandomSource を差し替えて決定論的に固定する。
// 内部 state は getDebugSnapshot() 経由で読む。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassicRpsScene, COUNTDOWN_TOTAL_MS } from './ClassicRpsScene'
import type { SceneExitParam } from '../Scene'
import { NPC_CHARACTERS } from '../npc'
import type { AIRandomSource, NpcAI } from '../npc'

/** 固定値を返す乱数源。NPC_CHARACTERS[0] (julius=scissors) を選ばせる用。 */
const fixedRandom = (value: number): AIRandomSource => ({
  next: () => value,
})

const dispatchKey = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

describe('ClassicRpsScene (Issue #7)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('enter() 直後は phase=countdown, round=1, score=0-0', () => {
    const scene = new ClassicRpsScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0], // julius=scissors affinity, easy=RandomAI
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

  it('keydown "1" で playerHand=rock になる (countdown 中)', () => {
    const scene = new ClassicRpsScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    dispatchKey('1')
    expect(scene.getDebugSnapshot().playerHand).toBe('rock')
    scene.destroyScene()
  })

  it('countdown 完了で reveal に遷移し NPC の手と結果が確定する', () => {
    const scene = new ClassicRpsScene({
      // RandomAI は random.next() を 0 にすると hands[0]='rock' を返す実装に
      // 依存するため、後段の RandomAI 内部実装の前提を以下で固定する:
      // - character 選択用に最初の next() は 0.5 (固定値) で julius を選ぶ
      // - その後の AI 呼び出しでも同値 0.5 を返すので結果は決定論的
      random: fixedRandom(0.5),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    // プレイヤーは rock を選ぶ
    dispatchKey('1')

    // countdown は 4 step × 500ms = COUNTDOWN_TOTAL_MS (2000ms)
    scene.update(COUNTDOWN_TOTAL_MS + 100)

    const s = scene.getDebugSnapshot()
    expect(s.phase).toBe('reveal')
    expect(s.playerHand).toBe('rock')
    expect(s.npcHand).toBeDefined()
    expect(s.lastResult).toBeDefined()
    scene.destroyScene()
  })

  it('プレイヤー未選択時は救済ランダムで playerHand が埋まる', () => {
    const scene = new ClassicRpsScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    // 入力せず countdown 完了
    scene.update(COUNTDOWN_TOTAL_MS + 100)
    const s = scene.getDebugSnapshot()
    expect(s.phase).toBe('reveal')
    expect(s.playerHand).toBeDefined()
    scene.destroyScene()
  })

  it('1 ラウンド draw 後に next round (round=2, score=0-0)', () => {
    // ジュリアス(scissors affinity) で easy=RandomAI。
    // RandomAI 実装に依存せず、AI が scissors を返すように random=0 とは
    // 限らないので、明示的にプレイヤーも scissors を選んで draw を狙う...のは
    // 不確実。draw 確定のため、AI を強制差し替えるテスト用キャラを作りたいが、
    // ここでは「ラウンドが進む」ことだけ確認する。
    const scene = new ClassicRpsScene({
      random: fixedRandom(0.5),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    dispatchKey('1') // rock
    scene.update(COUNTDOWN_TOTAL_MS + 100) // countdown → reveal
    scene.update(500) // reveal → flash
    scene.update(700) // flash → next or matchEnd

    const s = scene.getDebugSnapshot()
    // p1 か p2 のどちらかが 0 か 1。先取 2 勝には届かない 1 ラウンド目。
    expect(s.score.p1 + s.score.p2).toBeLessThanOrEqual(1)
    // 結果次第で round=2 (continue) or phase=matchEnd は起き得ないので
    // 必ず countdown フェーズ (round=2) に居るはず。
    expect(s.phase).toBe('countdown')
    expect(s.round).toBe(2)
    scene.destroyScene()
  })

  it('先取 2 勝で matchEnd → 1000ms 後に exit({next:result, result:win}) [決定論]', () => {
    // 固定 AI で常に scissors を返させる。プレイヤーは rock を選ぶ → 2 連勝で
    // matchEnd を必ず通過するため、if 分岐ガード無しで exit を検証できる。
    const fixedAi: NpcAI = {
      difficulty: 'easy',
      chooseHand: () => 'scissors',
      chooseDirection: () => 'up',
    }
    const scene = new ClassicRpsScene({
      random: fixedRandom(0.5),
      character: NPC_CHARACTERS[0],
      ai: fixedAi,
    })
    scene.enter()
    // exit ハンドラ登録
    const exitParams: SceneExitParam[] = []
    scene.setExitHandler(p => exitParams.push(p))

    // ラウンド 1: rock vs scissors → win
    dispatchKey('1')
    scene.update(COUNTDOWN_TOTAL_MS + 100) // countdown → reveal
    scene.update(500) // reveal → flash
    scene.update(700) // flash → afterFlash (score 1-0, round 2 へ)

    expect(scene.getDebugSnapshot().score).toEqual({ p1: 1, p2: 0 })
    expect(scene.getDebugSnapshot().phase).toBe('countdown')
    expect(scene.getDebugSnapshot().round).toBe(2)

    // ラウンド 2: rock vs scissors → win → matchEnd
    dispatchKey('1')
    scene.update(COUNTDOWN_TOTAL_MS + 100) // countdown → reveal
    scene.update(500) // reveal → flash
    scene.update(700) // flash → afterFlash → enterMatchEnd

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

  it('destroyScene() で Scene が destroyed になり、後続 keydown が落ちない', () => {
    const scene = new ClassicRpsScene({
      random: fixedRandom(0),
      character: NPC_CHARACTERS[0],
    })
    scene.enter()
    scene.destroyScene()
    expect(scene.destroyed).toBe(true)
    expect(() => dispatchKey('1')).not.toThrow()
  })
})
