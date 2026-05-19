// Achi Muite Hoi (あっちむいてホイ) シーン (Issue #9)。
//
// じゃんけん → 方向選択の 2 段階フロー:
//   1. じゃんけんで勝った側 (attacker) が方向を指差す
//   2. 負けた側 (defender) も方向を向く
//   3. 一致なら attacker に 1 point。不一致なら point は動かず再じゃんけん
//   4. draw のじゃんけんはそのまま再じゃんけん
//
// state machine:
//   jankenCountdown → jankenReveal → jankenFlash
//     ├─ draw  → jankenCountdown (再じゃんけん)
//     └─ 勝敗 → achiCountdown → achiReveal → achiFlash
//                                 ├─ 一致   → attacker に point → matchEnd or jankenCountdown
//                                 └─ 不一致 → jankenCountdown (再じゃんけん)
//
// 先取 2 point で matchEnd → exit('result', win/lose)。
// round 概念ではなく **point 数で表示** する (draw/miss で round 数が膨れるため)。

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
import type { Direction, Hand, RoundResult } from '../types'
import { judgeClassicRps } from '../rules/classic_rps'
import { judgeAchiPhase } from '../rules/achi_muite_hoi'

type Phase =
  | 'jankenCountdown'
  | 'jankenReveal'
  | 'jankenFlash'
  | 'achiCountdown'
  | 'achiReveal'
  | 'achiFlash'
  | 'matchEnd'

const COUNTDOWN_STEP_MS = 500
/** じゃんけん countdown のテキスト */
const JANKEN_COUNTDOWN_TEXTS = ['最初はグー', 'ジャン', 'ケン', 'ポン!']
/** あっち向いてホイ countdown のテキスト */
const ACHI_COUNTDOWN_TEXTS = ['あっちむいて', 'ホイ!']
/** janken countdown 合計 ms (テスト参照) */
export const JANKEN_COUNTDOWN_TOTAL_MS =
  COUNTDOWN_STEP_MS * JANKEN_COUNTDOWN_TEXTS.length
/**
 * achi countdown 合計 ms (テスト参照)。
 * defender 役 (NPC 攻めのケース) でも反応時間を確保したいので、
 * テキスト数 * step より長め (COUNTDOWN_STEP_MS * 3 相当 = 1500ms) に設定する。
 */
export const ACHI_COUNTDOWN_TOTAL_MS = COUNTDOWN_STEP_MS * 3
const REVEAL_HOLD_MS = 400
const FLASH_MS = 600
const MATCH_END_MS = 1000
/** 先取 2 point で勝利 */
const BEST_OF_WINS = 2

const HAND_ICON: Record<Hand, string> = {
  rock: '✊',
  scissors: '✌',
  paper: '✋',
}

const DIR_ICON: Record<Direction, string> = {
  up: '☝',
  down: '👇',
  left: '👈',
  right: '👉',
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
/** janken phase の 3 ボタン Y 座標 (横一列) */
const BUTTON_Y = STAGE_HEIGHT - 90

/**
 * janken phase の 3 ボタン (✊ ✌ ✋)。
 * 物理キー 1/2/3 (select1/2/3) との対応は ✊=1, ✌=2, ✋=3。
 */
const JANKEN_BUTTONS: { hand: Hand; x: number }[] = [
  { hand: 'rock', x: STAGE_WIDTH / 2 - 140 },
  { hand: 'scissors', x: STAGE_WIDTH / 2 },
  { hand: 'paper', x: STAGE_WIDTH / 2 + 140 },
]

/**
 * achi phase の 4 ボタン (↑↓←→)。中央 ✕ 配置:
 *   - 上↑ (x=center, y=center-gap)
 *   - 左← (x=center-gap, y=center)
 *   - 右→ (x=center+gap, y=center)
 *   - 下↓ (x=center, y=center+gap)
 *
 * 矢印キー (up/down/left/right) との対応はそのまま。
 */
const ACHI_BUTTON_CENTER_X = STAGE_WIDTH / 2
/**
 * achi ボタンの中心 Y 座標。
 * 下↓ボタンが STAGE 下端からはみ出さないようにする:
 *   center_y + GAP + RADIUS <= STAGE_HEIGHT
 *   STAGE_HEIGHT(600) - 170 + 100 + 50 = 580 <= 600
 */
const ACHI_CENTER_Y = STAGE_HEIGHT - 170
const ACHI_BUTTON_CENTER_Y = ACHI_CENTER_Y
/**
 * 隣接ボタン中心距離は sqrt(2)*GAP = 141px。
 * BUTTON_RADIUS=50 で直径 100px なので約 41px の余裕がある。
 */
const ACHI_BUTTON_GAP = 100
const ACHI_BUTTONS: { dir: Direction; x: number; y: number }[] = [
  {
    dir: 'up',
    x: ACHI_BUTTON_CENTER_X,
    y: ACHI_BUTTON_CENTER_Y - ACHI_BUTTON_GAP,
  },
  {
    dir: 'left',
    x: ACHI_BUTTON_CENTER_X - ACHI_BUTTON_GAP,
    y: ACHI_BUTTON_CENTER_Y,
  },
  {
    dir: 'right',
    x: ACHI_BUTTON_CENTER_X + ACHI_BUTTON_GAP,
    y: ACHI_BUTTON_CENTER_Y,
  },
  {
    dir: 'down',
    x: ACHI_BUTTON_CENTER_X,
    y: ACHI_BUTTON_CENTER_Y + ACHI_BUTTON_GAP,
  },
]

/** ボタン円の描画ヘルパ (selected で強調)。 */
const drawButton = (g: Graphics, selected: boolean): void => {
  g.clear()
  g.circle(0, 0, BUTTON_RADIUS)
    .fill({ color: 0xffffff, alpha: selected ? 0.4 : 0.18 })
    .stroke({ color: 0xffffff, width: selected ? 4 : 2 })
}

export interface AchiMuiteHoiSceneOptions {
  /** AI の乱数源。テストで決定論的に差し替え可能。 */
  random?: AIRandomSource
  /** NpcAI を直接注入する (テスト用)。 */
  ai?: NpcAI
  /** 強制的に使うキャラクター (テスト用)。 */
  character?: NpcCharacter
  /** InputManager の addEventListener 対象 (テストで window 以外に貼る用)。 */
  inputTarget?: HTMLElement | Window
}

export interface DebugSnapshot {
  phase: Phase
  score: { p1: number; p2: number }
  /** 直前のじゃんけんで勝った側 (achi phase の attacker) */
  attacker?: 'p1' | 'p2'
  playerHand?: Hand
  npcHand?: Hand
  playerDir?: Direction
  npcDir?: Direction
  lastJankenResult?: RoundResult
  lastAchiResult?: RoundResult
  /** countdown 中の現在ステップ */
  countdownStep: number
}

export class AchiMuiteHoiScene extends Scene {
  private input: InputManager | null = null
  private inputTarget: HTMLElement | Window
  private random: AIRandomSource
  private ai!: NpcAI
  private character!: NpcCharacter
  private characterDisplay: CharacterDisplay | null = null

  // state
  private phase: Phase = 'jankenCountdown'
  private score = { p1: 0, p2: 0 }
  private attacker?: 'p1' | 'p2'
  private playerHand?: Hand
  private npcHand?: Hand
  private playerDir?: Direction
  private npcDir?: Direction
  private lastJankenResult?: RoundResult
  private lastAchiResult?: RoundResult
  private countdownStep = 0
  private elapsed = 0

  // UI nodes
  private bgFlash!: Graphics
  private headerText!: Text
  private scoreText!: Text
  private roleText!: Text
  private countdownText!: Text
  private playerHandText!: Text
  private npcHandText!: Text
  private matchEndText!: Text
  private jankenButtonContainer!: Container
  private jankenButtonGraphics: Graphics[] = []
  private achiButtonContainer!: Container
  private achiButtonGraphics: Graphics[] = []

  constructor(opts: AchiMuiteHoiSceneOptions = {}) {
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

    // 左上 YOU
    const youLabel = new Text({ text: 'YOU', style: HEADER_STYLE })
    youLabel.position.set(24, 20)
    this.addChild(youLabel)

    // 上部中央: POINTS ヘッダ (round ではなく point で表示)
    this.headerText = new Text({
      text: `POINTS (FIRST TO ${BEST_OF_WINS})`,
      style: HEADER_STYLE,
    })
    this.headerText.anchor.set(0.5, 0)
    this.headerText.position.set(STAGE_WIDTH / 2, 20)
    this.addChild(this.headerText)

    // 上部: スコア
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

    // 中央上部: role 表示 (achi phase 中に「あなたが攻め!」「あなたが受け!」)
    this.roleText = new Text({ text: '', style: HEADER_STYLE })
    this.roleText.anchor.set(0.5)
    this.roleText.position.set(STAGE_WIDTH / 2, 100)
    this.roleText.visible = false
    this.addChild(this.roleText)

    // 中央: countdown
    this.countdownText = new Text({
      text: JANKEN_COUNTDOWN_TEXTS[0],
      style: COUNTDOWN_STYLE,
    })
    this.countdownText.anchor.set(0.5)
    this.countdownText.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2 - 60)
    this.addChild(this.countdownText)

    // reveal 用の表示 (左=自分, 右=NPC)
    this.playerHandText = new Text({ text: '', style: REVEAL_HAND_STYLE })
    this.playerHandText.anchor.set(0.5)
    this.playerHandText.position.set(
      STAGE_WIDTH / 2 - 130,
      STAGE_HEIGHT / 2 + 10
    )
    this.playerHandText.visible = false
    this.addChild(this.playerHandText)

    this.npcHandText = new Text({ text: '', style: REVEAL_HAND_STYLE })
    this.npcHandText.anchor.set(0.5)
    this.npcHandText.position.set(STAGE_WIDTH / 2 + 130, STAGE_HEIGHT / 2 + 10)
    this.npcHandText.visible = false
    this.addChild(this.npcHandText)

    // matchEnd メッセージ
    this.matchEndText = new Text({ text: '', style: MATCH_END_STYLE })
    this.matchEndText.anchor.set(0.5)
    this.matchEndText.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2)
    this.matchEndText.visible = false
    this.addChild(this.matchEndText)

    // 下: janken 3 ボタン (✊ ✌ ✋)
    this.jankenButtonContainer = new Container()
    this.addChild(this.jankenButtonContainer)
    for (const b of JANKEN_BUTTONS) {
      const g = new Graphics()
        .circle(0, 0, BUTTON_RADIUS)
        .fill({ color: 0xffffff, alpha: 0.18 })
        .stroke({ color: 0xffffff, width: 2 })
      g.position.set(b.x, BUTTON_Y)
      this.jankenButtonContainer.addChild(g)
      this.jankenButtonGraphics.push(g)

      const t = new Text({ text: HAND_ICON[b.hand], style: BUTTON_STYLE })
      t.anchor.set(0.5)
      t.position.set(b.x, BUTTON_Y)
      this.jankenButtonContainer.addChild(t)
    }

    // 下: achi 4 ボタン (中央 ✕)
    this.achiButtonContainer = new Container()
    this.achiButtonContainer.visible = false
    this.addChild(this.achiButtonContainer)
    for (const b of ACHI_BUTTONS) {
      const g = new Graphics()
        .circle(0, 0, BUTTON_RADIUS)
        .fill({ color: 0xffffff, alpha: 0.18 })
        .stroke({ color: 0xffffff, width: 2 })
      g.position.set(b.x, b.y)
      this.achiButtonContainer.addChild(g)
      this.achiButtonGraphics.push(g)

      const t = new Text({ text: DIR_ICON[b.dir], style: BUTTON_STYLE })
      t.anchor.set(0.5)
      t.position.set(b.x, b.y)
      this.achiButtonContainer.addChild(t)
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
      case 'jankenCountdown':
        this.tickJankenCountdown()
        break
      case 'jankenReveal':
        this.tickJankenReveal()
        break
      case 'jankenFlash':
        this.tickJankenFlash()
        break
      case 'achiCountdown':
        this.tickAchiCountdown()
        break
      case 'achiReveal':
        this.tickAchiReveal()
        break
      case 'achiFlash':
        this.tickAchiFlash()
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
    // janken phase の countdown 中だけ 1/2/3 を受け付ける。
    if (this.phase === 'jankenCountdown') {
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
          break
      }
      return
    }
    // achi phase の countdown 中だけ ↑↓←→ を受け付ける。
    if (this.phase === 'achiCountdown') {
      switch (action) {
        case 'up':
          this.setPlayerDir('up')
          break
        case 'down':
          this.setPlayerDir('down')
          break
        case 'left':
          this.setPlayerDir('left')
          break
        case 'right':
          this.setPlayerDir('right')
          break
        default:
          break
      }
      return
    }
    // 他 phase は意図的に no-op (reveal/flash/matchEnd 中の入力は無視)。
  }

  private handlePointer = (ev: InputPointerEvent): void => {
    if (this.phase === 'jankenCountdown') {
      for (const b of JANKEN_BUTTONS) {
        const dx = ev.x - b.x
        const dy = ev.y - BUTTON_Y
        if (dx * dx + dy * dy <= BUTTON_RADIUS * BUTTON_RADIUS) {
          this.setPlayerHand(b.hand)
          return
        }
      }
      return
    }
    if (this.phase === 'achiCountdown') {
      for (const b of ACHI_BUTTONS) {
        const dx = ev.x - b.x
        const dy = ev.y - b.y
        if (dx * dx + dy * dy <= BUTTON_RADIUS * BUTTON_RADIUS) {
          this.setPlayerDir(b.dir)
          return
        }
      }
      return
    }
  }

  private setPlayerHand(hand: Hand): void {
    this.playerHand = hand
    for (let i = 0; i < JANKEN_BUTTONS.length; i++) {
      drawButton(this.jankenButtonGraphics[i], JANKEN_BUTTONS[i].hand === hand)
    }
  }

  private setPlayerDir(dir: Direction): void {
    this.playerDir = dir
    for (let i = 0; i < ACHI_BUTTONS.length; i++) {
      drawButton(this.achiButtonGraphics[i], ACHI_BUTTONS[i].dir === dir)
    }
  }

  // ---------- janken phase ----------

  /**
   * countdown の経過時間からステップを進め、必要ならテキストを更新する。
   * tickJankenCountdown / tickAchiCountdown 共通ロジック。
   *
   * @param totalMs countdown 合計 ms (これを超えたら finished=true)
   * @param stepMs  1 ステップの ms (= COUNTDOWN_STEP_MS)
   * @param texts   ステップごとのテキスト
   * @returns { step: 進んだ後の countdownStep, finished: totalMs を超えたか }
   */
  private progressCountdown(
    totalMs: number,
    stepMs: number,
    texts: readonly string[]
  ): { step: number; finished: boolean } {
    const nextStep = Math.min(Math.floor(this.elapsed / stepMs), texts.length)
    if (nextStep > this.countdownStep) {
      this.countdownStep = nextStep
      if (nextStep < texts.length) {
        this.countdownText.text = texts[nextStep]
      }
    }
    return { step: this.countdownStep, finished: this.elapsed >= totalMs }
  }

  private tickJankenCountdown(): void {
    const { finished } = this.progressCountdown(
      JANKEN_COUNTDOWN_TOTAL_MS,
      COUNTDOWN_STEP_MS,
      JANKEN_COUNTDOWN_TEXTS
    )
    if (finished) {
      this.enterJankenReveal()
    }
  }

  private enterJankenReveal(): void {
    // プレイヤー未選択ならランダム救済。
    if (!this.playerHand) {
      const hands: Hand[] = ['rock', 'scissors', 'paper']
      const idx = Math.floor(this.random.next() * hands.length)
      this.playerHand = hands[Math.min(idx, hands.length - 1)]
    }
    // NPC の手 (classic_rps として 3 手から選ぶ)。
    const npcMove = this.ai.chooseHand('classic_rps')
    // 'well' は classic_rps では契約違反。rock 固定だと AI のクセが偏るので、
    // 3 手 (rock/scissors/paper) から再抽選する。
    if (npcMove === 'well') {
      console.warn(
        '[AchiMuiteHoiScene] NPC returned well for classic_rps; re-rolling among rock/scissors/paper'
      )
      const hands: Hand[] = ['rock', 'scissors', 'paper']
      const idx = Math.floor(this.random.next() * 3)
      this.npcHand = hands[Math.min(idx, hands.length - 1)]
    } else {
      this.npcHand = npcMove as Hand
    }

    this.lastJankenResult = judgeClassicRps(this.playerHand, this.npcHand)

    this.phase = 'jankenReveal'
    this.elapsed = 0
    this.countdownText.visible = false
    this.playerHandText.text = HAND_ICON[this.playerHand]
    this.npcHandText.text = HAND_ICON[this.npcHand]
    this.playerHandText.visible = true
    this.npcHandText.visible = true
    this.characterDisplay?.setHand(this.npcHand)
  }

  private tickJankenReveal(): void {
    if (this.elapsed >= REVEAL_HOLD_MS) {
      this.enterJankenFlash()
    }
  }

  private enterJankenFlash(): void {
    this.phase = 'jankenFlash'
    this.elapsed = 0
    const color =
      this.lastJankenResult === 'win'
        ? COLOR_WIN
        : this.lastJankenResult === 'lose'
          ? COLOR_LOSE
          : COLOR_DRAW
    this.bgFlash.clear()
    this.bgFlash.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill({ color })
    this.bgFlash.alpha = 0.5
  }

  private tickJankenFlash(): void {
    const t = Math.min(this.elapsed / FLASH_MS, 1)
    this.bgFlash.alpha = 0.5 * (1 - t)
    if (this.elapsed >= FLASH_MS) {
      this.afterJankenFlash()
    }
  }

  private afterJankenFlash(): void {
    // draw → 再じゃんけん
    if (this.lastJankenResult === 'draw') {
      this.resetForJankenRound()
      return
    }
    // 勝敗確定 → attacker を決めて achi phase へ
    this.attacker = this.lastJankenResult === 'win' ? 'p1' : 'p2'
    this.enterAchiCountdown()
  }

  // ---------- achi phase ----------

  private enterAchiCountdown(): void {
    this.phase = 'achiCountdown'
    this.elapsed = 0
    this.countdownStep = 0
    this.countdownText.text = ACHI_COUNTDOWN_TEXTS[0]
    this.countdownText.visible = true
    // janken の手 reveal 用テキストは隠す。
    // achi phase の reveal 時に同じ Text オブジェクトを使い回して方向アイコン
    // (DIR_ICON) を表示するため、ここで一度クリアする。
    // (専用 playerDirText を設けない簡易構成。デザイン変更時は再検討)
    this.playerHandText.visible = false
    this.npcHandText.visible = false
    // ボタン切替: janken hide, achi show
    this.jankenButtonContainer.visible = false
    this.achiButtonContainer.visible = true
    // ボタンハイライト解除
    for (const g of this.achiButtonGraphics) {
      drawButton(g, false)
    }
    // role 表示
    this.roleText.text =
      this.attacker === 'p1'
        ? 'あなたが攻め! 方向を指せ'
        : 'あなたが受け! 別の方向を向け'
    this.roleText.visible = true
    // playerDir/npcDir はリセット
    this.playerDir = undefined
    this.npcDir = undefined
  }

  private tickAchiCountdown(): void {
    const { finished } = this.progressCountdown(
      ACHI_COUNTDOWN_TOTAL_MS,
      COUNTDOWN_STEP_MS,
      ACHI_COUNTDOWN_TEXTS
    )
    if (finished) {
      this.enterAchiReveal()
    }
  }

  private enterAchiReveal(): void {
    // プレイヤー未選択ならランダム救済。
    if (!this.playerDir) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right']
      const idx = Math.floor(this.random.next() * dirs.length)
      this.playerDir = dirs[Math.min(idx, dirs.length - 1)]
    }
    this.npcDir = this.ai.chooseDirection()

    // attacker 視点で一致判定。
    // attacker=p1 (プレイヤー攻め): attackerDir=playerDir, defenderDir=npcDir
    // attacker=p2 (NPC 攻め): attackerDir=npcDir, defenderDir=playerDir
    const attackerDir = this.attacker === 'p1' ? this.playerDir : this.npcDir
    const defenderDir = this.attacker === 'p1' ? this.npcDir : this.playerDir
    this.lastAchiResult = judgeAchiPhase(attackerDir, defenderDir)

    this.phase = 'achiReveal'
    this.elapsed = 0
    this.countdownText.visible = false
    this.playerHandText.text = DIR_ICON[this.playerDir]
    this.npcHandText.text = DIR_ICON[this.npcDir]
    this.playerHandText.visible = true
    this.npcHandText.visible = true
  }

  private tickAchiReveal(): void {
    if (this.elapsed >= REVEAL_HOLD_MS) {
      this.enterAchiFlash()
    }
  }

  private enterAchiFlash(): void {
    this.phase = 'achiFlash'
    this.elapsed = 0
    // attacker 視点で一致なら 'win' (= attacker point)。
    // プレイヤー視点では: attacker=p1 で win なら player point, attacker=p2 で win なら npc point。
    // playerView は背景フラッシュ色の選択にのみ使う。
    // lastAchiResult === 'lose' (= 方向が一致せず) のケースは「どちらにも
    // point が入らない」中立状態なので、playerView 上では 'draw' に丸めて
    // COLOR_DRAW で描画する。
    const playerView: RoundResult =
      this.lastAchiResult === 'win'
        ? this.attacker === 'p1'
          ? 'win'
          : 'lose'
        : 'draw' // 'lose' (一致せず) は playerView の color 選択上 draw 扱いにする
    const color =
      playerView === 'win'
        ? COLOR_WIN
        : playerView === 'lose'
          ? COLOR_LOSE
          : COLOR_DRAW
    this.bgFlash.clear()
    this.bgFlash.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill({ color })
    this.bgFlash.alpha = 0.5
  }

  private tickAchiFlash(): void {
    const t = Math.min(this.elapsed / FLASH_MS, 1)
    this.bgFlash.alpha = 0.5 * (1 - t)
    if (this.elapsed >= FLASH_MS) {
      this.afterAchiFlash()
    }
  }

  private afterAchiFlash(): void {
    // 一致した場合、attacker に 1 point。
    if (this.lastAchiResult === 'win') {
      if (this.attacker === 'p1') this.score.p1++
      else this.score.p2++
      this.scoreText.text = `${this.score.p1} - ${this.score.p2}`
    }
    // 先取判定
    if (this.score.p1 >= BEST_OF_WINS || this.score.p2 >= BEST_OF_WINS) {
      this.enterMatchEnd()
      return
    }
    // 続行 → 再じゃんけん
    this.resetForJankenRound()
  }

  private resetForJankenRound(): void {
    this.phase = 'jankenCountdown'
    this.elapsed = 0
    this.countdownStep = 0
    this.playerHand = undefined
    this.npcHand = undefined
    this.playerDir = undefined
    this.npcDir = undefined
    this.lastJankenResult = undefined
    this.lastAchiResult = undefined
    this.attacker = undefined
    this.countdownText.text = JANKEN_COUNTDOWN_TEXTS[0]
    this.countdownText.visible = true
    this.playerHandText.visible = false
    this.npcHandText.visible = false
    this.roleText.visible = false
    this.jankenButtonContainer.visible = true
    this.achiButtonContainer.visible = false
    this.characterDisplay?.setHand(undefined)
    for (const g of this.jankenButtonGraphics) {
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
      // input.dispose は destroyScene で一元化。tickMatchEnd では呼ばない。
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
      score: { p1: this.score.p1, p2: this.score.p2 },
      attacker: this.attacker,
      playerHand: this.playerHand,
      npcHand: this.npcHand,
      playerDir: this.playerDir,
      npcDir: this.npcDir,
      lastJankenResult: this.lastJankenResult,
      lastAchiResult: this.lastAchiResult,
      countdownStep: this.countdownStep,
    }
  }
}
