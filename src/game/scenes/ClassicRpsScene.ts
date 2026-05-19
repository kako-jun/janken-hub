// Classic RPS (3 手じゃんけん) シーン (Issue #7)。
//
// best-of-3 (先取 2 勝) でラウンドを回し、最終結果を ResultScene に渡す。
// 進行は state machine (countdown → reveal → flash → countdown ... → matchEnd)。
//
// 設計メモ:
// - 判定ロジックは ./rules/classic_rps の純粋関数に委譲
// - NPC AI は createAIFromCharacter で character から組み立て
// - 入力は InputManager で抽象化 (select1=rock, select2=scissors, select3=paper)
// - 確率依存を避けるため AIRandomSource をテストで差し替え可能 (constructor 引数)
// - 内部 state は getDebugSnapshot() で読めるようにして、テスト時に直接覗ける

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
import type { Hand, RoundResult } from '../types'
import { judgeClassicRps } from '../rules/classic_rps'

type Phase = 'countdown' | 'reveal' | 'flash' | 'matchEnd'

const COUNTDOWN_STEP_MS = 500
/** countdown のテキスト。step 3 ("ポン!") の終端で reveal へ遷移する。 */
const COUNTDOWN_TEXTS = ['最初はグー', 'ジャン', 'ケン', 'ポン!']
const REVEAL_HOLD_MS = 400
const FLASH_MS = 600
const MATCH_END_MS = 1000
const BEST_OF_WINS = 2 // 先取 2 勝 = best-of-3

const HAND_ICON: Record<Hand, string> = {
  rock: '✊',
  scissors: '✌',
  paper: '✋',
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
  fontSize: 56,
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

const BUTTON_RADIUS = 50
const BUTTON_Y = STAGE_HEIGHT - 90

/** UI ボタン情報。順序は ✊ ✌ ✋ で select1/2/3 に対応。 */
const BUTTONS: { hand: Hand; x: number }[] = [
  { hand: 'rock', x: STAGE_WIDTH / 2 - 140 },
  { hand: 'scissors', x: STAGE_WIDTH / 2 },
  { hand: 'paper', x: STAGE_WIDTH / 2 + 140 },
]

export interface ClassicRpsSceneOptions {
  /** AI の乱数源。テストで決定論的に差し替え可能。 */
  random?: AIRandomSource
  /** 強制的に使うキャラクター (テスト用)。未指定なら random で選択。 */
  character?: NpcCharacter
  /** InputManager の addEventListener 対象 (テストで window 以外に貼る用)。 */
  inputTarget?: HTMLElement | Window
}

export interface DebugSnapshot {
  phase: Phase
  round: number
  score: { p1: number; p2: number }
  playerHand?: Hand
  npcHand?: Hand
  lastResult?: RoundResult
  /** countdown 中の現在ステップ (0..3) */
  countdownStep: number
}

export class ClassicRpsScene extends Scene {
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
  private playerHand?: Hand
  private npcHand?: Hand
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

  constructor(opts: ClassicRpsSceneOptions = {}) {
    super()
    this.random = opts.random ?? { next: () => Math.random() }
    this.inputTarget = opts.inputTarget ?? window

    // キャラクター選択 (forced → random)。
    if (opts.character) {
      this.character = opts.character
    } else {
      const idx = Math.floor(this.random.next() * NPC_CHARACTERS.length)
      this.character = NPC_CHARACTERS[Math.min(idx, NPC_CHARACTERS.length - 1)]
    }
    this.ai = createAIFromCharacter(this.character, this.random)

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

    // flash overlay (reveal 結果色)。alpha 0 で見えない。
    this.bgFlash = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0xffffff })
    this.bgFlash.alpha = 0
    this.addChild(this.bgFlash)

    // 左上 YOU
    const youLabel = new Text({ text: 'YOU', style: HEADER_STYLE })
    youLabel.position.set(24, 20)
    this.addChild(youLabel)

    // 上部中央: ROUND
    this.roundText = new Text({
      text: `ROUND ${this.round} / 3`,
      style: HEADER_STYLE,
    })
    this.roundText.anchor.set(0.5, 0)
    this.roundText.position.set(STAGE_WIDTH / 2, 20)
    this.addChild(this.roundText)

    // 上部: スコア表示 (中央下)
    this.scoreText = new Text({
      text: `${this.score.p1} - ${this.score.p2}`,
      style: SCORE_STYLE,
    })
    this.scoreText.anchor.set(0.5, 0)
    this.scoreText.position.set(STAGE_WIDTH / 2, 50)
    this.addChild(this.scoreText)

    // 右上: CharacterDisplay
    this.characterDisplay = new CharacterDisplay(this.character)
    this.characterDisplay.position.set(STAGE_WIDTH - 90, 80)
    this.addChild(this.characterDisplay)

    // 中央: countdown
    this.countdownText = new Text({
      text: COUNTDOWN_TEXTS[0],
      style: COUNTDOWN_STYLE,
    })
    this.countdownText.anchor.set(0.5)
    this.countdownText.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2 - 40)
    this.addChild(this.countdownText)

    // reveal 用の手 (左=自分, 右=NPC)
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

    // matchEnd メッセージ
    this.matchEndText = new Text({ text: '', style: MATCH_END_STYLE })
    this.matchEndText.anchor.set(0.5)
    this.matchEndText.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2)
    this.matchEndText.visible = false
    this.addChild(this.matchEndText)

    // 下: 3 ボタン (✊ ✌ ✋)
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
    // CharacterDisplay は this.addChild 済みなので super.destroyScene の
    // children: true で連鎖破棄される。参照だけ落としてリーク防止。
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
      default:
        // confirm/cancel/up/down/... は countdown 中は no-op
        break
    }
  }

  private handlePointer = (ev: InputPointerEvent): void => {
    if (this.phase !== 'countdown') return
    // ボタン円との距離判定。最も近いボタン半径内なら確定。
    for (const b of BUTTONS) {
      const dx = ev.x - b.x
      const dy = ev.y - BUTTON_Y
      if (dx * dx + dy * dy <= BUTTON_RADIUS * BUTTON_RADIUS) {
        this.setPlayerHand(b.hand)
        return
      }
    }
  }

  private setPlayerHand(hand: Hand): void {
    this.playerHand = hand
    // ボタンハイライトを更新。
    for (let i = 0; i < BUTTONS.length; i++) {
      const isSelected = BUTTONS[i].hand === hand
      const g = this.buttonGraphics[i]
      g.clear()
      g.circle(0, 0, BUTTON_RADIUS)
        .fill({ color: 0xffffff, alpha: isSelected ? 0.4 : 0.18 })
        .stroke({ color: 0xffffff, width: isSelected ? 4 : 2 })
    }
  }

  // ---------- phase tick ----------

  private tickCountdown(): void {
    // step 0..3 を 500ms ずつ進める。step 3 ("ポン!") を表示し終えたら reveal。
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
    // 全 step (0,1,2,3) を表示し終えたら reveal へ。
    if (this.elapsed >= COUNTDOWN_STEP_MS * COUNTDOWN_TEXTS.length) {
      this.enterReveal()
    }
  }

  private enterReveal(): void {
    // プレイヤー未選択ならランダム救済 (ペナルティではなく)。
    if (!this.playerHand) {
      const hands: Hand[] = ['rock', 'scissors', 'paper']
      const idx = Math.floor(this.random.next() * hands.length)
      this.playerHand = hands[Math.min(idx, hands.length - 1)]
    }
    // NPC の手を決定。
    const npcMove = this.ai.chooseHand('classic_rps')
    // classic_rps では NPC AI は Hand のみを返すが、IdoHand 型でも返り得るため
    // 'well' が来た場合は rock にフォールバック (現状の RandomAI/WeightedAI は
    // 'well' を返さない実装だが、念のためのガード)。
    this.npcHand = npcMove === 'well' ? 'rock' : (npcMove as Hand)

    this.lastResult = judgeClassicRps(this.playerHand, this.npcHand)

    this.phase = 'reveal'
    this.elapsed = 0
    this.countdownText.visible = false
    this.playerHandText.text = HAND_ICON[this.playerHand]
    this.npcHandText.text = HAND_ICON[this.npcHand]
    this.playerHandText.visible = true
    this.npcHandText.visible = true
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
    // フェードアウト
    const t = Math.min(this.elapsed / FLASH_MS, 1)
    this.bgFlash.alpha = 0.5 * (1 - t)
    if (this.elapsed >= FLASH_MS) {
      this.afterFlash()
    }
  }

  private afterFlash(): void {
    // スコア更新。
    if (this.lastResult === 'win') this.score.p1++
    else if (this.lastResult === 'lose') this.score.p2++
    this.scoreText.text = `${this.score.p1} - ${this.score.p2}`

    // 先取 2 勝判定。
    if (this.score.p1 >= BEST_OF_WINS || this.score.p2 >= BEST_OF_WINS) {
      this.enterMatchEnd()
      return
    }

    // 次のラウンドへ。
    this.round++
    this.roundText.text = `ROUND ${this.round} / 3`
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
    // ボタンハイライト解除
    for (let i = 0; i < this.buttonGraphics.length; i++) {
      const g = this.buttonGraphics[i]
      g.clear()
      g.circle(0, 0, BUTTON_RADIUS)
        .fill({ color: 0xffffff, alpha: 0.18 })
        .stroke({ color: 0xffffff, width: 2 })
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
    this.playerHandText.visible = false
    this.npcHandText.visible = false
    this.countdownText.visible = false
  }

  private tickMatchEnd(): void {
    if (this.elapsed >= MATCH_END_MS) {
      const result: RoundResult = this.score.p1 >= BEST_OF_WINS ? 'win' : 'lose'
      // 入力を即切ってから exit (handleExit 中に新規 listener が走らないように)
      this.input?.dispose()
      this.input = null
      this.exit({ next: 'result', result })
    }
  }

  // ---------- test helper ----------

  /** テストから内部 state を読むための公開フック。 */
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
