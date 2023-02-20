import Config from './config.js';
import { LifeCell } from './cell.js';
import { Tile, TileGrid } from './grid.js';
import {
  North,
  South,
  East,
  West,
  Water,
  Sugar,
  Mineral,
  Carbon,
  Dirt,
  Sky,
  InvisibleBorder,
} from './constants.js';
import { shuffle } from './utils.js';


const DETERIORATION_AGE = 120;

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
      if (tile.cell.age % this.config.ticksToConsumeSugar === 0) {
        tile.cell.sugar -= 1;
      }
      const moved_resources = new Set();

      for (const d of shuffle([West, South, East, North])) {
        const adjacent_tile = this.tiles.get(...tile.adjacent_point(d));

        if (adjacent_tile.cell) {
          tile.cell.shareResources(adjacent_tile.cell, already_balanced, moved_resources);

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
              moved_resources.add(Carbon);
            }
          }

          if (tile.cell.sugar < this.config.maxSugar && tile.cell.carbon > 2 && tile.cell.water > 2 && d === North) {
            if (!moved_resources.has(Sugar)) {
              tile.cell.sugar += Math.ceil(0.2 * tile.cell.chloroplasts);
              tile.cell.water -= 1;
              tile.cell.carbon -= 1;
              moved_resources.add(Sugar);
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

    const TICKS_TO_MOVE_WATER = 4
    if (this.ticks % TICKS_TO_MOVE_WATER === 0) {
      const alreadyBalancedDirt = new Set();
      Object.values(this.tiles.tiles).filter((tile) => {
        return !tile.cell && tile.type === Dirt
      }).forEach(tile => {
        for (const d of shuffle([East, West, South])) {
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

          const baseWater = Math.floor(tile.y * 1.5 + 8);  // ex: 4,4,4,4,8,8,8,8,12,12,12,12...
          if (tile.resources.water < baseWater && adjacent_tile.type === Dirt && adjacent_tile.resources.Water - 1 > tile.resources.Water) {
            adjacent_tile.resources.Water -= 1
            tile.resources.Water += 1
            alreadyBalancedDirt.add(hash_value)
            break;
          }
        }
      });
    }

    this.ticks += 1;
  }
}
