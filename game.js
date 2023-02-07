
const CardinalDirection = {
  North: 'North',
  South: 'South',
  East: 'East',
  West: 'West',
};

const Resource = {
  Mineral: 'Mineral',
  Sugar: 'Sugar',
  Water: 'Water',
  Carbon: 'Carbon',
};


const { North, South, East, West } = CardinalDirection;
const { Water, Sugar, Mineral, Carbon } = Resource;

const MAX_WATER = 10
const MAX_MINERALS = 10
const MAX_CARBON = 10
const MAX_SUGAR = 10


class LifeCell {
    // all resources max capacity of 10
  constructor({
    minerals,
    sugar,
    water,
    carbon,
    flow_direction,
    growth_direction,
    age,
  }) {
    this.minerals = minerals || 0;
    this.sugar = sugar || 0;
    this.water = water || 0;
    this.carbon = carbon || 0;
    this.flow_direction = flow_direction || [North, South, East, West];
    this.growth_direction = growth_direction || [North, South, East, West];
    this.age = age || 0;
  }

  static seed() {
    return new LifeCell({
      minerals: MAX_MINERALS,
      sugar: MAX_SUGAR,
      water: MAX_WATER,
      carbon: MAX_CARBON,
    });
  }

  get is_dead() {
    return this.age > 50
  }

  check_can_reproduce() {
    if (this.minerals < MAX_MINERALS / 2) { // 2:
        return false
    }
    if (this.sugar < MAX_SUGAR / 2) { // 2:
        return false
    }
    if (this.water < MAX_WATER / 2) { // 2:
        return false
    }
    if (this.carbon < MAX_CARBON / 2) { // 2:
        return false
    }
    return true
  }

  reproduce() {
    const cell = new LifeCell({})
    cell.minerals = Math.floor(this.minerals / 2);
    this.minerals = Math.floor(this.minerals / 2)

    cell.sugar = Math.floor(this.sugar / 2);
    this.sugar = Math.floor(this.sugar / 2)

    cell.water = Math.floor(this.water / 2);
    this.water = Math.floor(this.water / 2)

    cell.carbon = Math.floor(this.carbon / 2);
    this.carbon = Math.floor(this.carbon / 2)

    return cell
  }
}


class Tile {
  constructor({
    x,
    y,
    is_dirt,
    cell,
  }) {
    this.x = x;
    this.y = y;
    this.is_dirt = is_dirt;
    this.cell = cell;
  }

  static build_dirt(x, y) {
    return new Tile({
      x: x,
      y: y,
      is_dirt: true,
    });
  }

  static build_sky(x, y) {
    return new Tile({
      x: x,
      y: y,
    });
  }

  adjacent_point(direction) {
    switch(direction) {
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
  constructor() {
    this.tiles = {}
  }

  get(x, y) {
    const key = `${x}_${y}`
    if (this.tiles[key]) {
      return this.tiles[key];
    } else {
      let tile;
      if (y >= 0) {  // negative is north
        tile = Tile.build_dirt(x, y);
      } else {
        tile = Tile.build_sky(x, y);
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
class Game {
  constructor() {
    this.cursor_x = 0
    this.cursor_y = 0
    this.ticks = 0
    this.tiles = new TileGrid()

    const seed = LifeCell.seed()
    const seed_tile = Tile.build_dirt(0, 0)
    seed_tile.cell = seed
    this.tiles.tiles["0_0"] = seed_tile
  }

  get_selected_tile() {
    return this.tiles.get(this.cursor_x, this.cursor_y)
  }

  get_tiles_with_life_cells() {
    return Object.values(this.tiles.tiles).filter(tile => {
      return tile.cell && !tile.is_dead;
    });
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
    const already_balanced = new Set()

    for (const tile of this.get_tiles_with_life_cells()) {
      const moved_resources = new Set()

      for (const d of tile.cell.flow_direction) {
        const adjacent_tile = this.tiles.get(...tile.adjacent_point(d))

        if (adjacent_tile.cell) {
          const a = tile.cell;
          const [ax, ay] = [tile.x, tile.y];
          const b = adjacent_tile.cell;
          const [bx, by] = [adjacent_tile.x, adjacent_tile.y];

          const hash_value = `${Math.min(ax, bx)},${Math.min(ay, by)},${Math.max(ax, bx)},${Math.max(ay, by)}`

          if (already_balanced.has(hash_value)) {
            // already balanced
            continue;
          }

          let from_cell, to_cell;

          from_cell = max(a, b, cell => cell.water)
          to_cell = min(a, b, cell => cell.water)
          if (!to_cell.is_dead && from_cell.water > 0 && to_cell.water < MAX_WATER & Math.abs(from_cell.water - to_cell.water) > 0) {
            if (!moved_resources.has(Water)) {
              from_cell.water -= 1
              to_cell.water += 1
              moved_resources.add(Water)
              already_balanced.add(hash_value)
            }
          }

          from_cell = max(a, b, cell => cell.minerals)
          to_cell = min(a, b, cell => cell.minerals)
          if (!to_cell.is_dead && from_cell.minerals > 0 && to_cell.minerals < MAX_MINERALS & Math.abs(from_cell.minerals - to_cell.minerals) > 0) {
            if (!moved_resources.has(Mineral)) {
              from_cell.minerals -= 1
              to_cell.minerals += 1
              moved_resources.add(Mineral)
              already_balanced.add(hash_value)
            }
          }

          from_cell = max(a, b, cell => cell.sugar)
          to_cell = min(a, b, cell => cell.sugar)
          if (!to_cell.is_dead && from_cell.sugar > 0 && to_cell.sugar < MAX_SUGAR & Math.abs(from_cell.sugar - to_cell.sugar) > 0) {
            if (!moved_resources.has(Sugar)) {
              from_cell.sugar -= 1
              to_cell.sugar += 1
              moved_resources.add(Sugar)
              already_balanced.add(hash_value)
            }
          }

          from_cell = max(a, b, cell => cell.carbon)
          to_cell = min(a, b, cell => cell.carbon)
          if (!to_cell.is_dead && from_cell.carbon > 0 && to_cell.carbon < MAX_CARBON & Math.abs(from_cell.carbon - to_cell.carbon) > 0) {
            if (!moved_resources.has(Carbon)) {
              from_cell.carbon -= 1
              to_cell.carbon += 1
              moved_resources.add(Carbon)
              already_balanced.add(hash_value)
            }
          }
        } else if (adjacent_tile.is_dirt) {
          if (tile.cell.minerals < MAX_MINERALS) {
            if (!moved_resources.has(Mineral)) {
              tile.cell.minerals += 1
              moved_resources.add(Mineral)
            }
          }

          if (tile.cell.water < MAX_WATER && d == South) {
            if (!moved_resources.has(Water)) {
              tile.cell.water += 1
              moved_resources.add(Water)
            }
          }

        } else {
          // sky
          if (tile.cell.carbon < MAX_CARBON) {
            if (!moved_resources.has(Carbon)) {
              tile.cell.carbon += 1
              moved_resources.add(Carbon)
            }
          }

          if (tile.cell.sugar < MAX_SUGAR && d === North) {
            if (!moved_resources.has(Sugar)) {
              tile.cell.sugar += 1
              moved_resources.add(Sugar)
            }
          }
        }
      }
    }

    // after moving all resources,
    //   reproduce tiles
    for (const tile of this.get_tiles_with_life_cells()) {
      if (tile.cell.check_can_reproduce()) {
          for (const d of tile.cell.growth_direction) {
            const [x, y] = tile.adjacent_point(d)
            if (!this.tiles.get(x, y).cell) {
              const new_cell = tile.cell.reproduce()
              this.tiles.get(x, y).cell = new_cell
              break;
            }
          }
        }

        tile.cell.age += 1
      }

    this.ticks += 1
  }
}


