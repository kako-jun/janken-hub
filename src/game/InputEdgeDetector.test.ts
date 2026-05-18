import { describe, expect, it } from 'vitest'
import { InputEdgeDetector } from './InputEdgeDetector'

describe('InputEdgeDetector', () => {
  describe('initialDelayMs なし (armed=true から開始)', () => {
    it('初回 setPressed(true) + tick でエッジが立つ', () => {
      const d = new InputEdgeDetector()
      d.setPressed(true)
      expect(d.tick(16)).toBe(true)
    })

    it('同じ押下では 2 回目以降エッジが立たない (consumed)', () => {
      const d = new InputEdgeDetector()
      d.setPressed(true)
      expect(d.tick(16)).toBe(true)
      expect(d.tick(16)).toBe(false)
      expect(d.tick(16)).toBe(false)
    })

    it('release してから再度押すとエッジが立つ (consumed しないモード=triggerOnce ではない場合)', () => {
      // tick() は consumed したらもう返さない仕様。これは「1 シーン 1 回」用途。
      // 連打受付が要るシーンでは別途 reset() を生やす設計余地を残す。
      const d = new InputEdgeDetector()
      d.setPressed(true)
      d.tick(16)
      d.setPressed(false)
      d.tick(16)
      d.setPressed(true)
      expect(d.tick(16)).toBe(false)
    })
  })

  describe('initialDelayMs 付き', () => {
    it('ディレイ中は pressed でも tick が false を返し、armed にならない', () => {
      const d = new InputEdgeDetector({ initialDelayMs: 250 })
      d.setPressed(true)
      expect(d.tick(100)).toBe(false)
      expect(d.isArmed()).toBe(false)
      expect(d.tick(100)).toBe(false)
      expect(d.isArmed()).toBe(false)
    })

    it('ディレイ中ずっと押しっぱなしのまま armed になっても、ディレイ切れの瞬間にエッジが立たない (バグ修正の核心)', () => {
      const d = new InputEdgeDetector({ initialDelayMs: 250 })
      d.setPressed(true)
      // 計 300ms 経過: ディレイ 250 を超える
      expect(d.tick(100)).toBe(false)
      expect(d.tick(100)).toBe(false)
      expect(d.tick(100)).toBe(false) // ここで armed になるが、押しっぱなしなのでエッジ無し
      expect(d.isArmed()).toBe(true)
      // 押しっぱなしのまま次フレームに来てもエッジは立たない
      expect(d.tick(16)).toBe(false)
    })

    it('ディレイ切れ後にいったん release してから再度押すとエッジが立つ', () => {
      const d = new InputEdgeDetector({ initialDelayMs: 250 })
      d.setPressed(true)
      d.tick(100)
      d.tick(100)
      d.tick(100) // armed
      d.setPressed(false)
      d.tick(16)
      d.setPressed(true)
      expect(d.tick(16)).toBe(true)
    })

    it('ディレイ中に release → armed 後に押下するとエッジが立つ (正常系)', () => {
      const d = new InputEdgeDetector({ initialDelayMs: 250 })
      // ディレイ中は何も押していない
      d.tick(100)
      d.tick(100)
      d.tick(100) // armed
      d.setPressed(true)
      expect(d.tick(16)).toBe(true)
    })
  })

  describe('triggerOnce (pointer 用)', () => {
    it('armed なら最初の triggerOnce が true、以降は false', () => {
      const d = new InputEdgeDetector()
      expect(d.triggerOnce()).toBe(true)
      expect(d.triggerOnce()).toBe(false)
    })

    it('ディレイ中の triggerOnce は false', () => {
      const d = new InputEdgeDetector({ initialDelayMs: 250 })
      expect(d.triggerOnce()).toBe(false)
    })

    it('triggerOnce を消費した後は tick もエッジを返さない', () => {
      const d = new InputEdgeDetector()
      d.triggerOnce()
      d.setPressed(true)
      expect(d.tick(16)).toBe(false)
    })
  })

  describe('disarm', () => {
    it('disarm 後はエッジが立たない', () => {
      const d = new InputEdgeDetector()
      d.disarm()
      d.setPressed(true)
      expect(d.tick(16)).toBe(false)
      expect(d.triggerOnce()).toBe(false)
    })
  })
})
