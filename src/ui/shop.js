// Shop System

import { state, hasUpgrade, INVENTORY_SIZE } from '../core/gameState.js';
import { updateCoinUI, showFloatingText } from './uiManager.js';
import { saveGame } from '../core/saveLoad.js';

let shopModal, shopItemsContainer;
export let shopItems = [];

export function initShopElements() {
  shopModal = document.getElementById('shop-modal');
  shopItemsContainer = document.getElementById('shop-items');
}

export function setShopItems(items) {
  shopItems = items;
}

export function getShopItems() {
  return shopItems;
}

export function toggleShop() {
  const isHidden = shopModal.classList.contains('hidden');
  if (isHidden) {
    renderShop();
    shopModal.classList.remove('hidden');
  } else {
    shopModal.classList.add('hidden');
  }
}

export function renderShop() {
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
    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, '인벤토리 가득찬 !');
    return;
  }

  if (state.coins >= item.cost) {
    state.coins -= item.cost;
    updateCoinUI();
    
    // Add to inventory instead of immediate effect
    state.inventory.push(item);
    
    // Render inventory (we'll need to import this)
    if (window.renderInventory) window.renderInventory();
    
    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, `${item.name} 구매!`);
    saveGame();
  }
};
