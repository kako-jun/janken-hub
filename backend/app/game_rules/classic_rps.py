from .base import GameRuleBase
from ..models import Player, GameResult, Hand


class ClassicRPS(GameRuleBase):
    """通常じゃんけんルール"""

    def judge(self, player1: Player, player2: Player) -> GameResult:
        """勝敗判定

        Args:
            player1: プレイヤー1
            player2: プレイヤー2

        Returns:
            GameResult: プレイヤー1視点での勝敗結果
        """
        if player1.hand == player2.hand:
            return "draw"

        # 勝利条件（プレイヤー1が勝つ組み合わせ）
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
        """ルール名を取得"""
        return "Classic Rock-Paper-Scissors"

    def get_description(self) -> str:
        """ルール説明を取得"""
        return "Rock beats Scissors, Scissors beats Paper, Paper beats Rock"
