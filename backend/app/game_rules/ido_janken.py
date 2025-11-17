from .base import GameRuleBase
from ..models import Player, GameResult


class IdoJanken(GameRuleBase):
    """井戸じゃんけんルール"""

    def judge(self, player1: Player, player2: Player) -> GameResult:
        """勝敗判定

        Args:
            player1: プレイヤー1
            player2: プレイヤー2

        Returns:
            GameResult: プレイヤー1視点での勝敗結果
        """
        h1, h2 = player1.hand, player2.hand

        if h1 == h2:
            return "draw"

        # 井戸の特殊ルール
        if h1 == "well":
            # 井戸 > グー（井戸に落ちる）、チョキ（井戸に落ちる）
            # パー > 井戸（井戸に蓋をする）
            return "win" if h2 in ["rock", "scissors"] else "lose"

        if h2 == "well":
            # グー > 井戸（井戸に落ちる）、チョキ > 井戸（井戸に落ちる）
            # 井戸 > パー（井戸に蓋をする）
            return "lose" if h1 in ["rock", "scissors"] else "win"

        # 通常のじゃんけん判定
        win_conditions = {
            ("rock", "scissors"),
            ("scissors", "paper"),
            ("paper", "rock"),
        }

        return "win" if (h1, h2) in win_conditions else "lose"

    def get_rule_name(self) -> str:
        """ルール名を取得"""
        return "Ido Janken (井戸じゃんけん)"

    def get_description(self) -> str:
        """ルール説明を取得"""
        return "Rock/Scissors fall into Well, Paper covers Well"
