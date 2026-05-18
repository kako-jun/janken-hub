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
| #5    | じゃんけん勝敗判定 (Classic RPS) ロジック + テスト                                          | 未着手     |
| #6    | NPC ロジック (easy = ランダム)                                                              | 未着手     |
| #7    | Classic RPS GameScene 本実装                                                                | 未着手     |
| #8    | Ido Janken (井戸じゃんけん)                                                                 | 未着手     |
| #9    | Achi Muite Hoi (あっちむいてホイ)                                                           | 未着手     |
| #10   | Glico (階段じゃんけん)                                                                      | 未着手     |
| #11   | スコア表示・ベストオブ進行 UI                                                               | 未着手     |
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

## 既知の TODO（次に拾うもの）

- `App.ts` から `Scene` への `resize()` 呼び出しは未配線（`window.resize`
  イベントを App が拾ってシーンに伝える経路は `#7` 以降で追加する）
- `vitest` で `getContext` 未実装の警告が出る（PixiJS が DOM 上で
  canvas 取得を試みるため）。テストの assertion には影響しない
- `frontend/` / `backend/` の lint は `eslint.config.js` で `ignores` 済
