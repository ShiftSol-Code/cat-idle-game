// Coin Generation System

import { state, coinTick, bonusGiven, setBonusGiven, incrementCoinTick } from '../core/gameState.js';
import { coinSound } from './audio.js';
import config from '../config.json';

export function generateCoins(updateCoinUI, showFloatingText) {
  if (state.gameOver) return;

  const minStat = Math.min(state.hunger, state.thirst, state.fun);
  
  // Bonus Logic: All 100%
  if (state.hunger === 100 && state.thirst === 100 && state.fun === 100) {
    if (!bonusGiven) {
      const bonus = (config && config.bonus && config.bonus.allMax) || 10;
      state.coins += bonus;
      coinSound.play();
      showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `보너스 +${bonus} 코인!`);
      setBonusGiven(true);
    }
  } else {
    setBonusGiven(false);
  }

  // Tiered Generation Logic
  incrementCoinTick();
  
  const max = (config && config.thresholds && config.thresholds.coinGenMax) || 90;
  const high = (config && config.thresholds && config.thresholds.coinGenHigh) || 60;
  const mid = (config && config.thresholds && config.thresholds.coinGenMid) || 30;
  const low = (config && config.thresholds && config.thresholds.coinGenLow) || 10;

  if (minStat >= max) {
    // > 90%: 2 coins every 1s
    state.coins += 2;
    coinSound.play();
  } else if (minStat >= high) {
    // > 60%: 1 coin every 1s
    state.coins++;
    coinSound.play();
  } else if (minStat >= mid) {
    // > 30%: 1 coin every 2s
    if (coinTick % 2 === 0) {
      state.coins++;
      coinSound.play();
    }
  } else if (minStat >= low) {
    // > 10%: 1 coin every 3s
    if (coinTick % 3 === 0) {
      state.coins++;
      coinSound.play();
    }
  }
  
  updateCoinUI();
}
