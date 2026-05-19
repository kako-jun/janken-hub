// Classic RPS 判定関数 (Issue #7)。
//
// 純粋関数として切り出すことで、シーン (ClassicRpsScene) は描画と進行に専念し、
// 「誰が勝ったか」のロジックはここに集約する。React 版の判定と挙動を揃える。

import type { Hand, RoundResult } from '../types'

/**
 * プレイヤー (p1) 視点の勝敗を返す。
 *
 * - 同じ手 → draw
 * - rock vs scissors / scissors vs paper / paper vs rock の組で p1 が勝 → win
 * - それ以外 → lose
 */
export const judgeClassicRps = (p1: Hand, p2: Hand): RoundResult => {
  if (p1 === p2) return 'draw'
  if (
    (p1 === 'rock' && p2 === 'scissors') ||
    (p1 === 'scissors' && p2 === 'paper') ||
    (p1 === 'paper' && p2 === 'rock')
  ) {
    return 'win'
  }
  return 'lose'
}
