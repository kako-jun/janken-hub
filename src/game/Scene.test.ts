// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { Scene, SceneExitParam } from './Scene'

describe('Scene 基底 (Issue #4)', () => {
  it('exit() で setExitHandler に登録したハンドラに param が渡る', () => {
    const scene = new Scene()
    const handler = vi.fn<(p: SceneExitParam) => void>()
    scene.setExitHandler(handler)
    scene.exit({ next: 'game', rule: 'classic_rps' })
    expect(handler).toHaveBeenCalledWith({
      next: 'game',
      rule: 'classic_rps',
    })
  })

  it('setExitHandler 未設定でも exit() で例外が出ない', () => {
    const scene = new Scene()
    expect(() => scene.exit({ next: 'title' })).not.toThrow()
  })

  it('update / resize はデフォルトで no-op (override 用フック)', () => {
    const scene = new Scene()
    expect(() => scene.update(16)).not.toThrow()
    expect(() => scene.resize(800, 600)).not.toThrow()
  })

  it('destroyScene() で Container.destroyed=true になる', () => {
    const scene = new Scene()
    scene.destroyScene()
    expect(scene.destroyed).toBe(true)
  })
})
