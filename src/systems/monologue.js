// Cat Monologue System

import { state } from '../core/gameState.js';
import config from '../config.json';

let monologueTimeout;

export function startMonologueLoop() {
  if (state.gameOver) return;

  const minInterval = (config && config.monologues && config.monologues.interval.min) || 3000;
  const maxInterval = (config && config.monologues && config.monologues.interval.max) || 6000;
  const delay = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

  monologueTimeout = setTimeout(() => {
    showMonologue();
    startMonologueLoop();
  }, delay);
}

export function showMonologue() {
  if (state.gameOver) return;

  const minStat = Math.min(state.hunger, state.thirst, state.fun);

  if (!config || !config.monologues || !config.monologues.ranges) return;

  const ranges = config.monologues.ranges;
  let messages = [];

  for (const range of ranges) {
    if (minStat >= range.min && minStat <= range.max) {
      messages = range.messages;
      break;
    }
  }

  if (messages.length > 0) {
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    showMonologuePopup(randomMsg);
  }
}

function showMonologuePopup(text) {
  const el = document.createElement('div');
  el.className = 'monologue-popup';
  el.textContent = text;
  
  document.body.appendChild(el);
  
  const duration = (config && config.monologues && config.monologues.duration) || 1000;

  setTimeout(() => {
    el.remove();
  }, duration);
}

export function clearMonologueTimeout() {
  if (monologueTimeout) clearTimeout(monologueTimeout);
}

export function getMonologueTimeout() {
  return monologueTimeout;
}
