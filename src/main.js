
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
};

// DOM Elements (initialized in init)
let hungerBar, hungerText, thirstBar, thirstText, funBar, funText;
let catImage, feedBtn, waterBtn, gameContainer, gameOverScreen, restartBtn;
let coinCount, shopBtn, shopModal, closeShopBtn, shopItemsContainer, inventoryContainer;

// Cooldowns
let feedCooldown = false;
let waterCooldown = false;

// Constants
const DECAY_RATE = 1; // per second
const DECAY_INTERVAL = 1000; // ms

// Game Loop
let gameInterval;

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

  if (!hungerBar || !feedBtn || !gameContainer) {
    console.error('Critical DOM elements missing!');
    return;
  }

  // Initialize Config Values
  if (config && config.defaults) {
    state.hunger = config.defaults.hunger;
    state.thirst = config.defaults.thirst;
    state.fun = config.defaults.fun;
  }
  
  if (config && config.actions) {
    feedAmount = config.actions.feedAmount;
    waterAmount = config.actions.waterAmount;
  }

  if (config && config.shopItems) {
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
          }
        }
      };
    });
  }

  // Event Listeners
  feedBtn.addEventListener('click', feed);
  waterBtn.addEventListener('click', water);
  gameContainer.addEventListener('click', handleInteraction);
  restartBtn.addEventListener('click', startGame);

  shopBtn.addEventListener('click', toggleShop);
  closeShopBtn.addEventListener('click', toggleShop);

  // Initial Render
  renderInventory();
  startGame();
}

function startGame() {
  if (config && config.defaults) {
    state.hunger = config.defaults.hunger;
    state.thirst = config.defaults.thirst;
    state.fun = config.defaults.fun;
  } else {
    state.hunger = 100;
    state.thirst = 100;
    state.fun = 100;
  }
  state.gameOver = false;
  
  updateUI();
  gameOverScreen.classList.add('hidden');
  
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, DECAY_INTERVAL);
  
  // Passive Coin Generation
  if (window.coinInterval) clearInterval(window.coinInterval);
  window.coinInterval = setInterval(generateCoins, 1000);
}

function gameLoop() {
  if (state.gameOver) return;

  // Decay stats
  state.hunger = Math.max(0, state.hunger - DECAY_RATE);
  state.thirst = Math.max(0, state.thirst - DECAY_RATE);
  state.fun = Math.max(0, state.fun - DECAY_RATE);

  checkGameOver();
  updateCatState();
  updateUI();
}

function checkGameOver() {
  if (state.hunger === 0 && state.thirst === 0 && state.fun === 0) {
    state.gameOver = true;
    clearInterval(gameInterval);
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
  if (value < 30) {
    element.style.backgroundColor = '#ff6b6b'; // Danger
  } else if (value < 60) {
    element.style.backgroundColor = '#feca57'; // Warning
  } else {
    element.style.backgroundColor = '#76c7c0'; // Normal
  }
}

function updateCatState() {
  let newState = 'sleep'; // Default/Low
  
  if (state.hunger >= 90 && state.thirst >= 90) {
    newState = 'happy';
  } else if (state.hunger >= 60 && state.thirst >= 60) {
    newState = 'neutral';
  } else if (state.hunger >= 30 && state.thirst >= 30) {
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
  let timeLeft = 10;
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
}

function water() {
  if (waterCooldown || state.gameOver) return;
  
  state.thirst = Math.min(100, state.thirst + waterAmount);
  updateUI();
  updateCatState();
  
  // Cooldown
  waterCooldown = true;
  waterBtn.disabled = true;
  let timeLeft = 5;
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
}

function handleInteraction(e) {
  if (state.gameOver) return;
  
  let petAmount = config && config.actions ? config.actions.petAmount : 3;
  let bgAmount = config && config.actions ? config.actions.backgroundClickAmount : 1;

  if (e.target === catImage) {
    state.fun = Math.min(100, state.fun + petAmount);
    showFloatingText(e.clientX, e.clientY, `+${petAmount} 재미`);
  } else {
    // Don't trigger on buttons
    if (e.target.closest('button')) return;
    
    state.fun = Math.min(100, state.fun + bgAmount);
    showFloatingText(e.clientX, e.clientY, `+${bgAmount} 재미`);
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
  // Generate 1 coin if all stats are above 50
  if (state.hunger > 50 && state.thirst > 50 && state.fun > 50) {
    state.coins++;
    updateCoinUI();
  }
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
    
    itemEl.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-desc">${item.desc}</span>
      </div>
      <button class="buy-btn" onclick="buyItem('${item.id}')" ${state.coins < item.cost || isPurchased ? 'disabled' : ''}>
        ${isPurchased ? '보유중' : item.cost + ' 💰'}
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
  if (state.inventory.length >= 3) {
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
  }
};

function renderInventory() {
  if (!inventoryContainer) return;
  inventoryContainer.innerHTML = '';
  
  // Render up to 3 slots
  for (let i = 0; i < 3; i++) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    
    if (state.inventory[i]) {
      const item = state.inventory[i];
      // Simple icon mapping based on id or type
      let icon = '❓';
      if (item.id === 'treat') icon = '🍬';
      else if (item.id === 'premium_food') icon = '🍖';
      else if (item.id === 'premium_water') icon = '💧';
      
      slot.textContent = icon;
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
}

// Start Initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

