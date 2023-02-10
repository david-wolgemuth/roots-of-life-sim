import Config from './config.js';

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

const DETERIORATION_AGE = 120;

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
  constructor(config, {
    minerals,
    sugar,
    water,
    carbon,
    chloroplasts,
  }) {
    this.config = config;

    this.minerals = minerals || 0;
    this.sugar = sugar || 0;
    this.water = water || 0;
    this.carbon = carbon || 0;
    this.chloroplasts = chloroplasts || 0;

    this.age = 0;
    this.death_age = null;
  }

  /**
   * @param {Config} config
   */
  static seed(config) {
    return new LifeCell(config, {
      minerals: config.maxMinerals * 12,
      sugar: config.maxSugar * 48,
      water: config.maxWater * 12,
      carbon: config.maxCarbon * 12,
      chloroplasts: config.maxChloroplasts * 4,
    });
  }

  get is_dead() {
    return Boolean(this.death_age)
  }

  check_can_reproduce() {
    if (this.chloroplasts > this.config.maxChloroplasts / 2) {
      // leaf
      return this.sugar >= this.config.maxSugar - 2 && this.water > 4 && this.carbon > 4 && this.minerals > 2;
    } else {
      // root
      return this.water >= this.config.maxWater / 2 && this.sugar > 2 && this.minerals > 2 && this.carbon > 2;
    }
  }

  reproduce() {
    const cell = new LifeCell(this.config, {});
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
  /**
   * @param {Config} config
   */
  constructor(config) {
    this.config = config;
    this.tiles = {};
  }

  get(x, y) {
    const key = `${x}_${y}`;
    if (this.tiles[key]) {
      return this.tiles[key];
    } else {
      let tile;
      if (Math.abs(x) > this.config.gridWidth / 2) {
        tile = new Tile({ x, y, type: InvisibleBorder });
      } else if (y >= 0) {
        // negative is north
        tile = new Tile({
          x,
          y,
          type: Dirt,
          resources: {
            Mineral: this.config.maxMinerals * 3,
            // deeper has more water
            Water: y + 8,  // ex: 4,4,4,4,8,8,8,8,12,12,12,12...
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
 *    should it be 2d (matrix)
 *        - easier to visualize
 *
 *    or free graph (node connections)
 *        - more flexible
 *
 *    - how to represent a treenode and a resource occupying the same location (touching?)
 *        a "connection"
 *
 *    a view could show all connections from selected node
 *        connection
 */
export class Game {

  /**
   *
   * @param {Config} config
   */
  constructor(config) {
    this.config = config
    this.ticks = 0;
    this.tiles = new TileGrid(config);
    console.log(this)

    const seed = LifeCell.seed(this.config);
    const seed_tile = new Tile({ x: 0, y: 0, type: Dirt });
    seed_tile.cell = seed;
    this.tiles.tiles["0_0"] = seed_tile;
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
    const seed = LifeCell.seed(this.config);
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
      if (tile.cell.sugar < -2) {
        tile.cell.death_age = tile.cell.age;
        continue;
      }
      if (tile.cell.age % 20 === 0) {
        tile.cell.sugar -= 1;
      }
      const moved_resources = new Set();

      for (const d of _shuffle([West, South, East, North])) {
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
            (to_cell.water < this.config.maxWater) &
              (Math.abs(from_cell.water - to_cell.water) > 1)
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
            (to_cell.minerals < this.config.maxMinerals) &
              (Math.abs(from_cell.minerals - to_cell.minerals) > 1)
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
            from_cell.sugar > 5 &&
            (to_cell.sugar < this.config.maxSugar) &
              (Math.abs(from_cell.sugar - to_cell.sugar) > 1)
          ) {
            if (!moved_resources.has(Sugar)) {
              from_cell.sugar -= 2;
              to_cell.sugar += 2;
              moved_resources.add(Sugar);
              already_balanced.add(hash_value);
            }
          }

          from_cell = max(a, b, (cell) => cell.carbon);
          to_cell = min(a, b, (cell) => cell.carbon);
          if (
            !to_cell.is_dead &&
            from_cell.carbon > 0 &&
            (to_cell.carbon < this.config.maxCarbon) &
              (Math.abs(from_cell.carbon - to_cell.carbon) > 1)
          ) {
            if (!moved_resources.has(Carbon)) {
              from_cell.carbon -= 1;
              to_cell.carbon += 1;
              moved_resources.add(Carbon);
              already_balanced.add(hash_value);
            }
          }
        } else if (adjacent_tile.type === Dirt) {
          if (tile.cell.minerals < this.config.maxMinerals && adjacent_tile.resources.Mineral > 0) {
            if (!moved_resources.has(Mineral)) {
              tile.cell.minerals += 1;
              adjacent_tile.resources.Mineral -= 1
              moved_resources.add(Mineral);
            }
          }

          if (tile.cell.water < this.config.maxWater && adjacent_tile.resources.Water > 0) {
            if (!moved_resources.has(Water)) {
              tile.cell.water += 1;
              adjacent_tile.resources.Water -= 1;
              moved_resources.add(Water);
            }
          }

        } else if (adjacent_tile.type === Sky) {
          if (tile.cell.sugar > 0 && tile.cell.chloroplasts < this.config.maxChloroplasts) {
            tile.cell.chloroplasts += 1;
            tile.cell.sugar -= 1;
          }

          // sky
          if (tile.cell.carbon < this.config.maxCarbon) {
            if (!moved_resources.has(Carbon)) {
              tile.cell.carbon += 1;
              // moved_resources.add(Carbon);
            }
          }

          if (tile.cell.sugar < this.config.maxSugar && tile.cell.carbon > 2 && tile.cell.water > 2 && d === North) {
            if (!moved_resources.has(Sugar)) {
              tile.cell.sugar += 2 * tile.cell.chloroplasts;
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
        // leaf
        let preferredDirection;
        let directionsToCheck;
        if (tile.cell.chloroplasts > 5) {
          // leaf
          directionsToCheck = [North, East, West, South]
        } else {
          // root
          directionsToCheck = [South, East, West, North]
        }
        for (const d of directionsToCheck) {
          const [x, y] = tile.adjacent_point(d);
          const adjacent_tile = this.tiles.get(x, y)
          if (adjacent_tile.type !== InvisibleBorder && !adjacent_tile.cell) {
            if (!preferredDirection) {
              preferredDirection = d;
            } else {
              const otherTile = this.tiles.get(x, y);
              const countSpaces = [North, South, East, West].filter(d2 => {
                const [x2, y2] = otherTile.adjacent_point(d2);
                const otherOtherTile = this.tiles.get(x2, y2);
                return otherOtherTile.type !== InvisibleBorder && !otherOtherTile.cell;
              }).length
              if (countSpaces >= 2) {
                preferredDirection = d
              }
            }
          }
        }
        if (preferredDirection) {
            const [x, y] = tile.adjacent_point(preferredDirection);
            const new_cell = tile.cell.reproduce();
            this.tiles.get(x, y).cell = new_cell;
        }
      }

      tile.cell.age += 1;
    }

    // break down dead cells
    for (const tile of this.get_tiles_with_dead_life_cells()) {
      if (tile.cell.age - tile.cell.death_age === DETERIORATION_AGE) {
        tile.resources.Water = tile.cell.water;
        tile.resources.Mineral = tile.cell.minerals;
        tile.cell = null;
        tile.type = Dirt;
      } else {
        tile.cell.age += 1;
      }
    }

    const alreadyBalancedDirt = new Set();
    Object.values(this.tiles.tiles).filter((tile) => {
      return !tile.cell && tile.type === Dirt
    }).forEach(tile => {
      for (const d of _shuffle([East, West, South])) {
        const [x, y] = tile.adjacent_point(d);

        const [ax, ay] = [tile.x, tile.y];
        const adjacent_tile = this.tiles.get(x, y)
        const [bx, by] = [adjacent_tile.x, adjacent_tile.y];
        const hash_value = `${Math.min(ax, bx)},${Math.min(
          ay,
          by
        )},${Math.max(ax, bx)},${Math.max(ay, by)}`;
        if (alreadyBalancedDirt.has(hash_value)) {
          // already balanced
          break;
        }

        if (adjacent_tile.type === Dirt && adjacent_tile.resources.Water - 2 > tile.resources.Water) {
          adjacent_tile.resources.Water -= 1
          tile.resources.Water += 1
          alreadyBalancedDirt.add(hash_value)
          break;
        }
      }
    });

    this.ticks += 1;
  }
}
