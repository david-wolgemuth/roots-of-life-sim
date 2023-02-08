const CardinalDirection = {
  North: "North",
  South: "South",
  East: "East",
  West: "West",
};

const Resource = {
  Mineral: "Mineral",
  Sugar: "Sugar",
  Water: "Water",
  Carbon: "Carbon",
};

const TileType = {
  Dirt: "Dirt",
  Sky: "Sky",
  InvisibleBorder: "InvisibleBorder",
}

export const { North, South, East, West } = CardinalDirection;
export const { Water, Sugar, Mineral, Carbon } = Resource;
export const { Dirt, Sky, InvisibleBorder } = TileType

const MAX_WATER = 10;
const MAX_MINERALS = 10;
const MAX_CARBON = 10;
const MAX_SUGAR = 10;
const MAX_CHLOROPLASTS = 10;

const DEATH_AGE = 240;
const DETERIORATION_AGE = 480;

function _shuffle(array) {
  // NOTE - modifies input
  //
  // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
  //
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

class LifeCell {
  // all resources max capacity of 10
  constructor(organismId, {
    minerals,
    sugar,
    water,
    carbon,
    chloroplasts,
  }) {
    this.organismId = organismId;

    this.minerals = minerals || 0;
    this.sugar = sugar || 0;
    this.water = water || 0;
    this.carbon = carbon || 0;
    this.chloroplasts = chloroplasts || 0;

    this.age = 0;
    this.is_dead = false;
  }

  static seed() {
    return new LifeCell(Math.random(), {
      minerals: MAX_MINERALS * 2,
      sugar: MAX_SUGAR * 2,
      water: MAX_WATER * 2,
      carbon: MAX_CARBON * 2,
      chloroplasts: MAX_CHLOROPLASTS * 2,
    });
  }

  // get is_dead() {
  //   return this.age >= DEATH_AGE;
  // }

  check_can_reproduce() {
    if (this.chloroplasts > MAX_CHLOROPLASTS / 2) {
      return this.sugar >= MAX_SUGAR - 1 && this.water > MAX_WATER / 2 && this.carbon > MAX_CARBON / 2;
    } else {
      return this.water >= MAX_WATER - 1 && this.sugar > MAX_SUGAR / 2 && this.minerals > MAX_MINERALS / 2;
    }
  }

  reproduce() {
    const cell = new LifeCell(this.organismId, {});
    cell.minerals = Math.floor(this.minerals / 2);
    this.minerals = Math.floor(this.minerals / 2);

    cell.sugar = Math.floor(this.sugar / 2);
    this.sugar = Math.floor(this.sugar / 2);

    cell.water = Math.floor(this.water / 2);
    this.water = Math.floor(this.water / 2);

    cell.carbon = Math.floor(this.carbon / 2);
    this.carbon = Math.floor(this.carbon / 2);

    cell.chloroplasts = Math.floor(this.chloroplasts / 2);
    this.chloroplasts = Math.floor(this.chloroplasts / 2);

    return cell;
  }
}

class Tile {
  constructor({ x, y, type, cell, resources }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.cell = cell;
    this.resources = resources || {
      Water: 0,
      Mineral: 0,
    }
  }

  adjacent_point(direction) {
    switch (direction) {
      case North:
        return [this.x, this.y - 1];
      case South:
        return [this.x, this.y + 1];
      case East:
        return [this.x + 1, this.y];
      case West:
        return [this.x - 1, this.y];
      default:
        console.warn("no point found...");
        return [Infinity, Infinity];
    }
  }
}

class TileGrid {
  constructor(width) {
    this.tiles = {};
    this.width = width;
  }

  get(x, y) {
    const key = `${x}_${y}`;
    if (this.tiles[key]) {
      return this.tiles[key];
    } else {
      let tile;
      if (Math.abs(x) > this.width / 2) {
        tile = new Tile({ x, y, type: InvisibleBorder });
      } else if (y >= 0) {
        // negative is north
        tile = new Tile({
          x,
          y,
          type: Dirt,
          resources: {
            Mineral: 10,
            // deeper has more water
            Water: (Math.floor(y / 4) + 8),  // ex: 4,4,4,4,8,8,8,8,12,12,12,12...
          }
        });
      } else {
        tile = new Tile({ x, y, type: Sky });
      }
      this.tiles[key] = tile;
      return tile;
    }
  }
}

function max(a, b, key) {
  if (key(a) >= key(b)) {
    return a;
  } else {
    return b;
  }
}
function min(a, b, key) {
  if (key(a) < key(b)) {
    return a;
  } else {
    return b;
  }
}

/**
 *
    should it be 2d (matrix)
        - easier to visualize

    or free graph (node connections)
        - more flexible

    - how to represent a treenode and a resource occupying the same location (touching?)
        a "connection"

    a view could show all connections from selected node
        connection
 */
export class Game {
  constructor(width) {
    this.cursor_x = 0;
    this.cursor_y = 0;
    this.ticks = 0;
    this.tiles = new TileGrid(width);

    const seed = LifeCell.seed();
    const seed_tile = new Tile({ x: 0, y: 0, type: Dirt });
    seed_tile.cell = seed;
    this.tiles.tiles["0_0"] = seed_tile;
  }

  get_selected_tile() {
    return this.tiles.get(this.cursor_x, this.cursor_y);
  }

  get_tiles_with_life_cells() {
    return Object.values(this.tiles.tiles).filter((tile) => {
      return tile.cell && !tile.cell.is_dead;
    });
  }

  get_tiles_with_dead_life_cells() {
    return Object.values(this.tiles.tiles).filter((tile) => {
      return tile.cell && tile.cell.is_dead;
    });
  }

  addNewOrganism(x, y) {
    const tile = this.tiles.get(x, y);
    const seed = LifeCell.seed();
    tile.cell = seed;
  }

  /**
   *
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
   */
  loop() {
    const already_balanced = new Set();

    for (const tile of this.get_tiles_with_life_cells()) {
      // if (tile.cell.sugar < 0) {
      //   tile.cell.is_dead = true;
      //   continue;
      // }
      const moved_resources = new Set();

      for (const d of _shuffle(Object.values(CardinalDirection))) {
        const adjacent_tile = this.tiles.get(...tile.adjacent_point(d));

        if (adjacent_tile.cell && adjacent_tile.cell.organismId === tile.cell.organismId) {
          const a = tile.cell;
          const [ax, ay] = [tile.x, tile.y];
          const b = adjacent_tile.cell;
          const [bx, by] = [adjacent_tile.x, adjacent_tile.y];

          const hash_value = `${Math.min(ax, bx)},${Math.min(
            ay,
            by
          )},${Math.max(ax, bx)},${Math.max(ay, by)}`;

          if (already_balanced.has(hash_value)) {
            // already balanced
            continue;
          }

          let from_cell, to_cell;

          from_cell = max(a, b, (cell) => cell.water);
          to_cell = min(a, b, (cell) => cell.water);
          if (
            !to_cell.is_dead &&
            from_cell.water > 0 &&
            (to_cell.water < MAX_WATER) &
              (Math.abs(from_cell.water - to_cell.water) > 0)
          ) {
            if (!moved_resources.has(Water)) {
              from_cell.water -= 1;
              to_cell.water += 1;
              moved_resources.add(Water);
              already_balanced.add(hash_value);
            }
          }

          from_cell = max(a, b, (cell) => cell.minerals);
          to_cell = min(a, b, (cell) => cell.minerals);
          if (
            !to_cell.is_dead &&
            from_cell.minerals > 0 &&
            (to_cell.minerals < MAX_MINERALS) &
              (Math.abs(from_cell.minerals - to_cell.minerals) > 0)
          ) {
            if (!moved_resources.has(Mineral)) {
              from_cell.minerals -= 1;
              to_cell.minerals += 1;
              moved_resources.add(Mineral);
              already_balanced.add(hash_value);
            }
          }

          from_cell = max(a, b, (cell) => cell.sugar);
          to_cell = min(a, b, (cell) => cell.sugar);
          if (
            !to_cell.is_dead &&
            from_cell.sugar > 0 &&
            (to_cell.sugar < MAX_SUGAR) &
              (Math.abs(from_cell.sugar - to_cell.sugar) > 0)
          ) {
            if (!moved_resources.has(Sugar)) {
              from_cell.sugar -= 1;
              to_cell.sugar += 1;
              moved_resources.add(Sugar);
              already_balanced.add(hash_value);
            }
          }

          from_cell = max(a, b, (cell) => cell.carbon);
          to_cell = min(a, b, (cell) => cell.carbon);
          if (
            !to_cell.is_dead &&
            from_cell.carbon > 0 &&
            (to_cell.carbon < MAX_CARBON) &
              (Math.abs(from_cell.carbon - to_cell.carbon) > 0)
          ) {
            if (!moved_resources.has(Carbon)) {
              from_cell.carbon -= 1;
              to_cell.carbon += 1;
              moved_resources.add(Carbon);
              already_balanced.add(hash_value);
            }
          }
        } else if (adjacent_tile.type === Dirt) {
          if (tile.cell.minerals < MAX_MINERALS && adjacent_tile.resources.Mineral > 0) {
            if (!moved_resources.has(Mineral)) {
              tile.cell.minerals += 1;
              adjacent_tile.resources.Mineral -= 1
              moved_resources.add(Mineral);
            }
          }

          if (tile.cell.water < MAX_WATER && adjacent_tile.resources.Water > 0) {
            if (!moved_resources.has(Water)) {
              tile.cell.water += 1;
              adjacent_tile.resources.Water -= 1;
              moved_resources.add(Water);
            }
          }

        } else if (adjacent_tile.type === Sky) {
          if (tile.cell.sugar > 0 && tile.cell.chloroplasts < MAX_CHLOROPLASTS) {
            tile.cell.chloroplasts += 1;
            tile.cell.sugar -= 1;
          }

          // sky
          if (tile.cell.carbon < MAX_CARBON) {
            if (!moved_resources.has(Carbon)) {
              tile.cell.carbon += 1;
              // moved_resources.add(Carbon);
            }
          }

          if (tile.cell.sugar < MAX_SUGAR && tile.cell.carbon > 0 && tile.cell.water > 0 && d === North) {
            if (!moved_resources.has(Sugar)) {
              tile.cell.sugar += 1 * (Math.floor(tile.cell.chloroplasts / 2) + 1);
              tile.cell.water -= 1;
              tile.cell.carbon -= 1;
              // moved_resources.add(Sugar);
            }
          }
        }
      }
    }

    // after moving all resources,
    //   reproduce tiles
    for (const tile of this.get_tiles_with_life_cells()) {
      if (tile.cell.check_can_reproduce()) {
        for (const d of _shuffle(Object.values(CardinalDirection))) {
          const [x, y] = tile.adjacent_point(d);
          const adjacent_tile = this.tiles.get(x, y)
          if (adjacent_tile.type !== InvisibleBorder && !adjacent_tile.cell) {
            const new_cell = tile.cell.reproduce();
            this.tiles.get(x, y).cell = new_cell;
            break;
          }
        }
      }

      tile.cell.age += 1;
    }

    // break down dead cells
    for (const tile of this.get_tiles_with_dead_life_cells()) {
      if (tile.cell.age === DETERIORATION_AGE) {
        tile.cell = null;
        tile.type = Dirt;
      } else {
        tile.cell.age += 1;
      }
    }

    this.ticks += 1;
  }
}