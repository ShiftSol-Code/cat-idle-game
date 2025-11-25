// Player Actions and Interactions

import { state, feedCooldown, waterCooldown, setFeedCooldown, setWaterCooldown, feedAmount, waterAmount } from '../core/gameState.js';
import { updateUI, showFloatingText } from '../ui/uiManager.js';
import { popSound } from '../systems/audio.js';
import { saveGame } from '../core/saveLoad.js';
import config from '../config.json';

let feedBtn, waterBtn, catImage;

export function initInteractionElements() {
  feedBtn = document.getElementById('feed-btn');
  waterBtn = document.getElementById('water-btn');
  catImage = document.getElementById('cat-image');
}

export function getFeedBtn() {
  return feedBtn;
}

export function getWaterBtn() {
  return waterBtn;
}

export function getCatImage() {
  return catImage;
}

export function feed(updateCatState) {
  if (feedCooldown || state.gameOver) return;
  
  state.hunger = Math.min(100, state.hunger + feedAmount);
  updateUI();
  updateCatState();
  
  // Cooldown
  setFeedCooldown(true);
  feedBtn.disabled = true;
  let timeLeft = (config && config.cooldowns && config.cooldowns.feed) || 10;
  feedBtn.textContent = `Feed (${timeLeft})`;
  
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      setFeedCooldown(false);
      feedBtn.disabled = false;
      feedBtn.textContent = `밥주기 (+${feedAmount})`;
    } else {
      feedBtn.textContent = `밥주기 (${timeLeft})`;
    }
  }, 1000);
  saveGame();
}

export function water(updateCatState) {
  if (waterCooldown || state.gameOver) return;
  
  state.thirst = Math.min(100, state.thirst + waterAmount);
  updateUI();
  updateCatState();
  
  // Cooldown
  setWaterCooldown(true);
  waterBtn.disabled = true;
  let timeLeft = (config && config.cooldowns && config.cooldowns.water) || 5;
  waterBtn.textContent = `Water (${timeLeft})`;
  
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      setWaterCooldown(false);
      waterBtn.disabled = false;
      waterBtn.textContent = `물주기 (+${waterAmount})`;
    } else {
      waterBtn.textContent = `물주기 (${timeLeft})`;
    }
  }, 1000);
  saveGame();
}

export function handleInteraction(e) {
  if (state.gameOver) return;
  
  let petAmount = config && config.actions ? config.actions.petAmount : 3;
  let bgAmount = config && config.actions ? config.actions.backgroundClickAmount : 1;

  if (e.target === catImage) {
    state.fun = Math.min(100, state.fun + petAmount);
    showFloatingText(e.clientX, e.clientY, `+${petAmount} 재미`);
    popSound.play();
  } else {
    // Don't trigger on buttons
    if (e.target.closest('button')) return;
    
    state.fun = Math.min(100, state.fun + bgAmount);
    showFloatingText(e.clientX, e.clientY, `+${bgAmount} 재미`);
    popSound.play();
  }
  
  updateUI();
}
