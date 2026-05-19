# DESIGN.md

Janken Hub — Design System (PixiJS 版)

> Tailwind 時代のカラー語彙はそのままに、PixiJS の `Graphics` / `Text` で
> 再構築している。本ドキュメントは「PixiJS で UI を組み立てるエージェント
> が参照する仕様書」を意図して、Tailwind クラスではなく **hex 値と
> PixiJS のスタイル指定** に揃えてある。

## 1. ビジュアルテーマ

賑やかなアーケードゲーム調。背景は青→紫のグラデで埋め、白いカードが影付きで
浮かぶ。絵文字を大胆に使い、テキストを読まなくても「グー / チョキ / パー」が
わかる UI。雰囲気はモバイルゲームのロビーや、お祭りの一画にあるアミューズメント。

インスピレーション: モバイルゲームのロビー、アーケード筐体、パーティゲーム。

## 2. カラーパレット

定数は `src/game/constants.ts` に集約。

| 役割           | 定数              | Hex        | 用途       |
| -------------- | ----------------- | ---------- | ---------- |
| 背景（上半分） | `BG_COLOR_TOP`    | `0x3b82f6` | blue-500   |
| 背景（下半分） | `BG_COLOR_BOTTOM` | `0x9333ea` | purple-600 |
| カード地       | `CARD_COLOR`      | `0xffffff` | 白カード   |
| 主テキスト     | `TEXT_PRIMARY`    | `0x1f2937` | gray-800   |
| 補助テキスト   | `TEXT_SECONDARY`  | `0x4b5563` | gray-600   |
| 勝利           | `COLOR_WIN`       | `0x22c55e` | green-500  |
| 敗北           | `COLOR_LOSE`      | `0xef4444` | red-500    |
| 引き分け       | `COLOR_DRAW`      | `0xeab308` | yellow-500 |

ダーク版なし、ライト版のみ。PixiJS の Graphics で塗りを当てる場合は
`.fill({ color: BG_COLOR_TOP })` のように 16 進整数で渡す。

### グラデ背景の描き方

シーン側で 2 枚の矩形 (上半分 / 下半分) を `Graphics().rect(...).fill()` で
描いて重ねる近似でよい。本物のグラデが必要になったら Mesh + Shader だが、
現状の DESIGN コンセプト的に 2 色矩形で十分。

## 3. タイポグラフィ

### フォント

| 用途   | family                                        |
| ------ | --------------------------------------------- |
| 既定   | `'Inter, system-ui, sans-serif'`              |
| 絵文字 | `'sans-serif'`（system emoji フォールバック） |

### サイズ

| 要素           | fontSize | weight | 備考                               |
| -------------- | -------- | ------ | ---------------------------------- |
| 大タイトル     | 72       | bold   | TitleScene の「JankenHub」         |
| 見出し         | 36       | bold   | RuleSelect の「ルールを選ぶ」      |
| カードタイトル | 22       | bold   | ルール名                           |
| 補助テキスト   | 16       | normal | カードの説明文                     |
| ヒント         | 22-28    | bold   | 「PRESS SPACE / TAP TO START」など |
| 絵文字         | 40+      | n/a    | カードアイコン                     |

PixiJS の Text は `new Text({ text, style })` で組む。anchor は `0.5`
（中央寄せ）か `0.5, 0`（上端 + 横中央）が基本。

## 4. コンポーネントスタイル

### ルールカード（白カード）

```
Graphics
  .roundRect(0, 0, CARD_W, CARD_H, 12)
  .fill({ color: 0xffffff })
```

- 角丸: 12px
- サイズ: 320 × 180（RuleSelectScene 既定）
- シャドウ近似: `Graphics.roundRect(4, 6, w, h, 12).fill({ color: 0x000000, alpha: 0.25 })`
  を本体の **裏側** に重ねる（PixiJS にネイティブの box-shadow は無い）

### ハンドボタン（絵文字）

カード中央に絵文字 1 つ。`text-5xl 相当 = fontSize 40-48`。
キーボード（1/2/3/4）でも操作できるよう数字ヒントを下部に置く。

### 結果表示

| 結果 | テキスト色              | サイズ |
| ---- | ----------------------- | ------ |
| WIN  | `COLOR_WIN` (0x22c55e)  | 48-72  |
| LOSE | `COLOR_LOSE` (0xef4444) | 48-72  |
| DRAW | `COLOR_DRAW` (0xeab308) | 48-72  |

### スコア

白カードに `TEXT_PRIMARY` で player 名と数字。
中央に「VS」を `TEXT_SECONDARY` で添える。

## 5. レイアウト

ステージは固定 `STAGE_WIDTH = 800 / STAGE_HEIGHT = 600` (4:3)。
`index.html` の CSS で `aspect-ratio: 800 / 600` を維持しつつ
`max-width: 100vw / max-height: 100vh` で縮小表示する
（PixiJS の `autoDensity: true` が canvas の inline style を上書きする
ため `width: auto !important; height: auto !important;` で打ち消している）。

### グリッド

- ルール選択: 2 × 2 グリッド
- カード間 gap: 32px
- 中央配置: `(STAGE - gridSize) / 2`

### 余白

| 用途               | 値      |
| ------------------ | ------- |
| 画面端から         | 32px    |
| カード間           | 32px    |
| カード内パディング | 16-24px |

## 6. 奥行きと階層

PixiJS は z-index ではなく `addChild` の順序で奥行きを表現する。

- 背景 Graphics（青/紫 2 枚）→ 最初に addChild
- カード（影 → 本体 → アイコン → テキスト）の順に重ねる
- 効果テキスト（FLASH / 勝敗アニメ）は最後に addChild

シャドウは Graphics の半透明矩形をオフセットして敷く。
モーダルや重ね合わせは現状なし（必要になったら `app.stage` の最後尾に
覆い隠す Graphics を追加する）。

## 7. インタラクション

### スケール変化（カード）

| 状態  | scale |
| ----- | ----- |
| 既定  | 1.0   |
| hover | 1.05  |
| 押下  | 0.95  |

`card.on('pointerover' / 'pointerdown' / 'pointerup' / 'pointerout' /
'pointerupoutside')` でハンドリング。`scale.set(...)` で変化させる。
モバイルは hover を持たないので `pointerdown` → `pointerup` の 0.95 →
1.0 だけが効く（pointerover が同時に発火する WebKit/Chromium 実装も
あるので、不要な拡大が残らないよう `pointerout` で必ず 1.0 へ戻す）。

### 入力エッジ検出

タイトル等の「押しっぱなしですり抜ける」現象を防ぐため、
`InputEdgeDetector` を経由して **状態遷移直後にもう一度離してから押す**
ことを要求する。`triggerOnce()` / `setPressed(true|false)` / `disarm()`
の 3 API のみ。

## 8. レスポンシブ挙動

ステージは固定サイズで、CSS の `aspect-ratio` で縮小表示する方針。

- スマホ縦持ち: 横幅にフィット、上下にレターボックス
- スマホ横持ち: 縦にフィット、左右にレターボックス
- デスクトップ: 等倍以下で表示（ステージより大きくはしない）

タッチターゲットは絵文字 + カード全面が反応するので、320 × 180px
（拡大時）= スマホ実機でも 100 × 60px 以上は確保される。

## 9. やる / やらない

### やる

- 青→紫グラデ背景は全シーン共通
- 白カード + 影で要素を浮かせる
- 絵文字を大きく使う（fontSize 40+）
- カードは hover/press でスケール変化
- 勝敗カラーは緑/赤/黄の 3 色だけ
- ステージ固定 + CSS aspect-ratio で縮小レスポンシブ

### やらない

- ダーク版を作る
- 凝った遷移アニメ（scale/alpha 以外を増やす）
- ボーダー線（影で表現する）
- カスタムフォントの読み込み（system font で十分）
- z-index 制御（PixiJS では addChild 順）

## 10. エージェント向けクイックリファレンス

```ts
// 16 進カラー
BG_COLOR_TOP = 0x3b82f6 // blue-500
BG_COLOR_BOTTOM = 0x9333ea // purple-600
CARD_COLOR = 0xffffff
TEXT_PRIMARY = 0x1f2937
TEXT_SECONDARY = 0x4b5563
COLOR_WIN = 0x22c55e
COLOR_LOSE = 0xef4444
COLOR_DRAW = 0xeab308

// ステージ
STAGE_WIDTH = 800
STAGE_HEIGHT = 600

// 典型スタイル
const TITLE_STYLE = {
  fill: 0xffffff,
  fontSize: 72,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold',
}
const HINT_STYLE = {
  fill: 0xffffff,
  fontSize: 24,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold',
}
const CARD_STYLE = {
  fill: TEXT_PRIMARY,
  fontSize: 22,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 'bold',
}
```

「ブランドの感情」:

- 青→紫: エネルギー、遊び、競技性
- 白カード: 明瞭さ、フォーカス、清潔なゲーム盤
- 緑: 勝利、達成、祝祭
- 赤: 敗北、再挑戦
- 黄: 引き分け、緊張、未決
