// Game State Management

// Game State
export const state = {
  hunger: 100,
  thirst: 100,
  fun: 100,
  coins: 0,
  inventory: [],
  gameOver: false,
  placedItems: [], // Track placed furniture
};

// Store purchased upgrades
export const upgrades = new Set();

export function hasUpgrade(id) {
  return upgrades.has(id);
}

// Cooldowns
export let feedCooldown = false;
export let waterCooldown = false;

export function setFeedCooldown(value) {
  feedCooldown = value;
}

export function setWaterCooldown(value) {
  waterCooldown = value;
}

// Coin Logic State
export let coinTick = 0;
export let bonusGiven = false;

export function setCoinTick(value) {
  coinTick = value;
}

export function setBonusGiven(value) {
  bonusGiven = value;
}

export function incrementCoinTick() {
  coinTick++;
}

// Config Values (runtime)
export let feedAmount = 20;
export let waterAmount = 25;

export function setFeedAmount(value) {
  feedAmount = value;
}

export function setWaterAmount(value) {
  waterAmount = value;
}

// Constants (Defaults if config fails)
export let DECAY_RATE = 1;
export let DECAY_INTERVAL = 1000;
export let INVENTORY_SIZE = 3;

export function setDecayRate(value) {
  DECAY_RATE = value;
}

export function setDecayInterval(value) {
  DECAY_INTERVAL = value;
}

export function setInventorySize(value) {
  INVENTORY_SIZE = value;
}
