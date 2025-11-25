// Furniture System

import { state } from '../core/gameState.js';

export function renderFurniture(gameContainer) {
    // Remove existing furniture elements
    const existing = document.querySelectorAll('.furniture-item');
    existing.forEach(el => el.remove());

    state.placedItems.forEach(id => {
        const el = document.createElement('img');
        
        // Filename mapping
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
