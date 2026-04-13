# 設計ドキュメント

## 🏗️ アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         React + TypeScript + Tailwind           │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Menu     │  │ Game     │  │ UI       │     │
│  │Components│  │Components│  │Components│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│         │             │             │           │
│         └─────────────┴─────────────┘           │
│                     │                            │
│         ┌───────────▼──────────┐                │
│         │ WebSocket Service    │                │
│         └───────────┬──────────┘                │
└─────────────────────┼───────────────────────────┘
                      │ WebSocket
                      │ (ws://localhost:8080/ws)
┌─────────────────────▼───────────────────────────┐
│                   Backend                        │
│              FastAPI + WebSocket                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Game     │  │ Game     │  │ NPC      │     │
│  │ Manager  │  │ Rules    │  │ AI       │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│         │             │             │           │
│         └─────────────┴─────────────┘           │
│                     │                            │
│         ┌───────────▼──────────┐                │
│         │ Connection Manager   │                │
│         └──────────────────────┘                │
└─────────────────────────────────────────────────┘
```

---

## 📦 バックエンド設計

### ディレクトリ構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPIエントリーポイント
│   ├── models.py            # Pydanticモデル
│   ├── websocket.py         # WebSocket管理・ゲーム管理
│   ├── game_rules/          # ゲームルールエンジン
│   │   ├── __init__.py
│   │   ├── base.py          # 基底クラス
│   │   ├── classic_rps.py   # 通常じゃんけん
│   │   ├── achi_muite_hoi.py
│   │   └── ido_janken.py
│   └── npc/                 # NPC AI
│       ├── __init__.py
│       └── random_ai.py
├── Dockerfile
└── pyproject.toml
```

### クラス設計

#### GameRuleBase（基底クラス）
```python
class GameRuleBase(ABC):
    @abstractmethod
    def judge(self, player1: Player, player2: Player) -> GameResult:
        """勝敗判定"""
        pass

    @abstractmethod
    def get_rule_name(self) -> str:
        """ルール名を取得"""
        pass

    @abstractmethod
    def get_description(self) -> str:
        """ルール説明を取得"""
        pass
```

#### GameManager
```python
class GameManager:
    sessions: Dict[str, GameSession]
    game_rules: Dict[str, GameRuleBase]

    def create_session(player_id, player_name, rule_type) -> GameSession
    def play_round(session_id, player_hand) -> dict
    def get_session(session_id) -> GameSession
```

#### ConnectionManager
```python
class ConnectionManager:
    active_connections: Dict[str, WebSocket]
    game_manager: GameManager

    async def connect(websocket, client_id)
    def disconnect(client_id)
    async def send_message(client_id, message)
```

### データモデル

#### Player
```python
class Player(BaseModel):
    id: str
    name: str
    isNPC: bool
    hand: Optional[Hand | IdoHand] = None
    direction: Optional[Direction] = None
```

#### GameSession
```python
class GameSession(BaseModel):
    id: str
    ruleType: GameRuleType
    player1: Player
    player2: Player
    currentRound: int = 0
    result: Optional[GameResult] = None
    score: dict[str, int]
    createdAt: datetime
```

---

## 🎨 フロントエンド設計

### ディレクトリ構造

```
frontend/src/
├── components/
│   ├── menu/
│   │   └── RuleSelector.tsx    # ルール選択画面
│   ├── game/
│   │   └── GameBoard.tsx       # ゲーム画面
│   └── ui/
│       ├── HandButton.tsx      # 手選択ボタン（3択）
│       └── IdoHandButton.tsx   # 井戸じゃんけん用（4択）
├── services/
│   └── websocketService.ts     # WebSocket通信
├── types/
│   └── game.ts                 # 型定義
├── App.tsx                     # メインコンポーネント
└── main.tsx
```

### コンポーネント設計

#### App（ルートコンポーネント）
```typescript
type GameState = 'menu' | 'loading' | 'playing'

State:
- gameState: GameState
- session: GameSession | null

Handlers:
- handleRuleSelect(ruleType)
- handleBackToMenu()
```

#### RuleSelector
```typescript
Props:
- onSelect: (rule: GameRuleType) => void

State:
- なし（ステートレス）

Features:
- ルール一覧表示
- enabled/disabled制御
- クリックでルール選択
```

#### GameBoard
```typescript
Props:
- session: GameSession
- onBack: () => void

State:
- waiting: boolean
- lastResult: { playerHand, npcHand, result } | null
- currentScore: { player1, player2 }

Handlers:
- handleHandSelect(hand)

Features:
- ルール別ボタン表示切り替え
- リアルタイム結果表示
- スコア表示
```

### 型定義

```typescript
// 基本型
type Hand = 'rock' | 'paper' | 'scissors'
type IdoHand = Hand | 'well'
type Direction = 'up' | 'down' | 'left' | 'right'
type GameResult = 'win' | 'lose' | 'draw'

type GameRuleType =
  | 'classic_rps'
  | 'achi_muite_hoi'
  | 'ido_janken'
  | 'limited_janken'
  | 'arcade_coin'
  | 'glico_game'
  | 'tournament'

// 複合型
interface Player {
  id: string
  name: string
  isNPC: boolean
  hand?: Hand | IdoHand
  direction?: Direction
}

interface GameSession {
  id: string
  ruleType: GameRuleType
  player1: Player
  player2: Player
  currentRound: number
  result?: GameResult
  score: { player1: number; player2: number }
  createdAt: string
}
```

---

## 🔄 データフロー

### セッション作成フロー

```
Frontend                    Backend
   │                           │
   │  CREATE_SESSION           │
   ├──────────────────────────>│
   │  { playerName, ruleType } │
   │                           │
   │                           │ GameManager.create_session()
   │                           │ - プレイヤー1生成
   │                           │ - NPC生成
   │                           │ - セッション生成
   │                           │
   │  SESSION_CREATED          │
   │<──────────────────────────┤
   │  { session: {...} }       │
   │                           │
   ▼                           ▼
State更新
session設定
```

### ゲームプレイフロー

```
Frontend                    Backend
   │                           │
   │  PLAY_HAND                │
   ├──────────────────────────>│
   │  { sessionId, hand }      │
   │                           │
   │                           │ GameManager.play_round()
   │                           │ - NPC手選択
   │                           │ - ルールエンジン判定
   │                           │ - スコア更新
   │                           │
   │  ROUND_RESULT             │
   │<──────────────────────────┤
   │  {                        │
   │    playerHand,            │
   │    npcHand,               │
   │    result,                │
   │    score                  │
   │  }                        │
   │                           │
   ▼                           ▼
State更新
結果表示
```

---

## 🎮 ゲームルール設計

### Classic RPS
- **勝敗条件**: グー > チョキ > パー > グー
- **特殊ルール**: なし
- **UI**: 3択ボタン

### Ido Janken
- **勝敗条件**:
  - 井戸 > グー, チョキ
  - パー > 井戸
  - 通常ルールも適用
- **特殊ルール**: 井戸の追加
- **UI**: 4択ボタン

### Achi Muite Hoi
- **勝敗条件**:
  1. じゃんけんで勝敗
  2. 勝者の方向選択と負者の方向が一致で勝利
- **特殊ルール**: 2段階ゲーム
- **UI**: 3択ボタン + 方向選択（4択）

### Glico Game（階段ゲーム）
- **勝敗条件**:
  - グー（グリコ）: 3歩
  - チョキ（チョコレート）: 6歩
  - パー（パイナップル）: 10歩
  - ぴったり30段でゴール
- **特殊ルール**: オーバーするとスタートに戻る
- **UI**: 階段ビジュアル + 3択ボタン

---

## 🤖 NPC AI設計

### RandomAI
```python
class RandomAI:
    def choose_hand(rule_type) -> Hand | IdoHand:
        # ルールに応じてランダム選択

    def choose_direction() -> Direction:
        # ランダムに方向選択
```

### 将来実装予定

#### NormalAI
- 確率調整（特定の手を多めに出す）
- 簡単なパターン認識

#### HardAI
- プレイヤーの傾向学習
- カウンター戦略
- 心理戦要素

---

## 🎨 UI/UXデザイン方針

### カラースキーム
- **Primary**: Blue (#3B82F6) → Purple (#9333EA) グラデーション
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Warning**: Yellow (#F59E0B)

### レイアウト
- Flexbox + CSS Grid
- レスポンシブデザイン
- モバイルファースト

### アニメーション
- Framer Motion使用
- ボタンホバー: scale(1.05)
- 結果表示: フェードイン
- スコア更新: 数字カウントアップ

---

## 🔒 セキュリティ考慮事項

### 実装済み
- CORS設定（開発環境）
- WebSocket接続管理

### 今後実装
- 入力バリデーション強化
- レート制限
- 認証・認可（オンライン対戦時）
- XSS対策

---

## 📊 パフォーマンス最適化

### 実装済み
- Viteによる高速ビルド
- WebSocketによる効率的通信

### 今後実装
- コンポーネントメモ化
- 遅延ローディング
- 画像最適化
- バンドルサイズ削減

---

最終更新: 2025-11-17
