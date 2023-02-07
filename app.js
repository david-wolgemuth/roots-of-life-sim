const RADIUS = 84;
const CENTER = RADIUS + 1;
const GRID_SIZE = RADIUS * 2 + 1;

const TICK_RATE = 10;

const COLORS = [
  'Aqua',
  'Aquamarine',
  'Beige',
  'Bisque',
  'BlanchedAlmond',
  'Chocolate',
  'DarkGoldenRod',
  'DarkOliveGreen',
  'DarkRed',
  'DarkSalmon',
  'DarkSeaGreen',
  'DarkTurquoise',
  'Green',
  'Olive',
  'OliveDrab',
  'SpringGreen',
  'Thistle',
]

class GameApp {
  constructor() {
    this.game = new Game();
    document.addEventListener("keypress", (e) => this.onkeypress(e));
    this.organisms = {

    };
  }

  run() {
    this.interval = setInterval(() => this.game_loop(), TICK_RATE);
  }

  game_loop() {
    this.game.loop();
    document.querySelector("#timer").innerHTML = `ticks: ${this.game.ticks}`;
    this.update_display();
  }

  onkeypress(e) {
    console.log(e);
    switch (e.key) {
      case "i": // UP
        this.moveCursor(0, -1);
        break;
      case "l": // RIGHT
        this.moveCursor(1, 0);
        break;
      case "j": // LEFT
        this.moveCursor(-1, 0);
        break;
      case "k": // DOWN
        this.moveCursor(0, 1);
        break;
    }
  }

  moveCursor(x, y) {
    this.game.cursor_x += x;
    this.game.cursor_y += y;
    this.update_display();
  }

  get_grid_data() {
    const data = [
      // (x, y, tileDivId, tile, visible)
    ];
    for (let i = 0; i < GRID_SIZE; i += 1) {
      for (let j = 0; j < GRID_SIZE; j += 1) {
        // # if (i + j < 2) or ()
        const x = this.game.cursor_x + i - RADIUS;
        const y = this.game.cursor_y + j - RADIUS;

        // # dist = abs(this.game.cursor_x - x) + abs(this.game.cursor_y - y)
        // # visible = dist < RADIUS + 1
        const tileDivId = `tile-${i}-${j}`;
        const tile = this.game.tiles.get(x, y);
        data.push({
          // # "visible": visible,
          tileDivId: tileDivId,
          tile: tile,
        });
      }
    }
    return data;
  }

  update_display() {
    for (const tile_data of this.get_grid_data()) {
      const tileDiv = document.querySelector("#" + tile_data["tileDivId"]);
      this._update_tile_tileDiv(tileDiv, tile_data["tile"]);
    }

    this._update_tile_info(
      document.querySelector("#tile-info"),
      this.game.get_selected_tile()
    );
  }

  _update_tile_tileDiv(tileDiv, tile) {

    tileDiv.dataset.x = tile.x
    tileDiv.dataset.y = tile.y

    if (tile.cell) {
      if (tile.cell.is_dead) {
        tileDiv.style.background = "whitesmoke";
        tileDiv.innerHTML = "";
      } else {
        let color;
        if (this.organisms[tile.cell.organismId]) {
          color = this.organisms[tile.cell.organismId];
        } else {
          this.organisms[tile.cell.organismId] = COLORS[Math.floor(Math.random()*COLORS.length)]
          color = this.organisms[tile.cell.organismId];
        }
        tileDiv.style.background = color;
        tileDiv.innerHTML = "";
        // `
        //     w: ${tile.cell.water}
        //     m: ${tile.cell.minerals}
        //     c: ${tile.cell.carbon}
        //     ns: ${tile.cell.sugar}
        // `;
      }
    } else if (tile.type === Sky) {
      tileDiv.style.background = "skyblue";
      tileDiv.innerHTML = "";
    } else if (tile.type === Dirt) {
      tileDiv.style.background = "rosybrown";
      tileDiv.innerHTML = "";
    } else {
      // invisible border
      tileDiv.style.background = "white";
      tileDiv.innerHTML = "";
    }
  }

  _update_tile_info(data_table, tile) {
    let html = `
            <dt>x</dt><dd>${tile.x}</dd>
            <dt>y</dt><dd>${tile.y}</dd>
            <dt>type</dt><dd>${tile.type}</dd>
            <dt>cell</dt><dd>----</dd>
        `;
    if (tile.cell) {
      html += `
                <dt>age</dt><dd>${tile.cell.age}</dd>
                <dt>water</dt><dd>${tile.cell.water}</dd>
                <dt>minerals</dt><dd>${tile.cell.minerals}</dd>
                <dt>carbon</dt><dd>${tile.cell.carbon}</dd>
                <dt>sugar</dt><dd>${tile.cell.sugar}</dd>
            `;
    }

    data_table.innerHTML = `<dl>${html}</dl>`;
  }

  onClickTile(e) {
    const x = e.target.dataset.x;
    const y = e.target.dataset.y;
    console.log(x, y)
    this.game.addNewOrganism(x, y);
  }

  setupLayout() {
    const tile_info_data_table = document.createElement("div");
    tile_info_data_table.id = "tile-info";
    this._update_tile_info(tile_info_data_table, this.game.get_selected_tile());

    const container = document.createElement("div");
    container.id = "container";

    for (let i = 0; i < GRID_SIZE; i += 1) {
      const row = document.createElement("div");
      row.classList.add("row");
      for (let j = 0; j < GRID_SIZE; j += 1) {
        // # if (i + j < 2) or ()
        const x = this.game.cursor_x + i - RADIUS;
        const y = this.game.cursor_y + j - RADIUS;

        // # dist = abs(this.game.cursor_x - x) + abs(this.game.cursor_y - y)
        // # visible = dist < RADIUS + 1
        const tileDivId = `tile-${i}-${j}`;
        const tile = this.game.tiles.get(x, y);

        const tileDiv = document.createElement("div");
        tileDiv.classList.add("tile");
        tileDiv.id = tileDivId;

        tileDiv.onclick = e => this.onClickTile(e);

        this._update_tile_tileDiv(tileDiv, tile);

        row.appendChild(tileDiv);
      }
      container.appendChild(row);
    }
    document.body.appendChild(container);
    document.body.appendChild(tile_info_data_table);

    const timer = document.createElement("div");
    timer.id = "timer";
    document.body.appendChild(timer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new GameApp();
  app.setupLayout();
  app.run();
});
