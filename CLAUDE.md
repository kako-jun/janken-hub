# JankenHub (RPSHub) - 全体実装計画

## プロジェクト概要

**JankenHub**（じゃんけんハブ / RPSHub）は、世界中のじゃんけん文化を集約したオンライン対戦プラットフォームです。

### コンセプト
- 🌍 **世界のじゃんけん**: 各国・各地域のじゃんけんルールをプラグイン的にサポート
- 🤖 **NPC対戦**: 第一段階はランダムAIとの対戦で各ルールを楽しめる
- 🎲 **多様なバリエーション**: 通常じゃんけんから階段ゲーム、トーナメントまで
- 🏆 **スコアシステム**: ポイント制、コイン制、ゴール制など多彩な評価方式
- 🌐 **国際展開**: 多言語対応（日本語・英語）、各ルールの文化紹介

---

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Tailwind CSS
- **ビルドツール**: Vite
- **レイアウト**: Flexbox + CSS Grid
- **アニメーション**: Framer Motion
- **リアルタイム通信**: WebSocket
  - 将来的にP2P対戦に拡張
- **状態管理**: React Context API / Zustand (必要に応じて)
- **ストレージ**: LocalStorage（戦績・スコア保存）
- **バックエンド**: FastAPI (Python 3.11+) + WebSocket
- **パッケージ管理**: uv (Backend) / npm (Frontend)
- **開発環境**: Docker Compose
- **コード品質**: ESLint + Prettier + Husky

---

## 実装予定のゲームルール

### 1. Classic RPS（通常じゃんけん）
- グー・チョキ・パーの3択
- 勝敗判定：グー > チョキ > パー > グー
- ポイント制（先に3勝で勝利など）

### 2. Achi Muite Hoi（あっちむいてホイ）
1. じゃんけんで勝敗を決定
2. 勝者が「上下左右」を選択
3. 負者も同時に「上下左右」を選択
4. 方向が一致すれば勝者の勝利、不一致なら継続

### 3. Ido Janken（井戸じゃんけん）
- グー・チョキ・パー・**井戸**の4択
- 勝敗判定：
  - グー > チョキ、パー
  - チョキ > パー
  - パー > グー
  - **井戸** > グー（井戸に落ちる）、チョキ（井戸に落ちる）
  - パー > 井戸（井戸に蓋をする）

### 4. Limited Janken（限定じゃんけん）
- 各プレイヤーは事前に「グー3回、チョキ3回、パー3回」など回数制限
- 使い切ったらその手は使えない
- 戦略性の高いじゃんけん

### 5. Arcade Coin Janken（メダルゲーム風）
- 勝つと仮想コイン払い出し（+10コイン）
- 負けると没収（-5コイン）
- コイン0になったらゲームオーバー
- 目標コイン数到達でクリア

### 6. Glico・Chocolate・Pineapple 階段ゲーム
- じゃんけんで勝ったら歩数を進む
  - グー（グリコ）: 3歩
  - チョキ（チョコレート）: 6歩
  - パー（パイナップル）: 10歩（※諸説あり）
- 30段の階段をゴール目指す
- **ぴったりゴール制**: オーバーするとスタートに戻る

### 7. 大じゃんけん（プログラミングじゃんけん）
- 参考: https://adhd-tama.hatenablog.com/entry/2018/06/09/182449
- プログラミングで自動じゃんけんAIを作成
- NPC vs NPC の自動対戦を観戦

### 8. トーナメント生成機能
- N人分（2^n人）のトーナメント表を自動生成
- じゃんけんn連戦で勝者を決定
- 結果をHTML/SVGで表示
- プレイヤー自身もトーナメントに参加可能

---

## NPC設計（キャラクター名案）

### Scissors（チョキ）系
- **ユリウス・シザー** (Julius Scissor)
- **シザーハンド** (Scissorhands)
- **カットマン** (Cutman)
- **ブレード卿** (Lord Blade)
- **ハサミ侍** (Samurai Scissor)

### Rock（グー）系
- **ロッキー・バルボア** (Rocky Balboa風)
- **ストーンエイジ** (Stone Age)
- **グラニット伯爵** (Count Granite)
- **岩拳王** (Rock Fist King)
- **ペブルズ** (Pebbles：小石キャラ)

### Paper（パー）系
- **ペーパー・タイガー** (Paper Tiger)
- **ドクター・スクロール** (Doctor Scroll)
- **折り紙マスター** (Origami Master)

---

## 開発フェーズ

### フェーズ1: 基盤構築（Week 1-2）✅

#### 1.1 プロジェクト構造

```
janken-hub/
├── backend/                   # FastAPI バックエンド
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI エントリーポイント
│   │   ├── models.py         # Pydantic モデル
│   │   ├── websocket.py      # WebSocket管理
│   │   ├── game_rules/       # ゲームルールエンジン
│   │   │   ├── __init__.py
│   │   │   ├── base.py       # 基底クラス
│   │   │   ├── classic_rps.py
│   │   │   ├── achi_muite_hoi.py
│   │   │   └── ...
│   │   └── npc/              # NPC AI
│   │       ├── __init__.py
│   │       └── random_ai.py
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/                  # React + Vite フロントエンド
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/         # ゲーム画面
│   │   │   ├── menu/         # ルール選択メニュー
│   │   │   ├── npc/          # NPC表示
│   │   │   └── ui/           # 共通UIコンポーネント
│   │   ├── hooks/            # カスタムフック
│   │   ├── services/
│   │   │   ├── websocketService.ts
│   │   │   └── gameService.ts
│   │   ├── types/
│   │   │   ├── game.ts       # ゲーム型定義
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile.dev
│   └── package.json
├── compose.yaml              # Docker Compose設定
├── CLAUDE.md                 # このファイル
└── README.md
```

#### 1.2 型定義（TypeScript）

**`frontend/src/types/game.ts`**
```typescript
// じゃんけんの手（基本3種）
export type Hand = 'rock' | 'paper' | 'scissors'

// 井戸じゃんけん用
export type IdoHand = Hand | 'well'

// あっちむいてホイの方向
export type Direction = 'up' | 'down' | 'left' | 'right'

// じゃんけんの結果
export type GameResult = 'win' | 'lose' | 'draw'

// ゲームルールタイプ
export type GameRuleType =
  | 'classic_rps'
  | 'achi_muite_hoi'
  | 'ido_janken'
  | 'limited_janken'
  | 'arcade_coin'
  | 'glico_game'
  | 'tournament'

// プレイヤー
export interface Player {
  id: string
  name: string
  isNPC: boolean
  hand?: Hand | IdoHand
  direction?: Direction // あっちむいてホイ用
}

// ゲームセッション
export interface GameSession {
  id: string
  ruleType: GameRuleType
  player1: Player
  player2: Player // NPC or Human
  currentRound: number
  result?: GameResult
  score: {
    player1: number
    player2: number
  }
  createdAt: string
}

// プレイヤー統計
export interface PlayerStats {
  wins: number
  losses: number
  draws: number
  totalGames: number
  winRate: number
}

// 階段ゲーム用
export interface GlicoGameState {
  player1Position: number
  player2Position: number
  goalPosition: number // デフォルト30
}

// コインゲーム用
export interface CoinGameState {
  player1Coins: number
  player2Coins: number
  targetCoins: number
}

// 限定じゃんけん用
export interface LimitedJankenState {
  player1Remaining: {
    rock: number
    paper: number
    scissors: number
  }
  player2Remaining: {
    rock: number
    paper: number
    scissors: number
  }
}
```

#### 1.3 Pydanticモデル（Backend）

**`backend/app/models.py`**
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

# じゃんけんの手
Hand = Literal["rock", "paper", "scissors"]
IdoHand = Literal["rock", "paper", "scissors", "well"]
Direction = Literal["up", "down", "left", "right"]

# ゲーム結果
GameResult = Literal["win", "lose", "draw"]

# ゲームルールタイプ
GameRuleType = Literal[
    "classic_rps",
    "achi_muite_hoi",
    "ido_janken",
    "limited_janken",
    "arcade_coin",
    "glico_game",
    "tournament"
]

class Player(BaseModel):
    """プレイヤー"""
    id: str
    name: str
    isNPC: bool
    hand: Optional[Hand | IdoHand] = None
    direction: Optional[Direction] = None

class GameSession(BaseModel):
    """ゲームセッション"""
    id: str
    ruleType: GameRuleType
    player1: Player
    player2: Player
    currentRound: int = 0
    result: Optional[GameResult] = None
    score: dict[str, int]
    createdAt: datetime

class PlayerStats(BaseModel):
    """プレイヤー統計"""
    wins: int = 0
    losses: int = 0
    draws: int = 0
    totalGames: int = 0
    winRate: float = 0.0

class GlicoGameState(BaseModel):
    """階段ゲーム状態"""
    player1Position: int = 0
    player2Position: int = 0
    goalPosition: int = 30

class CoinGameState(BaseModel):
    """コインゲーム状態"""
    player1Coins: int = 100
    player2Coins: int = 100
    targetCoins: int = 200

class LimitedJankenState(BaseModel):
    """限定じゃんけん状態"""
    player1Remaining: dict[str, int]
    player2Remaining: dict[str, int]
```

---

### フェーズ2: ゲームルールエンジン（Week 3-4）

#### 2.1 基底クラス設計

**`backend/app/game_rules/base.py`**
```python
from abc import ABC, abstractmethod
from ..models import Player, GameResult, Hand

class GameRuleBase(ABC):
    """ゲームルールの基底クラス"""

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

#### 2.2 Classic RPS実装

**`backend/app/game_rules/classic_rps.py`**
```python
from .base import GameRuleBase
from ..models import Player, GameResult, Hand

class ClassicRPS(GameRuleBase):
    """通常じゃんけんルール"""

    def judge(self, player1: Player, player2: Player) -> GameResult:
        if player1.hand == player2.hand:
            return "draw"

        win_conditions = {
            ("rock", "scissors"),
            ("scissors", "paper"),
            ("paper", "rock"),
        }

        if (player1.hand, player2.hand) in win_conditions:
            return "win"
        else:
            return "lose"

    def get_rule_name(self) -> str:
        return "Classic Rock-Paper-Scissors"

    def get_description(self) -> str:
        return "Rock beats Scissors, Scissors beats Paper, Paper beats Rock"
```

#### 2.3 井戸じゃんけん実装

**`backend/app/game_rules/ido_janken.py`**
```python
from .base import GameRuleBase
from ..models import Player, GameResult, IdoHand

class IdoJanken(GameRuleBase):
    """井戸じゃんけんルール"""

    def judge(self, player1: Player, player2: Player) -> GameResult:
        h1, h2 = player1.hand, player2.hand

        if h1 == h2:
            return "draw"

        # 井戸の特殊ルール
        if h1 == "well":
            return "win" if h2 in ["rock", "scissors"] else "lose"
        if h2 == "well":
            return "lose" if h1 in ["rock", "scissors"] else "win"

        # 通常のじゃんけん判定
        win_conditions = {
            ("rock", "scissors"),
            ("scissors", "paper"),
            ("paper", "rock"),
        }

        return "win" if (h1, h2) in win_conditions else "lose"

    def get_rule_name(self) -> str:
        return "Ido Janken (井戸じゃんけん)"

    def get_description(self) -> str:
        return "Rock/Scissors fall into Well, Paper covers Well"
```

---

### フェーズ3: NPC AI実装（Week 5）

#### 3.1 ランダムAI

**`backend/app/npc/random_ai.py`**
```python
import random
from ..models import Player, Hand, IdoHand, Direction

class RandomAI:
    """ランダムに手を選ぶAI"""

    def __init__(self, npc_name: str):
        self.name = npc_name

    def choose_hand(self, rule_type: str) -> Hand | IdoHand:
        if rule_type == "ido_janken":
            return random.choice(["rock", "paper", "scissors", "well"])
        else:
            return random.choice(["rock", "paper", "scissors"])

    def choose_direction(self) -> Direction:
        """あっちむいてホイ用"""
        return random.choice(["up", "down", "left", "right"])
```

#### 3.2 難易度別AI（将来実装）

- **Easy**: 完全ランダム
- **Normal**: 確率調整（パーを少し多く出すなど）
- **Hard**: プレイヤーの傾向を学習して対策

---

### フェーズ4: フロントエンド実装（Week 6-8）

#### 4.1 ルール選択メニュー

**`frontend/src/components/menu/RuleSelector.tsx`**
```tsx
import { GameRuleType } from '@/types/game'

interface Rule {
  id: GameRuleType
  name: string
  description: string
  icon: string
}

const RULES: Rule[] = [
  {
    id: 'classic_rps',
    name: 'Classic RPS',
    description: '通常のじゃんけん',
    icon: '✊✋✌️',
  },
  {
    id: 'achi_muite_hoi',
    name: 'Achi Muite Hoi',
    description: 'あっちむいてホイ',
    icon: '👆👇👈👉',
  },
  {
    id: 'ido_janken',
    name: 'Ido Janken',
    description: '井戸じゃんけん',
    icon: '🪨📄✂️🕳️',
  },
  // ... 他のルール
]

export const RuleSelector = ({ onSelect }: { onSelect: (rule: GameRuleType) => void }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
      {RULES.map(rule => (
        <button
          key={rule.id}
          onClick={() => onSelect(rule.id)}
          className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-2">{rule.icon}</div>
          <h3 className="text-lg font-bold">{rule.name}</h3>
          <p className="text-sm text-gray-600">{rule.description}</p>
        </button>
      ))}
    </div>
  )
}
```

#### 4.2 ゲーム画面

**`frontend/src/components/game/GameBoard.tsx`**
```tsx
import { useState } from 'react'
import { Hand, GameSession, Player } from '@/types/game'

export const GameBoard = ({ session }: { session: GameSession }) => {
  const [selectedHand, setSelectedHand] = useState<Hand | null>(null)

  const handleHandSelect = (hand: Hand) => {
    setSelectedHand(hand)
    // WebSocketでサーバーに送信
    websocketService.send('PLAY_HAND', { sessionId: session.id, hand })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* プレイヤー表示 */}
      <div className="flex justify-between w-full max-w-4xl mb-8">
        <PlayerCard player={session.player1} />
        <div className="text-white text-2xl">VS</div>
        <PlayerCard player={session.player2} />
      </div>

      {/* スコア表示 */}
      <div className="bg-white rounded-lg p-4 mb-8">
        <div className="text-2xl font-bold">
          {session.score.player1} - {session.score.player2}
        </div>
      </div>

      {/* 手選択ボタン */}
      <div className="flex gap-4">
        <HandButton hand="rock" emoji="✊" onClick={handleHandSelect} />
        <HandButton hand="paper" emoji="✋" onClick={handleHandSelect} />
        <HandButton hand="scissors" emoji="✌️" onClick={handleHandSelect} />
      </div>
    </div>
  )
}
```

---

### フェーズ5: 階段ゲーム実装（Week 9）

#### 5.1 階段ビジュアル

**`frontend/src/components/game/GlicoStaircase.tsx`**
```tsx
export const GlicoStaircase = ({ state }: { state: GlicoGameState }) => {
  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-sky-200 to-green-200">
      {/* 階段描画 */}
      {Array.from({ length: state.goalPosition }).map((_, i) => (
        <div
          key={i}
          className="absolute border-2 border-gray-700 bg-yellow-600"
          style={{
            width: '60px',
            height: '40px',
            left: `${50 + (i % 2) * 40}px`,
            bottom: `${i * 20}px`,
          }}
        >
          {i + 1}
        </div>
      ))}

      {/* プレイヤー1のコマ */}
      <div
        className="absolute text-4xl transition-all duration-500"
        style={{
          left: '50px',
          bottom: `${state.player1Position * 20 + 40}px`,
        }}
      >
        🏃
      </div>

      {/* プレイヤー2のコマ */}
      <div
        className="absolute text-4xl transition-all duration-500"
        style={{
          left: '90px',
          bottom: `${state.player2Position * 20 + 40}px`,
        }}
      >
        🤖
      </div>
    </div>
  )
}
```

---

### フェーズ6: トーナメント機能（Week 10-11）

#### 6.1 トーナメント生成

**`backend/app/game_rules/tournament.py`**
```python
import math
from typing import List
from ..models import Player

class TournamentBracket:
    """トーナメント表生成"""

    def __init__(self, players: List[Player]):
        self.players = players
        self.rounds = []

    def generate_bracket(self):
        """トーナメント表を生成"""
        n = len(self.players)
        # 2のべき乗に合わせる
        bracket_size = 2 ** math.ceil(math.log2(n))

        # 不足分はBYE（不戦勝）
        bye_count = bracket_size - n

        # ... トーナメントロジック
```

---

### フェーズ7: 国際化対応（Week 12）

#### 7.1 多言語対応

**`frontend/src/i18n/translations.ts`**
```typescript
export const translations = {
  en: {
    classic_rps: 'Classic Rock-Paper-Scissors',
    achi_muite_hoi: 'Direction Game',
    ido_janken: 'Well Janken',
    rock: 'Rock',
    paper: 'Paper',
    scissors: 'Scissors',
    well: 'Well',
  },
  ja: {
    classic_rps: '通常じゃんけん',
    achi_muite_hoi: 'あっちむいてホイ',
    ido_janken: '井戸じゃんけん',
    rock: 'グー',
    paper: 'パー',
    scissors: 'チョキ',
    well: '井戸',
  },
}
```

---

## 開発コマンド

### Docker Compose使用（推奨）
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

### ローカル開発（Dockerなし）
```bash
# Backend
cd backend
uv sync
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8080

# Frontend
cd frontend
npm install
npm run dev
```

### アクセスURL
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs
- **WebSocket**: ws://localhost:8080/ws

---

## マイルストーン

| フェーズ | 期間 | 主要成果物 |
|---------|------|----------|
| 1 | Week 1-2 | プロジェクト構造、型定義、WebSocket基盤 ✅ |
| 2 | Week 3-4 | ゲームルールエンジン（Classic RPS, Ido Janken） |
| 3 | Week 5 | NPC AI実装（ランダムAI） |
| 4 | Week 6-8 | フロントエンド（ルール選択、ゲーム画面） |
| 5 | Week 9 | 階段ゲーム実装 |
| 6 | Week 10-11 | トーナメント機能 |
| 7 | Week 12 | 国際化対応、多言語 |
| 8 | Week 13-14 | デプロイ、最適化 |

---

## 将来拡張

### オンライン対戦（P2P / マッチング）
- WebSocketでリアルタイム対戦
- マッチングシステム
- フレンド対戦

### ユーザー投稿ルール
- コミュニティで新しいじゃんけんルールを追加
- ルールエディタ（JSON形式で定義）

### ランキングシステム
- グローバルランキング
- ルール別ランキング
- 月間ランキング

### 大将棋モード
- じゃんけん要素を取り入れた将棋風ゲーム
- 駒の強さをじゃんけんで決定

---

## 📂 プロジェクトドキュメント

このプロジェクトには、以下の詳細ドキュメントが用意されています（`.claude/`ディレクトリ内）:

- **[TODO.md](.claude/TODO.md)**: タスク一覧と優先順位
- **[PROGRESS.md](.claude/PROGRESS.md)**: 開発進捗状況の詳細
- **[DESIGN.md](.claude/DESIGN.md)**: アーキテクチャと設計ドキュメント
- **[NEXT_STEPS.md](.claude/NEXT_STEPS.md)**: 今後の実装ロードマップ

---

## 現在の実装状況

**全体進捗: 約35%** (2025-11-17更新)

### ✅ 完全実装済み（100%）

#### 基盤構築
- プロジェクト構造（backend + frontend）
- Docker Compose環境
- FastAPI + WebSocket基盤
- React + TypeScript環境
- 全ゲームルール対応の型定義
- WebSocketクライアント（再接続ロジック付き）

#### ゲームルールエンジン
- ゲームルール基底クラス (`GameRuleBase`)
- Classic RPS ルールエンジン (`classic_rps.py`)
- Ido Janken ルールエンジン (`ido_janken.py`)
- Achi Muite Hoi ルールエンジン (`achi_muite_hoi.py`) - バックエンドのみ

#### NPC AI
- ランダムAI実装 (`random_ai.py`)
- 全ルール対応の手選択ロジック
- 方向選択ロジック（あっちむいてホイ用）

#### フロントエンドUI
- ルール選択画面 (`RuleSelector.tsx`)
- ゲーム画面 (`GameBoard.tsx`)
- 手選択ボタン（3択・4択対応）
- スコア表示・結果表示
- リアルタイムWebSocket通信

### 🚧 一部実装済み（50%）

#### Achi Muite Hoi（あっちむいてホイ）
- ✅ バックエンド: じゃんけん部分のルールエンジン
- ✅ バックエンド: 方向判定ロジック
- ❌ フロントエンド: 方向選択UI
- ❌ フロントエンド: 2段階ゲームフロー
- ❌ バックエンド: WebSocketメッセージハンドラ統合

### ❌ 未実装（0%）

#### ゲームモード
- Glico Game（階段ゲーム）
- Limited Janken（限定じゃんけん）
- Arcade Coin Janken（メダルゲーム）
- Tournament（トーナメント）
- Dai-janken（プログラミングじゃんけん）

#### 機能拡張
- NPC AI強化（Normal/Hard難易度）
- アニメーション強化
- サウンドエフェクト
- 統計・ランキング
- 多言語対応
- テスト実装

---

## 次のアクション

### 優先度S（直近1-2週間）
1. **Achi Muite Hoi完成** - 方向選択UIと2段階ゲームフロー実装
2. **Glico Game実装** - 階段ゲームのルールエンジンとビジュアル

### 優先度A（近日中）
3. **Limited Janken実装** - 手の回数制限ロジック
4. **Arcade Coin Janken実装** - コイン増減システム
5. **UI/UX改善** - サウンドとアニメーション追加

詳細は [NEXT_STEPS.md](.claude/NEXT_STEPS.md) を参照してください。
