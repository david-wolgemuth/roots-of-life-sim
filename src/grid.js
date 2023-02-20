import Config from './config.js';
import {
  North,
  South,
  East,
  West,
  InvisibleBorder,
  Dirt,
  Sky,
} from './constants.js';


export class Tile {
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


export class TileGrid {
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
            Water: Math.floor(y * 2.5 + 8),  // ex: 4,4,4,4,8,8,8,8,12,12,12,12...
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
