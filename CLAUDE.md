# CLAUDE.md — janken-hub 開発エージェント向けガイド

世界のじゃんけんを集めた、PixiJS v8 + Vite + TypeScript のフロント完結アプリ。
サーバなし。LocalStorage で完結。

## このリポジトリの正本

- **アーキテクチャ**: 本ファイル
- **ビジュアル設計**: [DESIGN.md](./DESIGN.md)
- **公開向け説明**: [README.md](./README.md)
- **旧 React/FastAPI 時代の経緯**: [docs/migration-pixijs.md](./docs/migration-pixijs.md)

## 技術スタック

- **PixiJS v8** — WebGL/WebGPU 自動切替、Scene Graph
- **Vite 6** — dev/preview/build
- **TypeScript 5** — `strict` + `noUnused*` + bundler resolution
- **Vitest 4** — jsdom 環境のユニットテスト
- **ESLint 9 (flat config) + Prettier + Husky + lint-staged**

ランタイム依存は `pixi.js` ただ 1 つ。

## ディレクトリ構成

```
janken-hub/
├── index.html              # PixiJS canvas ホスト + loading 表示
├── src/
│   ├── main.ts             # Application 初期化、pipe 事前登録、App へ委譲
│   └── game/
│       ├── App.ts          # シーン切替コントローラ
│       ├── Scene.ts        # 基底クラス
│       ├── constants.ts    # ステージ寸法 + カラー定数
│       ├── state.ts        # GameState ファクトリ initWithState
│       ├── types.ts        # Hand / GameState / RuleState など
│       ├── input.ts        # 入力統合
│       ├── InputEdgeDetector.ts  # 押しっぱなしすり抜け防止
│       ├── scenes/         # Title / RuleSelect / *Scene / Result
│       ├── rules/          # ルール判定の純粋関数
│       └── npc/            # NPC AI とキャラクター表示
└── docs/
    └── migration-pixijs.md  # 旧 React/FastAPI → PixiJS への移植経緯
```

`src/game/**` の `.test.ts` は Vitest 用の単体テスト。Scene 系も DOM を
触る箇所だけ jsdom で確認している（getContext 警告はテスト結果には影響しない）。

## アーキテクチャ

### シーン基盤

`Scene` は `pixi.js` の `Container` を継承した基底クラスで、

- `enter()`: シーンが addChild された後の初期化フック
- `update(deltaMs)`: 毎フレーム呼ばれる更新フック
- `resize(w, h)`: ウィンドウリサイズ通知（将来用、現状は空 override）
- `destroyScene()`: 切替直前のクリーンアップ。`destroy({ children: true })`

シーン切替は `App.replaceScene()` が `removeChild → destroyScene → addChild
→ enter` の順で実行する。動的 `import()` 中の多重遷移を `isTransitioning`
フラグで防ぐ（`legend-of-window-ninja` と同じ方針）。

各シーンは `enter()` で `keydown` / `keyup` / `pointerdown` を `window` に
addEventListener し、`destroyScene()` の冒頭で removeEventListener する。
**リスナの片付け漏れはユニットテストで検証している**。

### GameState

`GameState` はシーン横断の純粋データ。判別共用体 `RuleState` で
`classic_rps` / `ido_janken` / `achi_muite_hoi` / `glico` を切り替える。

```ts
type RuleState =
  | { kind: 'classic_rps'; data: ClassicRpsState }
  | { kind: 'ido_janken'; data: IdoJankenState }
  | { kind: 'achi_muite_hoi'; data: AchiMuiteState }
  | { kind: 'glico'; data: GlicoState }
```

`initWithState(partial)` は `partial.rule` の切り替えに合わせて
`ruleState` を自動でルール用デフォルトに整合させる（kind 不一致は破棄）。
テスト fixture / シーンリスタート / セーブ復元で共通利用。

### ルール判定

`src/game/rules/` 配下に **純粋関数だけ** を置く。
シーンは画面遷移と描画担当、ルール判定は鉛筆紙でも書ける純粋ロジック、と
役割を分離する。

| ファイル            | 役割                                        |
| ------------------- | ------------------------------------------- |
| `classic_rps.ts`    | じゃんけん 3 手の勝敗                       |
| `ido_janken.ts`     | 井戸（rock < well < scissors の追加ルール） |
| `achi_muite_hoi.ts` | 方向一致判定                                |

### NPC AI

`src/game/npc/` 配下。難易度を 3 段階に分けてある。

| ファイル        | 戦略                               |
| --------------- | ---------------------------------- |
| `RandomAI.ts`   | 完全ランダム                       |
| `MemoryAI.ts`   | 直近の人間の手を覚えて読みに来る   |
| `WeightedAI.ts` | 重み付き戦略（normal/hard で使用） |

`characters.ts` に NPC 設定（名前 + 性格 + 難易度）を集約。
`CharacterDisplay.ts` が PixiJS Container として描画する。

### 入力統合

`input.ts` は keyboard / mouse / touch を `InputAction` に正規化する。
`InputEdgeDetector` は「シーン遷移直後にキーが押しっぱなしですり抜ける」
バグを防ぐためのエッジ判定器で、状態遷移後に **離してから押し直す**
ことを要求する。タイトル → ルール選択でうっかり選択が走るのを防ぐ。

## 重要な実装上の注意

### PixiJS v8 の pipe 事前登録

`main.ts` の冒頭で

```ts
import 'pixi.js/text'
import 'pixi.js/graphics'
```

を **必ず** 入れる。PixiJS v8 は各クラスファイルが副作用として
`extensions.add(...)` で renderPipe を登録するが、`Application.init()` は
登録済み pipe を **1 度だけ** スナップショットしてマップを作る。
Scene が dynamic import 越しに Text/Graphics を引っ張る構成だと、本番
ビルドでだけ「Cannot read properties of undefined (reading
'updateRenderable')」が出る。dev では同期評価なので顕在化しない。

### canvas のアスペクト比

`autoDensity: true` が canvas の **inline style** に `"800px"`/`"600px"` を
書き込むため、`index.html` の `max-width: 100vw / max-height: 100vh` だけ
だとスマホで縦伸びする。`width: auto !important; height: auto !important;
aspect-ratio: 800 / 600;` の 3 行セットで打ち消す。

### Co-Authored-By を付けない

コミットメッセージに Claude/AI の痕跡を残さない。`/commit` スキルも
この方針で設定されている。

## 開発コマンド

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # tsc + vite build
npm run preview      # built artifact を確認 (本番バグの再現に必須)
npm test             # vitest run
npm run lint
npm run lint:fix
npm run typecheck
npm run format
```

**本番ビルドだけで起きるバグ** (上の pipe 登録のような問題) を踏むので、
描画系の変更を入れたら `npm run preview` で動作確認するクセを付ける。

## デプロイ

- 公開 URL: https://janken-hub.llll-ll.com
- 配信: **Cloudflare Pages**（`server: cloudflare`）。main への push で
  Cloudflare 側が自動ビルド・デプロイする
- `.github/workflows/deploy.yml` も GitHub Pages 向けのフォールバックとして
  ルートビルドを設定済み（実運用は Cloudflare Pages 側）

## テスト方針

- ルール判定（`rules/*.ts`）と AI（`npc/*.ts`）は **純粋関数ベース** で
  網羅テスト
- シーン（`scenes/*.ts`）は **状態機械の遷移** を中心にテスト。
  PixiJS の描画自体はテストしない（jsdom で `getContext` が未実装なため、
  描画系の警告は無視）
- App.ts は `isTransitioning` ガードとリスナの片付けをテスト

新しいシーン/ルール/AI を足したら必ず `.test.ts` を併走させる。

## 起動時の流れ

1. `index.html` → `#loading` を表示
2. `main.ts` → `pixi.js/text` / `pixi.js/graphics` を side-effect import
3. `Application.init({ width: 800, height: 600, ... })` で renderer 構築
4. `#game` に canvas を挿入
5. `App` インスタンス生成 → `app.startTitle()` で TitleScene 起動
6. `#loading` を除去

シーン遷移は `Scene.exit({ next, rule?, result? })` でリクエストし、
`App.handleExit()` が次のシーンを動的 import する。

## 残タスク

進行中の作業は GitHub Issues を正本とする。次のマイルストーンは:

- **#10**: Glico（階段じゃんけん）シーンの実装
- **#11**: LocalStorage 戦績保存 + 結果アニメ・SE
- **#21**: ClassicRps / IdoJanken の共通基底抽出（refactor）
