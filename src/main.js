
import config from './config.json';

console.log('Config loaded:', config);

// Game State
const state = {
  hunger: 100,
  thirst: 100,
  fun: 100,
  coins: 0,
  inventory: [],
  gameOver: false,
  placedItems: [], // Track placed furniture
};

// DOM Elements (initialized in init)
let hungerBar, hungerText, thirstBar, thirstText, funBar, funText;
let catImage, feedBtn, waterBtn, gameContainer, gameOverScreen, restartBtn;
let coinCount, shopBtn, shopModal, closeShopBtn, shopItemsContainer, inventoryContainer;
let settingsBtn, settingsModal, closeSettingsBtn, volumeSlider, bgmToggle, sfxToggle, quitBtn;

// Audio
class SoundPool {
  constructor(src, size = 5) {
    this.pool = [];
    this.index = 0;
    this.muted = false;
    for (let i = 0; i < size; i++) {
      this.pool.push(new Audio(src));
    }
  }

  play() {
    if (this.muted) return;
    const sound = this.pool[this.index];
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Audio play failed:', e));
    this.index = (this.index + 1) % this.pool.length;
  }

  setVolume(volume) {
    this.pool.forEach(sound => {
      sound.volume = volume;
    });
  }

  setMuted(muted) {
    this.muted = muted;
  }
}

const popSound = new SoundPool('/Pop1.mp3', 5);
const coinSound = new SoundPool('/CashRegister.mp3', 5);
const bgmTracks = ['/Music/MyMusic1.mp3', '/Music/MyMusic2.mp3', '/Music/babyfox1.mp3', '/Music/babyfox2.mp3'];
const randomTrack = bgmTracks[Math.floor(Math.random() * bgmTracks.length)];
const bgm = new Audio(randomTrack);
bgm.loop = true;
bgm.volume = 0.5;

function playBGM() {
  bgm.play().then(() => {
    // Autoplay started successfully
    document.body.removeEventListener('click', playBGM);
  }).catch(e => {
    console.log('BGM autoplay blocked, waiting for interaction');
    // Add listener if not already added (though playBGM is the listener itself, so it's fine)
  });
}

// Cooldowns
let feedCooldown = false;
let waterCooldown = false;

// Constants (Defaults if config fails)
let DECAY_RATE = 1;
let DECAY_INTERVAL = 1000;
let INVENTORY_SIZE = 3;

// Game Loop
let gameInterval;
let coinInterval;
let saveInterval;

// Coin Logic State
let coinTick = 0;
let bonusGiven = false;

// Config Values
let feedAmount = 20;
let waterAmount = 25;
let shopItems = [];

function init() {
  console.log('Initializing game...');
  
  // Initialize DOM Elements
  hungerBar = document.getElementById('hunger-bar');
  hungerText = document.getElementById('hunger-text');
  thirstBar = document.getElementById('thirst-bar');
  thirstText = document.getElementById('thirst-text');
  funBar = document.getElementById('fun-bar');
  funText = document.getElementById('fun-text');

  catImage = document.getElementById('cat-image');
  feedBtn = document.getElementById('feed-btn');
  waterBtn = document.getElementById('water-btn');
  gameContainer = document.getElementById('game-container');
  gameOverScreen = document.getElementById('game-over');
  restartBtn = document.getElementById('restart-btn');

  coinCount = document.getElementById('coin-count');
  shopBtn = document.getElementById('shop-btn');
  shopModal = document.getElementById('shop-modal');
  closeShopBtn = document.getElementById('close-shop-btn');
  shopItemsContainer = document.getElementById('shop-items');
  inventoryContainer = document.getElementById('inventory-container');

  settingsBtn = document.getElementById('settings-btn');
  settingsModal = document.getElementById('settings-modal');
  closeSettingsBtn = document.getElementById('close-settings-btn');
  volumeSlider = document.getElementById('volume-slider');
  bgmToggle = document.getElementById('bgm-toggle');
  sfxToggle = document.getElementById('sfx-toggle');
  quitBtn = document.getElementById('quit-btn');

  if (!hungerBar || !feedBtn || !gameContainer) {
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
        feedAmount = config.actions.feedAmount;
        waterAmount = config.actions.waterAmount;
    }

    if (config.settings) {
        DECAY_RATE = config.settings.decayRate || 1;
        DECAY_INTERVAL = config.settings.decayInterval || 1000;
        INVENTORY_SIZE = config.settings.inventorySize || 3;
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
                feedAmount = item.value;
                if (feedBtn && !feedBtn.disabled) feedBtn.textContent = `밥주기 (+${feedAmount})`;
                } else if (item.id === 'premium_water') {
                waterAmount = item.value;
                if (waterBtn && !waterBtn.disabled) waterBtn.textContent = `물주기 (+${waterAmount})`;
                }
            } else if (item.type === 'furniture') {
                if (!state.placedItems.includes(item.id)) {
                    state.placedItems.push(item.id);
                    renderFurniture();
                    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `${item.name} 배치 완료!`);
                } else {
                    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `이미 배치되어 있습니다!`);
                }
            }
            }
        };
        });
    }
  }

  // Event Listeners
  feedBtn.addEventListener('click', feed);
  waterBtn.addEventListener('click', water);
  gameContainer.addEventListener('click', handleInteraction);
  restartBtn.addEventListener('click', () => startGame(false));

  shopBtn.addEventListener('click', toggleShop);
  closeShopBtn.addEventListener('click', toggleShop);

  settingsBtn.addEventListener('click', toggleSettings);
  closeSettingsBtn.addEventListener('click', toggleSettings);
  volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));
  bgmToggle.addEventListener('change', (e) => toggleBGM(e.target.checked));
  sfxToggle.addEventListener('change', (e) => toggleSFX(e.target.checked));
  quitBtn.addEventListener('click', quitGame);

  // Try to play BGM
  playBGM();
  document.body.addEventListener('click', playBGM, { once: true });

  // Initial Render
  if (loadGame()) {
    console.log('Game loaded from save');
    renderInventory();
    updateUI();
    updateCoinUI();
    
    // Re-update button text if upgrades loaded
    if (hasUpgrade('premium_food')) {
        feedBtn.textContent = `밥주기 (+${feedAmount})`;
    }
    if (hasUpgrade('premium_water')) {
        waterBtn.textContent = `물주기 (+${waterAmount})`;
    }
    
    renderFurniture(); // Render loaded furniture
    startGame(true); // true = isLoaded
  } else {
    renderInventory();
    renderFurniture(); // Ensure empty furniture is rendered (cleared)
    startGame(false);
  }

  // Auto-save every 5 seconds
  if (saveInterval) clearInterval(saveInterval);
  saveInterval = setInterval(saveGame, 5000);
}

function startGame(isLoaded = false) {
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
    // state.coins = 0; // Removed hardcoded reset, handled above
    state.inventory = [];
    state.placedItems = [];
    upgrades.clear();
    renderFurniture(); // Clear furniture visuals
    // Reset upgrade values
    if (config && config.actions) {
        feedAmount = config.actions.feedAmount;
        waterAmount = config.actions.waterAmount;
    }
    // Reset button text
    if (feedBtn) feedBtn.textContent = `밥주기 (+${feedAmount})`;
    if (waterBtn) waterBtn.textContent = `물주기 (+${waterAmount})`;
    
    renderInventory();
    saveGame(); // Immediately save the reset state
  }
  
  state.gameOver = false;
  coinTick = 0;
  bonusGiven = false;
  
  updateUI();
  updateCoinUI();
  gameOverScreen.classList.add('hidden');
  
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, DECAY_INTERVAL);
  
  // Coin Generation Loop (Fixed 1s tick)
  if (coinInterval) clearInterval(coinInterval);
  coinInterval = setInterval(generateCoins, 1000);
}

function gameLoop() {
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

function checkGameOver() {
  if (state.hunger === 0 && state.thirst === 0 && state.fun === 0) {
    state.gameOver = true;
    clearInterval(gameInterval);
    clearInterval(coinInterval);
    if (saveInterval) clearInterval(saveInterval);
    
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
      restartBtn.onclick = () => startGame(false);
    }
    
    gameOverScreen.classList.remove('hidden');
  }
}

function updateUI() {
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

function updateCatState() {
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

// Interactions
function feed() {
  if (feedCooldown || state.gameOver) return;
  
  state.hunger = Math.min(100, state.hunger + feedAmount);
  updateUI();
  updateCatState();
  
  // Cooldown
  feedCooldown = true;
  feedBtn.disabled = true;
  let timeLeft = (config && config.cooldowns && config.cooldowns.feed) || 10;
  feedBtn.textContent = `Feed (${timeLeft})`;
  
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      feedCooldown = false;
      feedBtn.disabled = false;
      feedBtn.textContent = `밥주기 (+${feedAmount})`;
    } else {
      feedBtn.textContent = `밥주기 (${timeLeft})`;
    }
  }, 1000);
  saveGame();
}

function water() {
  if (waterCooldown || state.gameOver) return;
  
  state.thirst = Math.min(100, state.thirst + waterAmount);
  updateUI();
  updateCatState();
  
  // Cooldown
  waterCooldown = true;
  waterBtn.disabled = true;
  let timeLeft = (config && config.cooldowns && config.cooldowns.water) || 5;
  waterBtn.textContent = `Water (${timeLeft})`;
  
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      waterCooldown = false;
      waterBtn.disabled = false;
      waterBtn.textContent = `물주기 (+${waterAmount})`;
    } else {
      waterBtn.textContent = `물주기 (${timeLeft})`;
    }
  }, 1000);
  saveGame();
}

function handleInteraction(e) {
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

function showFloatingText(x, y, text) {
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

// Shop Logic
// Map config items to include logic
// shopItems is now initialized in init()

// Store purchased upgrades
const upgrades = new Set();

function hasUpgrade(id) {
  return upgrades.has(id);
}

function generateCoins() {
  if (state.gameOver) return;

  const minStat = Math.min(state.hunger, state.thirst, state.fun);
  
  // Bonus Logic: All 100%
  if (state.hunger === 100 && state.thirst === 100 && state.fun === 100) {
    if (!bonusGiven) {
      const bonus = (config && config.bonus && config.bonus.allMax) || 10;
      state.coins += bonus;
      coinSound.play();
      showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `보너스 +${bonus} 코인!`);
      bonusGiven = true;
    }
  } else {
    bonusGiven = false;
  }

  // Tiered Generation Logic
  coinTick++;
  
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

function updateCoinUI() {
  if (coinCount) coinCount.textContent = state.coins;
}

function toggleShop() {
  const isHidden = shopModal.classList.contains('hidden');
  if (isHidden) {
    renderShop();
    shopModal.classList.remove('hidden');
  } else {
    shopModal.classList.add('hidden');
  }
}

function renderShop() {
  shopItemsContainer.innerHTML = '';
  shopItems.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'shop-item';
    
    const isPurchased = (item.type === 'upgrade' && hasUpgrade(item.id));
    const isPlaced = (item.type === 'furniture' && state.placedItems.includes(item.id));
    
    itemEl.innerHTML = `
      <div class="shop-item-content">
        ${item.image ? `<img src="${item.image}" class="shop-item-image" alt="${item.name}">` : ''}
        <div class="item-info">
          <span class="item-name">${item.name}</span>
          <span class="item-desc">${item.desc}</span>
        </div>
      </div>
      <button class="buy-btn" onclick="buyItem('${item.id}')" ${state.coins < item.cost || isPurchased || isPlaced ? 'disabled' : ''}>
        ${isPurchased || isPlaced ? '보유중' : item.cost + ' 💰'}
      </button>
    `;
    shopItemsContainer.appendChild(itemEl);
  });
}

// Expose buyItem to window for onclick
window.buyItem = function(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  
  // Check inventory space
  if (state.inventory.length >= INVENTORY_SIZE) {
    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, '인벤토리 가득참!');
    return;
  }

  if (state.coins >= item.cost) {
    state.coins -= item.cost;
    updateCoinUI();
    
    // Add to inventory instead of immediate effect
    state.inventory.push(item);
    renderInventory();
    
    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `${item.name} 구매!`);
    saveGame();
  }
};

function renderInventory() {
  if (!inventoryContainer) return;
  inventoryContainer.innerHTML = '';
  
  // Render up to INVENTORY_SIZE slots
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    
    if (state.inventory[i]) {
      const item = state.inventory[i];
      if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.className = 'inventory-item-image';
        slot.appendChild(img);
      } else {
        // Simple icon mapping based on id or type
        let icon = '❓';
        if (item.id === 'treat') icon = '🍬';
        else if (item.id === 'premium_food') icon = '🍖';
        else if (item.id === 'premium_water') icon = '💧';
        slot.textContent = icon;
      }
      
      slot.title = item.name;
      slot.onclick = () => useItem(i);
    } else {
      slot.className += ' empty';
    }
    
    inventoryContainer.appendChild(slot);
  }
}

function useItem(index) {
  if (state.gameOver) return;
  
  const item = state.inventory[index];
  if (!item) return;
  
  // Apply effect
  if (item.type === 'upgrade') {
    upgrades.add(item.id);
    item.effect(); // Sets the feed/water amount
    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `업그레이드 완료!`);
  } else {
    item.effect(); // Consumable effect
    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `${item.name} 사용!`);
  }
  
  // Remove from inventory
  state.inventory.splice(index, 1);
  renderInventory();
  renderShop(); // Update shop UI (in case upgrade status changed)
  saveGame();
}

function renderFurniture() {
    // Remove existing furniture elements
    const existing = document.querySelectorAll('.furniture-item');
    existing.forEach(el => el.remove());

    state.placedItems.forEach(id => {
        const el = document.createElement('img');
        el.src = `/o_${id.replace('cat_tower', 'cattower').replace('auto_feeder', 'Autofeeder').replace('auto_water', 'autowaterdispenser')}.png`; // Mapping to actual filenames
        // Filename mapping based on user request:
        // cat_tower -> o_cattower.png
        // auto_feeder -> o_Autofeeder.png
        // auto_water -> o_autowaterdispenser.png
        
        // Let's make the mapping cleaner
        let filename = '';
        if (id === 'cat_tower') filename = 'o_cattower.png';
        else if (id === 'auto_feeder') filename = 'o_Autofeeder.png';
        else if (id === 'auto_water') filename = 'o_autowaterdispenser.png';

        if (filename) {
            el.src = `/${filename}`;
            el.className = `furniture-item ${id.replace('_', '-')}`;
            gameContainer.appendChild(el);
        }
    });
}

function toggleSettings() {
  const isHidden = settingsModal.classList.contains('hidden');
  if (isHidden) {
    settingsModal.classList.remove('hidden');
  } else {
    settingsModal.classList.add('hidden');
  }
}

function updateVolume(value) {
  bgm.volume = value;
  popSound.setVolume(value);
  coinSound.setVolume(value);
}

function toggleBGM(isChecked) {
  if (isChecked) {
    bgm.play().catch(e => console.warn('BGM play failed:', e));
  } else {
    bgm.pause();
  }
}

function toggleSFX(isChecked) {
  popSound.setMuted(!isChecked);
  coinSound.setMuted(!isChecked);
}

function quitGame() {
  saveGame(); // Save before quitting
  state.gameOver = true;
  clearInterval(gameInterval);
  clearInterval(coinInterval);
  if (saveInterval) clearInterval(saveInterval);
  bgm.pause();
  
  settingsModal.classList.add('hidden');
  const finalScoreEl = document.getElementById('final-score');
  const gameOverTitle = document.querySelector('#game-over h1');
  const restartBtn = document.getElementById('restart-btn');
  
  if (finalScoreEl) {
    finalScoreEl.textContent = `현재까지 적립된 코인은 ${state.coins}개 입니다.`;
  }
  
  if (gameOverTitle) {
    gameOverTitle.textContent = "게임이 저장되었습니다";
  }
  
  if (restartBtn) {
    restartBtn.textContent = "새로운 게임 시작하기";
    restartBtn.onclick = () => location.reload();
  }
  
  gameOverScreen.classList.remove('hidden');
}

// Save/Load System
function saveGame() {
  const saveData = {
    state: state,
    upgrades: Array.from(upgrades),
    timestamp: Date.now()
  };
  localStorage.setItem('catGameSave', JSON.stringify(saveData));
  // console.log('Game saved');
}

function loadGame() {
  const savedJSON = localStorage.getItem('catGameSave');
  if (!savedJSON) return false;

  try {
    const saveData = JSON.parse(savedJSON);
    
    // Restore state
    if (saveData.state) {
      state.hunger = saveData.state.hunger;
      state.thirst = saveData.state.thirst;
      state.fun = saveData.state.fun;
      state.coins = saveData.state.coins;
      state.inventory = saveData.state.inventory || [];
      state.placedItems = saveData.state.placedItems || [];
      
      // Restore inventory item effects
      state.inventory = state.inventory.map(savedItem => {
        const originalItem = shopItems.find(i => i.id === savedItem.id);
        if (originalItem) {
          return { ...savedItem, effect: originalItem.effect };
        }
        return savedItem;
      });
    }

    // Restore upgrades
    if (saveData.upgrades) {
      upgrades.clear();
      saveData.upgrades.forEach(id => {
        upgrades.add(id);
        // Re-apply effects
        const item = shopItems.find(i => i.id === id);
        if (item && item.type === 'upgrade') {
           if (item.id === 'premium_food') {
             feedAmount = item.value;
           } else if (item.id === 'premium_water') {
             waterAmount = item.value;
           }
        }
      });
    }
    
    // Offline Progress (Optional - just decay for now or skip)
    // For a simple version, let's just load the state as is.
    
    return true;
  } catch (e) {
    console.error('Failed to load save:', e);
    return false;
  }
}

// Start Initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

