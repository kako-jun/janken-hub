// Achi Muite Hoi 方向判定 (Issue #9)。
//
// あっちむいてホイは「じゃんけんで勝った側 (attacker) が方向を指差し、
// 負けた側 (defender) がそれと違う方向を向こうとする」遊び。
// attacker が指した方向と defender が向いた方向が**一致した場合に**
// attacker の勝ち (= 1 point)。一致しなければ point は動かず、再度じゃんけんへ。
//
// 純粋関数として切り出すことで、シーン (AchiMuiteHoiScene) は描画と進行に専念し、
// 「一致したか」のロジックだけここに集約する。

import type { Direction, RoundResult } from '../types'

/**
 * あっちむいてホイの方向判定。
 * 攻め手 (attacker) が指した方向と、受け手 (defender) が向いた方向が一致なら
 * attacker の勝ち。戻り値は **attacker 視点**。
 *
 * - 一致 → 'win'   (attacker が point を取る)
 * - 不一致 → 'lose' (point は動かず再じゃんけん)
 *
 * draw は構造的に発生しない (2 方向の集合は等価か等価でないかの 2 値)。
 */
export const judgeAchiPhase = (
  attackerDir: Direction,
  defenderDir: Direction
): RoundResult => (attackerDir === defenderDir ? 'win' : 'lose')
