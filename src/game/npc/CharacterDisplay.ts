// NPC キャラクター表示コンポーネント (Issue #6)。
// themeColor の円 + アイコン (絵文字) + 名前を 1 つの Container にまとめて、
// 「出した手」を右肩に小さく表示できるようにする。シーン側は addChild するだけでよい。

import { Container, Graphics, Text } from 'pixi.js'
import type { Hand, IdoHand } from '../types'
import type { NpcCharacter } from './types'

const HAND_ICON: Record<Hand | IdoHand, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌',
  well: '🌀',
}

const NAME_STYLE = {
  fill: 0xffffff,
  fontSize: 18,
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

const ICON_STYLE = {
  fill: 0xffffff,
  fontSize: 64,
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

const HAND_STYLE = {
  fill: 0xffffff,
  fontSize: 32,
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

export class CharacterDisplay extends Container {
  private readonly character: NpcCharacter
  private readonly handText: Text

  constructor(character: NpcCharacter) {
    super()
    this.character = character

    const circle = new Graphics()
      .circle(0, 0, 60)
      .fill({ color: character.themeColor })
    this.addChild(circle)

    const iconText = new Text({ text: character.icon, style: ICON_STYLE })
    iconText.anchor.set(0.5)
    this.addChild(iconText)

    const nameText = new Text({ text: character.name, style: NAME_STYLE })
    nameText.anchor.set(0.5, 0)
    nameText.position.set(0, 70)
    this.addChild(nameText)

    this.handText = new Text({ text: '', style: HAND_STYLE })
    this.handText.anchor.set(0.5)
    this.handText.position.set(55, -55)
    this.handText.visible = false
    this.addChild(this.handText)
  }

  /** 右肩に出した手アイコンを表示。undefined で非表示。 */
  setHand(hand: Hand | IdoHand | undefined): void {
    if (!hand) {
      this.handText.visible = false
      this.handText.text = ''
      return
    }
    this.handText.text = HAND_ICON[hand]
    this.handText.visible = true
  }

  getCharacter(): NpcCharacter {
    return this.character
  }
}
