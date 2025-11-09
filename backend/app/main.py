from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .websocket import manager

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Janken Hub API",
    description="じゃんけんハブ リアルタイムAPI",
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
    return {"status": "ok", "message": "Janken Hub API is running"}

# WebSocketエンドポイントを登録
from .websocket import websocket_endpoint
app.websocket("/ws")(websocket_endpoint)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
