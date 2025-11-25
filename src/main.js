// Main Entry Point - Cat Idle Game
// This file orchestrates all game modules

import config from './config.json';

// Core modules
import { state, upgrades, setFeedAmount, setWaterAmount, setDecayRate, setDecayInterval, setInventorySize, feedAmount, waterAmount } from './core/gameState.js';
import { saveGame, loadGame } from './core/saveLoad.js';
import { gameLoop, checkGameOver, updateCatState, startGame, gameInterval, coinInterval, saveInterval, setGameInterval, setCoinInterval, setSaveInterval } from './core/gameLoop.js';

// Systems
import { playBGM } from './systems/audio.js';
import { generateCoins } from './systems/coinGenerator.js';
import { startMonologueLoop, clearMonologueTimeout } from './systems/monologue.js';
import { renderFurniture } from './systems/furniture.js';

// UI
import { initUIElements, updateUI, updateCoinUI, showFloatingText } from './ui/uiManager.js';
import { initShopElements, toggleShop, setShopItems, getShopItems, renderShop } from './ui/shop.js';
import { initInventoryElements, renderInventory } from './ui/inventory.js';
import { initSettingsElements, toggleSettings, updateVolume, toggleBGM, toggleSFX, quitGame } from './ui/settings.js';

// Interactions
import { initInteractionElements, feed, water, handleInteraction, getFeedBtn, getWaterBtn, getCatImage } from './interactions/playerActions.js';

console.log('Config loaded:', config);

// DOM Elements (initialized in init)
let gameContainer, gameOverScreen, restartBtn;

// Shop items (configured from config.json)
let shopItems = [];

function init() {
  console.log('Initializing game...');
  
  // Initialize all DOM elements
  initUIElements();
  initShopElements();
  initInventoryElements();
  initSettingsElements();
  initInteractionElements();
  
  // Main game elements
  gameContainer = document.getElementById('game-container');
  gameOverScreen = document.getElementById('game-over');
  restartBtn = document.getElementById('restart-btn');

  const feedBtn = getFeedBtn();
  const waterBtn = getWaterBtn();
  const catImage = getCatImage();

  if (!gameContainer || !feedBtn) {
    console.error('Critical DOM elements missing!');
    return;
  }

  // Initialize Config Values
  if (config) {
    if (config.defaults) {
        state.hunger = config.defaults.hunger;
        state.thirst = config.defaults.thirst;
        state.fun = config.defaults.fun;
    }
    
    if (config.actions) {
        setFeedAmount(config.actions.feedAmount);
        setWaterAmount(config.actions.waterAmount);
    }

    if (config.settings) {
        setDecayRate(config.settings.decayRate || 1);
        setDecayInterval(config.settings.decayInterval || 1000);
        setInventorySize(config.settings.inventorySize || 3);
    }

    if (config.shopItems) {
        shopItems = config.shopItems.map(item => {
        return {
            ...item,
            effect: () => {
            if (item.type === 'consumable') {
                state.fun = Math.min(100, state.fun + item.value);
                updateUI();
            } else if (item.type === 'upgrade') {
                if (item.id === 'premium_food') {
                setFeedAmount(item.value);
                if (feedBtn && !feedBtn.disabled) feedBtn.textContent = `밥주기 (+${item.value})`;
                } else if (item.id === 'premium_water') {
                setWaterAmount(item.value);
                if (waterBtn && !waterBtn.disabled) waterBtn.textContent = `물주기 (+${item.value})`;
                }
            } else if (item.type === 'furniture') {
                if (!state.placedItems.includes(item.id)) {
                    state.placedItems.push(item.id);
                    renderFurniture(gameContainer);
                    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `${item.name} 배치 완료!`);
                } else {
                    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `이미 배치되어 있습니다!`);
                }
            }
            }
        };
        });
        setShopItems(shopItems);
    }
  }

  // Event Listeners
  feedBtn.addEventListener('click', () => feed(() => updateCatState(catImage)));
  waterBtn.addEventListener('click', () => water(() => updateCatState(catImage)));
  gameContainer.addEventListener('click', handleInteraction);
  restartBtn.addEventListener('click', () => handleStartGame(false));

  const shopBtn = document.getElementById('shop-btn');
  const closeShopBtn = document.getElementById('close-shop-btn');
  shopBtn.addEventListener('click', toggleShop);
  closeShopBtn.addEventListener('click', toggleShop);

  const settingsBtn = document.getElementById('settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const bgmToggle = document.getElementById('bgm-toggle');
  const sfxToggle = document.getElementById('sfx-toggle');
  const quitBtn = document.getElementById('quit-btn');
  
  settingsBtn.addEventListener('click', toggleSettings);
  closeSettingsBtn.addEventListener('click', toggleSettings);
  volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));
  bgmToggle.addEventListener('change', (e) => toggleBGM(e.target.checked));
  sfxToggle.addEventListener('change', (e) => toggleSFX(e.target.checked));
  quitBtn.addEventListener('click', () => quitGame(gameInterval, coinInterval, saveInterval));

  // Try to play BGM
  playBGM();
  document.body.addEventListener('click', playBGM, { once: true });

  // Expose renderShop to window for inventory module
  window.renderShop = renderShop;

  // Initial Render
  if (loadGame(getShopItems())) {
    console.log('Game loaded from save');
    renderInventory();
    updateUI();
    updateCoinUI();
    
    // Re-update button text if upgrades loaded
    if (upgrades.has('premium_food')) {
        feedBtn.textContent = `밥주기 (+${feedAmount})`;
    }
    if (upgrades.has('premium_water')) {
        waterBtn.textContent = `물주기 (+${waterAmount})`;
    }
    
    renderFurniture(gameContainer);
    handleStartGame(true); // true = isLoaded
  } else {
    renderInventory();
    renderFurniture(gameContainer);
    handleStartGame(false);
  }

  // Auto-save every 5 seconds
  const newSaveInterval = setInterval(saveGame, 5000);
  setSaveInterval(newSaveInterval);
}

function handleStartGame(isLoaded) {
  const DECAY_INTERVAL = 1000; // Get from gameState if needed
  
  const result = startGame(
    isLoaded,
    config,
    gameOverScreen,
    updateUI,
    updateCoinUI,
    renderInventory,
    () => renderFurniture(gameContainer),
    startMonologueLoop,
    (updateCoinUI, showFloatingText) => generateCoins(updateCoinUI, showFloatingText),
    DECAY_INTERVAL,
    saveGame,
    getFeedBtn(),
    getWaterBtn()
  );
  
  // Start game loops
  const newGameInterval = setInterval(() => {
    gameLoop(
      updateUI,
      () => updateCatState(getCatImage()),
      () => checkGameOver(
        gameOverScreen,
        clearMonologueTimeout,
        () => {
          clearInterval(gameInterval);
          clearInterval(coinInterval);
          clearInterval(saveInterval);
        }
      )
    );
  }, DECAY_INTERVAL);
  
  const newCoinInterval = setInterval(() => {
    generateCoins(updateCoinUI, showFloatingText);
  }, 1000);
  
  setGameInterval(newGameInterval);
  setCoinInterval(newCoinInterval);
  
  // Start monologue
  clearMonologueTimeout();
  startMonologueLoop();
}

// Start Initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
