/* sokol.js — Штурман Сокол: персонаж-наставник и помощник */
(function(){
  'use strict';

  /* === Время суток === */
  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'day';
    if (h >= 17 && h < 22) return 'evening';
    return 'night';
  }

  /* === Дата последней активности === */
  function getLastVisit() {
    try { return parseInt(localStorage.getItem('sokolLastVisit') || '0', 10); }
    catch { return 0; }
  }
  function setLastVisit() {
    try { localStorage.setItem('sokolLastVisit', String(Date.now())); }
    catch {}
  }
  function getDaysSinceLastVisit() {
    const last = getLastVisit();
    if (!last) return 0;
    return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
  }

  /* === Приветствия по времени суток === */
  const GREETINGS = {
    morning: [
      'Доброе утро, курсант! ☀️ Начнём день с полёта?',
      'Утро, лётчик! Как прошла ночь? Готов к новому вылету?',
      'Доброе утро! Штурман Сокол уже на связи. Сегодня полётный день?'
    ],
    day: [
      'Добрый день, курсант! Как успехи с проектом?',
      'Привет, лётчик! День в разгаре — есть время для вылета?',
      'Штурман Сокол на связи! Как проходит день?'
    ],
    evening: [
      'Добрый вечер, курсант! Как прошёл день?',
      'Вечер, лётчик! Успел что-нибудь сделать для проекта?',
      'Штурман Сокол спрашивает: как день? Выполнил микро-задание?'
    ],
    night: [
      'Поздно, курсант! Не забудь перед сном заглянуть в лётную книжку.',
      'Ночь, лётчик! Завтра полётный день — отдыхай!',
      'Штурман Сокол напоминает: пора спать, завтра новые горизонты!'
    ]
  };

  /* === Пауза: 2+ дня без активности === */
  const PAUSE_MESSAGES = [
    '🌤 Бывает нелётная погода! Ничего страшного.',
    '🌤 Давно не виделись! Как дела? Пропустил пару дней — не проблема.',
    '🌤 Штурман Сокол не сердится! Бывают перерывы.',
    '🌤 Вернёмся в строй? Начни с малого — микро-задание поможет!'
  ];

  /* === Сообщения === */
  const MESSAGES = {
    welcome: [
      'Привет, курсант! Готов к новому вылету?',
      'Штурман Сокол на связи! Как дела с проектом?',
      'Рад тебя видеть! Сегодня проверим лётную книжку?'
    ],
    streak: [
      '🔥 Отличная серия! Продолжай в том же духе!',
      '🔥 Серия растёт! Ты настоящий лётчик!',
      '🔥 Не останавливайся! До следующего звания осталось совсем мало!'
    ],
    noFlight: [
      'Бывает нелётная погода! Но можно почитать лётную книжку.',
      'Сегодня можно отдохнуть, но не забудь про микро-задание!',
      'Даже в нелётный день можно узнать что-то новое о самолётах!'
    ],
    medal: [
      '🎖 Новая медаль! Ты заслужил её!',
      '🎖 Штурман Сокол поздравляет! Медаль зачислена!',
      '🎖 Отлично! Ещё одна медаль в коллекции!'
    ],
    rankUp: [
      '⭐ Повышение в звании! Новый ранг — новые возможности!',
      '⭐ Теперь ты выше по званию! Так держать!',
      '⭐ Штурман Сокол гордится тобой! Новое звание!'
    ],
    microtask: [
      '📋 Как насчёт микро-задания? Простое и интересное!',
      '📋 Штурман Сокол предлагает маленькое задание на сегодня!',
      '📋 Есть 3 минуты? Сделай микро-задание!'
    ],
    encourage: [
      '💪 Ты справишься! Штурман Сокол верит в тебя!',
      '💪 Каждый вылет — это шаг к победе!',
      '💪 Не сдавайся! Ты — настоящий лётчик!'
    ]
  };

  /* === Подсказки по вылетам === */
  const FLIGHT_HINTS = {
    1: { section: '#chronicle', text: 'Начни с хроники — посмотри самолёты!', action: 'Изучить хронику' },
    2: { section: '#chronicle', text: 'Продолжай изучать историю Ил-2!', action: 'Читать дальше' },
    3: { section: '#origami', text: 'Сложи бумажный самолётик в разделе «Ангар»!', action: 'Складывать оригами' },
    4: { section: '#heroes', text: 'Узнай о «Ночных ведьмах» в разделе «Герои»!', action: 'Изучить героев' },
    5: { section: '#cinema', text: 'Посмотри фильм про авиацию!', action: 'Смотреть кино' },
    6: { section: '#anatomy', text: 'Разбери устройство самолёта в разделе «Самолёт»!', action: 'Изучить устройство' },
    7: { section: '#gear', text: 'Посмотри, как было одеты лётчики!', action: 'Изучить снаряжение' },
    8: { section: '#voices', text: 'Послушай голоса неба!', action: 'Слушать аудио' },
    9: { section: '#exhibits', text: 'Посмотри музейные экспонаты!', action: 'Смотреть экспонаты' },
    10: { section: '#expedition', text: 'Сравни самолёты разных эпох!', action: 'Сравнивать эпохи' },
    11: { section: '#motorist', text: 'Посмотри, как Макар разобрал двигатели!', action: 'Смотреть доклад' },
    12: { section: '#quiz', text: 'Проверь себя в викторине — закрепи знания!', action: 'Пройти викторину' },
    13: { section: '#modelist', text: 'Собери наградной конструктор Су-57!', action: 'Собирать модель' },
    14: { section: '#squadron', text: 'Посмотри путь Макара — ты почти у цели!', action: 'Посмотреть прогресс' },
    15: { section: '#awards', text: 'Посмотри все свои награды!', action: 'Посмотреть награды' }
  };

  /* === Получение прогресса === */
  let _progressCache = null;

  function getProgress() {
    if (_progressCache) return _progressCache;
    return { medals: [], earned: [], streak: 0, nextSortie: 1, totalMedals: 15, totalRanks: 8, ammo: 0 };
  }

  function loadProgress() {
    return fetch('assets/data/progress.json')
      .then(r => r.json())
      .then(data => {
        _progressCache = {
          medals: data.medals || [],
          earned: data.earned || [],
          streak: data.streak || 0,
          nextSortie: data.nextSortie || 1,
          totalMedals: data.totalMedals || 15,
          totalRanks: data.totalRanks || 8,
          ammo: data.ammo || 0
        };
        const panel = document.getElementById('sokolPanel');
        if (panel && panel.classList.contains('sokol-panel-visible')) {
          showMainMenu();
        }
        return _progressCache;
      })
      .catch(e => {
        console.error('[sokol] Failed to load progress:', e);
        return getProgress();
      });
  }

  function getRandomMessage(category) {
    const msgs = MESSAGES[category] || MESSAGES.welcome;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  /* === Получение приветствия === */
  function getWelcomeMessage() {
    const days = getDaysSinceLastVisit();
    const tod = getTimeOfDay();
    const progress = getProgress();
    const streak = progress.streak;

    if (days >= 2) {
      const pauseMsg = PAUSE_MESSAGES[Math.floor(Math.random() * PAUSE_MESSAGES.length)];
      const suggest = streak > 0
        ? ` У тебя серия из ${streak} вылетов — не теряй её!`
        : '';
      return pauseMsg + suggest + ' Начни с микро-задания — это как лёгкий вылет!';
    }

    if (streak >= 3) {
      return getRandomMessage('streak');
    }

    const pool = GREETINGS[tod] || GREETINGS.day;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  /* === Боеприпасы: приходят из assets/data/progress.json === */
  function getAmmoBalance() {
    const p = getProgress();
    return parseInt(p.ammo || '0', 10) || 0;
  }

  /* Формат «19 708» — с неразрывным пробелом, чтобы число не рвалось */
  function fmtAmmo(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* Экранирование перед вставкой в innerHTML */
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(s)));
    return d.innerHTML;
  }


  /* === Трофейные припасы: витрина, корзина, заказ === */
  let _prizes = [];
  let _cart = [];          // [{id, name, cost, hero}]

  const cartTotal = () => _cart.reduce((s, it) => s + it.cost, 0);

  function inCart(id) {
    return _cart.some(it => it.id === id);
  }

  /* Условия открытия приза. Приоритет — от самого «дальнего» к простому:
     финальный вылет важнее процента, процент важнее числа вылетов. */
  function prizeGate(prize, progress) {
    const earned = (progress && progress.earned) || [];
    const done = earned.length;
    const total = (progress && progress.totalMedals) || 15;
    const pct = Math.round((done / total) * 100);
    const need = prize.progress || 0;

    if (prize.requiresFinal) {
      const finalNum = total;
      const finalDone = earned.some(n => +n === finalNum);
      if (!finalDone) {
        return {
          locked: true,
          pct,
          reason: 'только после финального вылета №' + finalNum,
        };
      }
    }
    if (need && pct < need) {
      return {
        locked: true,
        pct,
        reason: 'откроется при ' + need + '% вылетов (сейчас ' + pct + '%)',
      };
    }
    if ((prize.unlock || 0) > done) {
      return {
        locked: true,
        pct,
        reason: 'откроется на вылете ' + prize.unlock,
      };
    }
    return { locked: false, pct, reason: '' };
  }

  function toggleCart(prize) {
    if (inCart(prize.id)) {
      _cart = _cart.filter(it => it.id !== prize.id);
    } else {
      // не даём набрать больше, чем есть боеприпасов
      if (cartTotal() + prize.cost > getAmmoBalance()) {
        if (typeof window.showToast === 'function') {
          window.showToast('Не хватает боеприпасов на этот заказ', 'warn');
        }
        return;
      }
      _cart.push({ id: prize.id, name: prize.name, cost: prize.cost, hero: prize.hero || '' });
    }
    renderCart();
    renderPrizes();
  }

  function clearCart() {
    _cart = [];
    renderCart();
    renderPrizes();
  }

  function renderCart() {
    const box = document.getElementById('cartBox');
    if (!box) return;
    if (!_cart.length) { box.hidden = true; box.innerHTML = ''; return; }
    const total = cartTotal();
    box.hidden = false;
    box.innerHTML = `
      <div class="sokol-cart-title">🎒 Твой заказ</div>
      <ul class="sokol-cart-list">
        ${_cart.map(it => `<li>${escapeHtml(it.name)} <b>${fmtAmmo(it.cost)}</b></li>`).join('')}
      </ul>
      <div class="sokol-cart-total">Итого: <b id="cartTotal">${fmtAmmo(total)}</b> БП</div>
      <div class="sokol-cart-note">Остаток после покупки: <b id="cartLeft">${fmtAmmo(getAmmoBalance() - total)}</b></div>
      <div class="sokol-cart-actions">
        <button class="sokol-buy" id="buyBtn">Подтвердить и купить</button>
        <button class="sokol-cart-clear" id="clearCartBtn">Очистить</button>
      </div>
    `;
    const buy = document.getElementById('buyBtn');
    if (buy) buy.addEventListener('click', submitOrder);
    const clr = document.getElementById('clearCartBtn');
    if (clr) clr.addEventListener('click', clearCart);
  }

  /* Ярусы витрины: чем дороже — тем серьёзнее подпись */
  const TIERS = [
    {
      max: 6000, title: 'Разминка',
      slogan: 'С них начинается любой полёт. Собери их все — и разом увидишь, сколько заработал.'
    },
    {
      max: 15000, title: 'Знание — оружие лётчика',
      slogan: 'Настоящие пилоты читали инструкции и чертежи. Понимание машины — половина победы.'
    },
    {
      max: Infinity, title: 'Большие цели',
      slogan: 'Сюда идут те, кто готов пройти весь проект. Настоящие герои шли к таким целям годами.'
    },
  ];

  /* Порог «почти достижимо»: подсвечиваем цели, до которых один шаг */
  const NEAR_STEP = 3000;

  function tierOf(cost) {
    return TIERS.find(t => cost <= t.max) || TIERS[TIERS.length - 1];
  }

  function renderPrizes() {
    const list = document.getElementById('prizeList');
    if (!list) return;
    const balance = getAmmoBalance();
    const progress = getProgress();
    const done = progress.earned.length;
    const cartSum = cartTotal();
    // перерисовка не должна сбрасывать прокрутку панели
    const panelBody = document.getElementById('sokolPanelBody');
    const keepScroll = panelBody ? panelBody.scrollTop : 0;

    if (!_prizes.length) { list.innerHTML = ''; return; }

    const top = _prizes.reduce((a, b) => (b.cost > a.cost ? b : a), _prizes[0]);

    // Ближайшая достижимая цель среди запертых/дорогих — та, до которой меньше всего не хватает
    const reachables = _prizes
      .filter(p => !prizeGate(p, progress).locked && balance < p.cost)
      .sort((a, b) => (a.cost - balance) - (b.cost - balance));
    const nearest = reachables.length ? reachables[0] : null;

    let lastTier = null;
    const blocks = [];
    for (const p of _prizes) {
      const tier = tierOf(p.cost);
      if (tier !== lastTier) {
        lastTier = tier;
        blocks.push(`
          <div class="sokol-tier">
            <div class="sokol-tier-title">${escapeHtml(tier.title)}</div>
            <div class="sokol-tier-slogan">${escapeHtml(tier.slogan)}</div>
          </div>`);
      }

      const gate = prizeGate(p, progress);
      const locked = gate.locked;
      const picked = inCart(p.id);
      const lack = p.cost - balance;
      const isTop = p.id === top.id;
      const near = !locked && !picked && lack > 0 && lack <= NEAR_STEP;
      const afford = !locked && balance >= p.cost && (cartSum + p.cost) <= balance;
      const pct = Math.min(100, Math.round((balance / p.cost) * 100));

      let state, cls = '';
      if (locked) {
        state = gate.reason;
        cls = ' locked';
      } else if (picked) {
        state = 'в заказе';
        cls = ' picked';
      } else if (balance >= p.cost) {
        state = 'МОЖНО — забирай!';
        cls = ' can';
      } else if (near) {
        state = 'ПОЧТИ! не хватает ' + fmtAmmo(lack);
        cls = ' near';
      } else {
        state = 'не хватает ' + fmtAmmo(lack);
        cls = ' far';
      }
      if (isTop) cls += ' top';

      const bar = locked
        ? ''
        : `<div class="sokol-bar"><i style="width:${pct}%"></i></div>
           <div class="sokol-bar-pct">${pct}%</div>`;

      const btn = locked
        ? ''
        : `<button class="sokol-add${picked ? ' on' : ''}" data-prize="${escapeHtml(p.id)}"${afford || picked ? '' : ' disabled'}>${picked ? '✓' : '+'}</button>`;

      // Условия открытия показываем у дорогих призов — ребёнку нужно видеть,
      // что именно надо закрыть, чтобы приз не выглядел недостижимым.
      const conds = [];
      if (p.requiresFinal) conds.push('обязательно финальный вылет №' + (progress.totalMedals || 15));
      if (p.progress) conds.push(p.progress + '% вылетов');
      const condHtml = conds.length
        ? `<div class="sokol-prize-gate">🔒 Условия: ${escapeHtml(conds.join(' + '))}</div>`
        : '';

      blocks.push(`
      <div class="sokol-prize${cls}">
        <div class="sokol-prize-body">
          <div class="sokol-prize-name">${locked ? '🔒' : escapeHtml(p.icon || '🎁')} ${escapeHtml(p.name || '')}${isTop ? ' <span class="sokol-badge">ГЛАВНАЯ ЦЕЛЬ</span>' : ''}</div>
          ${bar}
          <div class="sokol-prize-note">${escapeHtml(p.note || '')}</div>
          ${p.hero ? `<div class="sokol-prize-hero">⚔ ${escapeHtml(p.hero)}</div>` : ''}
          ${condHtml}
        </div>
        <div class="sokol-prize-side">
          <span class="sokol-prize-price">${fmtAmmo(p.cost)}</span>
          <span class="sokol-prize-state">${escapeHtml(state)}</span>
          ${btn}
        </div>
      </div>`);
    }

    list.innerHTML = `
      ${nearest && nearest.cost - balance <= NEAR_STEP ? `
        <div class="sokol-nudge">
          <b>${escapeHtml(nearest.icon || '🎁')} ${escapeHtml(nearest.name)}</b> — до этого приза не хватает
          <b>${fmtAmmo(nearest.cost - balance)}</b> БП. Один-два вылета — и он твой.
        </div>` : ''}
      ${blocks.join('')}
      <p class="sokol-prizes-foot">Копи боеприпасы за микро-задания и вылеты. Сложное открывается после нужного числа вылетов — так же, как настоящие герои проходили испытания.</p>
    `;

    list.querySelectorAll('.sokol-add').forEach(b => {
      b.addEventListener('click', () => {
        const p = _prizes.find(x => x.id === b.dataset.prize);
        if (p) toggleCart(p);
      });
    });
    if (panelBody) panelBody.scrollTop = keepScroll;
  }

  function loadPrizes() {
    fetch('assets/data/prizes.json')
      .then(r => r.json())
      .then(data => {
        _prizes = (data && data.prizes) || [];
        renderCart();
        renderPrizes();
      })
      .catch(() => {
        const list = document.getElementById('prizeList');
        if (list) list.innerHTML = '<p class="sokol-hint-text">Не удалось загрузить призы</p>';
      });
  }

  /* --- Заказ: уходит дяде Глебу, но есть и запасной путь через чат --- */
  function submitOrder() {
    const btn = document.getElementById('buyBtn');
    if (!btn || !_cart.length) return;
    btn.disabled = true;
    btn.textContent = 'Отправляю…';

    const order = {
      items: _cart.map(it => ({ id: it.id, name: it.name, cost: it.cost, hero: it.hero })),
      total: cartTotal(),
      balance: getAmmoBalance(),
      from: 'shop',
    };

    fetch('api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(j => {
        if (!j || j.ok !== true) throw new Error('отказ сервера');
        showOrderDone(order, !j.stored);
      })
      .catch(() => showOrderDone(order, true));
  }

  function showOrderDone(order, failed) {
    const total = order.total;
    const left = order.balance - total;
    const text =
      'Хочу обменять боеприпасы:\n' +
      order.items.map(it => '• ' + it.name + ' — ' + fmtAmmo(it.cost)).join('\n') +
      '\nИтого: ' + fmtAmmo(total) + ' БП';

    const box = document.getElementById('cartBox');
    if (box) {
      box.hidden = false;
      box.innerHTML = `
        <div class="sokol-cart-title">✅ Заказ принят</div>
        <p class="sokol-done-text">${failed
          ? 'Дядя Глеб не получил заявку автоматически — скопируй текст и отправь ему в чат:'
          : 'Дядя Глеб получил заявку и спишет боеприпасы. Пока новый баланс:'}</p>
        <textarea class="sokol-done-copy" id="orderText" readonly rows="5">${escapeHtml(text)}</textarea>
        ${failed ? '' : `<div class="sokol-done-left">Остаток после покупки: <b>${fmtAmmo(left)}</b> БП</div>`}
        <div class="sokol-cart-actions">
          <button class="sokol-buy" id="copyBtn">Скопировать текст</button>
          <button class="sokol-cart-clear" id="clearCartBtn">Закрыть</button>
        </div>
      `;
      const copy = document.getElementById('copyBtn');
      if (copy) copy.addEventListener('click', () => {
        const ta = document.getElementById('orderText');
        if (!ta) return;
        ta.select();
        const done = () => { copy.textContent = 'Скопировано ✓'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ta.value).then(done, () => {
            try { document.execCommand('copy'); done(); } catch (e) { /* не критично */ }
          });
        } else {
          try { document.execCommand('copy'); done(); } catch (e) { /* не критично */ }
        }
      });
      const clr = document.getElementById('clearCartBtn');
      if (clr) clr.addEventListener('click', () => { _cart = []; renderCart(); renderPrizes(); });

      animateAmmo(order.balance, left);
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Заказ отправлен дяде Глебу!', 'medal');
    }
  }

  /* Плавно пересчитываем баланс в сторону списания */
  function animateAmmo(from, to) {
    const el = document.getElementById('ammoValue');
    if (!el) return;
    const steps = 22;
    const dur = 620;
    let i = 0;
    const tick = () => {
      i++;
      const v = Math.round(from + (to - from) * (i / steps));
      el.textContent = fmtAmmo(Math.max(0, v));
      if (i < steps) setTimeout(tick, dur / steps);
    };
    tick();
  }

  /* === Создание SVG === */
  function createSokol() {
    const container = document.createElement('div');
    container.id = 'sokol';
    container.innerHTML = `
      <div class="sokol-wrap">
        <div class="sokol-character" id="sokolCharacter" role="button" tabindex="0" aria-label="Штурман Сокол — помощник">
          <svg viewBox="0 0 120 140" class="sokol-svg" aria-hidden="true">
            <!-- Тело -->
            <ellipse cx="60" cy="85" rx="32" ry="40" fill="#2a3a4a" stroke="#4a6a7a" stroke-width="1.5"/>
            <!-- Грудь -->
            <ellipse cx="60" cy="90" rx="22" ry="30" fill="#e9eef5"/>
            <!-- Голова -->
            <circle cx="60" cy="48" r="22" fill="#2a3a4a" stroke="#4a6a7a" stroke-width="1.5"/>
            <!-- Пилотка -->
            <path d="M38 42 Q60 25 82 42 L78 48 Q60 38 42 48 Z" fill="#1a2a3a" stroke="#4a6a7a" stroke-width="1"/>
            <circle cx="60" cy="32" r="4" fill="#ff5b23"/>
            <!-- Глаза (белки) -->
            <ellipse cx="50" cy="48" rx="5" ry="5.5" fill="white"/>
            <ellipse cx="70" cy="48" rx="5" ry="5.5" fill="white"/>
            <!-- Зрачки (с анимацией) -->
            <g class="sokol-eyes">
              <circle cx="51" cy="48" r="3" fill="#1a1a2a" class="sokol-pupil-left"/>
              <circle cx="71" cy="48" r="3" fill="#1a1a2a" class="sokol-pupil-right"/>
              <circle cx="52" cy="47" r="1" fill="white"/>
              <circle cx="72" cy="47" r="1" fill="white"/>
            </g>
            <!-- Брови -->
            <path d="M44 42 Q50 39 55 42" stroke="#1a2a3a" stroke-width="1.5" fill="none" class="sokol-brow-left"/>
            <path d="M65 42 Q70 39 76 42" stroke="#1a2a3a" stroke-width="1.5" fill="none" class="sokol-brow-right"/>
            <!-- Клюв -->
            <path d="M56 55 L60 62 L64 55" fill="#ff5b23" stroke="#cc4418" stroke-width="1"/>
            <!-- Крылья (с анимацией) -->
            <path d="M28 75 Q15 85 20 105 Q25 95 35 90" fill="#3a5a6a" stroke="#4a6a7a" stroke-width="1" class="sokol-wing-left"/>
            <path d="M92 75 Q105 85 100 105 Q95 95 85 90" fill="#3a5a6a" stroke="#4a6a7a" stroke-width="1" class="sokol-wing-right"/>
            <!-- Лапы -->
            <path d="M48 120 L45 135 M48 120 L50 135 M48 120 L53 133" stroke="#cc8844" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M72 120 L67 135 M72 120 L72 135 M72 120 L75 133" stroke="#cc8844" stroke-width="2" fill="none" stroke-linecap="round"/>
            <!-- Шарф -->
            <path d="M40 65 Q60 72 80 65" stroke="#ff5b23" stroke-width="3" fill="none" class="sokol-scarf"/>
            <path d="M78 65 Q85 70 82 80 Q80 75 78 72" fill="#ff5b23"/>
          </svg>
          <div class="sokol-hint" id="sokolHint">?</div>
        </div>
        <div class="sokol-panel" id="sokolPanel">
          <div class="sokol-panel-header">
            <span class="sokol-panel-title">🦅 Штурман Сокол</span>
            <button class="sokol-close" id="sokolClose" aria-label="Закрыть">&times;</button>
          </div>
          <div class="sokol-panel-body" id="sokolPanelBody"></div>
          <div class="sokol-panel-actions" id="sokolPanelActions"></div>
        </div>
      </div>
    `;
    return container;
  }

  /* === Главное меню === */
  function showMainMenu() {
    const body = document.getElementById('sokolPanelBody');
    const actions = document.getElementById('sokolPanelActions');
    if (!body || !actions) return;

    const progress = getProgress();
    const nextFlight = progress.nextSortie;
    const hint = FLIGHT_HINTS[nextFlight] || FLIGHT_HINTS[1];
    const medalsCount = progress.earned.length;
    const streak = progress.streak;
    const days = getDaysSinceLastVisit();
    const ammoBalance = getAmmoBalance();

    let statusHtml = `
      <div class="sokol-status">
        <div class="sokol-status-row">
          <span>🎖 Медалей:</span>
          <span class="sokol-status-value">${medalsCount} / ${progress.totalMedals}</span>
        </div>
        <div class="sokol-status-row">
          <span>🔥 Серия:</span>
          <span class="sokol-status-value">${streak} вылетов</span>
        </div>
        <div class="sokol-status-row">
          <span>✈️ Следующий:</span>
          <span class="sokol-status-value">Вылет ${nextFlight}</span>
        </div>
        <div class="sokol-status-row">
          <span>🎯 Боеприпасы:</span>
          <span class="sokol-status-value">${fmtAmmo(ammoBalance)}</span>
        </div>
      </div>
    `;

    if (days >= 2) {
      statusHtml += `
        <div class="sokol-pause-notice">
          🌤 Нелётная погода: ${days} дня без полётов. Начни с микро-задания!
        </div>
      `;
    }

    statusHtml += `
      <div class="sokol-next-step">
        <div class="sokol-next-label">📋 Рекомендация:</div>
        <div class="sokol-next-text">${hint.text}</div>
      </div>
    `;

    body.innerHTML = statusHtml;

    // Сворачиваемое меню
    actions.innerHTML = `
      <button class="sokol-menu-toggle" id="sokolMenuToggle">📋 Меню ▾</button>
      <div class="sokol-menu-items" id="sokolMenuItems" style="display:none">
        <button class="sokol-btn sokol-btn-primary" data-action="nextStep">🚀 ${hint.action}</button>
        <button class="sokol-btn" data-action="microtask">📋 Микро-задание</button>
        <button class="sokol-btn" data-action="ammo">🎯 Боевые припасы</button>
        <button class="sokol-btn" data-action="squadron">📰 Новости эскадрильи</button>
        <button class="sokol-btn" data-action="help">❓ Как пользоваться</button>
        <button class="sokol-btn" data-action="about">ℹ️ Обо мне</button>
      </div>
    `;

    // Переключатель меню
    const toggle = document.getElementById('sokolMenuToggle');
    const menuItems = document.getElementById('sokolMenuItems');
    toggle.addEventListener('click', () => {
      const isOpen = menuItems.style.display !== 'none';
      menuItems.style.display = isOpen ? 'none' : 'flex';
      toggle.textContent = isOpen ? '📋 Меню ▾' : '📋 Меню ▴';
    });

    actions.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        menuItems.style.display = 'none';
        toggle.textContent = '📋 Меню ▾';
        handleAction(btn.dataset.action);
      });
    });
  }

  /* === Обработка действий === */
  function handleAction(action) {
    const body = document.getElementById('sokolPanelBody');
    const actions = document.getElementById('sokolPanelActions');
    if (!body || !actions) return;

    const progress = getProgress();
    const nextFlight = progress.nextSortie;
    const hint = FLIGHT_HINTS[nextFlight] || FLIGHT_HINTS[1];

    switch (action) {
      case 'nextStep': {
        const target = document.querySelector(hint.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          hidePanel();
        }
        break;
      }

      case 'microtask': {
        const p = getProgress();
        const nf = p.nextSortie || 1;

        body.innerHTML = '<p>Загружаю задание...</p>';
        actions.innerHTML = '';

        fetch('assets/data/microtasks.json')
          .then(r => r.json())
          .then(data => {
            const common = data.common || [];
            const flightTasks = (data.flights && data.flights[String(nf)]) ? data.flights[String(nf)].tasks : [];

            const pool = [];
            if (flightTasks.length > 0) {
              pool.push({ ...flightTasks[Math.floor(Math.random() * flightTasks.length)], source: 'flight' });
            }
            if (common.length > 0) {
              pool.push({ ...common[Math.floor(Math.random() * common.length)], source: 'common' });
            }

            if (pool.length === 0) {
              body.innerHTML = '<p>Задания пока не добавлены. Скоро будут!</p>';
              actions.innerHTML = '<button class="sokol-btn" data-action="back">← Назад</button>';
              bindActions(actions);
              return;
            }

            let html = '<div class="sokol-microtask-list">';
            pool.forEach(task => {
              const icon = task.source === 'flight' ? '✈️' : '📋';
              const label = task.source === 'flight' ? `Вылет ${nf}` : 'Общее';
              html += `
                <div class="sokol-microtask-item">
                  <div class="sokol-microtask-label">${icon} ${label}</div>
                  <div class="sokol-microtask-text">${task.text}</div>
                  <div class="sokol-microtask-duration">⏱ ${task.duration}</div>
                </div>
              `;
            });
            html += '</div>';
            html += '<div class="sokol-microtask-reminder">📸 Не забудь отчитаться в штаб о выполнении задания!</div>';
            body.innerHTML = html;

            actions.innerHTML = `
              <button class="sokol-btn sokol-btn-primary" data-action="microtask">🔄 Другое задание</button>
              <button class="sokol-btn" data-action="back">← Назад</button>
            `;
            bindActions(actions);
          })
          .catch(e => {
            console.error('[sokol] Failed to load microtasks:', e);
            body.innerHTML = '<p>Не удалось загрузить задания. Попробуй обновить страницу!</p>';
            actions.innerHTML = '<button class="sokol-btn" data-action="back">← Назад</button>';
            bindActions(actions);
          });
        break;
      }

      case 'ammo': {
        const balance = getAmmoBalance();
        const done = getProgress().earned.length;
        body.innerHTML = `
          <div class="sokol-ammo-balance">
            <div class="sokol-ammo-balance-label">Твои трофейные припасы</div>
            <div class="sokol-ammo-balance-value" id="ammoValue">${fmtAmmo(balance)}</div>
            <div class="sokol-ammo-balance-hint">Сокол приготовил призы от штурмана Сокола. Копи за микро-задания, вылеты и находки</div>
          </div>
          <div class="sokol-cart" id="cartBox" hidden></div>
          <div id="prizeList"><p class="sokol-hint-text">Загружаю призы…</p></div>
        `;
        actions.innerHTML = `
          <button class="sokol-btn" data-action="back">← Назад</button>
        `;
        bindActions(actions);
        loadPrizes();
        break;
      }

      case 'squadron': {
        body.innerHTML = '<div id="squadronContent">Загрузка...</div>' +
          '<div class="sokol-hint-text">Викторина из ста вопросов живёт отдельной секцией — там прогресс сохраняется, а за правильные ответы падают боеприпасы.</div>';
        actions.innerHTML = '<button class="sokol-btn sokol-btn-primary" data-action="goQuiz">🎯 Перейти к викторине</button>';
        bindActions(actions);

        if (window.Squadron) {
          if (!window.Squadron._loaded) {
            window.Squadron.load().then(() => {
              window.Squadron._loaded = true;
              window.Squadron.render('squadronContent');
            });
          } else {
            window.Squadron.render('squadronContent');
          }
        } else {
          document.getElementById('squadronContent').innerHTML = '<p>Новости загружаются...</p>';
        }
        break;
      }

      case 'goQuiz': {
        hidePanel();
        if (typeof window.MakarJumpTo === 'function') {
          window.MakarJumpTo('#quiz');
        } else {
          const target = document.getElementById('quiz');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
      }

      case 'help': {
        body.innerHTML = `
          <div class="sokol-help">
            <h4>Как пользоваться лендингом</h4>
            <div class="sokol-help-list">
              <div class="sokol-help-item">
                <span class="sokol-help-icon">🗺</span>
                <div>
                  <strong>Таймлайн</strong>
                  <p>Навигация по 15 вылетам. Нажми на номер — перейдёшь к секции!</p>
                </div>
              </div>
              <div class="sokol-help-item">
                <span class="sokol-help-icon">🎖</span>
                <div>
                  <strong>Медали</strong>
                  <p>Каждый вылет — это медаль. Бронза → Серебро → Золото!</p>
                </div>
              </div>
              <div class="sokol-help-item">
                <span class="sokol-help-icon">⭐</span>
                <div>
                  <strong>Звания</strong>
                  <p>Каждые 2 медали = новое звание. До Лётчика-аса — 14 медалей!</p>
                </div>
              </div>
              <div class="sokol-help-item">
                <span class="sokol-help-icon">📋</span>
                <div>
                  <strong>Микро-задания</strong>
                  <p>Маленькие задания на каждый день. Даже без вылета — есть чем заняться!</p>
                </div>
              </div>
              <div class="sokol-help-item">
                <span class="sokol-help-icon">🎯</span>
                <div>
                  <strong>Боевые припасы</strong>
                  <p>Начисляются дядей Глебом после проверки отчётов. Можно обменять на призы!</p>
                </div>
              </div>
              <div class="sokol-help-item">
                <span class="sokol-help-icon">✈️</span>
                <div>
                  <strong>Викторина Эскадрильи</strong>
                  <p>Воздушные новости и мини-викторина. Проверь свои знания!</p>
                </div>
              </div>
            </div>
          </div>
        `;
        actions.innerHTML = '<button class="sokol-btn" data-action="back">← Назад</button>';
        bindActions(actions);
        break;
      }

      case 'about': {
        body.innerHTML = `
          <div class="sokol-about">
            <p>Привет! Я <strong>Штурман Сокол</strong> — твой помощник в проекте «Крылья Победы»!</p>
            <p>Моя задача — помогать тебе и напоминать о заданиях.</p>
            <h4>Что я умею:</h4>
            <ul>
              <li>🎯 Подсказывать следующий шаг</li>
              <li>📋 Напоминать о микро-заданиях</li>
              <li>🎯 Показывать баланс боеприпасов</li>
              <li>✈️ Проводить викторину</li>
              <li>🎉 Поздравлять с достижениями</li>
              <li>💪 Поддерживать в трудные моменты</li>
              <li>🌤 Напоминать о нелётной погоде</li>
            </ul>
            <p>Нажми на меня в углу экрана — и я всегда подскажу, что делать дальше!</p>
          </div>
        `;
        actions.innerHTML = '<button class="sokol-btn" data-action="back">← Назад</button>';
        bindActions(actions);
        break;
      }

      case 'back': {
        showMainMenu();
        break;
      }
    }
  }

  function bindActions(container) {
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.action));
    });
  }

  /* === Показать/скрыть панель === */
  function showPanel() {
    const panel = document.getElementById('sokolPanel');
    const hint = document.getElementById('sokolHint');
    if (panel) {
      panel.classList.add('sokol-panel-visible');
      showMainMenu();
    }
    if (hint) hint.style.display = 'none';
  }

  function hidePanel() {
    const panel = document.getElementById('sokolPanel');
    const hint = document.getElementById('sokolHint');
    if (panel) panel.classList.remove('sokol-panel-visible');
    if (hint) hint.style.display = '';
  }

  /* === Показать речь === */
  function showSpeech(category, customMessage) {
    const sokol = document.getElementById('sokol');
    if (!sokol) return;

    showPanel();
    const body = document.getElementById('sokolPanelBody');
    if (body) {
      const msg = customMessage || getRandomMessage(category);
      body.innerHTML = `<div class="sokol-speech-text">${msg}</div>`;
    }
  }

  /* === Инициализация === */
  function init() {
    const existing = document.getElementById('sokol');
    if (existing) return;

    const sokol = createSokol();
    document.body.appendChild(sokol);

    const character = document.getElementById('sokolCharacter');
    const closeBtn = document.getElementById('sokolClose');

    character.addEventListener('click', () => {
      const panel = document.getElementById('sokolPanel');
      if (panel && panel.classList.contains('sokol-panel-visible')) {
        hidePanel();
      } else {
        showPanel();
      }
    });

    character.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showPanel();
      }
    });

    closeBtn.addEventListener('click', hidePanel);

    loadProgress();

    setTimeout(() => {
      setLastVisit();
      /* Раньше панель открывалась сама и на телефоне закрывала варианты
         ответа в викторине. На узких экранах не открываемся — значок
         с вопросительным знаком остаётся, а панель вызывается по клику. */
      const quizVisible = (function () {
        const q = document.getElementById('quiz');
        if (!q) return false;
        const r = q.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      })();
      if (window.innerWidth > 860 && !quizVisible) {
        showSpeech(null, getWelcomeMessage());
      }
    }, 2000);

    window.Sokol = {
      show: showSpeech,
      hide: hidePanel,
      showMainMenu: showMainMenu,
      refresh: loadProgress,
      getTimeOfDay: getTimeOfDay,
      getDaysSinceLastVisit: getDaysSinceLastVisit,
      getAmmoBalance: getAmmoBalance
    };
  }

  /* === CSS === */
  const style = document.createElement('style');
  style.textContent = `
    #sokol {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 90;
      transition: opacity .25s ease, transform .25s ease;
    }
    /* Пока идёт викторина, значок Сокола уходит в фон: на телефоне он
       перекрывал варианты ответа и мешал нажимать. */
    #sokol.is-quiet { opacity: 0; pointer-events: none; transform: translateY(16px); }
    body:not(.unlocked) #sokol { display: none !important; }
    .sokol-wrap {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }
    .sokol-character {
      cursor: pointer;
      position: relative;
      transition: transform 0.2s;
    }
    .sokol-character:hover {
      transform: scale(1.05);
    }
    .sokol-character:focus-visible {
      outline: 2px solid #ff5b23;
      outline-offset: 4px;
      border-radius: 8px;
    }

    /* === Анимации Сокола === */
    .sokol-svg {
      width: 90px;
      height: 112px;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
      animation: sokolFloat 3s ease-in-out infinite;
    }
    @keyframes sokolFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    /* Глаза — смотрят в одну сторону (синхронно) */
    .sokol-pupil-left, .sokol-pupil-right {
      animation: sokolLook 5s ease-in-out infinite;
    }
    @keyframes sokolLook {
      0%, 45%, 100% { transform: translateX(0); }
      55%, 85% { transform: translateX(1.5px); }
    }

    /* Брови — поднимаются */
    .sokol-brow-left {
      animation: sokolBrowLeft 5s ease-in-out infinite;
    }
    .sokol-brow-right {
      animation: slogBrowRight 5s ease-in-out infinite;
    }
    @keyframes sokolBrowLeft {
      0%, 70%, 100% { transform: translateY(0); }
      80%, 90% { transform: translateY(-2px); }
    }
    @keyframes slogBrowRight {
      0%, 70%, 100% { transform: translateY(0); }
      80%, 90% { transform: translateY(-2px); }
    }

    /* Крылья — поднимаются */
    .sokol-wing-left {
      animation: sokolWingLeft 3s ease-in-out infinite;
      transform-origin: 35px 85px;
    }
    .sokol-wing-right {
      animation: sokolWingRight 3s ease-in-out infinite;
      transform-origin: 85px 85px;
    }
    @keyframes sokolWingLeft {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-8deg); }
    }
    @keyframes sokolWingRight {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(8deg); }
    }

    /* Шарф — покачивается */
    .sokol-scarf {
      animation: sokolScarf 4s ease-in-out infinite;
    }
    @keyframes sokolScarf {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(2px); }
    }

    /* Моргание — периодическое */
    .sokol-svg {
      animation: sokolFloat 3s ease-in-out infinite, sokolBlink 6s ease-in-out infinite;
    }
    @keyframes sokolBlink {
      0%, 45%, 55%, 100% { opacity: 1; }
      50% { opacity: 0.95; }
    }

    .sokol-hint {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 22px;
      height: 22px;
      background: #ff5b23;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      animation: sokolPulse 2s ease-in-out infinite;
    }
    @keyframes sokolPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* Панель */
    .sokol-panel {
      display: none;
      width: 340px;
      max-height: 500px;
      background: rgba(16, 22, 31, 0.97);
      border: 2px solid #ff5b23;
      border-radius: 12px;
      overflow: visible;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: sokolSlideIn 0.3s ease-out;
    }
    .sokol-panel-visible {
      display: flex;
      flex-direction: column;
    }
    @keyframes sokolSlideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .sokol-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255, 91, 35, 0.15);
      border-bottom: 1px solid rgba(255, 91, 35, 0.3);
    }
    .sokol-panel-title {
      font-family: 'Russo One', sans-serif;
      font-size: 14px;
      color: #ff5b23;
      letter-spacing: 0.05em;
    }
    .sokol-close {
      background: none;
      border: none;
      color: #8fa0b7;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      transition: color 0.2s;
    }
    .sokol-close:hover { color: #ff5b23; }
    .sokol-panel-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      font-size: 13px;
      color: #e9eef5;
      line-height: 1.5;
      min-height: 80px;
    }
    .sokol-panel-actions {
      padding: 12px 16px;
      border-top: 1px solid rgba(42, 56, 73, 0.5);
    }

    /* Сворачиваемое меню */
    .sokol-menu-toggle {
      width: 100%;
      background: rgba(42, 56, 73, 0.5);
      border: 1px solid #2a3849;
      color: #e9eef5;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      text-align: left;
      transition: background 0.2s;
    }
    .sokol-menu-toggle:hover {
      background: rgba(42, 56, 73, 0.8);
    }
    .sokol-menu-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    /* Статус */
    .sokol-status { margin-bottom: 12px; }
    .sokol-status-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(42, 56, 73, 0.3);
    }
    .sokol-status-value { color: #f0b23c; font-weight: 600; }

    /* Пауза */
    .sokol-pause-notice {
      background: rgba(255, 204, 0, 0.1);
      border-left: 3px solid #ffcc00;
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #ffcc00;
      margin-bottom: 10px;
    }

    /* Рекомендация */
    .sokol-next-step {
      background: rgba(93, 240, 182, 0.1);
      border-left: 3px solid #5df0b6;
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
    }
    .sokol-next-label {
      font-size: 11px;
      color: #5df0b6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    /* Кнопки */
    .sokol-btn {
      background: rgba(42, 56, 73, 0.5);
      border: 1px solid #2a3849;
      color: #e9eef5;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      text-align: left;
      transition: background 0.2s, border-color 0.2s;
    }
    .sokol-btn:hover {
      background: rgba(42, 56, 73, 0.8);
      border-color: #4a6a7a;
    }
    .sokol-btn-primary {
      background: rgba(255, 91, 35, 0.2);
      border-color: #ff5b23;
      color: #ff5b23;
      font-weight: 600;
    }
    .sokol-btn-primary:hover { background: rgba(255, 91, 35, 0.3); }

    /* Помощь */
    .sokol-help h4 {
      color: #f0b23c;
      margin: 0 0 12px 0;
      font-size: 14px;
    }
    .sokol-help-list { display: flex; flex-direction: column; gap: 12px; }
    .sokol-help-item { display: flex; gap: 10px; }
    .sokol-help-icon { font-size: 20px; flex-shrink: 0; }
    .sokol-help-item strong { color: #f0b23c; display: block; margin-bottom: 2px; }
    .sokol-help-item p { margin: 0; font-size: 12px; color: #8fa0b7; }

    /* О себе */
    .sokol-about h4 { color: #f0b23c; margin: 12px 0 8px 0; font-size: 13px; }
    .sokol-about ul { margin: 0; padding-left: 20px; }
    .sokol-about li { margin-bottom: 4px; font-size: 12px; }

    /* Микро-задания */
    .sokol-microtask-list { display: flex; flex-direction: column; gap: 12px; }
    .sokol-microtask-item {
      background: rgba(42, 56, 73, 0.5);
      border: 1px solid #2a3849;
      border-radius: 8px;
      padding: 12px;
    }
    .sokol-microtask-label {
      font-size: 11px;
      color: #5df0b6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .sokol-microtask-text { color: #e9eef5; font-size: 13px; line-height: 1.4; margin-bottom: 6px; }
    .sokol-microtask-duration { font-size: 11px; color: #8fa0b7; }
    .sokol-microtask-reminder {
      background: rgba(255, 91, 35, 0.15);
      border-left: 3px solid #ff5b23;
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #ff5b23;
      margin-top: 8px;
    }

    /* Боеприпасы — баланс */
    .sokol-ammo-balance {
      text-align: center;
      padding: 20px 16px;
    }
    .sokol-ammo-balance-label {
      font-size: 12px;
      color: #8fa0b7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .sokol-ammo-balance-value {
      font-size: 48px;
      font-weight: 700;
      color: #f0b23c;
      font-family: 'Russo One', sans-serif;
      margin-bottom: 8px;
    }
    .sokol-ammo-balance-hint {
      font-size: 11px;
      color: #5a6a7a;
      font-style: italic;
      max-width: 260px;
      margin: 0 auto;
      line-height: 1.5;
    }

    /* Обменный пункт — призы */
    .sokol-prizes-title {
      margin: 6px 0 10px;
      font-size: 12px;
      color: #8fa0b7;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .sokol-prizes { display: flex; flex-direction: column; gap: 8px; }
    .sokol-prize {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 8px 10px;
      padding: 10px 12px;
      border: 1px solid rgba(70, 90, 115, .45);
      border-radius: 4px;
      background: rgba(20, 28, 40, .6);
      opacity: .55;
      transition: opacity .2s, border-color .2s, background .2s;
    }
    .sokol-prize.can { opacity: 1; border-color: rgba(240, 178, 60, .55); background: rgba(240, 178, 60, .07); }
    .sokol-prize.picked { opacity: 1; border-color: rgba(93, 240, 182, .7); background: rgba(93, 240, 182, .1); }
    .sokol-prize.locked { opacity: .4; border-style: dashed; }
    .sokol-prize-gate {
      margin-top: 8px; padding: 7px 10px;
      border: 1px dashed rgba(255,207,92,.45); border-radius: 3px;
      background: rgba(255,207,92,.07); color: #ffd97a;
      font-size: .76rem; line-height: 1.4;
    }
    /* «почти достижимо» — тёплое свечение, чтобы цель манила */
    .sokol-prize.near {
      opacity: 1;
      border-color: rgba(255, 149, 64, .85);
      background: rgba(255, 149, 64, .12);
      box-shadow: 0 0 0 1px rgba(255, 149, 64, .35), 0 0 14px rgba(255, 149, 64, .22);
      animation: nearPulse 2.6s ease-in-out infinite;
    }
    @keyframes nearPulse {
      0%, 100% { box-shadow: 0 0 0 1px rgba(255,149,64,.35), 0 0 10px rgba(255,149,64,.18); }
      50%      { box-shadow: 0 0 0 1px rgba(255,149,64,.6),  0 0 20px rgba(255,149,64,.34); }
    }
    @media (prefers-reduced-motion: reduce) {
      .sokol-prize.near { animation: none; }
    }
    .sokol-prize.top { border-left: 3px solid #ff5b23; }

    /* ярусы */
    .sokol-tier { margin: 14px 0 8px; }
    .sokol-tier:first-child { margin-top: 4px; }
    .sokol-tier-title {
      font-family: 'Russo One', sans-serif;
      font-size: 12px;
      color: #ff5b23;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .sokol-tier-slogan {
      font-size: 11px;
      color: #7d8ea6;
      line-height: 1.45;
      margin-top: 3px;
    }

    /* полоса прогресса к цели */
    .sokol-bar {
      height: 5px;
      border-radius: 3px;
      background: rgba(255, 255, 255, .07);
      overflow: hidden;
      margin: 7px 0 3px;
    }
    .sokol-bar > i {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, #ff5b23, #f0b23c);
      transition: width .4s ease;
    }
    .sokol-prize.can .sokol-bar > i { background: linear-gradient(90deg, #5df0b6, #f0b23c); }
    .sokol-bar-pct {
      font-size: 9.5px;
      color: #5a6a7a;
      letter-spacing: .05em;
    }
    .sokol-prize.near .sokol-bar-pct { color: #ff9540; }
    .sokol-prize.can .sokol-bar-pct { color: #5df0b6; }

    /* значок главной цели */
    .sokol-badge {
      display: inline-block;
      margin-left: 6px;
      padding: 2px 6px;
      border-radius: 3px;
      background: #ff5b23;
      color: #1a0d05;
      font-family: system-ui, sans-serif;
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: .08em;
      vertical-align: middle;
    }

    /* подталкивание к ближайшей цели */
    .sokol-nudge {
      margin: 4px 0 12px;
      padding: 9px 11px;
      border: 1px solid rgba(255, 149, 64, .45);
      border-left: 3px solid #ff9540;
      border-radius: 4px;
      background: rgba(255, 149, 64, .08);
      font-size: 11.5px;
      line-height: 1.5;
      color: #e9d8c8;
    }
    .sokol-nudge b { color: #ff9540; }

    .sokol-prize-icon { font-size: 22px; line-height: 1.2; flex: 0 0 auto; }
    /* текст занимает всю ширину — иначе на узкой панели он сжимается в столбик */
    .sokol-prize-body { flex: 1 1 100%; min-width: 0; }
    .sokol-prize-name {
      font-family: 'Russo One', sans-serif;
      font-size: 13px;
      color: #e9eef5;
      line-height: 1.3;
    }
    .sokol-prize-note {
      font-size: 11px;
      color: #7d8ea6;
      line-height: 1.4;
      margin-top: 2px;
    }
    .sokol-prize-hero {
      font-size: 11px;
      color: #b79ad6;
      line-height: 1.45;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed rgba(140, 120, 175, .3);
    }
    /* цена, состояние и кнопка — строкой под текстом */
    .sokol-prize-side {
      flex: 1 1 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }
    .sokol-prize-price {
      font-size: 14px;
      font-weight: 700;
      color: #f0b23c;
      font-family: 'Russo One', sans-serif;
      white-space: nowrap;
    }
    .sokol-prize-state {
      font-size: 10px;
      letter-spacing: .04em;
      color: #5a6a7a;
      text-align: right;
      line-height: 1.3;
    }
    .sokol-prize.can .sokol-prize-state { color: #5df0b6; }
    .sokol-prize.picked .sokol-prize-state { color: #5df0b6; }
    .sokol-add {
      margin-top: 3px;
      width: 30px;
      height: 30px;
      border-radius: 4px;
      border: 1px solid rgba(240, 178, 60, .5);
      background: rgba(240, 178, 60, .12);
      color: #f0b23c;
      font-size: 17px;
      line-height: 1;
      cursor: pointer;
      font-weight: 700;
    }
    .sokol-add:hover:not(:disabled) { background: rgba(240, 178, 60, .3); }
    .sokol-add:disabled { opacity: .3; cursor: not-allowed; }
    .sokol-add.on { background: #5df0b6; border-color: #5df0b6; color: #08210f; }
    .sokol-cart {
      margin: 12px 0;
      padding: 12px;
      border: 1px solid rgba(93, 240, 182, .45);
      border-radius: 6px;
      background: rgba(93, 240, 182, .07);
    }
    .sokol-cart-title { font-family: 'Russo One', sans-serif; font-size: 14px; color: #5df0b6; margin-bottom: 8px; }
    .sokol-cart-list { margin: 0 0 8px; padding-left: 18px; font-size: 12px; color: #cfe0d8; line-height: 1.6; }
    .sokol-cart-list b { color: #f0b23c; }
    .sokol-cart-total, .sokol-done-left { font-size: 13px; color: #e9eef5; margin-bottom: 4px; }
    .sokol-cart-total b, .sokol-done-left b { color: #f0b23c; font-size: 15px; }
    .sokol-cart-note { font-size: 11px; color: #7d8ea6; margin-bottom: 10px; }
    .sokol-cart-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .sokol-buy {
      flex: 1 1 auto;
      padding: 9px 14px;
      border: 0;
      border-radius: 4px;
      background: #5df0b6;
      color: #08210f;
      font-family: 'Russo One', sans-serif;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .sokol-buy:hover:not(:disabled) { filter: brightness(1.1); }
    .sokol-buy:disabled { opacity: .5; cursor: wait; }
    .sokol-cart-clear {
      padding: 9px 14px;
      border: 1px solid rgba(120, 140, 165, .5);
      border-radius: 4px;
      background: transparent;
      color: #9fb0c7;
      font-size: 12px;
      cursor: pointer;
    }
    .sokol-cart-clear:hover { background: rgba(255, 255, 255, .06); }
    .sokol-done-text { font-size: 12px; color: #cfe0d8; line-height: 1.5; margin: 0 0 8px; }
    .sokol-done-copy {
      width: 100%;
      font-family: inherit;
      font-size: 12px;
      line-height: 1.5;
      color: #e9eef5;
      background: rgba(10, 14, 20, .8);
      border: 1px solid rgba(93, 240, 182, .3);
      border-radius: 4px;
      padding: 8px;
      resize: vertical;
      margin-bottom: 8px;
    }
    .sokol-prizes-foot {
      margin: 12px 0 0;
      font-size: 11px;
      color: #5a6a7a;
      line-height: 1.5;
      text-align: center;
    }

    /* Речь */
    .sokol-speech-text { animation: sokolPop 0.3s ease-out; }
    @keyframes sokolPop {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* Мобильная версия — панель над персонажем */
    @media (max-width: 640px) {
      #sokol { bottom: 12px; left: 12px; }
      .sokol-wrap {
        flex-direction: column-reverse;
        align-items: flex-start;
      }
      .sokol-svg { width: 100px; height: 125px; }
      .sokol-panel {
        width: min(340px, calc(100vw - 24px));
        max-height: 70vh;
        position: relative;
        bottom: auto;
        right: auto;
        margin-bottom: 8px;
      }
    }
    @media (max-width: 380px) {
      .sokol-svg { width: 85px; height: 106px; }
      .sokol-panel {
        width: min(280px, calc(100vw - 24px));
      }
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
