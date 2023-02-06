from typing import List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class CardinalDirection(Enum):
    North = "North"
    South = "South"
    East = "East"
    West = "West"


class Resource(Enum):
    Mineral = "Mineral"
    Sugar = "Sugar"
    Water = "Water"
    Carbon = "Carbon"


North = CardinalDirection.North
South = CardinalDirection.South
East = CardinalDirection.East
West = CardinalDirection.West

Water = Resource.Water
Sugar = Resource.Sugar
Mineral = Resource.Mineral
Carbon = Resource.Carbon

MAX_WATER = 10
MAX_MINERALS = 10
MAX_CARBON = 10
MAX_SUGAR = 10

@dataclass
class LifeCell:
    # all resources max capacity of 10
    minerals: int = 0
    sugar: int = 0
    water: int = 0
    carbon: int = 0

    flow_direction: Tuple[CardinalDirection] = North, South, East, West
    growth_direction: Tuple[CardinalDirection] = North, South, East, West

    age: int = 0

    @classmethod
    def seed(cls):
        return LifeCell(
            minerals=MAX_MINERALS,
            sugar=MAX_SUGAR,
            water=MAX_WATER,
            carbon=MAX_CARBON,
        )

    @property
    def is_dead(self) -> bool:
        return self.age > 50

    def check_can_reproduce(self) -> bool:
        if self.minerals < MAX_MINERALS // 2:
            return False
        if self.sugar < MAX_SUGAR // 2:
            return False
        if self.water < MAX_WATER // 2:
            return False
        if self.carbon < MAX_CARBON // 2:
            return False
        return True

    def reproduce(self) -> "LifeCell":
        cell = LifeCell()
        cell.minerals = self.minerals // 2
        self.minerals //= 2

        cell.sugar = self.sugar // 2
        self.sugar //= 2

        cell.water = self.water // 2
        self.water //= 2

        cell.carbon = self.carbon // 2
        self.carbon //= 2

        return cell


@dataclass
class Tile:
    x: int
    y: int

    is_dirt: bool = False
    cell: Optional["LifeCell"] = None

    @classmethod
    def build_dirt(cls, x, y):
        return cls(
            x=x,
            y=y,
            is_dirt=True,
        )

    @classmethod
    def build_sky(cls, x, y):
        return cls(
            x=x,
            y=y,
        )

    def adjacent_point(self, direction: "CardinalDirection") -> Tuple[int, int]:
        if direction == North:
            return self.x, self.y - 1
        elif direction == South:
            return self.x, self.y + 1
        elif direction == East:
            return self.x + 1, self.y
        elif direction == West:
            return self.x - 1, self.y
        else:
            raise RuntimeError()

class TileGrid:
    def __init__(self):
        self.tiles = {}

    def get(self, x: int, y: int):
        key = f"{x}_{y}"
        try:
            return self.tiles[key]
        except KeyError:

            if y >= 0:  # negative is north
                tile = Tile.build_dirt(x, y)
            else:
                tile = Tile.build_sky(x, y)

            return self.tiles.setdefault(key, tile)


class Game:
    """
    should it be 2d (matrix)
        - easier to visualize

    or free graph (node connections)
        - more flexible

    - how to represent a treenode and a resource occupying the same location (touching?)
        a "connection"

    a view could show all connections from selected node
        connection

    """

    def __init__(self):
        self.cursor_x = 0
        self.cursor_y = 0
        self.ticks = 0
        self.tiles = TileGrid()

        seed = LifeCell.seed()
        seed_tile = Tile.build_dirt(0, 0)
        seed_tile.cell = seed
        self.tiles.tiles["0_0"] = seed_tile

    @property
    def selected_tile(self):
        return self.tiles.get(self.cursor_x, self.cursor_y)

    @property
    def tiles_with_life_cells(self) -> List["Tile"]:
        return [tile for tile in self.tiles.tiles.values() if (tile.cell and not tile.cell.is_dead)]

    def loop(self):
        """
        birth / reproduction
            - specialized nodes split off

        add new node to your tree
            - more water source
            - more dirt (nutrients)

        grow existing node on a tree
            - to support more nodes
            - to support more water/nutrient flow
            - node in _between_ existing nodes?

        nutrients / water released
            - inefficiency

        death of old trees
            - each tree node has a certain life span
            - each _tree_ has a certain life span?
            - converts back to nutrients

        other trees grow?...  MANY trees?
        """

        already_balanced = set()

        for tile in self.tiles_with_life_cells:

            moved_resources = set()

            for d in tile.cell.flow_direction:
                adjacent_tile = self.tiles.get(*tile.adjacent_point(d))

                if adjacent_tile.cell:
                    a = tile.cell
                    ax, ay = tile.x, tile.y
                    b = adjacent_tile.cell
                    bx, by = adjacent_tile.x, adjacent_tile.y

                    hash_value = f"{min(ax, bx)},{min(ay, by)},{min(ay, by)},{max(ay, by)}"

                    if hash_value in already_balanced:
                        # already balanced
                        continue

                    from_cell = max(a, b, key=lambda cell: cell.water)
                    to_cell = min(a, b, key=lambda cell: cell.water)
                    if not to_cell.is_dead and from_cell.water > 0 and to_cell.water < MAX_WATER and abs(from_cell.water - to_cell.water) > 0:
                        if Water not in moved_resources:
                            from_cell.water -= 1
                            to_cell.water += 1
                            moved_resources.add(Water)
                            already_balanced.add(hash_value)

                    from_cell = max(a, b, key=lambda cell: cell.minerals)
                    to_cell = min(a, b, key=lambda cell: cell.minerals)
                    if not to_cell.is_dead and from_cell.minerals > 0 and to_cell.minerals < MAX_MINERALS and abs(from_cell.minerals - to_cell.minerals) > 0:
                        if Mineral not in moved_resources:
                            from_cell.minerals -= 1
                            to_cell.minerals += 1
                            moved_resources.add(Mineral)
                            already_balanced.add(hash_value)

                    from_cell = max(a, b, key=lambda cell: cell.sugar)
                    to_cell = min(a, b, key=lambda cell: cell.sugar)
                    if not to_cell.is_dead and from_cell.sugar > 0 and to_cell.sugar < MAX_SUGAR and abs(from_cell.sugar - to_cell.sugar) > 0:
                        if Sugar not in moved_resources:
                            from_cell.sugar -= 1
                            to_cell.sugar += 1
                            moved_resources.add(Sugar)
                            already_balanced.add(hash_value)

                    from_cell = max(a, b, key=lambda cell: cell.carbon)
                    to_cell = min(a, b, key=lambda cell: cell.carbon)
                    if not to_cell.is_dead and from_cell.carbon > 0 and to_cell.carbon < MAX_CARBON and abs(from_cell.carbon - to_cell.carbon) > 0:
                        if Carbon not in moved_resources:
                            from_cell.carbon -= 1
                            to_cell.carbon += 1
                            moved_resources.add(Carbon)
                            already_balanced.add(hash_value)

                elif adjacent_tile.is_dirt:
                    if tile.cell.minerals < MAX_MINERALS:
                        if Mineral not in moved_resources:
                            tile.cell.minerals += 1
                            moved_resources.add(Mineral)

                    if tile.cell.water < MAX_WATER and d in (South,):
                        if Water not in moved_resources:
                            tile.cell.water += 1
                            moved_resources.add(Water)

                else:
                    # sky
                    if tile.cell.carbon < MAX_CARBON:
                        if Carbon not in moved_resources:
                            tile.cell.carbon += 1
                            moved_resources.add(Carbon)

                    if tile.cell.sugar < MAX_SUGAR and d in (North,):
                        if Sugar not in moved_resources:
                            tile.cell.sugar += 1
                            moved_resources.add(Sugar)

        # after moving all resources,
        #   reproduce tiles

        for tile in self.tiles_with_life_cells:
            if tile.cell.check_can_reproduce():
                for d in tile.cell.growth_direction:
                    x, y = tile.adjacent_point(d)
                    if not self.tiles.get(x, y).cell:
                        new_cell = tile.cell.reproduce()
                        self.tiles.get(x, y).cell = new_cell
                        break

            tile.cell.age += 1

        self.ticks += 1
