# 次のステップ

## 🎯 直近の目標（1-2週間）

### 1. あっちむいてホイの完成 ⭐ 最優先

#### バックエンド実装
- [x] じゃんけん部分のルールエンジン
- [x] 方向判定ロジック
- [ ] WebSocketメッセージハンドラ拡張
  - `PLAY_DIRECTION` メッセージ追加
  - 2段階ゲームフロー管理

```python
# 実装イメージ
async def websocket_endpoint(websocket: WebSocket):
    # ...
    elif message_type == "PLAY_DIRECTION":
        session_id = data.get("sessionId")
        direction = data.get("direction")

        # 方向判定
        result = game_manager.judge_direction(session_id, direction)

        await manager.send_message(client_id, {
            "type": "DIRECTION_RESULT",
            **result
        })
```

#### フロントエンド実装
- [ ] 方向選択UIコンポーネント作成
- [ ] 2段階ゲームフロー実装
  1. じゃんけん → 結果待ち
  2. 勝った場合 → 方向選択
  3. 負けた場合 → 方向選択（同時）
  4. 方向判定 → 結果表示

```typescript
// DirectionSelector.tsx
interface DirectionSelectorProps {
  onSelect: (direction: Direction) => void
  disabled?: boolean
}

// 実装予定
<DirectionButton direction="up" emoji="👆" />
<DirectionButton direction="down" emoji="👇" />
<DirectionButton direction="left" emoji="👈" />
<DirectionButton direction="right" emoji="👉" />
```

---

### 2. 階段ゲーム（Glico Game）実装

#### バックエンド実装
- [ ] GlicoGameルールエンジン作成
- [ ] 位置管理ロジック
- [ ] ぴったりゴール判定
- [ ] オーバー時のリセット処理

```python
class GlicoGame(GameRuleBase):
    step_map = {
        "rock": 3,      # グリコ
        "scissors": 6,  # チョコレート
        "paper": 10     # パイナップル（諸説あり）
    }

    def calculate_position(
        current_position: int,
        hand: Hand,
        goal: int = 30
    ) -> int:
        new_position = current_position + step_map[hand]
        if new_position == goal:
            return goal  # ゴール
        elif new_position > goal:
            return 0     # スタートに戻る
        return new_position
```

#### フロントエンド実装
- [ ] 階段ビジュアルコンポーネント
- [ ] プレイヤー位置アニメーション
- [ ] ゴール演出

```typescript
// GlicoStaircase.tsx
<div className="relative h-[600px]">
  {Array.from({ length: 30 }).map((_, i) => (
    <div
      key={i}
      className="absolute step"
      style={{ bottom: `${i * 20}px` }}
    >
      {i + 1}
    </div>
  ))}

  <PlayerPiece position={player1Position} emoji="🏃" />
  <PlayerPiece position={player2Position} emoji="🤖" />
</div>
```

---

## 📅 中期目標（3-4週間）

### 3. 限定じゃんけん実装

#### バックエンド
- [ ] 手の回数制限ロジック
- [ ] 残り回数管理
- [ ] 使用不可判定

#### フロントエンド
- [ ] 残り回数表示UI
- [ ] ボタン無効化処理

---

### 4. メダルゲーム実装

#### バックエンド
- [ ] コイン増減ロジック
- [ ] ゲームオーバー判定
- [ ] クリア判定

#### フロントエンド
- [ ] コイン表示UI
- [ ] メダル払い出しアニメーション

---

### 5. UI/UX改善

- [ ] サウンドエフェクト追加
  - 手選択時の音
  - 勝利時の音
  - 敗北時の音
- [ ] アニメーション強化
  - 結果表示のフェードイン
  - スコアカウントアップ
  - NPCの動き
- [ ] レスポンシブデザイン
  - モバイル対応
  - タブレット対応

---

## 🚀 長期目標（1-2ヶ月）

### 6. トーナメント機能

- [ ] バックエンド：トーナメント表生成
- [ ] バックエンド：複数ラウンド管理
- [ ] フロントエンド：トーナメント表表示
- [ ] フロントエンド：進行状況可視化

---

### 7. NPC AI強化

- [ ] Normal難易度AI
  - 確率調整（パーを多めなど）
  - 簡単なパターン認識
- [ ] Hard難易度AI
  - プレイヤー傾向学習
  - カウンター戦略

---

### 8. 統計・ランキング

- [ ] LocalStorageに戦績保存
- [ ] 統計表示画面
- [ ] ルール別ランキング

---

### 9. 多言語対応

- [ ] i18n設定
- [ ] 翻訳ファイル作成（日本語・英語）
- [ ] 言語切り替えUI

---

### 10. テスト・品質向上

- [ ] バックエンドユニットテスト
- [ ] フロントエンドコンポーネントテスト
- [ ] E2Eテスト
- [ ] CI/CD構築

---

## 📋 実装優先順位

### 優先度S（すぐにやる）
1. ✅ あっちむいてホイ完成
2. ✅ 階段ゲーム実装

### 優先度A（近日中）
3. 限定じゃんけん
4. メダルゲーム
5. UI/UX改善（サウンド・アニメーション）

### 優先度B（余裕があれば）
6. トーナメント機能
7. NPC AI強化
8. 統計・ランキング

### 優先度C（将来的に）
9. 多言語対応
10. テスト整備
11. デプロイ環境構築

---

## 💡 実装のヒント

### あっちむいてホイ実装時の注意点
- じゃんけん勝者のみが方向を「指定」
- 敗者は「見る方向」を選択
- 両方が同時に選択するUI設計
- タイミング制御が重要

### 階段ゲーム実装時の注意点
- CSS positioningで階段を描画
- Framer Motionでスムーズな移動アニメーション
- ぴったりゴールの演出を派手に
- オーバー時のリセットアニメーション

### パフォーマンス考慮
- 大量の階段DOM要素 → 仮想化検討
- アニメーションのGPU加速
- 画像の遅延ローディング

---

## 🎯 マイルストーン

- **Week 3**: あっちむいてホイ + 階段ゲーム完成
- **Week 4-5**: 限定じゃんけん + メダルゲーム
- **Week 6**: UI/UX強化（サウンド・アニメーション）
- **Week 7-8**: トーナメント機能
- **Week 9-10**: NPC AI強化 + 統計機能
- **Week 11-12**: テスト・デプロイ

---

最終更新: 2025-11-17
