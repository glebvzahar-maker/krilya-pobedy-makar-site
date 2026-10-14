/* ammo.js — Боевые припасы: случайные бонусы за выполнение заданий */
(function(){
  'use strict';

  let _ammoData = null;
  let _inventory = [];

  /* Загрузка данных */
  function loadAmmo() {
    return fetch('assets/data/ammo.json')
      .then(r => r.json())
      .then(data => {
        _ammoData = data;
        _inventory = JSON.parse(localStorage.getItem('ammoInventory') || '[]');
        return data;
      })
      .catch(e => {
        console.error('[ammo] Failed to load:', e);
        return null;
      });
  }

  /* Случайный бонус */
  function rollBonus() {
    if (!_ammoData) return null;

    const roll = Math.random();
    const chances = _ammoData.rarityChances;
    let rarity;

    if (roll < chances.legendary) {
      rarity = 'legendary';
    } else if (roll < chances.legendary + chances.rare) {
      rarity = 'rare';
    } else {
      rarity = 'common';
    }

    const pool = _ammoData.bonuses.filter(b => b.rarity === rarity);
    if (pool.length === 0) return null;

    const bonus = pool[Math.floor(Math.random() * pool.length)];
    return { ...bonus, timestamp: Date.now() };
  }

  /* Получить бонус и сохранить в инвентарь */
  function claimBonus() {
    const bonus = rollBonus();
    if (!bonus) return null;

    _inventory.push(bonus);
    try {
      localStorage.setItem('ammoInventory', JSON.stringify(_inventory));
    } catch (e) {
      console.error('[ammo] Failed to save inventory:', e);
    }

    return bonus;
  }

  /* Показать бонус через toast */
  function showBonusToast(bonus) {
    if (!bonus || typeof window.showToast !== 'function') return;

    const rarityLabel = {
      common: 'Обычный',
      rare: 'Редкий',
      legendary: 'Легендарный'
    };
    const rarityColor = {
      common: '#5df0b6',
      rare: '#9aa7ff',
      legendary: '#ffd23c'
    };

    const label = rarityLabel[bonus.rarity] || 'Обычный';
    const color = rarityColor[bonus.rarity] || '#5df0b6';

    window.showToast(
      `${bonus.icon} ${bonus.name} [${label}] — ${bonus.text}`,
      'ammo'
    );
  }

  /* Проверить шанс бонуса (30%) и выдать */
  function maybeBonus() {
    if (Math.random() < 0.30) {
      const bonus = claimBonus();
      showBonusToast(bonus);
      return bonus;
    }
    return null;
  }

  /* Получить инвентарь */
  function getInventory() {
    return _inventory.slice();
  }

  /* Получить статистику */
  function getStats() {
    const stats = { common: 0, rare: 0, legendary: 0, total: _inventory.length };
    _inventory.forEach(b => {
      if (stats[b.rarity] !== undefined) stats[b.rarity]++;
    });
    return stats;
  }

  /* Рендер инвентаря в DOM */
  function renderInventory(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = getStats();
    let html = `
      <div class="ammo-stats">
        <span class="ammo-stat"><span class="ammo-stat-icon">📦</span> ${stats.total}</span>
        <span class="ammo-stat ammo-common"><span class="ammo-stat-dot" style="background:#5df0b6"></span> ${stats.common}</span>
        <span class="ammo-stat ammo-rare"><span class="ammo-stat-dot" style="background:#9aa7ff"></span> ${stats.rare}</span>
        <span class="ammo-stat ammo-legendary"><span class="ammo-stat-dot" style="background:#ffd23c"></span> ${stats.legendary}</span>
      </div>
    `;

    if (_inventory.length === 0) {
      html += '<div class="ammo-empty">Пока нет боеприпасов. Выполняй задания!</div>';
    } else {
      html += '<div class="ammo-list">';
      _inventory.slice().reverse().forEach(b => {
        html += `
          <div class="ammo-item ammo-${b.rarity}">
            <span class="ammo-icon">${b.icon}</span>
            <div class="ammo-info">
              <div class="ammo-name">${b.name}</div>
              <div class="ammo-text">${b.text}</div>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /* Экспорт */
  window.AmmoSystem = {
    load: loadAmmo,
    roll: rollBonus,
    claim: claimBonus,
    maybe: maybeBonus,
    getInventory: getInventory,
    getStats: getStats,
    renderInventory: renderInventory
  };

  /* CSS */
  const style = document.createElement('style');
  style.textContent = `
    .ammo-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #8fa0b7;
    }
    .ammo-stat {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ammo-stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .ammo-empty {
      color: #5a6a7a;
      font-style: italic;
      font-size: 12px;
      padding: 16px;
      text-align: center;
    }
    .ammo-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 300px;
      overflow-y: auto;
    }
    .ammo-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #2a3849;
      background: rgba(42, 56, 73, 0.3);
    }
    .ammo-common { border-left: 3px solid #5df0b6; }
    .ammo-rare { border-left: 3px solid #9aa7ff; }
    .ammo-legendary { border-left: 3px solid #ffd23c; }
    .ammo-icon { font-size: 20px; flex-shrink: 0; }
    .ammo-info { flex: 1; min-width: 0; }
    .ammo-name {
      font-size: 12px;
      font-weight: 600;
      color: #e9eef5;
      margin-bottom: 2px;
    }
    .ammo-text {
      font-size: 11px;
      color: #8fa0b7;
    }
    /* Toast для боеприпасов */
    .toast-ammo {
      border-left: 3px solid #9aa7ff;
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadAmmo());
  } else {
    loadAmmo();
  }
})();
