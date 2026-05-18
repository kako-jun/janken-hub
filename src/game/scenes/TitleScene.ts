// タイトル画面 (Issue #4)。
// - 「JankenHub」大タイトル + 「PRESS SPACE / TAP TO START」点滅
// - Space / Enter / クリック / タップで RuleSelect へ

import { Graphics, Text } from 'pixi.js'
import { Scene } from '../Scene'
import {
  BG_COLOR_BOTTOM,
  BG_COLOR_TOP,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from '../constants'

const TITLE_STYLE = {
  fill: 0xffffff,
  fontSize: 72,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
}
const SUBTITLE_STYLE = {
  fill: 0xe5e7eb,
  fontSize: 22,
  fontFamily: 'Inter, system-ui, sans-serif',
}
const HINT_STYLE = {
  fill: 0xffffff,
  fontSize: 24,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
}

export class TitleScene extends Scene {
  private hint: Text
  private blinkMs = 0
  private armed = false
  private spaceDown = false
  private prevSpaceDown = false

  constructor() {
    super()

    // blue→purple グラデを近似する 2 色矩形 (DESIGN.md ブランド色)
    const bgTop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_TOP })
    const bgBottom = new Graphics()
      .rect(0, STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_BOTTOM })
    this.addChild(bgTop)
    this.addChild(bgBottom)

    const title = new Text({ text: 'JankenHub', style: TITLE_STYLE })
    title.anchor.set(0.5)
    title.x = STAGE_WIDTH / 2
    title.y = STAGE_HEIGHT * 0.32
    this.addChild(title)

    const sub = new Text({
      text: '世界のじゃんけんを集めた対戦ハブ',
      style: SUBTITLE_STYLE,
    })
    sub.anchor.set(0.5)
    sub.x = STAGE_WIDTH / 2
    sub.y = STAGE_HEIGHT * 0.32 + 60
    this.addChild(sub)

    this.hint = new Text({
      text: 'PRESS SPACE / TAP TO START',
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
    this.armed = true
  }

  override update(deltaMs: number): void {
    this.blinkMs += deltaMs
    this.hint.alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.blinkMs / 250))

    // Space は edge トリガで遷移
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
    if (ev.code === 'Space' || ev.code === 'Enter') {
      this.spaceDown = false
    }
  }

  private onPointerDown = (): void => {
    if (this.armed) this.go()
  }

  private go(): void {
    this.armed = false
    this.cleanup()
    this.exit({ next: 'rule_select' })
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
