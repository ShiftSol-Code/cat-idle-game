// Settings System

import { state } from '../core/gameState.js';
import { updateVolume, toggleBGM, toggleSFX, bgm } from '../systems/audio.js';
import { saveGame } from '../core/saveLoad.js';
import { clearMonologueTimeout } from '../systems/monologue.js';

let settingsModal;

export function initSettingsElements() {
  settingsModal = document.getElementById('settings-modal');
}

export function toggleSettings() {
  const isHidden = settingsModal.classList.contains('hidden');
  if (isHidden) {
    settingsModal.classList.remove('hidden');
  } else {
    settingsModal.classList.add('hidden');
  }
}

export function quitGame(gameInterval, coinInterval, saveInterval) {
  saveGame(); // Save before quitting
  state.gameOver = true;
  
  // Clear intervals
  clearInterval(gameInterval);
  clearInterval(coinInterval);
  clearInterval(saveInterval);
  clearMonologueTimeout();
  
  bgm.pause();
  
  settingsModal.classList.add('hidden');
  
  const gameOverScreen = document.getElementById('game-over');
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

// Export audio control functions
export { updateVolume, toggleBGM, toggleSFX };
