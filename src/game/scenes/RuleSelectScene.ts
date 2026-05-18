// ルール選択画面 (Issue #4)。
// - 4 ルール (classic_rps / ido_janken / achi_muite_hoi / glico) を 2×2 グリッドで表示
// - 各カードは PIXI.Graphics で白角丸 + Text、クリック/タップで GameScene へ遷移
//
// DESIGN.md: blue→purple BG、白カード、shadow-lg 相当、emoji を text-4xl 級で配置。

import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js'
import { Scene } from '../Scene'
import {
  BG_COLOR_BOTTOM,
  BG_COLOR_TOP,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../constants'
import { GameRuleType } from '../types'

interface RuleCardSpec {
  rule: GameRuleType
  title: string
  description: string
  icon: string
}

const RULES: RuleCardSpec[] = [
  {
    rule: 'classic_rps',
    title: 'Classic RPS',
    description: '通常じゃんけん',
    icon: '✊✋✌️',
  },
  {
    rule: 'ido_janken',
    title: 'Ido Janken',
    description: '井戸じゃんけん',
    icon: '🪨📄✂️🕳️',
  },
  {
    rule: 'achi_muite_hoi',
    title: 'Achi Muite Hoi',
    description: 'あっちむいてホイ',
    icon: '👆👇👈👉',
  },
  {
    rule: 'glico',
    title: 'Glico',
    description: '階段じゃんけん',
    icon: '🏃👣🪜',
  },
]

const HEADING_STYLE = {
  fill: 0xffffff,
  fontSize: 36,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
}
const CARD_TITLE_STYLE = {
  fill: TEXT_PRIMARY,
  fontSize: 22,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
}
const CARD_DESC_STYLE = {
  fill: TEXT_SECONDARY,
  fontSize: 16,
  fontFamily: 'Inter, system-ui, sans-serif',
}
const CARD_ICON_STYLE = {
  fill: TEXT_PRIMARY,
  fontSize: 40,
  fontFamily: 'sans-serif',
}

const CARD_W = 320
const CARD_H = 180
const GRID_GAP = 32

export class RuleSelectScene extends Scene {
  private armed = true

  constructor() {
    super()

    const bgTop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_TOP })
    const bgBottom = new Graphics()
      .rect(0, STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_BOTTOM })
    this.addChild(bgTop)
    this.addChild(bgBottom)

    const heading = new Text({ text: 'ルールを選ぶ', style: HEADING_STYLE })
    heading.anchor.set(0.5, 0)
    heading.x = STAGE_WIDTH / 2
    heading.y = 32
    this.addChild(heading)

    // 2x2 グリッドの左上座標
    const gridW = CARD_W * 2 + GRID_GAP
    const gridH = CARD_H * 2 + GRID_GAP
    const originX = (STAGE_WIDTH - gridW) / 2
    const originY = (STAGE_HEIGHT - gridH) / 2 + 30

    RULES.forEach((spec, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = originX + col * (CARD_W + GRID_GAP)
      const y = originY + row * (CARD_H + GRID_GAP)
      const card = this.makeCard(spec)
      card.x = x
      card.y = y
      this.addChild(card)
    })
  }

  private makeCard(spec: RuleCardSpec): Container {
    const card = new Container()
    // 白カード本体。「shadow-lg 相当」は darker な背後矩形で表現。
    const shadow = new Graphics()
      .roundRect(4, 6, CARD_W, CARD_H, 12)
      .fill({ color: 0x000000, alpha: 0.25 })
    const body = new Graphics()
      .roundRect(0, 0, CARD_W, CARD_H, 12)
      .fill({ color: 0xffffff })
    card.addChild(shadow)
    card.addChild(body)

    const icon = new Text({ text: spec.icon, style: CARD_ICON_STYLE })
    icon.anchor.set(0.5, 0)
    icon.x = CARD_W / 2
    icon.y = 16
    card.addChild(icon)

    const title = new Text({ text: spec.title, style: CARD_TITLE_STYLE })
    title.anchor.set(0.5, 0)
    title.x = CARD_W / 2
    title.y = 88
    card.addChild(title)

    const desc = new Text({ text: spec.description, style: CARD_DESC_STYLE })
    desc.anchor.set(0.5, 0)
    desc.x = CARD_W / 2
    desc.y = 124
    card.addChild(desc)

    card.eventMode = 'static'
    card.cursor = 'pointer'
    card.on('pointertap', (_ev: FederatedPointerEvent) => {
      if (!this.armed) return
      this.armed = false
      this.exit({ next: 'game', rule: spec.rule })
    })
    // DESIGN.md: hover で 1.05, 押下で 0.95 (active:scale-95 相当)
    card.on('pointerover', () => {
      card.scale.set(1.05)
    })
    card.on('pointerout', () => {
      card.scale.set(1.0)
    })
    card.on('pointerdown', () => {
      card.scale.set(0.95)
    })
    card.on('pointerup', () => {
      card.scale.set(1.05)
    })
    card.on('pointerupoutside', () => {
      card.scale.set(1.0)
    })
    return card
  }
}
