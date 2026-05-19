# PixiJS v8 移植進捗 (#2 - #12)

janken-hub は当初 React 18 + Tailwind CSS + FastAPI + Docker Compose の構成だった
（README.md / CLAUDE.md / DESIGN.md / docs/architecture.md はその構成の記述）。
2026-05 以降、**PixiJS v8 + Vite + TypeScript** のフロント完結アプリへ全面移植中。
最終形は endroll-jumpers / yatagarrage / legend-of-window-ninja と同じ構成。

新旧の構成はリポジトリ内に **並存** している。`#12` で旧構成（frontend/ / backend/ /
compose.yaml / Dockerfile.dev）とドキュメント類が全削除され、PixiJS 構成のみが残る予定。

## 新構成 (ルート直下)

```
janken-hub/
├── index.html              # PixiJS 用エントリ HTML
├── package.json            # pixi.js@^8 / vite@^6 / vitest@^4 / typescript@^5
├── tsconfig.json           # strict + noUnused* + bundler resolution
├── vite.config.ts          # base: /janken-hub/, test.environment: 'jsdom'
├── eslint.config.js        # flat config, frontend/backend は ignores
├── .prettierrc
├── .husky/                 # lint-staged hook
├── src/
│   ├── main.ts             # PixiJS Application を初期化し App に渡す
│   ├── vite-env.d.ts
│   └── game/
│       ├── App.ts          # シーン切替コントローラ (isTransitioning ガード付き)
│       ├── Scene.ts        # 基底クラス (enter / exit / update / resize / destroyScene)
│       ├── constants.ts    # STAGE_WIDTH/HEIGHT, DESIGN.md カラー定数
│       ├── state.ts        # initWithState (GameState ファクトリ)
│       ├── types.ts        # Hand / GameState / RuleState など
│       └── scenes/
│           ├── TitleScene.ts
│           ├── RuleSelectScene.ts
│           ├── GameScene.ts     # プレースホルダ (#7-#10 で本実装)
│           └── ResultScene.ts
└── docs/
    ├── architecture.md          # 旧 React/FastAPI 設計図 (#12 で更新予定)
    └── migration-pixijs.md      # このファイル
```

並存する旧構成（このフェーズでは触らない）:

- `frontend/` — React + Vite の旧 UI
- `backend/` — FastAPI + WebSocket
- `compose.yaml`, `frontend/Dockerfile.dev`
- `README.md`, `CLAUDE.md`, `DESIGN.md` — Tailwind 言及あり、`#12` で書き換え

参考リポ（同じ構成の手本）:

- `kako-jun/legend-of-window-ninja`
- `kako-jun/endroll-jumpers`
- `kako-jun/yatagarrage`

## ロードマップ

| Issue | 内容                                                                                        | 状態       |
| ----- | ------------------------------------------------------------------------------------------- | ---------- |
| #2    | PixiJS v8 + Vite + TypeScript 環境をルートに併設                                            | 完了 (#13) |
| #3    | `GameState` 型定義と `initWithState`                                                        | 完了 (#14) |
| #4    | シーン基盤 (Title → RuleSelect → Game → Result)                                             | 完了 (#15) |
| #5    | 入力管理 (キーボード / ポインタ / マルチタッチ統一 InputManager)                            | 実装中     |
| #6    | NPC AI とキャラクター表示 (Easy/Normal/Hard 難易度)                                         | 完了 (#18) |
| #7    | Classic RPS シーン本実装 (3 手じゃんけん + 結果アニメ + 勝敗判定)                           | 完了 (#19) |
| #8    | Ido Janken シーン (4 手・井戸ルール)                                                        | 実装中     |
| #9    | Achi Muite Hoi シーン (じゃんけん → 方向選択 2 段階フロー)                                  | 実装中     |
| #10   | Glico Game シーン (階段ゲーム)                                                              | 未着手     |
| #11   | LocalStorage 戦績保存 + 結果アニメ・SE                                                      | 未着手     |
| #12   | 旧 React/Tailwind/backend 削除 + README/CLAUDE/DESIGN/architecture を PixiJS 構成に書き換え | 未着手     |

## 起動方法 (PixiJS 構成)

リポジトリのルートで実行する。`frontend/` / `backend/` には入らない。

```bash
npm install         # 依存解決
npm run dev         # http://localhost:3000 で PixiJS Application が起動
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run test        # vitest run
npm run build       # tsc && vite build → dist/
```

`base` を `/janken-hub/` にしているため、GitHub Pages の
`https://kako-jun.github.io/janken-hub/` 配下に置く想定。

## 主要設計判断

### シーン構造

`Scene` 基底クラスは `PIXI.Container` を継承し、`enter()` / `exit(param)` /
`update(deltaMs)` / `resize(w, h)` / `destroyScene()` を持つ。
シーン切替は `App.replaceScene()` が `destroyScene()` → `addChild` →
`enter()` の順に呼び、`isTransitioning` フラグで動的 `import()` 中の多重遷移を防ぐ
（legend-of-window-ninja と同じ方針）。

各シーンは `enter()` で `keydown` / `keyup` / `pointerdown` を `window` に
addEventListener し、`destroyScene()` の冒頭で removeEventListener する。
シーン切替時にリスナが残らないことを単体テストで検証する方針。

### GameState

`GameState` はシーン横断の純粋データ。`ruleState` は `kind` 付き判別共用体で
`classic_rps` / `ido_janken` / `achi_muite_hoi` / `glico` を切り替える。
`initWithState(partial)` は `partial.rule` を切り替えると `ruleState` を
自動でルール用デフォルトに整合させる（kind 不一致なら破棄）。
テスト fixture / シーンリスタート / セーブ復元で同じ関数を使う。

### カラー定数

DESIGN.md の Tailwind カラーを 16 進数で `constants.ts` に取り込む。
`COLOR_WIN = 0x22c55e` / `COLOR_LOSE = 0xef4444` / `COLOR_DRAW = 0xeab308`。
ResultScene が `RoundResult` から色を選ぶ。

### ステージサイズ

`STAGE_WIDTH = 800` / `STAGE_HEIGHT = 600` 固定。
CSS 側 (`index.html`) で `canvas { max-width: 100vw; max-height: 100vh }`
にして縮小表示。`resize()` フックは将来のレスポンシブ調整用に空 override で持つ。

## 移植完了後の状態

`#12` (2026-05-20 完了) で:

- `frontend/` / `backend/` / `compose.yaml` / `docs/architecture.md` を削除
- `eslint.config.js` の `ignores` から `frontend` / `backend` を削除
- `.github/workflows/deploy.yml` をルートビルドに修正
- `CLAUDE.md` / `README.md` / `DESIGN.md` を PixiJS 構成に書き直し

本ファイルは移植経緯の歴史ドキュメントとして残してある。
現状アーキテクチャは [CLAUDE.md](../CLAUDE.md) を参照。

### 移植中に発見した落とし穴（再発防止用メモ）

- **PixiJS v8 の pipe 事前登録**: `Text` / `Graphics` の renderPipe は
  各クラスの side-effect import で登録される。`Application.init()` は
  登録済み pipe を 1 度だけスナップショットするため、Scene の dynamic
  import 越しに Text/Graphics を引っ張る構成だと本番ビルドだけで
  「Cannot read properties of undefined (reading 'updateRenderable')」
  が出る。`main.ts` で `import 'pixi.js/text'` / `'pixi.js/graphics'` を
  side-effect import して事前登録させる
- **canvas のアスペクト比**: `autoDensity: true` が inline style に
  寸法を書き込むため、`max-width: 100vw / max-height: 100vh` だけだと
  スマホで縦伸びする。`width: auto !important` + `aspect-ratio: 800/600`
  で打ち消す
