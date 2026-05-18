// 結果画面プレースホルダ (Issue #4)。
// You Win / You Lose / Draw を色付きで表示し、Space / クリックで Title へ戻る。

import { Graphics, Text } from 'pixi.js'
import { Scene } from '../Scene'
import {
  BG_COLOR_BOTTOM,
  BG_COLOR_TOP,
  COLOR_DRAW,
  COLOR_LOSE,
  COLOR_WIN,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from '../constants'
import { RoundResult } from '../types'

const TITLE_STYLE_BASE = {
  fontSize: 72,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
}
const HINT_STYLE = {
  fill: 0xffffff,
  fontSize: 22,
  fontFamily: 'Inter, system-ui, sans-serif',
}

const resultMessage = (r: RoundResult): { text: string; color: number } => {
  switch (r) {
    case 'win':
      return { text: 'You Win!', color: COLOR_WIN }
    case 'lose':
      return { text: 'You Lose...', color: COLOR_LOSE }
    case 'draw':
      return { text: 'Draw', color: COLOR_DRAW }
  }
}

export class ResultScene extends Scene {
  private hint: Text
  private blinkMs = 0
  private armed = false
  private spaceDown = false
  private prevSpaceDown = false
  private inputDelayMs = 400

  constructor(result: RoundResult) {
    super()

    const bgTop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_TOP })
    const bgBottom = new Graphics()
      .rect(0, STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_BOTTOM })
    this.addChild(bgTop)
    this.addChild(bgBottom)

    const msg = resultMessage(result)
    const title = new Text({
      text: msg.text,
      style: { ...TITLE_STYLE_BASE, fill: msg.color },
    })
    title.anchor.set(0.5)
    title.x = STAGE_WIDTH / 2
    title.y = STAGE_HEIGHT * 0.4
    this.addChild(title)

    this.hint = new Text({
      text: 'タップ / Space でタイトルへ',
      style: HINT_STYLE,
    })
    this.hint.anchor.set(0.5)
    this.hint.x = STAGE_WIDTH / 2
    this.hint.y = STAGE_HEIGHT * 0.7
    this.addChild(this.hint)
  }

  override enter(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('pointerdown', this.onPointerDown)
  }

  override update(deltaMs: number): void {
    this.blinkMs += deltaMs
    this.hint.alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.blinkMs / 250))

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
    this.armed = false
    this.cleanup()
    this.exit({ next: 'title' })
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
