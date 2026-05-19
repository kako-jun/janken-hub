// Ido Janken (井戸じゃんけん, 4 手) 判定関数 (Issue #8)。
//
// classic_rps と同じく純粋関数として切り出す。'well' (井戸) は rock と scissors
// に勝ち、paper に負ける特殊手。同じ手は draw。それ以外は classic 3 手のルール。

import type { IdoHand, RoundResult } from '../types'

/**
 * プレイヤー (p1) 視点の井戸じゃんけん勝敗を返す。
 *
 * - 同じ手 → draw
 * - well vs rock / well vs scissors → well の勝ち (rock/scissors は井戸に落ちる)
 * - paper vs well → paper の勝ち (紙が井戸を覆う)
 * - 残りは classic 3 手のルール (rock>scissors>paper>rock)
 */
export const judgeIdoJanken = (p1: IdoHand, p2: IdoHand): RoundResult => {
  if (p1 === p2) return 'draw'
  // well 特殊ルール
  if (p1 === 'well' && (p2 === 'rock' || p2 === 'scissors')) return 'win'
  if (p2 === 'well' && (p1 === 'rock' || p1 === 'scissors')) return 'lose'
  if (p1 === 'paper' && p2 === 'well') return 'win'
  if (p2 === 'paper' && p1 === 'well') return 'lose'
  // classic 3 手
  if (
    (p1 === 'rock' && p2 === 'scissors') ||
    (p1 === 'scissors' && p2 === 'paper') ||
    (p1 === 'paper' && p2 === 'rock')
  ) {
    return 'win'
  }
  // 型上は到達不可能だが、上の well 分岐が将来編集で壊れたときに
  // 'lose' を黙って返してしまうリグレッションを防ぐための assert。
  /* c8 ignore next */
  if (p1 === 'well' || p2 === 'well')
    throw new Error(
      'unreachable: well case must be handled above: ' + p1 + ' vs ' + p2
    )
  return 'lose'
}
