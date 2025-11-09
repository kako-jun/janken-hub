# Janken Hub (じゃんけんハブ)

> リアルタイムじゃんけん対戦プラットフォーム

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple)](https://vitejs.dev/)

## 🎮 コンセプト

**じゃんけんハブ**は、WebSocketによるリアルタイム通信を活用したじゃんけん対戦プラットフォームです。

### 主な特徴

- 🌐 **リアルタイム対戦**: WebSocketによる常時接続
- 🏆 **マッチングシステム**: 自動または友達対戦
- 📊 **統計・ランキング**: 戦績管理と順位表示
- ⚡ **高速レスポンス**: FastAPI + Reactで快適な操作感

## 🚀 技術スタック

- **フロントエンド**: React 18 + TypeScript 5.7 + Vite 6
- **スタイリング**: Tailwind CSS 4
- **レイアウト**: Flexbox + Absolute Positioning
- **アニメーション**: Framer Motion
- **バックエンド**: FastAPI + Python 3.11+
- **リアルタイム通信**: WebSocket
- **パッケージ管理**: uv (Backend) / npm (Frontend)
- **開発環境**: Docker Compose
- **コード品質**: ESLint + Prettier + Husky

## 📦 セットアップ

### 前提条件

- Docker & Docker Compose（推奨）
- または:
  - Python 3.11+ & uv
  - Node.js 20+

### インストール（Docker使用）

```bash
# リポジトリのクローン
git clone https://github.com/kako-jun/janken-hub.git
cd janken-hub

# Docker Composeで全サービス起動
docker compose up
```

### ローカル開発（Dockerなし）

```bash
# Backend
cd backend
uv sync
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8080

# Frontend（別ターミナル）
cd frontend
npm install
npm run dev
```

### アクセスURL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs（FastAPI自動生成）
- **WebSocket**: ws://localhost:8080/ws

## 🛠️ 開発コマンド

### Docker Compose

```bash
# 全サービス起動
docker compose up

# バックグラウンド起動
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

### Frontend

```bash
cd frontend

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# Lint
npm run lint
npm run lint:fix

# フォーマット
npm run format
npm run format:check
```

### Backend

```bash
cd backend

# 開発サーバー起動
uvicorn app.main:app --reload --port 8080

# テスト
uv run pytest

# 型チェック
uv run mypy app
```

## 📁 プロジェクト構造

```
janken-hub/
├── backend/                   # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py           # FastAPI エントリーポイント
│   │   ├── models.py         # Pydantic モデル
│   │   └── websocket.py      # WebSocket管理
│   ├── Dockerfile
│   └── pyproject.toml        # uv 依存関係
├── frontend/                  # React + Vite フロントエンド
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── Dockerfile.dev
│   └── package.json
├── compose.yaml              # Docker Compose設定
├── CLAUDE.md                 # 全体実装計画
└── README.md                 # このファイル
```

## 🎯 開発ロードマップ

詳細な実装計画は [CLAUDE.md](./CLAUDE.md) を参照してください。

## 🤝 コントリビューション

現在、このプロジェクトは初期開発段階です。コントリビューションガイドラインは後日追加予定です。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 👤 作者

**kako-jun**

- GitHub: [@kako-jun](https://github.com/kako-jun)

## 📝 現在の状態

⚠️ **開発初期段階**: 基本的なReact + Vite環境のセットアップが完了しています。ゲーム機能は未実装です。

---

**🚧 This project is currently under active development 🚧**
