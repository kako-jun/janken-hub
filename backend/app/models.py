from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

# じゃんけんの手
Hand = Literal["rock", "paper", "scissors"]

# じゃんけんの結果
GameResult = Literal["win", "lose", "draw"]


class Player(BaseModel):
    """プレイヤー"""
    id: str
    name: str
    hand: Optional[Hand] = None


class GameSession(BaseModel):
    """ゲームセッション"""
    id: str
    player1: Player
    player2: Optional[Player] = None
    result: Optional[GameResult] = None
    createdAt: datetime


class PlayerStats(BaseModel):
    """プレイヤー統計"""
    wins: int = 0
    losses: int = 0
    draws: int = 0
    totalGames: int = 0
