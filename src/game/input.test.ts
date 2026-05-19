import { afterEach, describe, expect, it, vi } from 'vitest'
import { InputManager, type InputAction } from './input'

// jsdom には PointerEvent が無いので、Event を流用して clientX/clientY/pointerId を後付けする。
function createPointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: { clientX: number; clientY: number; pointerId: number }
): Event {
  const ev = new Event(type, { bubbles: true })
  Object.assign(ev, {
    clientX: init.clientX,
    clientY: init.clientY,
    pointerId: init.pointerId,
  })
  return ev
}

function dispatchKey(
  type: 'keydown' | 'keyup',
  key: string,
  opts: { repeat?: boolean } = {},
  target: Window | HTMLElement = window
): void {
  const ev = new KeyboardEvent(type, { key, repeat: opts.repeat ?? false })
  target.dispatchEvent(ev)
}

describe('InputManager', () => {
  let manager: InputManager | null = null

  afterEach(() => {
    if (manager) {
      manager.dispose()
      manager = null
    }
  })

  describe('keyToAction マッピング', () => {
    it('1 / a / A はいずれも select1 を emit する', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', '1')
      dispatchKey('keyup', '1')
      dispatchKey('keydown', 'a')
      dispatchKey('keyup', 'a')
      dispatchKey('keydown', 'A')
      dispatchKey('keyup', 'A')
      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, 'select1')
      expect(handler).toHaveBeenNthCalledWith(2, 'select1')
      expect(handler).toHaveBeenNthCalledWith(3, 'select1')
    })

    it('2 / s / S は select2、3 / d / D は select3、4 / f / F は select4 を emit する', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      const pairs: Array<[string, InputAction]> = [
        ['2', 'select2'],
        ['s', 'select2'],
        ['S', 'select2'],
        ['3', 'select3'],
        ['d', 'select3'],
        ['D', 'select3'],
        ['4', 'select4'],
        ['f', 'select4'],
        ['F', 'select4'],
      ]
      for (const [key, action] of pairs) {
        dispatchKey('keydown', key)
        dispatchKey('keyup', key)
        expect(handler).toHaveBeenLastCalledWith(action)
      }
      expect(handler).toHaveBeenCalledTimes(pairs.length)
    })

    it('Arrow{Up,Down,Left,Right} は up/down/left/right を emit する', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', 'ArrowUp')
      dispatchKey('keydown', 'ArrowDown')
      dispatchKey('keydown', 'ArrowLeft')
      dispatchKey('keydown', 'ArrowRight')
      expect(handler).toHaveBeenNthCalledWith(1, 'up')
      expect(handler).toHaveBeenNthCalledWith(2, 'down')
      expect(handler).toHaveBeenNthCalledWith(3, 'left')
      expect(handler).toHaveBeenNthCalledWith(4, 'right')
    })

    it('Space と Enter はどちらも confirm を emit する', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', ' ')
      dispatchKey('keydown', 'Enter')
      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, 'confirm')
      expect(handler).toHaveBeenNthCalledWith(2, 'confirm')
    })

    it("ev.key が ' ' でなくても ev.code === 'Space' なら confirm を emit する (古い IME フォールバック)", () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      const ev = new KeyboardEvent('keydown', { key: 'Spacebar' })
      // KeyboardEvent の code は読み取り専用 + コンストラクタで未設定の環境があるため
      // Object.defineProperty で 'Space' を後付けする。
      Object.defineProperty(ev, 'code', { value: 'Space', configurable: true })
      window.dispatchEvent(ev)
      expect(handler).toHaveBeenCalledExactlyOnceWith('confirm')
    })

    it('Escape は cancel を emit する', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', 'Escape')
      expect(handler).toHaveBeenCalledExactlyOnceWith('cancel')
    })

    it('未マップキー (q) は emit せず isKeyDown も false のまま', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', 'q')
      expect(handler).not.toHaveBeenCalled()
      const actions: InputAction[] = [
        'select1',
        'select2',
        'select3',
        'select4',
        'up',
        'down',
        'left',
        'right',
        'confirm',
        'cancel',
      ]
      for (const a of actions) {
        expect(manager.isKeyDown(a)).toBe(false)
      }
    })

    it("空文字キー '' は emit しない", () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', '')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('onAction 購読 / 解除', () => {
    it('handler 未登録でも keydown 受信で例外を投げない', () => {
      manager = new InputManager()
      expect(() => dispatchKey('keydown', 'a')).not.toThrow()
    })

    it('複数 handler を登録すると全員に emit される', () => {
      manager = new InputManager()
      const h1 = vi.fn()
      const h2 = vi.fn()
      const h3 = vi.fn()
      manager.onAction(h1)
      manager.onAction(h2)
      manager.onAction(h3)
      dispatchKey('keydown', 'a')
      expect(h1).toHaveBeenCalledExactlyOnceWith('select1')
      expect(h2).toHaveBeenCalledExactlyOnceWith('select1')
      expect(h3).toHaveBeenCalledExactlyOnceWith('select1')
    })

    it('unsubscribe 後はその handler に emit されない', () => {
      manager = new InputManager()
      const h1 = vi.fn()
      const h2 = vi.fn()
      const off1 = manager.onAction(h1)
      manager.onAction(h2)
      off1()
      dispatchKey('keydown', 'a')
      expect(h1).not.toHaveBeenCalled()
      expect(h2).toHaveBeenCalledExactlyOnceWith('select1')
    })

    it('emit 中に他 handler を unsubscribe しても、その回のスナップショットには届く (race セーフ)', () => {
      manager = new InputManager()
      const h2 = vi.fn()
      let off2: (() => void) | null = null
      const h1 = vi.fn(() => {
        // h1 が呼ばれた時点で h2 を解除
        if (off2) off2()
      })
      manager.onAction(h1)
      off2 = manager.onAction(h2)
      dispatchKey('keydown', 'a')
      expect(h1).toHaveBeenCalledExactlyOnceWith('select1')
      // 同 emit のスナップショットに h2 が含まれているはず
      expect(h2).toHaveBeenCalledExactlyOnceWith('select1')
      // 次回 emit では h2 は呼ばれない
      dispatchKey('keydown', '2')
      expect(h2).toHaveBeenCalledTimes(1)
    })
  })

  describe('isKeyDown 状態遷移', () => {
    it('keydown で isKeyDown(action) が true になり、keyup で false に戻る', () => {
      manager = new InputManager()
      expect(manager.isKeyDown('select1')).toBe(false)
      dispatchKey('keydown', 'a')
      expect(manager.isKeyDown('select1')).toBe(true)
      dispatchKey('keyup', 'a')
      expect(manager.isKeyDown('select1')).toBe(false)
    })

    it('a と 1 を両方 down → どちらか片方 keyup でも select1 の isKeyDown は true のまま', () => {
      manager = new InputManager()
      dispatchKey('keydown', 'a')
      dispatchKey('keydown', '1')
      expect(manager.isKeyDown('select1')).toBe(true)
      dispatchKey('keyup', 'a')
      expect(manager.isKeyDown('select1')).toBe(true)
      dispatchKey('keyup', '1')
      expect(manager.isKeyDown('select1')).toBe(false)
    })

    it('event.repeat=true の keydown は action を emit しないが isKeyDown は true', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      dispatchKey('keydown', 'a', { repeat: true })
      expect(handler).not.toHaveBeenCalled()
      expect(manager.isKeyDown('select1')).toBe(true)
    })
  })

  describe('onPointer / getActivePointers', () => {
    it('pointerdown で onPointer が clientX/clientY と pointerId 付きで呼ばれる', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onPointer(handler)
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 123,
          clientY: 456,
          pointerId: 7,
        })
      )
      expect(handler).toHaveBeenCalledTimes(1)
      const arg = handler.mock.calls[0][0]
      expect(arg.clientX).toBe(123)
      expect(arg.clientY).toBe(456)
      expect(arg.pointerId).toBe(7)
    })

    it('canvas 未指定なら x === clientX, y === clientY', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onPointer(handler)
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 200,
          clientY: 300,
          pointerId: 1,
        })
      )
      const arg = handler.mock.calls[0][0]
      expect(arg.x).toBe(200)
      expect(arg.y).toBe(300)
    })

    it('canvas 指定時は getBoundingClientRect().left/top を引いた canvas 相対座標になる', () => {
      const canvas = document.createElement('canvas')
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 50,
        right: 900,
        bottom: 650,
        width: 800,
        height: 600,
        x: 100,
        y: 50,
        toJSON: () => ({}),
      } as DOMRect)
      manager = new InputManager({ canvas })
      const handler = vi.fn()
      manager.onPointer(handler)
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 250,
          clientY: 175,
          pointerId: 1,
        })
      )
      const arg = handler.mock.calls[0][0]
      expect(arg.x).toBe(150)
      expect(arg.y).toBe(125)
      expect(arg.clientX).toBe(250)
      expect(arg.clientY).toBe(175)
    })

    it('pointerdown 後 getActivePointers() に pointerId が現れる', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 42,
        })
      )
      const pointers = manager.getActivePointers()
      expect(pointers.has(42)).toBe(true)
      expect(pointers.get(42)).toEqual({ x: 10, y: 20 })
    })

    it('pointerup で getActivePointers() から該当 pointerId が消える', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 42,
        })
      )
      window.dispatchEvent(
        createPointerEvent('pointerup', {
          clientX: 10,
          clientY: 20,
          pointerId: 42,
        })
      )
      expect(manager.getActivePointers().has(42)).toBe(false)
    })

    it('pointercancel でも getActivePointers() から消える', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 42,
        })
      )
      window.dispatchEvent(
        createPointerEvent('pointercancel', {
          clientX: 10,
          clientY: 20,
          pointerId: 42,
        })
      )
      expect(manager.getActivePointers().has(42)).toBe(false)
    })

    it('2 本同時 pointerdown で両方の pointerId が保持される (マルチタッチ)', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 1,
        })
      )
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 30,
          clientY: 40,
          pointerId: 2,
        })
      )
      const pointers = manager.getActivePointers()
      expect(pointers.size).toBe(2)
      expect(pointers.get(1)).toEqual({ x: 10, y: 20 })
      expect(pointers.get(2)).toEqual({ x: 30, y: 40 })
    })

    it('片方の pointerId だけ pointerup で、他方は残る', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 1,
        })
      )
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 30,
          clientY: 40,
          pointerId: 2,
        })
      )
      window.dispatchEvent(
        createPointerEvent('pointerup', {
          clientX: 10,
          clientY: 20,
          pointerId: 1,
        })
      )
      const pointers = manager.getActivePointers()
      expect(pointers.has(1)).toBe(false)
      expect(pointers.has(2)).toBe(true)
    })

    it('pointermove は activePointer の座標を更新するが onPointer は呼ばれない', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onPointer(handler)
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 1,
        })
      )
      expect(handler).toHaveBeenCalledTimes(1)
      window.dispatchEvent(
        createPointerEvent('pointermove', {
          clientX: 99,
          clientY: 88,
          pointerId: 1,
        })
      )
      expect(handler).toHaveBeenCalledTimes(1) // move では呼ばれない
      expect(manager.getActivePointers().get(1)).toEqual({ x: 99, y: 88 })
    })

    it('down していない pointerId の pointermove は無視される (hover 非追跡)', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointermove', {
          clientX: 50,
          clientY: 60,
          pointerId: 99,
        })
      )
      expect(manager.getActivePointers().has(99)).toBe(false)
      expect(manager.getActivePointers().size).toBe(0)
    })

    it('pointerId 未定義のイベントは id=-1 として扱われ、pointerup で消える', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onPointer(handler)
      // pointerId を設定せずに dispatch する (一部環境の合成イベント想定)
      const down = new Event('pointerdown', { bubbles: true })
      Object.assign(down, { clientX: 11, clientY: 22 })
      window.dispatchEvent(down)
      expect(handler).toHaveBeenCalledTimes(1)
      const arg = handler.mock.calls[0][0]
      expect(arg.pointerId).toBe(-1)
      expect(manager.getActivePointers().get(-1)).toEqual({ x: 11, y: 22 })

      // 同じく pointerId 未定義の pointerup で削除されること
      const up = new Event('pointerup', { bubbles: true })
      Object.assign(up, { clientX: 11, clientY: 22 })
      window.dispatchEvent(up)
      expect(manager.getActivePointers().has(-1)).toBe(false)
    })

    it('getActivePointers() の戻り Map を mutate しても内部状態は変わらない', () => {
      manager = new InputManager()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 1,
        })
      )
      const snapshot = manager.getActivePointers()
      snapshot.clear()
      snapshot.set(999, { x: 0, y: 0 })
      const fresh = manager.getActivePointers()
      expect(fresh.has(1)).toBe(true)
      expect(fresh.has(999)).toBe(false)
      expect(fresh.size).toBe(1)
    })
  })

  describe('dispose', () => {
    it('dispose 後の keydown は action handler を呼ばない', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onAction(handler)
      manager.dispose()
      dispatchKey('keydown', 'a')
      expect(handler).not.toHaveBeenCalled()
      manager = null
    })

    it('dispose 後の pointerdown は pointer handler を呼ばない', () => {
      manager = new InputManager()
      const handler = vi.fn()
      manager.onPointer(handler)
      manager.dispose()
      window.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 10,
          clientY: 20,
          pointerId: 1,
        })
      )
      expect(handler).not.toHaveBeenCalled()
      manager = null
    })

    it('dispose 後に onAction / onPointer を呼んでも登録されず no-op unsubscribe が返る', () => {
      manager = new InputManager()
      manager.dispose()
      const actionHandler = vi.fn()
      const pointerHandler = vi.fn()
      const offA = manager.onAction(actionHandler)
      const offP = manager.onPointer(pointerHandler)
      expect(typeof offA).toBe('function')
      expect(typeof offP).toBe('function')
      // どちらの unsubscribe を呼んでも例外を投げない
      expect(() => offA()).not.toThrow()
      expect(() => offP()).not.toThrow()
      manager = null
    })

    it('dispose を 2 回呼んでも例外を投げない', () => {
      manager = new InputManager()
      manager.dispose()
      expect(() => manager!.dispose()).not.toThrow()
      manager = null
    })
  })

  describe('target オプション', () => {
    it('target に HTMLElement を渡すと、その要素の keydown だけ拾い window は拾わない', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      try {
        manager = new InputManager({ target: el })
        const handler = vi.fn()
        manager.onAction(handler)
        // window への dispatch は拾わない
        dispatchKey('keydown', 'a', {}, window)
        expect(handler).not.toHaveBeenCalled()
        // 対象 element への dispatch は拾う
        dispatchKey('keydown', 'a', {}, el)
        expect(handler).toHaveBeenCalledExactlyOnceWith('select1')
      } finally {
        document.body.removeChild(el)
      }
    })
  })
})
