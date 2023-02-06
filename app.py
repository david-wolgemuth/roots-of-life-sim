from game import Game, Tile

from textual.app import App, ComposeResult
from textual.containers import Container
from textual.containers import Grid, Horizontal, Vertical


from textual.widgets import Header, Footer, Static

from textual.widgets import Label, Placeholder, DataTable
from textual.reactive import reactive




tiles = []

for x in range(24):
    for y in range(24):
        tiles.append(f"{x}-{y}")


class TileLabel(Label):
    pass


GRID_SIZE = 9
CENTER = 5
RADIUS = 4


class GameApp(App):
    """A Textual app to manage stopwatches."""
    CSS_PATH = "styles.css"
    dark = False

    BINDINGS = [
        ("q", "quit", "Quit"),
        ("i", "press_up", "Move Up"),
        ("j", "press_left", "Move Left"),
        ("l", "press_right", "Move Right"),
        ("k", "press_down", "Move Down"),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game = Game()

    def on_mount(self):
        self.set_interval(
            interval=1.0,  # 1s
            callback=self.game_loop,
            name="game-loop",
            pause=False,
        )

    def game_loop(self):
        self.game.loop()
        self.query_one("#timer").update(f"ticks: {self.game.ticks}")
        self.update_display()

    def get_grid_data(self):
        data = [
            # (x, y, label_id, tile, visible)
        ]
        for i in range(GRID_SIZE):
            for j in range(GRID_SIZE):
                # if (i + j < 2) or ()
                x = self.game.cursor_x + j - RADIUS
                y = self.game.cursor_y + i - RADIUS

                # dist = abs(self.game.cursor_x - x) + abs(self.game.cursor_y - y)
                # visible = dist < RADIUS + 1
                label_id = f"label-{i}-{j}"
                tile = self.game.tiles.get(x, y)
                data.append({
                    # "visible": visible,
                    "label_id": label_id,
                    "tile": tile,
                })
        return data

    def update_display(self):
        for tile_data in self.get_grid_data():
            label = self.query_one("#" + tile_data["label_id"])
            self._update_tile_label(label, tile_data["tile"])

        self._update_tile_info(
            self.query_one("#tile-info"),
            self.game.selected_tile,
        )

    def _update_tile_label(self, label: "TileLabel", tile: "Tile"):
        if tile.cell:
            label.styles.background = "red"
        elif tile.is_dirt:
            label.styles.background = "brown"
        else:
            label.styles.background = "blue"

        label.update(f"{tile.x}, {tile.y}")

    def _update_tile_info(self, data_table: "DataTable", tile: "Tile"):
        data_table.clear(columns=True)
        data_table.add_column("key")
        data_table.add_column("value")
        data_table.add_row("x", f"{tile.x}")
        data_table.add_row("y", f"{tile.y}")
        data_table.add_row("dirt", f"{tile.is_dirt}")
        data_table.add_row("cell", "----")
        if tile.cell:
            data_table.add_row("age", f"{tile.cell.age}")
            data_table.add_row("water", f"{tile.cell.water}")
            data_table.add_row("minerals", f"{tile.cell.minerals}")
            data_table.add_row("carbon", f"{tile.cell.carbon}")
            data_table.add_row("energy", f"{tile.cell.sugar}")

    def compose(self) -> ComposeResult:
        """Create child widgets for the app."""
        labels = []
        for tile_data in self.get_grid_data():
            tile = tile_data["tile"]
            label = TileLabel(id=tile_data["label_id"])
            self._update_tile_label(label, tile)
            labels.append(label)

        tile_info_data_table = DataTable(
            show_header=False,
            zebra_stripes=True,
            id="tile-info",
        )
        self._update_tile_info(tile_info_data_table, self.game.selected_tile)

        yield Header()
        yield Horizontal(
            Grid(*labels, id="main-grid"),
            tile_info_data_table,
        )
        yield Label("ticks: 0", id="timer")
        yield Footer()

    def action_press_up(self) -> None:
        self.game.cursor_y -= 1
        self.update_display()

    def action_press_left(self) -> None:
        self.game.cursor_x -= 1
        self.update_display()

    def action_press_right(self) -> None:
        self.game.cursor_x += 1
        self.update_display()

    def action_press_down(self) -> None:
        self.game.cursor_y += 1
        self.update_display()

    def action_quit(self) -> None:
        exit(0)


if __name__ == "__main__":
    app = GameApp()
    app.run()
