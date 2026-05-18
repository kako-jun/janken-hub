// janken-hub の共通定数。
//
// ステージサイズ・配色などゲーム全体で共有する値を集約する。
// DESIGN.md にあるブランドカラー (blue→purple グラデ + white カード) を踏襲。

export const STAGE_WIDTH = 800
export const STAGE_HEIGHT = 600

// 背景は DESIGN.md の blue→purple グラデを近似した単色。
// 細かいグラデは Scene 側で Graphics を使って描く想定。
export const BG_COLOR_TOP = 0x3b82f6 // blue-500
export const BG_COLOR_BOTTOM = 0x9333ea // purple-600

export const CARD_COLOR = 0xffffff
export const TEXT_PRIMARY = 0x1f2937 // gray-800
export const TEXT_SECONDARY = 0x4b5563 // gray-600
export const COLOR_WIN = 0x22c55e // green-500
export const COLOR_LOSE = 0xef4444 // red-500
export const COLOR_DRAW = 0xeab308 // yellow-500
