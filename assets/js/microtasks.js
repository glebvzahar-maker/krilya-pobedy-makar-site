/* microtasks.js — Микро-задания для поддержания мотивации */
(function(){
  'use strict';

  let tasksData = null;
  let currentFlight = null;

  function loadTasks() {
    return fetch('assets/data/microtasks.json')
      .then(r => r.json())
      .then(data => {
        tasksData = data;
        return data;
      })
      .catch(e => {
        console.error('[microtasks] Failed to load:', e);
        return null;
      });
  }

  function getCurrentFlight() {
    // Определяем текущий вылет из прогресса
    try {
      const progress = JSON.parse(localStorage.getItem('krilyaProgress') || '{}');
      return progress.nextSortie || 1;
    } catch {
      return 1;
    }
  }

  function getDailyTasks(count) {
    if (!tasksData) return [];

    const flight = getCurrentFlight();
    const flightTasks = tasksData.flights[String(flight)]?.tasks || [];
    const commonTasks = tasksData.common || [];

    // Смешиваем задания вылета и общие
    const allTasks = [
      ...flightTasks.map(t => ({...t, source: 'flight'})),
      ...commonTasks.map(t => ({...t, source: 'common'}))
    ];

    // Генератор на основе дня (одинаковые задания в течение дня)
    const today = new Date().toISOString().slice(0, 10);
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);

    // Shuffle с seed для стабильности в течение дня
    const shuffled = [...allTasks].sort((a, b) => {
      const ha = (a.id.charCodeAt(1) * 31 + seed) % 100;
      const hb = (b.id.charCodeAt(1) * 31 + seed) % 100;
      return ha - hb;
    });

    return shuffled.slice(0, count || 2);
  }

  function renderMicrotasks(container) {
    if (!container) return;

    const tasks = getDailyTasks(2);
    const flight = getCurrentFlight();
    const flightTitle = tasksData?.flights[String(flight)]?.title || '';

    let html = `
      <div class="microtasks-panel">
        <div class="microtasks-header">
          <span class="microtasks-icon">📋</span>
          <span class="microtasks-title">Микро-задания на сегодня</span>
        </div>
        ${flightTitle ? `<div class="microtasks-flight">Вылет ${flight}: ${flightTitle}</div>` : ''}
        <div class="microtasks-list">
    `;

    tasks.forEach(task => {
      html += `
        <label class="microtask-item" data-id="${task.id}">
          <input type="checkbox" class="microtask-check">
          <span class="microtask-text">${task.text}</span>
          <span class="microtask-duration">${task.duration}</span>
        </label>
      `;
    });

    html += `
        </div>
        <div class="microtasks-footer">
          <button class="microtasks-refresh" id="microtasksRefresh">🔄 Другие задания</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Обработчики
    container.querySelectorAll('.microtask-check').forEach(cb => {
      cb.addEventListener('change', function() {
        const item = this.closest('.microtask-item');
        if (this.checked) {
          item.classList.add('completed');
          // Сохраняем в localStorage
          const today = new Date().toISOString().slice(0, 10);
          const completed = JSON.parse(localStorage.getItem('microtasksCompleted') || '{}');
          if (!completed[today]) completed[today] = [];
          completed[today].push(item.dataset.id);
          localStorage.setItem('microtasksCompleted', JSON.stringify(completed));

          // Toast
          if (window.showToast) {
            window.showToast('✅ Микро-задание выполнено!', 'info', 2000);
          }
        } else {
          item.classList.remove('completed');
        }
      });
    });

    const refreshBtn = container.querySelector('#microtasksRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        renderMicrotasks(container);
      });
    }

    // Восстанавливаем состояние
    const today = new Date().toISOString().slice(0, 10);
    const completed = JSON.parse(localStorage.getItem('microtasksCompleted') || '{}');
    if (completed[today]) {
      completed[today].forEach(id => {
        const item = container.querySelector(`[data-id="${id}"]`);
        if (item) {
          item.classList.add('completed');
          item.querySelector('.microtask-check').checked = true;
        }
      });
    }
  }

  // CSS
  const style = document.createElement('style');
  style.textContent = `
    .microtasks-panel {
      background: rgba(16, 22, 31, 0.9);
      border: 1px solid #2a3849;
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
    }
    .microtasks-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .microtasks-icon { font-size: 20px; }
    .microtasks-title {
      font-family: var(--font-display, 'Russo One', sans-serif);
      font-size: 14px;
      color: #f0b23c;
      letter-spacing: 0.05em;
    }
    .microtasks-flight {
      font-size: 12px;
      color: #8fa0b7;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(42, 56, 73, 0.5);
    }
    .microtasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .microtask-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: rgba(26, 35, 48, 0.6);
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .microtask-item:hover {
      border-color: #4a6a7a;
      background: rgba(26, 35, 48, 0.9);
    }
    .microtask-item.completed {
      border-color: #5df0b6;
      background: rgba(93, 240, 182, 0.08);
    }
    .microtask-item.completed .microtask-text {
      text-decoration: line-through;
      color: #8fa0b7;
    }
    .microtask-check {
      width: 18px;
      height: 18px;
      accent-color: #5df0b6;
      cursor: pointer;
    }
    .microtask-text {
      flex: 1;
      font-size: 13px;
      color: #e9eef5;
      line-height: 1.4;
    }
    .microtask-duration {
      font-size: 11px;
      color: #8fa0b7;
      white-space: nowrap;
      padding: 2px 6px;
      background: rgba(42, 56, 73, 0.5);
      border-radius: 4px;
    }
    .microtasks-footer {
      margin-top: 12px;
      text-align: center;
    }
    .microtasks-refresh {
      background: none;
      border: 1px solid #2a3849;
      color: #8fa0b7;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .microtasks-refresh:hover {
      color: #ff5b23;
      border-color: #ff5b23;
    }
  `;
  document.head.appendChild(style);

  // Экспорт
  window.Microtasks = {
    load: loadTasks,
    render: renderMicrotasks,
    getDaily: getDailyTasks
  };

  // Автозагрузка
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadTasks());
  } else {
    loadTasks();
  }
})();
