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
