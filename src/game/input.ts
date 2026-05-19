// 入力統一マネージャ (Issue #5)。
//
// キーボード / マウス / タッチを単一の `InputManager` で扱う。
// 既存シーンは InputEdgeDetector + window.addEventListener を直接書いて
// いるが、ルール / 手選択シーン (#7 以降) で「1/2/3/4 や A/S/D/F」のような
// 複数キーマップとマルチタッチを扱う必要が出てくるため、抽象 action 層と
// pointer 取得 API を先に切り出しておく。
//
// この PR ではまだ既存シーンに配線しない。次の Issue で組み込む。

/**
 * 抽象化された入力アクション。
 * キーボードの物理キーやポインタを「ゲーム上の意味」に正規化する。
 */
export type InputAction =
  | 'select1'
  | 'select2'
  | 'select3'
  | 'select4'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'cancel'

/** ポインタイベントのコールバック引数。canvas 相対 (x,y) と raw client 座標を両方返す。 */
export interface InputPointerEvent {
  /** canvas 左上原点。canvas 未指定なら clientX と同値。 */
  x: number
  /** canvas 左上原点。canvas 未指定なら clientY と同値。 */
  y: number
  /** raw clientX (PointerEvent.clientX そのまま) */
  clientX: number
  /** raw clientY (PointerEvent.clientY そのまま) */
  clientY: number
  /** PointerEvent.pointerId (マルチタッチ識別子) */
  pointerId: number
}

export type InputActionHandler = (action: InputAction) => void
export type InputPointerHandler = (ev: InputPointerEvent) => void

export interface InputManagerOptions {
  /** keydown / keyup / pointer* の addEventListener を貼る対象。省略時 window。 */
  target?: HTMLElement | Window
  /** 指定すると pointer イベントの x,y を canvas 左上原点に変換する。 */
  canvas?: HTMLCanvasElement
}

/**
 * KeyboardEvent.key を InputAction に変換する。
 * 該当しない場合 null を返す。
 *
 * - 1 / a / A → select1
 * - 2 / s / S → select2
 * - 3 / d / D → select3
 * - 4 / f / F → select4
 * - ArrowUp/Down/Left/Right → up/down/left/right
 * - Space (' ') / Enter → confirm
 * - Escape → cancel
 */
function keyToAction(key: string): InputAction | null {
  switch (key) {
    case '1':
    case 'a':
    case 'A':
      return 'select1'
    case '2':
    case 's':
    case 'S':
      return 'select2'
    case '3':
    case 'd':
    case 'D':
      return 'select3'
    case '4':
    case 'f':
    case 'F':
      return 'select4'
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    case ' ':
    case 'Enter':
      return 'confirm'
    case 'Escape':
      return 'cancel'
    default:
      return null
  }
}

/**
 * 入力統一マネージャ。
 *
 * - `onAction` で抽象アクション (select1, confirm, ...) を購読する。
 *   key repeat (event.repeat === true) では emit しないため連射防止になる。
 *   ただし `isKeyDown` の状態は repeat でも true のまま (押下状態は OS が保証)。
 * - `onPointer` で pointerdown を購読する。canvas 指定時は canvas 相対座標に変換。
 * - `getActivePointers()` で現在押下中の pointerId → 座標 を取得 (マルチタッチ用)。
 * - `dispose()` で全 listener を解除。destroy 後に handler を増やしても無視する。
 */
export class InputManager {
  private readonly target: HTMLElement | Window
  private readonly canvas?: HTMLCanvasElement
  private disposed = false

  private actionHandlers: Set<InputActionHandler> = new Set()
  private pointerHandlers: Set<InputPointerHandler> = new Set()

  /** action が現在押下中かどうか。複数の物理キーが同じ action にマップされる場合は OR。 */
  private pressedActions: Map<InputAction, Set<string>> = new Map()
  /** 現在 down 中の pointerId → canvas 相対座標 */
  private activePointers: Map<number, { x: number; y: number }> = new Map()

  constructor(opts: InputManagerOptions = {}) {
    this.target = opts.target ?? window
    this.canvas = opts.canvas

    // EventListener 型に合わせるため bind 済みプロパティを使う。
    this.target.addEventListener('keydown', this.onKeyDown as EventListener)
    this.target.addEventListener('keyup', this.onKeyUp as EventListener)
    this.target.addEventListener(
      'pointerdown',
      this.onPointerDown as EventListener
    )
    this.target.addEventListener(
      'pointermove',
      this.onPointerMove as EventListener
    )
    this.target.addEventListener('pointerup', this.onPointerUp as EventListener)
    this.target.addEventListener(
      'pointercancel',
      this.onPointerUp as EventListener
    )
  }

  /**
   * アクション emit を購読する。返り値の関数を呼ぶと購読解除。
   * dispose 後の呼び出しは何もしない (no-op の unsubscribe を返す)。
   */
  onAction(handler: InputActionHandler): () => void {
    if (this.disposed) return () => {}
    this.actionHandlers.add(handler)
    return () => {
      this.actionHandlers.delete(handler)
    }
  }

  /**
   * pointerdown を購読する。返り値の関数を呼ぶと購読解除。
   * dispose 後の呼び出しは何もしない。
   */
  onPointer(handler: InputPointerHandler): () => void {
    if (this.disposed) return () => {}
    this.pointerHandlers.add(handler)
    return () => {
      this.pointerHandlers.delete(handler)
    }
  }

  /** 現在押下中のポインタ一覧 (canvas 相対座標)。マルチタッチ用。 */
  getActivePointers(): Map<number, { x: number; y: number }> {
    // 内部 Map を直接返すと外から書き換えられるのでコピーを返す。
    return new Map(this.activePointers)
  }

  /** 指定 action に対応する物理キーが 1 つでも押下中なら true。 */
  isKeyDown(action: InputAction): boolean {
    const set = this.pressedActions.get(action)
    return set !== undefined && set.size > 0
  }

  /** 全 listener を解除し、以降の handler 追加を無効化する。 */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.target.removeEventListener('keydown', this.onKeyDown as EventListener)
    this.target.removeEventListener('keyup', this.onKeyUp as EventListener)
    this.target.removeEventListener(
      'pointerdown',
      this.onPointerDown as EventListener
    )
    this.target.removeEventListener(
      'pointermove',
      this.onPointerMove as EventListener
    )
    this.target.removeEventListener(
      'pointerup',
      this.onPointerUp as EventListener
    )
    this.target.removeEventListener(
      'pointercancel',
      this.onPointerUp as EventListener
    )
    this.actionHandlers.clear()
    this.pointerHandlers.clear()
    this.pressedActions.clear()
    this.activePointers.clear()
  }

  // ---------- handlers ----------

  private onKeyDown = (ev: KeyboardEvent): void => {
    const action = keyToAction(ev.key)
    if (action === null) return

    // isKeyDown 用の押下状態は repeat も含めて維持する。
    let set = this.pressedActions.get(action)
    if (!set) {
      set = new Set()
      this.pressedActions.set(action, set)
    }
    set.add(ev.key)

    // 連射防止: OS の auto-repeat は emit しない。
    if (ev.repeat) return

    this.emitAction(action)
  }

  private onKeyUp = (ev: KeyboardEvent): void => {
    const action = keyToAction(ev.key)
    if (action === null) return
    const set = this.pressedActions.get(action)
    if (!set) return
    set.delete(ev.key)
    if (set.size === 0) {
      this.pressedActions.delete(action)
    }
  }

  private onPointerDown = (ev: PointerEvent): void => {
    const { x, y } = this.toCanvasCoords(ev.clientX, ev.clientY)
    this.activePointers.set(ev.pointerId, { x, y })
    this.emitPointer({
      x,
      y,
      clientX: ev.clientX,
      clientY: ev.clientY,
      pointerId: ev.pointerId,
    })
  }

  private onPointerMove = (ev: PointerEvent): void => {
    // 押下中の pointer のみ追跡。hover は無視。
    if (!this.activePointers.has(ev.pointerId)) return
    const { x, y } = this.toCanvasCoords(ev.clientX, ev.clientY)
    this.activePointers.set(ev.pointerId, { x, y })
  }

  private onPointerUp = (ev: PointerEvent): void => {
    this.activePointers.delete(ev.pointerId)
  }

  // ---------- emit / coord helpers ----------

  private emitAction(action: InputAction): void {
    if (this.disposed) return
    // handler 内で onAction の解除が起きても安全なよう、スナップショットを取る。
    for (const h of [...this.actionHandlers]) {
      h(action)
    }
  }

  private emitPointer(ev: InputPointerEvent): void {
    if (this.disposed) return
    for (const h of [...this.pointerHandlers]) {
      h(ev)
    }
  }

  /** client 座標 → canvas 左上原点。canvas 未指定ならそのまま返す。 */
  private toCanvasCoords(
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    if (!this.canvas) return { x: clientX, y: clientY }
    const rect = this.canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }
}
