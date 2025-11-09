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
