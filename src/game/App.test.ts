// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { Application } from 'pixi.js'

// PIXI.Application は重いので、App が constructor で触る ticker.add と
// replaceScene 内で触る stage.{addChild,removeChild} だけ持つスタブで足りる。
const makeAppStub = (): Application => {
  const stage = {
    addChild: vi.fn(),
    removeChild: vi.fn(),
  }
  const ticker = {
    add: vi.fn(),
  }
  return { stage, ticker } as unknown as Application
}

describe('App.handleExit (Issue #4)', () => {
  let appStub: Application
  let app: App
  let startTitle: ReturnType<typeof vi.spyOn>
  let startRuleSelect: ReturnType<typeof vi.spyOn>
  let startGame: ReturnType<typeof vi.spyOn>
  let startResult: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    appStub = makeAppStub()
    app = new App(appStub)
    // 動的 import を防ぐため startXxx を全部スパイ化して resolve させる。
    startTitle = vi.spyOn(app, 'startTitle').mockResolvedValue(undefined)
    startRuleSelect = vi
      .spyOn(app, 'startRuleSelect')
      .mockResolvedValue(undefined)
    startGame = vi.spyOn(app, 'startGame').mockResolvedValue(undefined)
    startResult = vi.spyOn(app, 'startResult').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("next='rule_select' で startRuleSelect が呼ばれる", () => {
    app.handleExit({ next: 'rule_select' })
    expect(startRuleSelect).toHaveBeenCalledTimes(1)
    expect(startTitle).not.toHaveBeenCalled()
    expect(startGame).not.toHaveBeenCalled()
    expect(startResult).not.toHaveBeenCalled()
  })

  it("next='game' + rule='glico' で startGame('glico')", () => {
    app.handleExit({ next: 'game', rule: 'glico' })
    expect(startGame).toHaveBeenCalledWith('glico')
  })

  it("next='game' で rule 未指定なら classic_rps フォールバック", () => {
    app.handleExit({ next: 'game' })
    expect(startGame).toHaveBeenCalledWith('classic_rps')
  })

  it("next='result' + result='win' で startResult('win')", () => {
    app.handleExit({ next: 'result', result: 'win' })
    expect(startResult).toHaveBeenCalledWith('win')
  })

  it("next='result' で result 未指定なら draw フォールバック", () => {
    app.handleExit({ next: 'result' })
    expect(startResult).toHaveBeenCalledWith('draw')
  })

  it("next='title' で startTitle が呼ばれる", () => {
    app.handleExit({ next: 'title' })
    expect(startTitle).toHaveBeenCalledTimes(1)
  })

  it('next 未指定 (default) でも startTitle にフォールバック', () => {
    app.handleExit({})
    expect(startTitle).toHaveBeenCalledTimes(1)
  })

  it('constructor で ticker.add が 1 回呼ばれる', () => {
    expect(
      (appStub.ticker.add as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBe(1)
  })
})
