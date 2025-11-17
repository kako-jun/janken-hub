from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
from datetime import datetime
import logging
import uuid

from .models import GameSession, Player, GameRuleType
from .game_rules.classic_rps import ClassicRPS
from .npc.random_ai import RandomAI

logger = logging.getLogger(__name__)


class GameManager:
    """ゲームセッションを管理するクラス"""

    def __init__(self):
        self.sessions: Dict[str, GameSession] = {}
        self.game_rules = {
            "classic_rps": ClassicRPS()
        }

    def create_session(self, player_id: str, player_name: str, rule_type: GameRuleType) -> GameSession:
        """新しいゲームセッションを作成

        Args:
            player_id: プレイヤーID
            player_name: プレイヤー名
            rule_type: ゲームルールタイプ

        Returns:
            GameSession: 作成されたゲームセッション
        """
        session_id = str(uuid.uuid4())

        # プレイヤー1（人間）
        player1 = Player(
            id=player_id,
            name=player_name,
            isNPC=False
        )

        # プレイヤー2（NPC）
        npc_names = ["Rocky Balboa", "Julius Scissor", "Paper Tiger"]
        import random
        npc_name = random.choice(npc_names)

        player2 = Player(
            id=str(uuid.uuid4()),
            name=npc_name,
            isNPC=True
        )

        session = GameSession(
            id=session_id,
            ruleType=rule_type,
            player1=player1,
            player2=player2,
            currentRound=0,
            score={"player1": 0, "player2": 0},
            createdAt=datetime.now()
        )

        self.sessions[session_id] = session
        logger.info(f"Created game session: {session_id}, rule: {rule_type}")

        return session

    def play_round(self, session_id: str, player_hand: str) -> dict:
        """1ラウンドをプレイ

        Args:
            session_id: セッションID
            player_hand: プレイヤーが選んだ手

        Returns:
            dict: ラウンド結果
        """
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # NPCの手を選択
        npc_ai = RandomAI(session.player2.name)
        npc_hand = npc_ai.choose_hand(session.ruleType)

        # 手を設定
        session.player1.hand = player_hand
        session.player2.hand = npc_hand

        # 勝敗判定
        rule_engine = self.game_rules.get(session.ruleType)
        if not rule_engine:
            raise ValueError(f"Unknown rule type: {session.ruleType}")

        result = rule_engine.judge(session.player1, session.player2)

        # スコア更新
        if result == "win":
            session.score["player1"] += 1
        elif result == "lose":
            session.score["player2"] += 1

        session.currentRound += 1
        session.result = result

        return {
            "session_id": session_id,
            "round": session.currentRound,
            "player_hand": player_hand,
            "npc_hand": npc_hand,
            "result": result,
            "score": session.score
        }

    def get_session(self, session_id: str) -> GameSession | None:
        """セッションを取得

        Args:
            session_id: セッションID

        Returns:
            GameSession | None: セッション
        """
        return self.sessions.get(session_id)


class ConnectionManager:
    """WebSocket接続を管理するクラス"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.game_manager = GameManager()

    async def connect(self, websocket: WebSocket, client_id: str):
        """WebSocket接続を受け入れる"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client connected: {client_id}. Total: {len(self.active_connections)}")

    def disconnect(self, client_id: str):
        """WebSocket接続を切断する"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client disconnected: {client_id}. Total: {len(self.active_connections)}")

    async def send_message(self, client_id: str, message: dict):
        """特定のクライアントにメッセージを送信"""
        websocket = self.active_connections.get(client_id)
        if websocket:
            await websocket.send_json(message)


# グローバルインスタンス
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    """WebSocketエンドポイント"""
    client_id = str(uuid.uuid4())
    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            # メッセージタイプに応じて処理
            if message_type == "CREATE_SESSION":
                # 新しいゲームセッションを作成
                player_name = data.get("playerName", "Player")
                rule_type = data.get("ruleType", "classic_rps")

                session = manager.game_manager.create_session(
                    player_id=client_id,
                    player_name=player_name,
                    rule_type=rule_type
                )

                await manager.send_message(client_id, {
                    "type": "SESSION_CREATED",
                    "session": {
                        "id": session.id,
                        "ruleType": session.ruleType,
                        "player1": {
                            "id": session.player1.id,
                            "name": session.player1.name,
                            "isNPC": session.player1.isNPC
                        },
                        "player2": {
                            "id": session.player2.id,
                            "name": session.player2.name,
                            "isNPC": session.player2.isNPC
                        },
                        "score": session.score,
                        "currentRound": session.currentRound
                    }
                })

            elif message_type == "PLAY_HAND":
                # じゃんけんの手をプレイ
                session_id = data.get("sessionId")
                player_hand = data.get("hand")

                try:
                    result = manager.game_manager.play_round(session_id, player_hand)

                    await manager.send_message(client_id, {
                        "type": "ROUND_RESULT",
                        **result
                    })
                except ValueError as e:
                    await manager.send_message(client_id, {
                        "type": "ERROR",
                        "message": str(e)
                    })

    except WebSocketDisconnect:
        manager.disconnect(client_id)
