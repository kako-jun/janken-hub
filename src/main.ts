// PixiJS v8 エントリーポイント

// PixiJS v8 の renderPipes 登録を Application.init() より先に終わらせるため、
// text/graphics のサブパス init を side-effect import しておく。
// 各 init.mjs は extensions.add(CanvasTextPipe) 等を実行するだけのモジュールで、
// renderer は init() 時にその時点の登録 pipe を 1 度だけスナップショットして
// renderer.renderPipes マップを構築する。Scene が dynamic import 越しに
// あとから Text / Graphics を引っ張る構成だと、本番ビルドの最初の render で
// 「Cannot read properties of undefined (reading 'updateRenderable')」が出る
// (text pipe が未登録のまま init が走るため)。
import 'pixi.js/text'
import 'pixi.js/graphics'

import { Application } from 'pixi.js'
import { App } from './game/App'
import { STAGE_WIDTH, STAGE_HEIGHT } from './game/constants'

const setLoadingProgress = (ratio: number): void => {
  const bar = document.querySelector<HTMLDivElement>('#loading-bar > div')
  if (bar) bar.style.width = `${Math.floor(ratio * 100)}%`
}

const removeLoading = (): void => {
  const el = document.getElementById('loading')
  if (el) el.remove()
}

const main = async (): Promise<void> => {
  const pixiApp = new Application()
  await pixiApp.init({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    background: '#000000',
    antialias: false,
    autoDensity: true,
    // 3x retina (iPad Pro 等) でフィルレートが爆発するので 2 で頭打ちにする
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  })

  const host = document.getElementById('game') ?? document.body
  host.appendChild(pixiApp.canvas)

  setLoadingProgress(0.5)

  const app = new App(pixiApp)
  await app.startTitle()

  setLoadingProgress(1)
  removeLoading()
}

main().catch(err => {
  console.error(err)
})
