from .base import GameRuleBase
from ..models import Player, GameResult


class AchiMuiteHoi(GameRuleBase):
    """あっちむいてホイルール"""

    def judge(self, player1: Player, player2: Player) -> GameResult:
        """勝敗判定（じゃんけん部分）

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

    def judge_direction(self, winner: Player, loser: Player) -> bool:
        """方向判定

        Args:
            winner: じゃんけんの勝者
            loser: じゃんけんの敗者

        Returns:
            bool: 方向が一致したらTrue（勝者の勝利）、不一致ならFalse
        """
        return winner.direction == loser.direction

    def get_rule_name(self) -> str:
        """ルール名を取得"""
        return "Achi Muite Hoi (あっちむいてホイ)"

    def get_description(self) -> str:
        """ルール説明を取得"""
        return "Rock-Paper-Scissors + Direction Game. Winner chooses direction, if loser looks the same way, winner wins!"
