// NPC_CHARACTERS データ整合性テスト。
// id 一意 / icon 非空 / 推奨難易度の値域などの最低限の不変条件を守る。

import { describe, expect, it } from 'vitest'
import { NPC_CHARACTERS } from './characters'

describe('NPC_CHARACTERS', () => {
  it('6 体定義されている', () => {
    expect(NPC_CHARACTERS).toHaveLength(6)
  })

  it('id は一意', () => {
    const ids = NPC_CHARACTERS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('全キャラ: icon が空でない', () => {
    for (const c of NPC_CHARACTERS) {
      expect(c.icon.length).toBeGreaterThan(0)
    }
  })

  it('全キャラ: name が空でない', () => {
    for (const c of NPC_CHARACTERS) {
      expect(c.name.length).toBeGreaterThan(0)
    }
  })

  it('affinity は rock/paper/scissors のいずれか', () => {
    const valid = new Set(['rock', 'paper', 'scissors'])
    for (const c of NPC_CHARACTERS) {
      expect(valid.has(c.affinity)).toBe(true)
    }
  })

  it('recommendedDifficulty は easy/normal/hard のいずれか', () => {
    const valid = new Set(['easy', 'normal', 'hard'])
    for (const c of NPC_CHARACTERS) {
      expect(valid.has(c.recommendedDifficulty)).toBe(true)
    }
  })

  it('themeColor は 24bit 範囲内', () => {
    for (const c of NPC_CHARACTERS) {
      expect(c.themeColor).toBeGreaterThanOrEqual(0)
      expect(c.themeColor).toBeLessThanOrEqual(0xffffff)
    }
  })
})
