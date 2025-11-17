import random
from ..models import Hand, IdoHand, Direction


class RandomAI:
    """ランダムに手を選ぶAI"""

    def __init__(self, npc_name: str):
        """初期化

        Args:
            npc_name: NPCの名前
        """
        self.name = npc_name

    def choose_hand(self, rule_type: str) -> Hand | IdoHand:
        """じゃんけんの手を選択

        Args:
            rule_type: ゲームルールタイプ

        Returns:
            Hand | IdoHand: 選択した手
        """
        if rule_type == "ido_janken":
            return random.choice(["rock", "paper", "scissors", "well"])
        else:
            return random.choice(["rock", "paper", "scissors"])

    def choose_direction(self) -> Direction:
        """あっちむいてホイの方向を選択

        Returns:
            Direction: 選択した方向
        """
        return random.choice(["up", "down", "left", "right"])
