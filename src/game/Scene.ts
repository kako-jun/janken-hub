// シーン基底クラス (Issue #4)。
//
// PIXI.Container を継承し、enter() / exit() / update() / resize() のライフサイクルを持つ。
// シーン切替は App が replaceScene で行い、各シーンは exit({ next }) で次シーンを要求する。

import { Container } from 'pixi.js'
import { GameRuleType, RoundResult } from './types'

/** 各シーンが exit 時に「次にどこへ行きたいか」を伝えるパラメータ */
export interface SceneExitParam {
  next?: 'title' | 'rule_select' | 'game' | 'result'
  /** RuleSelect → Game に渡す選択ルール */
  rule?: GameRuleType
  /** Game → Result に渡す勝敗 */
  result?: RoundResult
}

export type SceneExitHandler = (param: SceneExitParam) => void

export class Scene extends Container {
  private exitHandler: SceneExitHandler | null = null

  setExitHandler(handler: SceneExitHandler): void {
    this.exitHandler = handler
  }

  /**
   * シーン開始時のフック。Container には既に追加されている前提。
   * 重い初期化はここでやる (constructor で全部やるとテストが苦しい)。
   */
  enter(): void {
    // override in subclass
  }

  /** Scene の差し替え直前。リスナ解除や Timeout キャンセルに使う。 */
  exit(param: SceneExitParam = {}): void {
    this.exitHandler?.(param)
  }

  /** 毎フレーム呼ばれる更新フック (ms 単位) */
  update(_deltaMs: number): void {
    // override in subclass
  }

  /** ウィンドウリサイズ通知 (canvas のリサイズに連動) */
  resize(_width: number, _height: number): void {
    // override in subclass
  }

  /** App が破棄するときに呼ぶ。子要素も destroy する。 */
  destroyScene(): void {
    // destroy({ children: true }) が子要素を removeChild + destroy するので
    // 事前の removeChildren() は不要 (PixiJS v8 仕様)。
    this.destroy({ children: true })
  }
}
