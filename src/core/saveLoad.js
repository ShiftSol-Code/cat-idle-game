// Save/Load System

import { state, upgrades, setFeedAmount, setWaterAmount } from './gameState.js';

export function saveGame() {
  const saveData = {
    state: state,
    upgrades: Array.from(upgrades),
    timestamp: Date.now()
  };
  localStorage.setItem('catGameSave', JSON.stringify(saveData));
  // console.log('Game saved');
}

export function loadGame(shopItems) {
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
             setFeedAmount(item.value);
           } else if (item.id === 'premium_water') {
             setWaterAmount(item.value);
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
