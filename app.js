import { Game, Sky, Dirt } from './game.js';

const RADIUS = 36; // not actually radius
const GRID_SIZE = RADIUS * 2 + 1;

const GAME_WIDTH = 64;

const TICK_RATE = 10;

const COLORS = [
  'DarkOliveGreen',
  'DarkSeaGreen',
  'DarkTurquoise',
  'Green',
  'Olive',
  'ForestGreen',
  'LightSeaGreen',
  'MediumSeaGreen',
  'OliveDrab',
  'SeaGreen',
]

class GameApp {
  constructor() {
    this.game = new Game(GAME_WIDTH);
    document.addEventListener("keypress", (e) => this.onkeypress(e));
    this.organismColors = {};
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

    let title = `x: ${tile.x}, y: ${tile.y}`;
    if (tile.cell) {
      const cell = tile.cell;
      if (cell.is_dead) {
        // const color = this.organismColors[cell.organismId];
        // tileDiv.style.background = color;
        tileDiv.style.outline = '1px dashed tan'
        tileDiv.innerHTML = "";
      } else {
        tileDiv.style.outline = ''
        // let color;
        // if (this.organismColors[cell.organismId]) {
        //   color = this.organismColors[cell.organismId];
        // } else {
        //   this.organismColors[cell.organismId] = COLORS[Math.floor(Math.random()*COLORS.length)]
        //   color = this.organismColors[cell.organismId];
        // }
        if (cell.chloroplasts < 2) {
          tileDiv.style.background = 'Tan';
        } else if (cell.chloroplasts < 4) {
          tileDiv.style.background = 'RosyBrown';
        } else if (cell.chloroplasts < 6) {
          tileDiv.style.background = 'Olive';
        } else if (cell.chloroplasts < 8) {
          tileDiv.style.background = 'OliveDrab';
        } else {
          tileDiv.style.background = 'MediumSeaGreen';
        }
        // tileDiv.innerHTML = "";
        tileDiv.innerHTML = `${cell.water},${cell.minerals}<br>${cell.carbon},${cell.sugar}`;
      }
      title += `water: ${cell.water}, minerals: ${cell.minerals}, carbon: ${cell.carbon}, sugar: ${cell.sugar}`
    } else if (tile.type === Sky) {
      tileDiv.style.outline = ''
      tileDiv.style.background = "skyblue";
      tileDiv.innerHTML = "";
    } else if (tile.type === Dirt) {
      tileDiv.style.outline = ''
      if (tile.resources.Water > 24) {
        tileDiv.style.background = "Chocolate";
      } else if (tile.resources.Water > 16) {
        tileDiv.style.background = "Peru";
      } else {
        tileDiv.style.background = "SandyBrown";
      }
      tileDiv.innerHTML = "";
    } else {
      // invisible border
      tileDiv.style.outline = ''
      tileDiv.style.background = "white";
      tileDiv.innerHTML = "";
    }
    tileDiv.title = title;
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

        // tileDiv.onmouseenter = e => this.onMouseEnter(e);
        // tileDiv.onmouseleave = e => this.onMouseLeave(e);

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
