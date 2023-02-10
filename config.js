

export default class Config {
  constructor({
    gridRadius,
    tickRate,

    maxWater,
    maxSugar,
    maxCarbon,
    maxMinerals,
    maxChloroplasts,

    ticksToConsumeSugar,
  }) {
    this.gridRadius = Number(gridRadius);
    this.tickRate = Number(tickRate);
    this.gridWidth = this.gridRadius * 2 + 1;


    this.maxWater = Number(maxWater);
    this.maxSugar = Number(maxSugar);
    this.maxCarbon = Number(maxCarbon);
    this.maxMinerals = Number(maxMinerals);
    this.maxChloroplasts = Number(maxChloroplasts);

    this.ticksToConsumeSugar = Number(ticksToConsumeSugar);
  }

  static buildFromDocument() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });

    const config = {}
    const form = document.querySelector('form[name=configuration]');
    const inputs = form.getElementsByTagName('input');
    for (const input of Array.from(inputs)) {
      const value = params[input.name] || input.dataset.default;
      config[input.name] = value;
      input.value = value;
    }

    return new Config(config);
  }
}


