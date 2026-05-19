# PixiJS v8 移植経緯（歴史ドキュメント）

janken-hub は当初 **React 18 + Tailwind CSS + FastAPI + Docker Compose**
の構成で立ち上がり（旧 `frontend/` + `backend/`）、2026-05 から
**PixiJS v8 + Vite + TypeScript** のフロント完結アプリへ全面移植された。

移植は GitHub Issue `#2` 〜 `#12` で進行し、`#12` で旧スタックの撤去と
ドキュメント書き直しを完了して終了している。本ファイルは「なぜこの構成に
なっているか」を後から振り返るための歴史ドキュメント。**現状アーキテクチャは
[../CLAUDE.md](../CLAUDE.md) を正本とする**。

## 移植の流れ

| Issue | 内容                                                          | 状態   |
| ----- | ------------------------------------------------------------- | ------ |
| #2    | React/Tailwind/FastAPI を除去し PixiJS v8 + Vite 環境を整える | 完了   |
| #3    | GameState 型定義と initWithState 実装                         | 完了   |
| #4    | シーン基盤（Title → RuleSelect → Game → Result）              | 完了   |
| #5    | 入力管理 InputManager 実装                                    | 完了   |
| #6    | NPC AI とキャラクター表示（Easy/Normal/Hard）                 | 完了   |
| #7    | Classic RPS シーン                                            | 完了   |
| #8    | Ido Janken シーン（4 手・井戸ルール）                         | 完了   |
| #9    | Achi Muite Hoi シーン（2 段階フロー）                         | 完了   |
| #10   | Glico シーン                                                  | 未着手 |
| #11   | LocalStorage 戦績保存 + 結果アニメ・SE                        | 未着手 |
| #12   | 旧 React/FastAPI 全削除 + ドキュメント書き直し                | 完了   |

旧 backend (FastAPI / WebSocket) は当時はリアルタイム対戦サーバとして
存在していたが、PixiJS 版は NPC 対戦オンリーのフロント完結に方針転換した
ため不要になった。旧 backend の依存スナップショットが必要になったら
commit `efb63df^` の `backend/uv.lock` / `backend/pyproject.toml` を
参照する。

## 設計判断のメモ

### シーン基盤を `pixi.js` の `Container` 直継承にした理由

State machine と Scene Graph を 1 つにまとめると、シーン破棄時に
`destroy({ children: true })` だけで描画ツリーごと消せて、リスナの
片付けと組み合わせれば「シーンに付随する全リソース」が原子的に開放できる。
`legend-of-window-ninja` で実証済みのパターン。

### `GameState` をシーン外に置いた理由

ルール判定（純粋関数）とシーン（描画 + 状態機械）を分離するため。
`src/game/rules/*.ts` は紙と鉛筆で書ける純粋ロジックに保ち、シーンは
それを呼ぶだけ。`initWithState` で fixture / リスタート / セーブ復元が
同じ経路を通る。

### ステージサイズ 800 × 600 (4:3)

レトロ感を出すための意図的な選択。`src/game/constants.ts` で固定値として
定義し、`index.html` の CSS `aspect-ratio: 800 / 600` で 4:3 を保ったまま
スマホでも縮小表示する。`autoDensity: true` が canvas の inline style に
寸法を書き込むため、CSS で `width: auto !important; height: auto !important`
を打ち消す必要がある（再発防止メモ参照）。

### カラー定数を Tailwind の hex 値で取り込んだ理由

旧 React 版の DESIGN.md は Tailwind クラス前提で書かれており、ブランド色
（青→紫グラデ・白カード・緑/赤/黄の勝敗）はそのまま新版でも採用したかった。
`src/game/constants.ts` で Tailwind パレットの hex 値を定数化することで、
DESIGN.md と 1:1 で対応するようにしてある。

## 移植中に発見した落とし穴（再発防止メモ）

### PixiJS v8 の renderPipe 事前登録

`Text` / `Graphics` 等のクラスが持つ renderPipe は、各クラスの `init.mjs`
の **side-effect import** で `extensions.add(...)` 経由で登録される。
`Application.init()` は登録済み pipe を **1 度だけスナップショット** して
`renderer.renderPipes` マップを構築するため、シーン側の dynamic import
越しに Text/Graphics を引っ張る構成だと **本番ビルドだけ** で
`Cannot read properties of undefined (reading 'updateRenderable')` が出る
（dev では同期評価なので顕在化しない）。

対策: `src/main.ts` 冒頭で `import 'pixi.js/text'` /
`import 'pixi.js/graphics'` を side-effect import し、init() より先に
pipe を登録させる。`src/main.test.ts` が回帰防止ガード。

### canvas のアスペクト比

`autoDensity: true` が canvas の **inline style** に
`"<STAGE_WIDTH>px"` / `"<STAGE_HEIGHT>px"` を書き込むため、
`max-width: 100vw / max-height: 100vh` だけだとスマホで縦伸びする。

対策: CSS で `width: auto !important; height: auto !important;` を当てた
うえで `aspect-ratio: 800 / 600` を指定し、4:3 を保ったまま縮める。
`src/index-html.test.ts` が回帰防止ガード（`STAGE_WIDTH` / `STAGE_HEIGHT`
との同期も検証）。
