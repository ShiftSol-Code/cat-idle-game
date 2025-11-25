// Game Loop and Core Logic

import { state, DECAY_RATE, coinTick, setCoinTick, setBonusGiven, upgrades, setFeedAmount, setWaterAmount, feedAmount, waterAmount } from './gameState.js';
import config from '../config.json';

// Game Intervals
export let gameInterval;
export let coinInterval;
export let saveInterval;

export function setGameInterval(interval) {
  gameInterval = interval;
}

export function setCoinInterval(interval) {
  coinInterval = interval;
}

export function setSaveInterval(interval) {
  saveInterval = interval;
}

export function gameLoop(updateUI, updateCatState, checkGameOver) {
  if (state.gameOver) return;

  // Decay stats
  state.hunger = Math.max(0, state.hunger - DECAY_RATE);
  state.thirst = Math.max(0, state.thirst - DECAY_RATE);
  state.fun = Math.max(0, state.fun - DECAY_RATE);

  // Furniture Effects
  // Cat Tower: +1 Fun every 2 seconds
  if (state.placedItems.includes('cat_tower')) {
      if (coinTick % 2 === 0) { // Sync with coinTick which is approx 1s, so % 2 is 2s
          state.fun = Math.min(100, state.fun + 1);
      }
  }

  // Auto Feeder: +1 Hunger every 2 seconds
  if (state.placedItems.includes('auto_feeder')) {
      if (coinTick % 2 === 0) {
          state.hunger = Math.min(100, state.hunger + 1);
      }
  }

  // Auto Water: +1 Thirst every 1 second
  if (state.placedItems.includes('auto_water')) {
      state.thirst = Math.min(100, state.thirst + 1);
  }

  checkGameOver();
  updateCatState();
  updateUI();
}

export function checkGameOver(gameOverScreen, clearMonologue, clearIntervals) {
  if (state.hunger === 0 && state.thirst === 0 && state.fun === 0) {
    state.gameOver = true;
    clearIntervals();
    clearMonologue();
    
    const finalScoreEl = document.getElementById('final-score');
    const gameOverTitle = document.querySelector('#game-over h1');
    const restartBtn = document.getElementById('restart-btn');

    if (finalScoreEl) {
      finalScoreEl.textContent = `그동안 적립된 코인은 ${state.coins}개 입니다`;
    }
    
    if (gameOverTitle) {
      gameOverTitle.textContent = "고양이별로 되돌아 갔습니다";
    }
    
    if (restartBtn) {
      restartBtn.textContent = "다시 시작";
    }
    
    gameOverScreen.classList.remove('hidden');
  }
}

export function updateCatState(catImage) {
  let newState = 'sleep'; // Default/Low
  
  const happy = (config && config.thresholds && config.thresholds.catHappy) || 90;
  const neutral = (config && config.thresholds && config.thresholds.catNeutral) || 60;
  const sleep = (config && config.thresholds && config.thresholds.catSleep) || 30;
  
  if (state.hunger >= happy && state.thirst >= happy) {
    newState = 'happy';
  } else if (state.hunger >= neutral && state.thirst >= neutral) {
    newState = 'neutral';
  } else if (state.hunger >= sleep && state.thirst >= sleep) {
    newState = 'sleep';
  } else {
    newState = 'sleep'; // Fallback for very low stats
  }

  const newSrc = `/cat_${newState}.png`;
  if (catImage && !catImage.src.endsWith(newSrc)) {
    catImage.src = newSrc;
  }
}

export function startGame(isLoaded, config, gameOverScreen, updateUI, updateCoinUI, renderInventory, renderFurniture, startMonologueLoop, generateCoins, DECAY_INTERVAL, saveGame, feedBtn, waterBtn) {
  if (!isLoaded) {
    if (config && config.defaults) {
        state.hunger = config.defaults.hunger;
        state.thirst = config.defaults.thirst;
        state.fun = config.defaults.fun;
        state.coins = config.defaults.coins !== undefined ? config.defaults.coins : 0;
    } else {
        state.hunger = 100;
        state.thirst = 100;
        state.fun = 100;
        state.coins = 0;
    }
    state.inventory = [];
    state.placedItems = [];
    upgrades.clear();
    renderFurniture(); // Clear furniture visuals
    // Reset upgrade values
    if (config && config.actions) {
        setFeedAmount(config.actions.feedAmount);
        setWaterAmount(config.actions.waterAmount);
    }
    // Reset button text
    if (feedBtn) feedBtn.textContent = `밥주기 (+${feedAmount})`;
    if (waterBtn) waterBtn.textContent = `물주기 (+${waterAmount})`;
    
    renderInventory();
    saveGame(); // Immediately save the reset state
  }
  
  state.gameOver = false;
  setCoinTick(0);
  setBonusGiven(false);
  
  updateUI();
  updateCoinUI();
  gameOverScreen.classList.add('hidden');
  
  if (gameInterval) clearInterval(gameInterval);
  if (coinInterval) clearInterval(coinInterval);
  
  // Start intervals
  return {
    needsGameInterval: true,
    needsCoinInterval: true,
    needsMonologue: true
  };
}
