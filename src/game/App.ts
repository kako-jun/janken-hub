// シーン切替を管理するアプリケーションコントローラ。
// 初期は緑画面プレースホルダのみ。Scene 基盤は Issue #4 で実装する。

import { Application, Graphics } from 'pixi.js'
import { STAGE_WIDTH, STAGE_HEIGHT } from './constants'

export class App {
  app: Application

  constructor(app: Application) {
    this.app = app
    this.renderPlaceholder()
  }

  /**
   * 緑画面プレースホルダ。Issue #4 のシーン基盤で置き換える。
   */
  private renderPlaceholder(): void {
    const bg = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0x22c55e })
    this.app.stage.addChild(bg)
  }
}
