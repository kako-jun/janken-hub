// ゲーム画面プレースホルダ (Issue #4)。
// 選択ルール名を表示するだけ。実際のじゃんけんロジックは #7-#10 で実装。
// Space / クリックで Result に進む (プレースホルダ用の動線確認だけ)。

import { Graphics, Text } from 'pixi.js'
import { Scene } from '../Scene'
import {
  BG_COLOR_BOTTOM,
  BG_COLOR_TOP,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from '../constants'
import { GameRuleType, RoundResult } from '../types'

const RULE_LABEL: Record<GameRuleType, string> = {
  classic_rps: 'Classic RPS',
  ido_janken: 'Ido Janken',
  achi_muite_hoi: 'Achi Muite Hoi',
  glico: 'Glico (階段じゃんけん)',
}

const TITLE_STYLE = {
  fill: 0xffffff,
  fontSize: 40,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
}
const HINT_STYLE = {
  fill: 0xe5e7eb,
  fontSize: 18,
  fontFamily: 'Inter, system-ui, sans-serif',
}

export class GameScene extends Scene {
  private rule: GameRuleType
  private armed = false
  private spaceDown = false
  private prevSpaceDown = false
  private inputDelayMs = 250

  constructor(rule: GameRuleType) {
    super()
    this.rule = rule

    const bgTop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_TOP })
    const bgBottom = new Graphics()
      .rect(0, STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_BOTTOM })
    this.addChild(bgTop)
    this.addChild(bgBottom)

    const ruleTitle = new Text({
      text: `ルール: ${RULE_LABEL[this.rule]}`,
      style: TITLE_STYLE,
    })
    ruleTitle.anchor.set(0.5)
    ruleTitle.x = STAGE_WIDTH / 2
    ruleTitle.y = STAGE_HEIGHT / 2 - 20
    this.addChild(ruleTitle)

    const hint = new Text({
      text: '(プレースホルダ) Space / クリックで結果画面へ',
      style: HINT_STYLE,
    })
    hint.anchor.set(0.5)
    hint.x = STAGE_WIDTH / 2
    hint.y = STAGE_HEIGHT / 2 + 40
    this.addChild(hint)
  }

  override enter(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('pointerdown', this.onPointerDown)
  }

  override update(deltaMs: number): void {
    if (this.inputDelayMs > 0) {
      this.inputDelayMs -= deltaMs
      if (this.inputDelayMs <= 0) this.armed = true
      return
    }
    if (this.armed && this.spaceDown && !this.prevSpaceDown) {
      this.go()
    }
    this.prevSpaceDown = this.spaceDown
  }

  private onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.code === 'Space' || ev.code === 'Enter') {
      this.spaceDown = true
      ev.preventDefault()
    }
  }
  private onKeyUp = (ev: KeyboardEvent): void => {
    if (ev.code === 'Space' || ev.code === 'Enter') this.spaceDown = false
  }
  private onPointerDown = (): void => {
    if (this.armed) this.go()
  }

  private go(): void {
    // プレースホルダなので結果は draw 固定。本実装は #7-#10。
    const result: RoundResult = 'draw'
    this.armed = false
    this.cleanup()
    this.exit({ next: 'result', result })
  }

  private cleanup(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('pointerdown', this.onPointerDown)
  }

  override destroyScene(): void {
    this.cleanup()
    super.destroyScene()
  }
}
