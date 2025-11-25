// Inventory System

import { state, upgrades, INVENTORY_SIZE } from '../core/gameState.js';
import { showFloatingText } from './uiManager.js';
import { saveGame } from '../core/saveLoad.js';

let inventoryContainer;

export function initInventoryElements() {
  inventoryContainer = document.getElementById('inventory-container');
}

export function renderInventory() {
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
  
  // Update shop UI (in case upgrade status changed)
  if (window.renderShop) window.renderShop();
  
  saveGame();
}

// Expose renderInventory to window for shop module
window.renderInventory = renderInventory;
