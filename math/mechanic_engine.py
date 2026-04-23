"""First-pass mechanic engine abstraction for generated game configurations."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MechanicProfile:
    key: str
    title: str
    board_layout: str
    win_conditions: list[str]
    bonus_features: list[str]
    notes: list[str]


class BaseMechanicEngine:
    def __init__(self, config: dict[str, object]):
        self.config = config
        self.engine_config = config.get("engine", {})

    def describe(self) -> MechanicProfile:
        raise NotImplementedError()


class ReelLineEngine(BaseMechanicEngine):
    def describe(self) -> MechanicProfile:
        board = self.engine_config.get("board", {})
        return MechanicProfile(
            key="reel-line",
            title="Reel Spin Line Wins",
            board_layout=f"{board.get('columns', 5)}x{board.get('rows', 3)} reels",
            win_conditions=self.engine_config.get("win_conditions", ["3 or more matching symbols from left to right"]),
            bonus_features=self.engine_config.get("bonus_features", ["Wild substitution", "Scatter-triggered bonus"]),
            notes=["Template-driven reel engine", "Supports line-win style content generation"],
        )


class ClusterPaysEngine(BaseMechanicEngine):
    def describe(self) -> MechanicProfile:
        board = self.engine_config.get("board", {})
        return MechanicProfile(
            key="cluster-pays",
            title="Cluster Pays",
            board_layout=f"{board.get('columns', 6)}x{board.get('rows', 5)} grid",
            win_conditions=self.engine_config.get("win_conditions", ["Adjacent symbol clusters award wins"]),
            bonus_features=self.engine_config.get("bonus_features", ["Cascade replacements", "Feature trigger symbol"]),
            notes=["First-pass arbitrary mechanic support", "Grid-based cluster win evaluation profile"],
        )


class PickBonusEngine(BaseMechanicEngine):
    def describe(self) -> MechanicProfile:
        board = self.engine_config.get("board", {})
        return MechanicProfile(
            key="pick-bonus",
            title="Pick Bonus",
            board_layout=f"{board.get('columns', 3)}x{board.get('rows', 3)} pick panel",
            win_conditions=self.engine_config.get("win_conditions", ["Reveal matching picks or hidden value awards"]),
            bonus_features=self.engine_config.get("bonus_features", ["Instant reveal", "Multiplier pick"]),
            notes=["First-pass bonus mechanic support", "Pick-driven rule profile only"],
        )


def create_mechanic_engine(config: dict[str, object]) -> BaseMechanicEngine:
    mechanic = str(config.get("engine", {}).get("mechanic", "reel-line")).lower()
    if "cluster" in mechanic:
        return ClusterPaysEngine(config)
    if "pick" in mechanic:
        return PickBonusEngine(config)
    return ReelLineEngine(config)