# Cafferot - 全体実装計画

## プロジェクト概要
カフェロット (Cafferot) は、ユーザーが自作のカフェロットを展示し、カフェ経営とコミュニティを融合させた2Dゲームです。

## 技術スタック
- **フロントエンド**: React 18 + TypeScript + Tailwind CSS
- **ビルドツール**: Vite
- **レイアウト**: Flexbox + Absolute Positioning (Grid不使用)
- **アニメーション**: Framer Motion
- **リアルタイム通信**: WebSocket → Nostr (段階的移行)
  - Phase 1: WebSocket (ws)
  - Phase 2: 抽象化レイヤー導入
  - Phase 3: Nostr Protocol
- **状態管理**: React Context API / Zustand (必要に応じて)
- **ファイル処理**: FileReader API (Base64変換)
- **ストレージ**: LocalStorage → IndexedDB (大容量対応時)
- **バックエンド**:
  - 初期: Node.js + Express + WebSocket
  - 将来: Nostrリレー（分散型、サーバーレス）

---

## フェーズ1: 基盤構築 (Week 1-2)

### 1.1 プロジェクト構造の整備（name-name準拠）

**プロジェクト全体構成:**
```
cafferot/                      # リポジトリルート
├── backend/                   # FastAPI バックエンド
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI エントリーポイント
│   │   ├── models.py         # Pydantic モデル
│   │   └── websocket.py      # WebSocket管理
│   ├── Dockerfile
│   ├── pyproject.toml        # uv/pip 依存関係
│   └── uv.lock
├── frontend/                  # React + Vite フロントエンド
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── compose.yaml              # Docker Compose設定
├── .gitignore
├── README.md
└── CLAUDE.md
```

**`compose.yaml`（ルート）:**
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - ./backend/app:/app/app
    environment:
      - PYTHONUNBUFFERED=1
    command: uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
    networks:
      - cafferot-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - ./frontend/index.html:/app/index.html
      - ./frontend/vite.config.ts:/app/vite.config.ts
    environment:
      - VITE_API_URL=http://localhost:8080
    command: npm run dev -- --host 0.0.0.0
    networks:
      - cafferot-network
    depends_on:
      - backend

networks:
  cafferot-network:
    driver: bridge
```

---

### 1.1.1 Frontend構成（name-name準拠）
**`frontend/`**
```
frontend/
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── cafe/           # カフェ関連
│   │   ├── cafferot/       # カフェロット関連
│   │   ├── community/      # コミュニティ関連
│   │   └── ui/             # 共通UIコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── services/           # ビジネスロジック
│   │   ├── websocketService.ts   # WebSocket実装
│   │   └── storage.ts            # LocalStorage管理
│   ├── types/              # TypeScript型定義
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── Dockerfile.dev
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .prettierrc
└── eslint.config.js
```

**`frontend/package.json`:**
```json
{
  "name": "cafferot-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/postcss": "^4.1.17",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@typescript-eslint/eslint-plugin": "^8.20.0",
    "@typescript-eslint/parser": "^8.20.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.1.8",
    "globals": "^16.5.0",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.7.1",
    "tailwindcss": "^4.1.17",
    "typescript": "^5.7.3",
    "vite": "^6.0.11"
  }
}
```

---

### 1.1.2 Backend構成（name-name準拠・FastAPI）
**`backend/`**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPIエントリーポイント
│   ├── models.py           # Pydanticモデル（型定義）
│   └── websocket.py        # WebSocket管理
├── Dockerfile
├── pyproject.toml          # uv/pip依存関係
├── uv.lock
└── .gitignore
```

**`backend/pyproject.toml`:**
```toml
[project]
name = "cafferot-backend"
version = "0.1.0"
description = "カフェロット バックエンドAPI"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.9.2",
    "python-multipart>=0.0.12",
    "websockets>=14.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["app"]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
]
```

**`backend/app/main.py`:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .websocket import manager

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cafferot API",
    description="カフェロット リアルタイムAPI",
    version="0.1.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発中はすべて許可
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """ヘルスチェック"""
    return {"status": "ok", "message": "Cafferot API is running"}

# WebSocketエンドポイントを登録
from .websocket import websocket_endpoint
app.websocket("/ws")(websocket_endpoint)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

---

### 1.1.3 WebSocket管理（name-name準拠）
**`backend/app/websocket.py`:**
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """WebSocket接続を管理するクラス"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """WebSocket接続を受け入れる"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """WebSocket接続を切断する"""
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """全クライアントにメッセージをブロードキャスト"""
        for connection in self.active_connections:
            await connection.send_json(message)

# グローバルインスタンス
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    """WebSocketエンドポイント"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()

            # 全クライアントにブロードキャスト
            await manager.broadcast(data)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

### 1.2 Pydanticモデル定義（Backend）

**`backend/app/models.py`:**
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Cafferot(BaseModel):
    """カフェロット"""
    id: str
    name: str
    imageData: str  # Base64 or URL
    audioData: Optional[str] = None
    createdAt: datetime
    authorId: str
    adoptionCount: int = 0
    value: int = 0

class Cafe(BaseModel):
    """カフェ"""
    id: str
    ownerId: str
    name: str
    level: int
    displayedCafferots: list[Cafferot]

class CafeStats(BaseModel):
    """カフェステータス"""
    revenue: int  # 売上
    customerFrequency: int  # 来店頻度
    regularCustomers: int  # 常連客数
    popularity: int  # 人気度
```

### 1.3 TypeScript型定義（Frontend）

**`frontend/src/types/cafferot.ts`:**
```typescript
// カフェロット（Pydanticモデルと同期）
export interface Cafferot {
  id: string
  name: string
  imageData: string // Base64 or URL
  audioData?: string
  createdAt: string // ISOString
  authorId: string
  adoptionCount: number // 採用数
  value: number // 価値
}
```

**`frontend/src/types/cafe.ts`:**
```typescript
import type { Cafferot } from './cafferot'

// カフェ
export interface Cafe {
  id: string
  ownerId: string
  name: string
  level: number
  displayedCafferots: Cafferot[]
}

// カフェステータス
export interface CafeStats {
  revenue: number // 売上
  customerFrequency: number // 来店頻度
  regularCustomers: number // 常連客数
  popularity: number // 人気度
}
```

**`frontend/src/types/index.ts`:**
```typescript
export * from './cafferot'
export * from './cafe'
```

### 1.4 開発コマンド（name-name準拠）

**Docker Compose使用（推奨）:**
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

**ローカル開発（Dockerなし）:**
```bash
# Backend
cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -e .
uvicorn app.main:app --reload --port 8080

# Frontend
cd frontend
npm install
npm run dev
```

**アクセスURL:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Backend API Docs: `http://localhost:8080/docs`
- WebSocket: `ws://localhost:8080/ws`

### 1.5 Dockerfileの準備

**`backend/Dockerfile`:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# uvをインストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 依存関係をコピー
COPY pyproject.toml uv.lock ./

# 依存関係をインストール
RUN uv sync --frozen

# アプリケーションコードをコピー
COPY app ./app

# ポート公開
EXPOSE 8080

# 起動コマンド
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**`frontend/Dockerfile.dev`:**
```dockerfile
FROM node:20-slim

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードはvolume マウントで提供

# ポート公開
EXPOSE 3000

# 開発サーバー起動（volumeマウント前提）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 1.6 基本的なルーティング設定 (Frontend)
- `/` - トップページ (カフェ一覧)
- `/cafe/:id` - 個別カフェ表示
- `/my-cafe` - 自分のカフェ管理
- `/upload` - カフェロットアップロード（描画エディタなし）
- `/gallery` - リアルタイムギャラリー

---

## フェーズ2: カフェ経営システム (Week 3-4)

### 2.1 カフェビュー実装
**コンポーネント構成:**
```
<CafeView>
  ├── <CafeBackground> (2D背景)
  ├── <Counter> (カウンター)
  ├── <Tables> (テーブル群)
  ├── <DisplayWall> (展示壁)
  │   └── <CafferotFrame> × N
  ├── <Customers> (常連客)
  └── <CafeStats> (売上表示)
```

**実装機能:**
- Flexbox + Absolute Positioning によるレイアウト
- 横スクロール可能なカフェビュー
- 展示壁（上部固定、Flexで横並び）
- カウンター、テーブル（Flexで配置）
- 常連客（Absolute配置でアニメーション）
- Framer Motion によるアニメーション

### 2.2 経営ロジック
**`src/services/cafeManagement.ts`**
```typescript
// 売上計算
export const calculateRevenue = (cafe: Cafe): number => {
  const baseRevenue = cafe.level * 100
  const cafferotBonus = cafe.displayedCafferots.reduce(
    (sum, cr) => sum + cr.value * 10,
    0
  )
  return baseRevenue + cafferotBonus
}

// 価値上昇処理
export const increaseCafferotValue = (
  cafferot: Cafferot,
  adoptionCount: number
): Cafferot => {
  return {
    ...cafferot,
    adoptionCount,
    value: Math.floor(Math.log(adoptionCount + 1) * 100),
  }
}
```

### 2.3 アップグレードシステム
- 内装アップグレード (売上+10%)
- メニュー拡張 (来店頻度+5%)
- 展示スペース拡張 (展示枠+1)

---

## フェーズ3: カフェロット作成システム (Week 5-6)

> **シンプル化戦略**: 描画エディタは不要、ファイルアップロードのみで実装

### 3.1 カフェロットアップロード機能
**`packages/cafferot-frontend/src/components/cafferot/CafferotUploader.tsx`**

```typescript
import { useState } from 'react'
import type { Cafferot } from 'cafferot-shared'

export const CafferotUploader = () => {
  const [name, setName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)

      // プレビュー生成
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!name || !imageFile) return

    const imageData = await fileToBase64(imageFile)
    const audioData = audioFile ? await fileToBase64(audioFile) : undefined

    const cafferot: Cafferot = {
      id: crypto.randomUUID(),
      name,
      imageData,
      audioData,
      createdAt: new Date(),
      authorId: getCurrentUser().id,
      adoptionCount: 0,
      value: 0,
    }

    await saveCafferot(cafferot)
    // WebSocketで配信
    publishCafferot(cafferot)
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">カフェロットを作成</h2>

      {/* 名前入力 */}
      <input
        type="text"
        placeholder="カフェロットの名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      {/* 画像アップロード */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold">画像（必須）</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full"
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-4 w-full h-64 object-contain border rounded"
          />
        )}
      </div>

      {/* 音声アップロード */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold">音声（任意）</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="w-full"
        />
        {audioFile && (
          <audio controls className="mt-2 w-full">
            <source src={URL.createObjectURL(audioFile)} />
          </audio>
        )}
      </div>

      {/* 投稿ボタン */}
      <button
        onClick={handleSubmit}
        disabled={!name || !imageFile}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        カフェロットを投稿
      </button>
    </div>
  )
}
```

### 3.2 ファイル処理ユーティリティ
**`packages/cafferot-shared/src/utils/file.ts`**

```typescript
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const validateImage = (file: File): boolean => {
  const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  return validTypes.includes(file.type) && file.size <= maxSize
}

export const validateAudio = (file: File): boolean => {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg']
  const maxSize = 10 * 1024 * 1024 // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize
}
```

### 3.3 LocalStorage保存
**`packages/cafferot-frontend/src/services/storage.ts`**

```typescript
import type { Cafferot } from 'cafferot-shared'

const STORAGE_KEY = 'cafferots'

export const saveCafferot = async (cafferot: Cafferot): Promise<void> => {
  const existing = getCafferots()
  existing.push(cafferot)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export const getCafferots = (): Cafferot[] => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export const deleteCafferot = (id: string): void => {
  const cafferots = getCafferots().filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cafferots))
}
```

### 3.4 IndexedDB対応（将来的な拡張）

大量の画像・音声データに対応する場合:

```typescript
// packages/cafferot-frontend/src/services/indexedDB.ts
import { openDB, DBSchema } from 'idb'

interface CafferotDB extends DBSchema {
  cafferots: {
    key: string
    value: Cafferot
  }
}

const db = await openDB<CafferotDB>('cafferot-db', 1, {
  upgrade(db) {
    db.createObjectStore('cafferots', { keyPath: 'id' })
  },
})

export const saveCafferotToDB = async (cafferot: Cafferot) => {
  await db.put('cafferots', cafferot)
}

export const getCafferotsFromDB = async () => {
  return await db.getAll('cafferots')
}
```

---

## フェーズ4: コミュニティ機能 (Week 7-8)

### 4.1 カフェ一覧ページ
**`src/components/community/CafeList.tsx`**
- 格子状レイアウト (Grid)
- ソート機能 (人気順、新着順)
- ページネーション
- サムネイル表示

### 4.2 カフェ訪問機能
**`src/components/community/CafeVisit.tsx`**
- 他人のカフェを閲覧
- 展示されたカフェロットの詳細表示
- 採用ボタン

### 4.3 採用システム
```typescript
export const adoptCafferot = (
  cafferot: Cafferot,
  targetCafe: Cafe
): void => {
  // 採用数を増やす
  cafferot.adoptionCount++

  // 価値を再計算
  cafferot.value = calculateValue(cafferot.adoptionCount)

  // 自分のカフェに追加
  targetCafe.displayedCafferots.push(cafferot)
}
```

### 4.4 盗みシステム
**`src/components/community/StealAction.tsx`**
- タップ速度測定 (タイマー + クリックカウント)
- 速度に応じた価値変動
```typescript
export const stealCafferot = (
  cafferot: Cafferot,
  tapSpeed: number // taps per second
): Cafferot => {
  const valueMultiplier = Math.min(tapSpeed / 10, 1) // 最大100%
  return {
    ...cafferot,
    value: Math.floor(cafferot.value * valueMultiplier),
  }
}
```

---

## フェーズ5: リアルタイム通信機能 (Week 9-10)

> **段階的移行戦略**: WebSocket → Nostr
>
> 1. **Phase 5A**: WebSocketで実装・動作確認
> 2. **Phase 5B**: 抽象化レイヤーの導入
> 3. **Phase 5C**: Nostrプロトコルへ段階的移行

### 5.1 WebSocketサーバー構築 (Phase 5A)
**`server/index.js`** (Node.js + ws)
```javascript
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

const clients = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)

  ws.on('message', (message) => {
    const data = JSON.parse(message)

    // 全クライアントにブロードキャスト
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  })

  ws.on('close', () => {
    clients.delete(ws)
  })
})
```

### 5.2 抽象化レイヤーの設計 (Phase 5B)
**`src/services/realtimeService.ts`** (プロトコル非依存)
```typescript
// 抽象インターフェース
export interface IRealtimeService {
  connect(): Promise<void>
  disconnect(): void
  publishCafferot(cafferot: Cafferot): Promise<void>
  subscribeToCafferots(callback: (cafferot: Cafferot) => void): void
  onConnectionChange(callback: (connected: boolean) => void): void
}

// WebSocket実装
export class WebSocketRealtimeService implements IRealtimeService {
  private ws: WebSocket | null = null
  private callbacks: ((cafferot: Cafferot) => void)[] = []

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:8080')

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'NEW_CAFFEROT') {
          this.callbacks.forEach(cb => cb(data.payload))
        }
      }

      this.ws.onerror = reject
    })
  }

  disconnect(): void {
    this.ws?.close()
  }

  async publishCafferot(cafferot: Cafferot): Promise<void> {
    this.ws?.send(JSON.stringify({
      type: 'NEW_CAFFEROT',
      payload: cafferot,
    }))
  }

  subscribeToCafferots(callback: (cafferot: Cafferot) => void): void {
    this.callbacks.push(callback)
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    if (this.ws) {
      this.ws.onopen = () => callback(true)
      this.ws.onclose = () => callback(false)
    }
  }
}

// Nostr実装 (Phase 5C で追加)
export class NostrRealtimeService implements IRealtimeService {
  // 後で実装
}

// ファクトリーパターンで切り替え可能に
export const createRealtimeService = (): IRealtimeService => {
  const useNostr = import.meta.env.VITE_USE_NOSTR === 'true'
  return useNostr
    ? new NostrRealtimeService()
    : new WebSocketRealtimeService()
}
```

### 5.3 コンポーネントでの利用
**`src/components/community/RealtimeGallery.tsx`**
```typescript
import { useEffect, useState } from 'react'
import { createRealtimeService } from '@/services/realtimeService'

export const RealtimeGallery = () => {
  const [cafferots, setCafferots] = useState<Cafferot[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const service = createRealtimeService()

    // 接続状態の監視
    service.onConnectionChange(setConnected)

    // カフェロットの購読
    service.subscribeToCafferots((cafferot) => {
      setCafferots(prev => [cafferot, ...prev])
    })

    // 接続
    service.connect()

    return () => service.disconnect()
  }, [])

  return (
    <div>
      <div>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      {cafferots.map(cafferot => (
        <CafferotCard key={cafferot.id} cafferot={cafferot} />
      ))}
    </div>
  )
}
```

### 5.4 Nostrへの移行 (Phase 5C - 将来)
**`src/services/nostrRealtimeService.ts`**
```typescript
import { SimplePool, Event, getPublicKey, finishEvent } from 'nostr-tools'

export class NostrRealtimeService implements IRealtimeService {
  private pool: SimplePool
  private relays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band'
  ]
  private callbacks: ((cafferot: Cafferot) => void)[] = []
  private subscription: any = null

  constructor() {
    this.pool = new SimplePool()
  }

  async connect(): Promise<void> {
    console.log('Nostr connected to relays:', this.relays)
    return Promise.resolve()
  }

  disconnect(): void {
    this.subscription?.unsub()
    this.pool.close(this.relays)
  }

  async publishCafferot(cafferot: Cafferot): Promise<void> {
    const event: Event = {
      kind: 1, // テキストノート
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'cafferot'], // カフェロットタグ
        ['title', cafferot.name]
      ],
      content: JSON.stringify(cafferot),
      pubkey: getPublicKey(/* 秘密鍵 */),
    }

    const signedEvent = finishEvent(event, /* 秘密鍵 */)
    await this.pool.publish(this.relays, signedEvent)
  }

  subscribeToCafferots(callback: (cafferot: Cafferot) => void): void {
    this.callbacks.push(callback)

    this.subscription = this.pool.sub(this.relays, [{
      kinds: [1],
      '#t': ['cafferot'],
      limit: 50
    }])

    this.subscription.on('event', (event: Event) => {
      try {
        const cafferot = JSON.parse(event.content)
        this.callbacks.forEach(cb => cb(cafferot))
      } catch (e) {
        console.error('Failed to parse cafferot:', e)
      }
    })
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    // Nostrは常に接続状態とみなす（リレーが複数あるため）
    callback(true)
  }
}
```

### 5.5 環境変数での切り替え
**`.env`**
```bash
# WebSocketモード（デフォルト）
VITE_USE_NOSTR=false

# Nostrモード（移行後）
# VITE_USE_NOSTR=true
```

**移行チェックリスト:**
- [ ] WebSocketで全機能が動作
- [ ] 抽象化レイヤーのテスト完了
- [ ] Nostr実装の追加
- [ ] 並行動作テスト（両方で同じデータが見える）
- [ ] Nostrへ完全移行
- [ ] WebSocketコードの削除（オプション）

---

## フェーズ6: アクション要素とポリッシュ (Week 11-12)

### 6.1 タップアクション演出
- **豆を挽く**: 円形ゲージを回転させる
- **皿を洗う**: 左右にスワイプ
- **コーヒーを淹れる**: タイミングゲーム

### 6.2 アニメーション強化
- CSS Animations / Framer Motion
- キャラクターの動き
- エフェクト (パーティクル、トランジション)

### 6.3 サウンド追加
- BGM (カフェ音楽)
- SE (採用時、盗み成功時、売上時)

### 6.4 レスポンシブ対応
- モバイルレイアウト調整
- タッチ操作最適化

---

## フェーズ7: デプロイと最適化 (Week 13-14)

### 7.1 パフォーマンス最適化
- 画像の遅延読み込み
- メモ化 (`useMemo`, `useCallback`)
- Virtual Scrolling (大量データ対応)

### 7.2 セキュリティ対策
- XSS対策 (入力サニタイズ)
- CSRF対策
- WebSocket認証

### 7.3 デプロイ
- **フロントエンド**: Vercel / Netlify / GitHub Pages
- **バックエンド**: Railway / Render / Heroku
- **WebSocket**: 専用サーバー or サーバーレス (Supabase Realtime)

---

## 追加機能 (将来実装)

### 街歩きモード
- 2Dマップでカフェを探索
- ランダムエンカウント

### ランキングシステム
- 人気カフェランキング
- 人気カフェロットランキング

### イベントシステム
- 期間限定テーマ
- コラボイベント

### トレード機能
- カフェロット交換
- オークション

---

## 開発コマンド

### 開発開始
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### Lint + Format
```bash
npm run lint:fix
npm run format
```

### WebSocketサーバー起動 (後で実装)
```bash
node server/index.js
```

---

## マイルストーン

| フェーズ | 期間 | 主要成果物 |
|---------|------|----------|
| 1 | Week 1-2 | プロジェクト構造、型定義 |
| 2 | Week 3-4 | カフェ経営システム |
| 3 | Week 5-6 | カフェロット作成機能 |
| 4 | Week 7-8 | コミュニティ機能 |
| 5 | Week 9-10 | WebSocketリアルタイム |
| 6 | Week 11-12 | アクション要素、演出 |
| 7 | Week 13-14 | デプロイ、最適化 |

---

## 次のアクション

1. **型定義ファイルの作成** (`src/types/index.ts`)
2. **プロジェクト構造の整備** (フォルダ作成)
3. **基本的なルーティング設定** (React Router)
4. **カフェビューのプロトタイプ作成**

準備ができたら、具体的な実装を開始しましょう！
