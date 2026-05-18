// シーン切替コントローラ (Issue #4)。
//
// Title → RuleSelect → Game → Result → Title のループを SceneExitParam で繋ぐ。
// 動的 import 中に多重遷移が走らないよう isTransitioning ガードを置く
// (legend-of-window-ninja と同じ方針)。

import { Application } from 'pixi.js'
import { Scene, SceneExitParam } from './Scene'
import { GameRuleType, RoundResult } from './types'

export class App {
  app: Application
  private currentScene: Scene | null = null
  private isTransitioning = false

  constructor(app: Application) {
    this.app = app
    this.app.ticker.add(ticker => {
      // タブ非アクティブから戻ったとき deltaMS が数百〜数千 ms になるのを 33ms (30fps 相当) で頭打ち。
      const deltaMs = Math.min(ticker.deltaMS, 33)
      this.currentScene?.update(deltaMs)
    })
  }

  async startTitle(): Promise<void> {
    if (this.isTransitioning) return
    this.isTransitioning = true
    try {
      const { TitleScene } = await import('./scenes/TitleScene')
      this.replaceScene(new TitleScene())
    } finally {
      this.isTransitioning = false
    }
  }

  async startRuleSelect(): Promise<void> {
    if (this.isTransitioning) return
    this.isTransitioning = true
    try {
      const { RuleSelectScene } = await import('./scenes/RuleSelectScene')
      this.replaceScene(new RuleSelectScene())
    } finally {
      this.isTransitioning = false
    }
  }

  async startGame(rule: GameRuleType): Promise<void> {
    if (this.isTransitioning) return
    this.isTransitioning = true
    try {
      const { GameScene } = await import('./scenes/GameScene')
      this.replaceScene(new GameScene(rule))
    } finally {
      this.isTransitioning = false
    }
  }

  async startResult(result: RoundResult): Promise<void> {
    if (this.isTransitioning) return
    this.isTransitioning = true
    try {
      const { ResultScene } = await import('./scenes/ResultScene')
      this.replaceScene(new ResultScene(result))
    } finally {
      this.isTransitioning = false
    }
  }

  private replaceScene(scene: Scene): void {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene)
      this.currentScene.destroyScene()
    }
    this.currentScene = scene
    scene.setExitHandler(param => this.handleExit(param))
    this.app.stage.addChild(scene)
    scene.enter()
  }

  // exported for unit tests. シーン側からは呼ばれず、setExitHandler 経由のみ。
  handleExit(param: SceneExitParam): void {
    switch (param.next) {
      case 'rule_select':
        void this.startRuleSelect()
        break
      case 'game':
        // rule 未指定なら classic_rps にフォールバック (RuleSelectScene が
        // 必ず rule 付きで exit する規約だが、安全側に default を置く)。
        void this.startGame(param.rule ?? 'classic_rps')
        break
      case 'result':
        // result 未指定は draw 扱い (GameScene が必ず result 付きで exit する)。
        void this.startResult(param.result ?? 'draw')
        break
      case 'title':
        // 'title' は default と同じ扱い。明示ケースを残すのは意図の表明。
        void this.startTitle()
        break
      default:
        void this.startTitle()
        break
    }
  }
}
