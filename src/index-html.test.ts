// index.html の CSS 回帰テスト。
//
// PixiJS の autoDensity: true は canvas の inline style に
// "<STAGE_WIDTH>px" / "<STAGE_HEIGHT>px" を書き込むため、CSS 側で
// !important で打ち消さないと viewport にフィットしたときアスペクト比が
// 崩れて、ポートレート画面 (iPhone 等) で中身が縦伸びする。
//
// このテストは index.html の canvas CSS が次の 3 点を守っていることを保証する:
//   1. width: auto !important
//   2. height: auto !important
//   3. aspect-ratio: STAGE_WIDTH / STAGE_HEIGHT
//
// aspect-ratio の数値は src/game/constants.ts と同期している必要があるので、
// constants の値を import して突き合わせる。

import { describe, it, expect } from 'vitest'
import indexHtml from '../index.html?raw'
import { STAGE_HEIGHT, STAGE_WIDTH } from './game/constants'

describe('index.html canvas CSS', () => {
  it('width / height が auto !important で autoDensity の inline style を打ち消している', () => {
    expect(indexHtml).toMatch(/width:\s*auto\s*!important/)
    expect(indexHtml).toMatch(/height:\s*auto\s*!important/)
  })

  it('max-width: 100vw / max-height: 100vh で viewport に収まる', () => {
    expect(indexHtml).toMatch(/max-width:\s*100vw/)
    expect(indexHtml).toMatch(/max-height:\s*100vh/)
  })

  it(`aspect-ratio が STAGE_WIDTH (${STAGE_WIDTH}) / STAGE_HEIGHT (${STAGE_HEIGHT}) と一致している`, () => {
    const match = indexHtml.match(/aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/)
    expect(match).not.toBeNull()
    if (!match) return
    expect(Number(match[1])).toBe(STAGE_WIDTH)
    expect(Number(match[2])).toBe(STAGE_HEIGHT)
  })
})
