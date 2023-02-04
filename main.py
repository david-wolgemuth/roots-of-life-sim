from typing import List
from dataclasses import dataclass


@dataclass
class TreeNode:
    """

    """
    age: int
    height: int  # higher can cause instability
    width: int  # higher can reduce photosynthesis

    connections: ["Connection"]


    # porous

    # touch water

    def grow(self):
        pass

    # def


@dataclass
class Connection:
    from_node: "TreeNode"
    to_node: "TreeNode"

    # can bring from one to another?
    resource: ""


@dataclass
class Resource:
    pass


class Water(Resource):
    """
    """
    pass


class Dirt(Resource):
    """
    """
    pass


class Sunlight(Resource):
    """
    """
    pass


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
        pass


### ---


from textual.app import App, ComposeResult
from textual.containers import Container
from textual.containers import Grid


from textual.widgets import Header, Footer, Static

from textual.widgets import Label
from textual.reactive import reactive

class Row(Static):
    def compose(self):
        yield Cell("A")
        yield Cell("B")
        yield Cell("C")
        yield Cell("D")
        yield Cell("E")


class Cell(Static):
    pass


example = """  1  
 123 
12345
 123 
  1  """


tiles = []

for x in range(24):
    for y in range(24):
        tiles.append(f"{x}-{y}")


class Tile(Label):
    pass


class VisibleTile(Tile):
    pass



class Game(App):
    """A Textual app to manage stopwatches."""
    CSS_PATH = "styles.css"

    BINDINGS = [
        ("i", "press_up", "Move Up"),
        ("j", "press_left", "Move Left"),
        ("l", "press_right", "Move Right"),
        ("k", "press_down", "Move Down"),
    ]

    loaded = False
    player_x = reactive(12)
    player_y = reactive(12)

    def update_grid(self):
        for i in range(5):
            for j in range(5):
                # if (i + j < 2) or ()
                x = self.player_x + i - 2
                y = self.player_y + j - 2

                dist = abs(self.player_x - x) + abs(self.player_y - y)
                tile = tiles[x * 24 + y]
                if dist < 3:
                    self.query_one(f"#tile-{i}-{j}").update(tile)

    def compose(self) -> ComposeResult:
        """Create child widgets for the app."""
        labels = []

        for i in range(5):
            for j in range(5):
                # if (i + j < 2) or ()
                x = i - 2
                y = j - 2

                dist = abs(x) + abs(y)
                if dist < 3:
                    labels.append(VisibleTile("", id=f"tile-{i}-{j}"))
                else:
                    # empty
                    labels.append(Tile())

        yield Header()
        yield Grid(*labels, id="main-grid")
        yield Label(f"player {self.player_x} {self.player_y}", id="player-label", )
        yield Footer()

    def watch_player_x(self, player_x: int) -> None:
        try:
            self.update_grid()
        except Exception as e:
            pass

    def watch_player_y(self, player_x: int) -> None:
        try:
            self.update_grid()
        except Exception as e:
            pass

    def action_press_up(self) -> None:
        self.player_y -= 1

    def action_press_left(self) -> None:
        self.player_x -= 1

    def action_press_right(self) -> None:
        self.player_x += 1

    def action_press_down(self) -> None:
        self.player_y += 1


if __name__ == "__main__":
    app = Game()
    app.run()