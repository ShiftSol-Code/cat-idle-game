// UI Manager

import { state } from '../core/gameState.js';
import config from '../config.json';

// DOM Elements
let hungerBar, hungerText, thirstBar, thirstText, funBar, funText;
let coinCount;

export function initUIElements() {
  hungerBar = document.getElementById('hunger-bar');
  hungerText = document.getElementById('hunger-text');
  thirstBar = document.getElementById('thirst-bar');
  thirstText = document.getElementById('thirst-text');
  funBar = document.getElementById('fun-bar');
  funText = document.getElementById('fun-text');
  coinCount = document.getElementById('coin-count');
}

export function updateUI() {
  if (!hungerBar) return; // Safety check

  // Update bars
  hungerBar.style.width = `${state.hunger}%`;
  hungerText.textContent = `${state.hunger}%`;
  
  thirstBar.style.width = `${state.thirst}%`;
  thirstText.textContent = `${state.thirst}%`;
  
  funBar.style.width = `${state.fun}%`;
  funText.textContent = `${state.fun}%`;

  // Color changes for low stats
  updateBarColor(hungerBar, state.hunger);
  updateBarColor(thirstBar, state.thirst);
  updateBarColor(funBar, state.fun);
}

function updateBarColor(element, value) {
  const danger = (config && config.thresholds && config.thresholds.barDanger) || 30;
  const warning = (config && config.thresholds && config.thresholds.barWarning) || 60;

  if (value < danger) {
    element.style.backgroundColor = '#ff6b6b'; // Danger
  } else if (value < warning) {
    element.style.backgroundColor = '#feca57'; // Warning
  } else {
    element.style.backgroundColor = '#76c7c0'; // Normal
  }
}

export function updateCoinUI() {
  if (coinCount) coinCount.textContent = state.coins;
}

export function showFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.position = 'absolute';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = '#ff9a9e';
  el.style.fontWeight = 'bold';
  el.style.pointerEvents = 'none';
  el.style.animation = 'floatUp 1s ease-out forwards';
  el.style.zIndex = '100';
  
  document.body.appendChild(el);
  
  setTimeout(() => {
    el.remove();
  }, 1000);
}

// Add float animation style dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-30px); opacity: 0; }
}
`;
document.head.appendChild(styleSheet);
