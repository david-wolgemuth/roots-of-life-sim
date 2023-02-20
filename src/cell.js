import Config from './config.js';
import { getMax, getMin } from './utils.js';
import { Water, Mineral, Carbon, Sugar } from './constants.js';


export class LifeCell {

  /**
   *
   * @param {Config} config
   */
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
      minerals: config.maxMinerals * 4,
      sugar: config.maxSugar * 6,
      water: config.maxWater * 4,
      carbon: config.maxCarbon * 4,
      chloroplasts: config.maxChloroplasts * 2,
    });
  }

  get is_dead() {
    return Boolean(this.death_age)
  }

  check_can_reproduce() {
    if (this.chloroplasts > this.config.maxChloroplasts / 2) {
      // leaf
      return (
        this.sugar >= this.config.requiredAmountOfResourcesToReproduce__leaf
        && this.water >= this.config.requiredAmountOfResourcesToReproduce__leaf
        && this.carbon >= this.config.requiredAmountOfResourcesToReproduce__leaf
        && this.minerals >= this.config.requiredAmountOfResourcesToReproduce__leaf
      );
    } else {
      // root
      return (
        this.water >= this.config.requiredAmountOfResourcesToReproduce__root
        && this.sugar >= this.config.requiredAmountOfResourcesToReproduce__root
        && this.minerals >= this.config.requiredAmountOfResourcesToReproduce__root
        && this.carbon >= this.config.requiredAmountOfResourcesToReproduce__root
      );
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

  /**
   *
   * @param {LifeCell} otherCell
   * @param {Set} alreadyBalancedSet - ensure not sharing back and forth in same tick
   * @param {Set} tileMovedResourcesSet - ensure not moving resources back and forth in same tick
   */
  shareResources(otherCell, alreadyBalancedSet, tileMovedResourcesSet) {
    const [ax, ay] = [this.x, this.y];
    const b = otherCell;
    const [bx, by] = [otherCell.x, otherCell.y];

    const hash_value = `${Math.min(ax, bx)},${Math.min(
      ay,
      by
    )},${Math.max(ax, bx)},${Math.max(ay, by)}`;

    if (alreadyBalancedSet.has(hash_value)) {
      // already balanced
      return;
    }

    let from_cell, to_cell;

    from_cell = getMax(this, b, (cell) => cell.water);
    to_cell = getMin(this, b, (cell) => cell.water);
    if (
      !to_cell.is_dead &&
      from_cell.water > 0 &&
      (to_cell.water < this.config.maxWater) &
        (Math.abs(from_cell.water - to_cell.water) > 1)
    ) {
      if (!tileMovedResourcesSet.has(Water)) {
        from_cell.water -= 1;
        to_cell.water += 1;
        tileMovedResourcesSet.add(Water);
        // alreadyBalancedSet.add(hash_value);
      }
    }

    from_cell = getMax(this, b, (cell) => cell.minerals);
    to_cell = getMin(this, b, (cell) => cell.minerals);
    if (
      !to_cell.is_dead &&
      from_cell.minerals > 0 &&
      (to_cell.minerals < this.config.maxMinerals) &
        (Math.abs(from_cell.minerals - to_cell.minerals) > 1)
    ) {
      if (!tileMovedResourcesSet.has(Mineral)) {
        from_cell.minerals -= 1;
        to_cell.minerals += 1;
        tileMovedResourcesSet.add(Mineral);
        // alreadyBalancedSet.add(hash_value);
      }
    }

    from_cell = getMax(this, b, (cell) => cell.sugar);
    to_cell = getMin(this, b, (cell) => cell.sugar);
    if (
      !to_cell.is_dead &&
      from_cell.sugar > 5 &&
      (to_cell.sugar < this.config.maxSugar) &
        (Math.abs(from_cell.sugar - to_cell.sugar) > 1)
    ) {
      if (!tileMovedResourcesSet.has(Sugar)) {
        from_cell.sugar -= 2;
        to_cell.sugar += 2;
        tileMovedResourcesSet.add(Sugar);
        // alreadyBalancedSet.add(hash_value);
      }
    }

    from_cell = getMax(this, b, (cell) => cell.carbon);
    to_cell = getMin(this, b, (cell) => cell.carbon);
    if (
      !to_cell.is_dead &&
      from_cell.carbon > 0 &&
      (to_cell.carbon < this.config.maxCarbon) &
        (Math.abs(from_cell.carbon - to_cell.carbon) > 1)
    ) {
      if (!tileMovedResourcesSet.has(Carbon)) {
        from_cell.carbon -= 1;
        to_cell.carbon += 1;
        tileMovedResourcesSet.add(Carbon);
        // alreadyBalancedSet.add(hash_value);
      }
    }
  }
}
