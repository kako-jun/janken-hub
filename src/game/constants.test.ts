import { describe, expect, it } from 'vitest'
import {
  STAGE_WIDTH,
  STAGE_HEIGHT,
  COLOR_WIN,
  COLOR_LOSE,
  COLOR_DRAW,
} from './constants'

describe('constants', () => {
  it('STAGE_WIDTH / STAGE_HEIGHT が想定値', () => {
    expect(STAGE_WIDTH).toBe(800)
    expect(STAGE_HEIGHT).toBe(600)
  })

  it('result カラーが DESIGN.md と一致', () => {
    expect(COLOR_WIN).toBe(0x22c55e)
    expect(COLOR_LOSE).toBe(0xef4444)
    expect(COLOR_DRAW).toBe(0xeab308)
  })
})
