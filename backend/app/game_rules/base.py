from abc import ABC, abstractmethod
from ..models import Player, GameResult


class GameRuleBase(ABC):
    """ゲームルールの基底クラス"""

    @abstractmethod
    def judge(self, player1: Player, player2: Player) -> GameResult:
        """勝敗判定

        Args:
            player1: プレイヤー1
            player2: プレイヤー2

        Returns:
            GameResult: プレイヤー1視点での勝敗結果（"win", "lose", "draw"）
        """
        pass

    @abstractmethod
    def get_rule_name(self) -> str:
        """ルール名を取得

        Returns:
            str: ルール名
        """
        pass

    @abstractmethod
    def get_description(self) -> str:
        """ルール説明を取得

        Returns:
            str: ルール説明
        """
        pass
