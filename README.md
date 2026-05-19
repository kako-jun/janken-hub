# Janken Hub (じゃんけんハブ)

> 世界のじゃんけんを集めた対戦ハブ

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PixiJS](https://img.shields.io/badge/PixiJS-8-ff66aa)](https://pixijs.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)

🌐 https://janken-hub.llll-ll.com

## コンセプト

各国・各地域のじゃんけん文化を 1 枚のキャンバスに集約した、フロント完結のオフライン対戦ハブ。
NPC との対戦で各ルールを楽しめる。サーバなし・LocalStorage で完結。

## 実装済みルール

| ルール         | 説明                             |
| -------------- | -------------------------------- |
| Classic RPS    | 通常じゃんけん（best-of-3）      |
| Ido Janken     | 井戸じゃんけん（4 手）           |
| Achi Muite Hoi | あっちむいてホイ（2 段階フロー） |
| Glico          | 階段じゃんけん **(WIP)**         |

## 技術スタック

- **PixiJS v8** — WebGL/WebGPU レンダリング
- **Vite 6** — dev サーバ & ビルド
- **TypeScript 5** — strict mode
- **Vitest 4** — ユニットテスト（jsdom）

サーバなし、フロント完結。

## 開発

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run preview      # ビルド成果物をローカルで確認
npm test             # vitest
npm run lint
npm run typecheck
```

Node.js 22 以上。

## プロジェクト構造

```
janken-hub/
├── index.html              # PixiJS 用エントリ HTML
├── src/
│   ├── main.ts             # Application 初期化
│   └── game/
│       ├── App.ts          # シーン切替コントローラ
│       ├── Scene.ts        # 基底クラス（enter/exit/update/destroyScene）
│       ├── constants.ts    # ステージ/カラー定数
│       ├── state.ts        # GameState ファクトリ
│       ├── types.ts        # Hand / GameState / RuleState など
│       ├── input.ts        # 入力統合 (キー/タップ/マウス)
│       ├── InputEdgeDetector.ts  # 押しっぱなしすり抜け防止
│       ├── scenes/         # TitleScene / RuleSelectScene / 各 GameScene / ResultScene
│       ├── rules/          # ルール判定純粋関数
│       └── npc/            # NPC AI（Random / Memory / Weighted）+ キャラクター
├── docs/                   # 設計メモ
├── CLAUDE.md               # 開発エージェント向けガイド
├── DESIGN.md               # ビジュアル設計指針
└── vite.config.ts
```

## 設計ドキュメント

- [CLAUDE.md](./CLAUDE.md) — アーキテクチャと開発規約
- [DESIGN.md](./DESIGN.md) — ビジュアル設計（カラー・タイポ・レイアウト）

## ライセンス

MIT License — [LICENSE](LICENSE) 参照。

## 作者

[@kako-jun](https://github.com/kako-jun)
