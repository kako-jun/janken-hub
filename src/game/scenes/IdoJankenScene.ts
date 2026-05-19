// Ido Janken (井戸じゃんけん, 4 手) シーン (Issue #8)。
//
// ClassicRpsScene と同じ state machine (countdown → reveal → flash → matchEnd)。
// 違いは手が 4 種 (rock/scissors/paper/well) になり、ボタンが 4 つ並ぶ点と、
// 判定が judgeIdoJanken に切り替わる点。NPC AI には 'ido_janken' で chooseHand
// を呼び、'well' を含む 4 手から選ばせる。

import { Container, Graphics, Text } from 'pixi.js'
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
import { InputAction, InputManager, InputPointerEvent } from '../input'
import { CharacterDisplay, NPC_CHARACTERS, createAIFromCharacter } from '../npc'
import type { AIRandomSource, NpcAI, NpcCharacter } from '../npc'
import type { IdoHand, RoundResult } from '../types'
import { judgeIdoJanken } from '../rules/ido_janken'

type Phase = 'countdown' | 'reveal' | 'flash' | 'matchEnd'

const COUNTDOWN_STEP_MS = 500
/** countdown のテキスト。step 3 ("ポン!") の終端で reveal へ遷移する。 */
const COUNTDOWN_TEXTS = ['最初はグー', 'ジャン', 'ケン', 'ポン!']
/** countdown 全 step を表示し終えるまでの合計時間 (ms)。テストからも参照する。 */
export const COUNTDOWN_TOTAL_MS = COUNTDOWN_STEP_MS * COUNTDOWN_TEXTS.length
const REVEAL_HOLD_MS = 400
const FLASH_MS = 600
const MATCH_END_MS = 1000
// 先取 2 勝 = best-of-3。将来 #11 で UI 選択化可能。
const BEST_OF_WINS = 2
/** best-of-3 の最大ラウンド数。ROUND ヘッダ表示に使う (= 3)。 */
const BEST_OF_MAX_ROUNDS = BEST_OF_WINS * 2 - 1

const HAND_ICON: Record<IdoHand, string> = {
  rock: '🪨',
  scissors: '✂️',
  paper: '📄',
  well: '🕳️',
}

const HEADER_STYLE = {
  fill: 0xffffff,
  fontSize: 22,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
} as const

const SCORE_STYLE = {
  fill: 0xffffff,
  fontSize: 28,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
} as const

const COUNTDOWN_STYLE = {
  fill: 0xffffff,
  fontSize: 72,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
} as const

const REVEAL_HAND_STYLE = {
  fill: 0xffffff,
  fontSize: 120,
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

const MATCH_END_STYLE = {
  fill: 0xffffff,
  fontSize: 64,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold' as const,
} as const

const BUTTON_STYLE = {
  fill: 0xffffff,
  // classic (50/56) より一段小さくして 4 ボタン横並びに対応。
  fontSize: 48,
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

// classic (50/56) より一段小さくして 4 ボタン横並びに対応。
const BUTTON_RADIUS = 48
const BUTTON_Y = STAGE_HEIGHT - 90
/**
 * 4 ボタンを中央寄せで横並びさせる際のボタン間距離 (中心-中心)。
 * 4 個 × 直径 96 + 余白で STAGE_WIDTH=800 に収まる。
 */
const BUTTON_GAP = 130

/**
 * UI ボタン情報。並び順は左→右で 🪨 ✂️ 📄 🕳️ (rock / scissors / paper / well)。
 * 物理キー 1/2/3/4 (select1/2/3/4) との対応は意図的にこの順序: 🪨=1, ✂️=2,
 * 📄=3, 🕳️=4。グー → チョキ → パー → 井戸 の流れに揃えている。
 */
const BUTTONS: { hand: IdoHand; x: number }[] = [
  { hand: 'rock', x: STAGE_WIDTH / 2 - BUTTON_GAP * 1.5 },
  { hand: 'scissors', x: STAGE_WIDTH / 2 - BUTTON_GAP * 0.5 },
  { hand: 'paper', x: STAGE_WIDTH / 2 + BUTTON_GAP * 0.5 },
  { hand: 'well', x: STAGE_WIDTH / 2 + BUTTON_GAP * 1.5 },
]

/**
 * ボタン円の見た目を描画する共通ヘルパ。selected の場合は塗り alpha と
 * stroke 幅を強調する。setPlayerHand / resetForNextRound から呼ぶ。
 */
const drawButton = (g: Graphics, selected: boolean): void => {
  g.clear()
  g.circle(0, 0, BUTTON_RADIUS)
    .fill({ color: 0xffffff, alpha: selected ? 0.4 : 0.18 })
    .stroke({ color: 0xffffff, width: selected ? 4 : 2 })
}

export interface IdoJankenSceneOptions {
  /** AI の乱数源。テストで決定論的に差し替え可能。 */
  random?: AIRandomSource
  /**
   * NpcAI を直接注入する (テスト用)。指定された場合は createAIFromCharacter
   * を呼ばずこれを使用するため、AI の chooseHand を完全に決定論化できる。
   */
  ai?: NpcAI
  /** 強制的に使うキャラクター (テスト用)。未指定なら random で選択。 */
  character?: NpcCharacter
  /** InputManager の addEventListener 対象 (テストで window 以外に貼る用)。 */
  inputTarget?: HTMLElement | Window
}

export interface DebugSnapshot {
  phase: Phase
  round: number
  score: { p1: number; p2: number }
  playerHand?: IdoHand
  npcHand?: IdoHand
  lastResult?: RoundResult
  /** countdown 中の現在ステップ (0..3) */
  countdownStep: number
}

export class IdoJankenScene extends Scene {
  private input: InputManager | null = null
  private inputTarget: HTMLElement | Window
  private random: AIRandomSource
  private ai!: NpcAI
  private character!: NpcCharacter
  private characterDisplay: CharacterDisplay | null = null

  // state
  private phase: Phase = 'countdown'
  private round = 1
  private score = { p1: 0, p2: 0 }
  private playerHand?: IdoHand
  private npcHand?: IdoHand
  private lastResult?: RoundResult
  private countdownStep = 0
  private elapsed = 0

  // UI nodes
  private bgFlash!: Graphics
  private roundText!: Text
  private scoreText!: Text
  private countdownText!: Text
  private playerHandText!: Text
  private npcHandText!: Text
  private matchEndText!: Text
  private buttonContainer!: Container
  private buttonGraphics: Graphics[] = []

  constructor(opts: IdoJankenSceneOptions = {}) {
    super()
    this.random = opts.random ?? { next: () => Math.random() }
    this.inputTarget = opts.inputTarget ?? window

    if (opts.character) {
      this.character = opts.character
    } else {
      const idx = Math.floor(this.random.next() * NPC_CHARACTERS.length)
      this.character = NPC_CHARACTERS[Math.min(idx, NPC_CHARACTERS.length - 1)]
    }
    this.ai = opts.ai ?? createAIFromCharacter(this.character, this.random)

    this.buildUi()
  }

  // ---------- UI ----------

  private buildUi(): void {
    const bgTop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_TOP })
    const bgBottom = new Graphics()
      .rect(0, STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT / 2)
      .fill({ color: BG_COLOR_BOTTOM })
    this.addChild(bgTop)
    this.addChild(bgBottom)

    this.bgFlash = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0xffffff })
    this.bgFlash.alpha = 0
    this.addChild(this.bgFlash)

    const youLabel = new Text({ text: 'YOU', style: HEADER_STYLE })
    youLabel.position.set(24, 20)
    this.addChild(youLabel)

    this.roundText = new Text({
      text: `ROUND ${this.round} / ${BEST_OF_MAX_ROUNDS}`,
      style: HEADER_STYLE,
    })
    this.roundText.anchor.set(0.5, 0)
    this.roundText.position.set(STAGE_WIDTH / 2, 20)
    this.addChild(this.roundText)

    this.scoreText = new Text({
      text: `${this.score.p1} - ${this.score.p2}`,
      style: SCORE_STYLE,
    })
    this.scoreText.anchor.set(0.5, 0)
    this.scoreText.position.set(STAGE_WIDTH / 2, 50)
    this.addChild(this.scoreText)

    this.characterDisplay = new CharacterDisplay(this.character)
    this.characterDisplay.position.set(STAGE_WIDTH - 90, 80)
    this.addChild(this.characterDisplay)

    this.countdownText = new Text({
      text: COUNTDOWN_TEXTS[0],
      style: COUNTDOWN_STYLE,
    })
    this.countdownText.anchor.set(0.5)
    this.countdownText.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2 - 40)
    this.addChild(this.countdownText)

    this.playerHandText = new Text({ text: '', style: REVEAL_HAND_STYLE })
    this.playerHandText.anchor.set(0.5)
    this.playerHandText.position.set(
      STAGE_WIDTH / 2 - 130,
      STAGE_HEIGHT / 2 + 30
    )
    this.playerHandText.visible = false
    this.addChild(this.playerHandText)

    this.npcHandText = new Text({ text: '', style: REVEAL_HAND_STYLE })
    this.npcHandText.anchor.set(0.5)
    this.npcHandText.position.set(STAGE_WIDTH / 2 + 130, STAGE_HEIGHT / 2 + 30)
    this.npcHandText.visible = false
    this.addChild(this.npcHandText)

    this.matchEndText = new Text({ text: '', style: MATCH_END_STYLE })
    this.matchEndText.anchor.set(0.5)
    this.matchEndText.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2)
    this.matchEndText.visible = false
    this.addChild(this.matchEndText)

    this.buttonContainer = new Container()
    this.addChild(this.buttonContainer)
    for (const b of BUTTONS) {
      const g = new Graphics()
        .circle(0, 0, BUTTON_RADIUS)
        .fill({ color: 0xffffff, alpha: 0.18 })
        .stroke({ color: 0xffffff, width: 2 })
      g.position.set(b.x, BUTTON_Y)
      this.buttonContainer.addChild(g)
      this.buttonGraphics.push(g)

      const t = new Text({ text: HAND_ICON[b.hand], style: BUTTON_STYLE })
      t.anchor.set(0.5)
      t.position.set(b.x, BUTTON_Y)
      this.buttonContainer.addChild(t)
    }
  }

  // ---------- lifecycle ----------

  override enter(): void {
    this.input = new InputManager({ target: this.inputTarget })
    this.input.onAction(this.handleAction)
    this.input.onPointer(this.handlePointer)
  }

  override update(deltaMs: number): void {
    this.elapsed += deltaMs

    switch (this.phase) {
      case 'countdown':
        this.tickCountdown()
        break
      case 'reveal':
        this.tickReveal()
        break
      case 'flash':
        this.tickFlash()
        break
      case 'matchEnd':
        this.tickMatchEnd()
        break
    }
  }

  override destroyScene(): void {
    this.input?.dispose()
    this.input = null
    this.characterDisplay = null
    super.destroyScene()
  }

  // ---------- input ----------

  private handleAction = (action: InputAction): void => {
    if (this.phase !== 'countdown') return
    switch (action) {
      case 'select1':
        this.setPlayerHand('rock')
        break
      case 'select2':
        this.setPlayerHand('scissors')
        break
      case 'select3':
        this.setPlayerHand('paper')
        break
      case 'select4':
        this.setPlayerHand('well')
        break
      default:
        break
    }
  }

  private handlePointer = (ev: InputPointerEvent): void => {
    if (this.phase !== 'countdown') return
    for (const b of BUTTONS) {
      const dx = ev.x - b.x
      const dy = ev.y - BUTTON_Y
      if (dx * dx + dy * dy <= BUTTON_RADIUS * BUTTON_RADIUS) {
        this.setPlayerHand(b.hand)
        return
      }
    }
  }

  private setPlayerHand(hand: IdoHand): void {
    this.playerHand = hand
    for (let i = 0; i < BUTTONS.length; i++) {
      drawButton(this.buttonGraphics[i], BUTTONS[i].hand === hand)
    }
  }

  // ---------- phase tick ----------

  private tickCountdown(): void {
    const nextStep = Math.min(
      Math.floor(this.elapsed / COUNTDOWN_STEP_MS),
      COUNTDOWN_TEXTS.length
    )
    if (nextStep > this.countdownStep) {
      this.countdownStep = nextStep
      if (nextStep < COUNTDOWN_TEXTS.length) {
        this.countdownText.text = COUNTDOWN_TEXTS[nextStep]
      }
    }
    if (this.elapsed >= COUNTDOWN_TOTAL_MS) {
      this.enterReveal()
    }
  }

  private enterReveal(): void {
    // プレイヤー未選択ならランダム救済 (4 手から)。
    if (!this.playerHand) {
      const hands: IdoHand[] = ['rock', 'scissors', 'paper', 'well']
      const idx = Math.floor(this.random.next() * hands.length)
      this.playerHand = hands[Math.min(idx, hands.length - 1)]
    }
    // ido_janken は 4 手 (well 含む) を 1st-class に受けるため、
    // ClassicRpsScene のような well フォールバック warn は不要。
    // NpcAI.chooseHand の戻り型 (Hand | IdoHand) は IdoHand と構造的に互換。
    this.npcHand = this.ai.chooseHand('ido_janken')

    this.lastResult = judgeIdoJanken(this.playerHand, this.npcHand)

    this.phase = 'reveal'
    this.elapsed = 0
    this.countdownText.visible = false
    this.playerHandText.text = HAND_ICON[this.playerHand]
    this.npcHandText.text = HAND_ICON[this.npcHand]
    this.playerHandText.visible = true
    this.npcHandText.visible = true
    // CharacterDisplay.setHand は IdoHand を受け付ける (well も渡せる)。
    this.characterDisplay?.setHand(this.npcHand)
  }

  private tickReveal(): void {
    if (this.elapsed >= REVEAL_HOLD_MS) {
      this.enterFlash()
    }
  }

  private enterFlash(): void {
    this.phase = 'flash'
    this.elapsed = 0
    const color =
      this.lastResult === 'win'
        ? COLOR_WIN
        : this.lastResult === 'lose'
          ? COLOR_LOSE
          : COLOR_DRAW
    this.bgFlash.clear()
    this.bgFlash.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill({ color })
    this.bgFlash.alpha = 0.5
  }

  private tickFlash(): void {
    const t = Math.min(this.elapsed / FLASH_MS, 1)
    this.bgFlash.alpha = 0.5 * (1 - t)
    if (this.elapsed >= FLASH_MS) {
      this.afterFlash()
    }
  }

  private afterFlash(): void {
    if (this.lastResult === 'win') this.score.p1++
    else if (this.lastResult === 'lose') this.score.p2++
    this.scoreText.text = `${this.score.p1} - ${this.score.p2}`

    if (this.score.p1 >= BEST_OF_WINS || this.score.p2 >= BEST_OF_WINS) {
      this.enterMatchEnd()
      return
    }

    this.round++
    this.roundText.text = `ROUND ${this.round} / ${BEST_OF_MAX_ROUNDS}`
    this.resetForNextRound()
  }

  private resetForNextRound(): void {
    this.phase = 'countdown'
    this.elapsed = 0
    this.countdownStep = 0
    this.playerHand = undefined
    this.npcHand = undefined
    this.lastResult = undefined
    this.countdownText.text = COUNTDOWN_TEXTS[0]
    this.countdownText.visible = true
    this.playerHandText.visible = false
    this.npcHandText.visible = false
    this.characterDisplay?.setHand(undefined)
    for (const g of this.buttonGraphics) {
      drawButton(g, false)
    }
  }

  private enterMatchEnd(): void {
    this.phase = 'matchEnd'
    this.elapsed = 0
    const win = this.score.p1 >= BEST_OF_WINS
    this.matchEndText.text = win ? 'YOU WIN!' : 'YOU LOSE...'
    this.matchEndText.style = {
      ...MATCH_END_STYLE,
      fill: win ? COLOR_WIN : COLOR_LOSE,
    }
    this.matchEndText.visible = true
    this.countdownText.visible = false
  }

  private tickMatchEnd(): void {
    if (this.elapsed >= MATCH_END_MS) {
      const result: RoundResult =
        this.score.p1 >= BEST_OF_WINS
          ? 'win'
          : this.score.p2 >= BEST_OF_WINS
            ? 'lose'
            : 'draw'
      this.exit({ next: 'result', result })
    }
  }

  // ---------- test helper ----------

  /**
   * テストから内部 state を読むための公開フック。
   * 本番コードからは呼ばないこと。
   * @internal
   */
  getDebugSnapshot(): DebugSnapshot {
    return {
      phase: this.phase,
      round: this.round,
      score: { p1: this.score.p1, p2: this.score.p2 },
      playerHand: this.playerHand,
      npcHand: this.npcHand,
      lastResult: this.lastResult,
      countdownStep: this.countdownStep,
    }
  }
}
