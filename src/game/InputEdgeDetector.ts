// 入力エッジ検出ユーティリティ。
//
// シーン (TitleScene / GameScene / ResultScene) で「Space / Enter / Pointer
// のキー押しっぱなしを 1 回の遷移として扱う」エッジトリガを共通化する。
//
// セルフレビュー (Issue #2-#4 後追い修正) で見つかったバグ:
// - 旧 GameScene / ResultScene は inputDelayMs カウントダウン中に
//   `update()` が早期 return しており、その間 prevSpaceDown が更新されなかった。
//   結果として「ディレイ中に Space を押しっぱなしにしてディレイ切れ → 即遷移」
//   という早押しすり抜けが起きていた。
// - ディレイ中も毎フレーム prevSpaceDown = spaceDown を回すように修正し、
//   armed 状態に切り替わった次のフレーム以降の "新しい押下" だけが edge として
//   トリガするようにする。

export interface InputEdgeDetectorOptions {
  /** armed になるまでの入力受付ディレイ (ms)。0 で即受付。 */
  initialDelayMs?: number
}

/**
 * Space/Enter/Pointer の押下を「立ち上がりエッジ」として 1 回だけ通す検出器。
 *
 * 使い方:
 *   const det = new InputEdgeDetector({ initialDelayMs: 250 })
 *   ... keydown ハンドラ内で det.setPressed(true)
 *   ... keyup   ハンドラ内で det.setPressed(false)
 *   ... update(dt) 内で if (det.tick(dt)) this.go()
 *
 * ディレイ中は tick() が false を返すが、内部で prevPressed = pressed の
 * 更新は継続するので「ディレイ中の押しっぱなし」が直後のフレームでエッジ
 * として誤検知されることはない。
 */
export class InputEdgeDetector {
  private pressed = false
  private prevPressed = false
  private remainingDelayMs: number
  private armed: boolean
  private consumed = false

  constructor(opts: InputEdgeDetectorOptions = {}) {
    this.remainingDelayMs = Math.max(0, opts.initialDelayMs ?? 0)
    this.armed = this.remainingDelayMs === 0
  }

  /** keydown / keyup から呼ぶ。Space / Enter / pointer を一括 OR で乗せてよい。 */
  setPressed(pressed: boolean): void {
    this.pressed = pressed
  }

  /**
   * 毎フレーム呼ぶ。立ち上がりエッジが起きたフレームだけ true を返す。
   * 一度 true を返した後は consumed フラグで以降ずっと false。
   */
  tick(deltaMs: number): boolean {
    // ディレイ中も prevPressed を更新し続けることで、ディレイ切れ瞬間に
    // 「押しっぱなし → そのままエッジ判定」が走らないようにする。
    if (!this.armed) {
      this.remainingDelayMs -= deltaMs
      if (this.remainingDelayMs <= 0) {
        this.armed = true
      }
      this.prevPressed = this.pressed
      return false
    }

    if (this.consumed) {
      this.prevPressed = this.pressed
      return false
    }

    const edge = this.pressed && !this.prevPressed
    this.prevPressed = this.pressed
    if (edge) {
      this.consumed = true
      return true
    }
    return false
  }

  /** Pointer タップなど、即時 1 回だけ消費したい場合に呼ぶ。 */
  triggerOnce(): boolean {
    if (!this.armed || this.consumed) return false
    this.consumed = true
    return true
  }

  /** 後続フレームでエッジを通したくないとき (シーン退場後) に呼ぶ。 */
  disarm(): void {
    this.consumed = true
  }

  /** 現在 armed 状態か。テスト用。 */
  isArmed(): boolean {
    return this.armed && !this.consumed
  }
}
