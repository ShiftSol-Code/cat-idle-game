// Game State
const state = {
  hunger: 100,
  thirst: 100,
  fun: 100,
  gameOver: false,
};

// DOM Elements
const hungerBar = document.getElementById('hunger-bar');
const hungerText = document.getElementById('hunger-text');
const thirstBar = document.getElementById('thirst-bar');
const thirstText = document.getElementById('thirst-text');
const funBar = document.getElementById('fun-bar');
const funText = document.getElementById('fun-text');

const catImage = document.getElementById('cat-image');
const feedBtn = document.getElementById('feed-btn');
const waterBtn = document.getElementById('water-btn');
const gameContainer = document.getElementById('game-container');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

// Cooldowns
let feedCooldown = false;
let waterCooldown = false;

// Constants
const DECAY_RATE = 1; // per second
const DECAY_INTERVAL = 1000; // ms

// Game Loop
let gameInterval;

function startGame() {
  state.hunger = 100;
  state.thirst = 100;
  state.fun = 100;
  state.gameOver = false;
  
  updateUI();
  gameOverScreen.classList.add('hidden');
  
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, DECAY_INTERVAL);
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
  // Logic:
  // 1. Happy: Hunger & Thirst >= 90
  // 2. Neutral: Hunger & Thirst >= 60
  // 3. Sleep: Hunger & Thirst >= 30 (or default if lower, but prompt implies thresholds)
  // Let's use the highest matching state.
  
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

  // Only update if src changes to avoid flickering (though browser handles cache)
  const newSrc = `/cat_${newState}.png`;
  if (!catImage.src.endsWith(newSrc)) {
    catImage.src = newSrc;
  }
}

// Interactions
function feed() {
  if (feedCooldown || state.gameOver) return;
  
  state.hunger = Math.min(100, state.hunger + 20);
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
      feedBtn.textContent = 'Feed (+20)';
    } else {
      feedBtn.textContent = `Feed (${timeLeft})`;
    }
  }, 1000);
}

function water() {
  if (waterCooldown || state.gameOver) return;
  
  state.thirst = Math.min(100, state.thirst + 25);
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
      waterBtn.textContent = 'Water (+25)';
    } else {
      waterBtn.textContent = `Water (${timeLeft})`;
    }
  }, 1000);
}

function handleInteraction(e) {
  if (state.gameOver) return;
  
  // Check if clicked on cat
  // Note: The event listener is on gameContainer.
  // If e.target is the cat image, it's a pet.
  // Otherwise it's a background click.
  
  if (e.target === catImage) {
    state.fun = Math.min(100, state.fun + 3);
    showFloatingText(e.clientX, e.clientY, '+3 Fun');
  } else {
    // Don't trigger on buttons
    if (e.target.closest('button')) return;
    
    state.fun = Math.min(100, state.fun + 1);
    showFloatingText(e.clientX, e.clientY, '+1 Fun');
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

// Event Listeners
feedBtn.addEventListener('click', feed);
waterBtn.addEventListener('click', water);
gameContainer.addEventListener('click', handleInteraction); // Covers both cat and background
restartBtn.addEventListener('click', startGame);

// Start
startGame();
