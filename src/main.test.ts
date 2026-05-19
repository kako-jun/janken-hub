// main.ts のエントリーポイント回帰テスト。
//
// PixiJS v8 + 動的 import 構成の落とし穴を防ぐ:
//
// 1. text / graphics の renderPipe は各クラスの side-effect import で
//    extensions に登録される。Application.init() は登録済み pipe を
//    1 度だけスナップショットして renderer.renderPipes マップを作る。
// 2. Text / Graphics を Scene 側の dynamic import 経由でしか参照しない
//    構成だと、init() より後に pipe 登録が走り、本番ビルドだけで
//    「Cannot read properties of undefined (reading 'updateRenderable')」
//    が出る (dev では同期評価なので顕在化しない)。
//
// このテストは main.ts の冒頭で `pixi.js/text` と `pixi.js/graphics` の
// side-effect import が削除されていないことを保証する。
// 「未使用 import に見えるから消す」リファクタの再発を防ぐガード。

import { describe, it, expect } from 'vitest'
import mainTs from './main.ts?raw'

describe('main.ts', () => {
  it('Application.init() より先に PixiJS の text pipe を side-effect import している', () => {
    expect(mainTs).toMatch(/import\s+['"]pixi\.js\/text['"]/)
  })

  it('Application.init() より先に PixiJS の graphics pipe を side-effect import している', () => {
    expect(mainTs).toMatch(/import\s+['"]pixi\.js\/graphics['"]/)
  })

  it('pixi.js/text と pixi.js/graphics の import は Application import より上に書く', () => {
    const textIdx = mainTs.search(/import\s+['"]pixi\.js\/text['"]/)
    const graphicsIdx = mainTs.search(/import\s+['"]pixi\.js\/graphics['"]/)
    const applicationIdx = mainTs.search(
      /import\s+\{[^}]*Application[^}]*\}\s+from\s+['"]pixi\.js['"]/
    )
    expect(textIdx).toBeGreaterThanOrEqual(0)
    expect(graphicsIdx).toBeGreaterThanOrEqual(0)
    expect(applicationIdx).toBeGreaterThanOrEqual(0)
    // side-effect import が Application より後ろにあると、Vite が
    // チャンクを並び替えたとき pipe 登録が遅れる可能性がある。
    expect(textIdx).toBeLessThan(applicationIdx)
    expect(graphicsIdx).toBeLessThan(applicationIdx)
  })
})
