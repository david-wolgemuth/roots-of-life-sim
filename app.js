
const GRID_SIZE = 9
const CENTER = 5
const RADIUS = 4


const TICK_RATE = 100

class GameApp {
    constructor() {
        this.game = new Game()
        document.addEventListener('keypress', e => this.onkeypress(e))
    }

    run() {
        this.interval = setInterval(() => this.game_loop(), TICK_RATE);
    }

    game_loop() {
        this.game.loop()
        document.querySelector("#timer").innerHTML = `ticks: ${this.game.ticks}`;
        this.update_display()
    }

    onkeypress(e) {
        console.log(e);
        switch (e.key) {
            case 'i': // UP
                this.moveCursor(0, -1);
                break;
            case 'l': // RIGHT
                this.moveCursor(1, 0);
                break;
            case 'j': // LEFT
                this.moveCursor(-1, 0);
                break;
            case 'k': // DOWN
                this.moveCursor(0, 1);
                break;
        }
    }

    moveCursor(x, y) {
        this.game.cursor_x += x;
        this.game.cursor_y += y
        this.update_display();
    }

    get_grid_data() {
        const data = [
            // (x, y, label_id, tile, visible)
        ]
        for (let i = 0; i < GRID_SIZE; i += 1) {
            for (let j = 0; j < GRID_SIZE; j += 1) {
                // # if (i + j < 2) or ()
                const x = this.game.cursor_x + i - RADIUS
                const y = this.game.cursor_y + j - RADIUS

                // # dist = abs(this.game.cursor_x - x) + abs(this.game.cursor_y - y)
                // # visible = dist < RADIUS + 1
                const label_id = `label-${i}-${j}`
                const tile = this.game.tiles.get(x, y)
                data.push({
                    // # "visible": visible,
                    "label_id": label_id,
                    "tile": tile,
                })
            }
        }
        return data
    }

    update_display() {
        for (const tile_data of this.get_grid_data()) {
            const label = document.querySelector("#" + tile_data["label_id"])
            this._update_tile_label(label, tile_data["tile"]);
        }

        this._update_tile_info(
            document.querySelector("#tile-info"),
            this.game.get_selected_tile(),
        )
    }

    _update_tile_label(label, tile) {
        if (tile.cell) {
            if (tile.cell.is_dead) {
                label.style.background = "black"
                label.innerHTML = ""
            } else {
                label.style.background = "red"
                label.innerHTML =`
                    w: ${tile.cell.water}
                    m: ${tile.cell.minerals}
                    c: ${tile.cell.carbon}
                    ns: ${tile.cell.sugar}
                `;
            }
        } else if (tile.is_dirt) {
            label.style.background = "brown"
            label.innerHTML = `${tile.x}, ${tile.y}`
        } else {
            label.style.background = "blue"
            label.innerHTML = `${tile.x}, ${tile.y}`
        }
    }

    _update_tile_info(data_table, tile) {
        let html = `
            <dt>x</dt><dd>${tile.x}</dd>
            <dt>y</dt><dd>${tile.y}</dd>
            <dt>dirt</dt><dd>${tile.is_dirt}</dd>
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

        data_table.innerHTML = `<dl>${html}</dl>`
    }

    setupLayout() {
        const tile_info_data_table = document.createElement('div')
        tile_info_data_table.id = 'tile-info'
        this._update_tile_info(tile_info_data_table, this.game.get_selected_tile())

        const container = document.createElement("div");
        container.id = "container";

        for (let i = 0; i < GRID_SIZE; i += 1) {
            const row = document.createElement('div')
            row.classList.add('row');
            for (let j = 0; j < GRID_SIZE; j += 1) {
                // # if (i + j < 2) or ()
                const x = this.game.cursor_x + i - RADIUS
                const y = this.game.cursor_y + j - RADIUS

                // # dist = abs(this.game.cursor_x - x) + abs(this.game.cursor_y - y)
                // # visible = dist < RADIUS + 1
                const label_id = `label-${i}-${j}`
                const tile = this.game.tiles.get(x, y)

                const label = document.createElement("div");
                label.classList.add('tile')
                label.id = label_id
                this._update_tile_label(label, tile)

                row.appendChild(label);
            }
            container.appendChild(row);
        }
        document.body.appendChild(container);
        document.body.appendChild(tile_info_data_table);

        const timer = document.createElement("div");
        timer.id = 'timer'
        document.body.appendChild(timer);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const app = new GameApp();
    app.setupLayout();
    app.run();
})
