/* quiz.js — Викторина эскадрильи: 100 вопросов из squadron.json
   --
   Живёт в секции #quiz и заменяет прежний мини-тест в панели Сокола:
   теперь это единственная викторина на сайте и она видна сразу, а не
   спрятана в модальном окне.

   Что умеет:
     — счётчик «вопрос N / всего · правильно K» и полоса прогресса;
     — варианты перемешиваются, чтобы запоминалось знание, а не позиция;
     — мгновенная обратная связь: правильный ответ подсвечивается зелёным,
       выбранный неверный — оранжевым, показывается разбор (hint из данных);
     — правильный ответ иногда роняет бонус (механика AmmoSystem);
     — кнопка «Следующий вопрос» с обратным отсчётом и автопереходом;
     — прогресс сохраняется в localStorage, можно пройти «только ошибки»;
     — при появлении секции на экране панель Сокола прячется, чтобы не
       закрывать варианты ответа.
*/
(function(){
  'use strict';

  /* Ключ localStorage — тот же, что и у прежнего мини-теста Сокола,
     поэтому ранее отвеченные вопросы остаются отмеченными. */
  const STORE = 'squadronQuizAnswered';

  const AUTO_NEXT_SECONDS = 6;   /* автопереход, если не нажали сами */
  const LETTERS = ['А', 'Б', 'В', 'Г'];

  let all = [];          /* все вопросы из данных */
  let answered = {};     /* id -> { correct, timestamp } */
  let mode = 'all';      /* 'all' | 'wrong' */
  let current = null;    /* текущий вопрос */
  let currentOrder = []; /* перемешанные индексы вариантов */
  let nextTimer = null;  /* автопереход */
  let tickTimer = null;  /* обратный отсчёт */
  let inView = false;    /* секция видна на экране */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /* ── Хранилище ── */
  function loadStore() {
    try {
      answered = JSON.parse(localStorage.getItem(STORE) || '{}') || {};
    } catch (e) {
      console.error('[quiz] Failed to read progress:', e);
      answered = {};
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORE, JSON.stringify(answered));
    } catch (e) {
      console.error('[quiz] Failed to save progress:', e);
    }
  }

  /* ── Вспомогательное ── */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function stats() {
    const ids = Object.keys(answered);
    let correct = 0;
    ids.forEach(function(id) { if (answered[id].correct) correct++; });
    return { answered: ids.length, correct: correct, total: all.length };
  }

  function pool() {
    if (mode === 'wrong') {
      const wrong = all.filter(function(q) { return answered[q.id] && !answered[q.id].correct; });
      if (wrong.length) return wrong;
    }
    return all;
  }

  function pickCurrent() {
    const list = pool();
    const fresh = list.filter(function(q) { return !answered[q.id]; });
    const from = fresh.length ? fresh : list;
    return from.length ? from[0] : null;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Рендер ── */
  function render() {
    const box = $('#quizBox');
    if (!box || !all.length) return;

    const st = stats();

    /* Всё пройдено — финальный экран */
    if (mode === 'all' && st.answered >= st.total) {
      box.innerHTML =
        '<div class="quiz-finish">' +
          '<div class="quiz-stamp">ВИКТОРИНА ПРОЙДЕНА</div>' +
          '<h3>ВСЕ ' + st.total + ' ВОПРОСОВ</h3>' +
          '<p>Правильных ответов: <b>' + st.correct + '</b> из ' + st.total + '. ' +
            'Это ' + Math.round((st.correct / st.total) * 100) + '% — настоящий результат штурмана Сокола.</p>' +
          '<button class="btn btn-accent quiz-restart" type="button" data-act="reset">ПРОЙТИ ЗАНОВО</button>' +
        '</div>';
      bindTools(box);
      return;
    }

    const list = pool();
    current = pickCurrent();
    if (!current) return;

    const pos = list.indexOf(current) + 1;
    const pct = st.total ? Math.round((st.answered / st.total) * 100) : 0;
    const wrongCount = st.answered - st.correct;

    currentOrder = shuffle(current.options.map(function(_, i) { return i; }));

    box.innerHTML =
      '<div class="quiz-head">' +
        '<div class="quiz-counter">ВОПРОС <b>' + pos + '</b> / ' + list.length +
          (mode === 'wrong'
            ? ' · ОШИБОК <b>' + wrongCount + '</b>'
            : ' · ПРАВИЛЬНО <b>' + st.correct + '</b>') +
        '</div>' +
        '<div class="quiz-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="quiz-tools">' +
          (wrongCount
            ? '<button class="quiz-tool' + (mode === 'wrong' ? ' is-active' : '') + '" type="button" data-act="wrong">ТОЛЬКО ОШИБКИ · ' + wrongCount + '</button>'
            : '') +
          (mode === 'wrong'
            ? '<button class="quiz-tool" type="button" data-act="all">ВСЕ ВОПРОСЫ</button>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="quiz-q" aria-live="polite">' + escapeHtml(current.question) + '</div>' +
      '<div class="quiz-answers" role="radiogroup" aria-label="Варианты ответа">' +
        currentOrder.map(function(origIdx, pos2) {
          return '<button class="quiz-answer" type="button" role="radio" aria-checked="false" data-i="' + origIdx + '">' +
            '<span class="quiz-letter">' + LETTERS[pos2] + '</span>' +
            '<span class="quiz-text">' + escapeHtml(current.options[origIdx]) + '</span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<div class="quiz-feedback" id="quizFeedback" aria-live="polite" hidden></div>';

    bindTools(box);
    bindAnswers(box);
  }

  function bindTools(box) {
    $$('.quiz-tool, .quiz-restart', box).forEach(function(btn) {
      btn.addEventListener('click', function() {
        const act = btn.dataset.act;
        if (act === 'wrong') mode = 'wrong';
        else if (act === 'all') mode = 'all';
        else if (act === 'reset') {
          answered = {};
          saveStore();
          mode = 'all';
        }
        stopTimers();
        render();
      });
    });
  }

  function bindAnswers(box) {
    $$('.quiz-answer', box).forEach(function(btn) {
      btn.addEventListener('click', function() { answer(parseInt(btn.dataset.i, 10)); });
    });
  }

  /* ── Ответ ── */
  function answer(index) {
    if (!current || answered[current.id]) return;

    const box = $('#quizBox');
    if (!box) return;

    const isCorrect = index === current.correct;
    answered[current.id] = { correct: isCorrect, timestamp: Date.now() };
    saveStore();

    const options = $$('.quiz-answer', box);
    options.forEach(function(btn) {
      btn.disabled = true;
      const i = parseInt(btn.dataset.i, 10);
      if (i === current.correct) {
        btn.classList.add('is-correct');
        btn.setAttribute('aria-checked', 'true');
      } else if (i === index) {
        btn.classList.add('is-wrong');
      } else {
        btn.classList.add('is-dim');
      }
    });

    const fb = $('#quizFeedback', box);
    if (fb) {
      const right = current.options[current.correct];
      let bonusHtml = '';
      if (isCorrect && window.AmmoSystem && typeof window.AmmoSystem.maybe === 'function') {
        const bonus = window.AmmoSystem.maybe();
        if (bonus) {
          bonusHtml = '<div class="quiz-bonus">🎁 Бонус: <b>' + escapeHtml(bonus.name) + '</b> — ' + escapeHtml(bonus.text) + '</div>';
        }
      }

      fb.className = 'quiz-feedback ' + (isCorrect ? 'is-correct' : 'is-wrong');
      fb.innerHTML =
        '<div class="quiz-verdict">' + (isCorrect ? '✓ ПРАВИЛЬНО' : '✗ НЕ СОВСЕМ') + '</div>' +
        (isCorrect ? '' : '<div class="quiz-explain">Правильный ответ: <b>' + escapeHtml(right) + '</b></div>') +
        (current.hint ? '<div class="quiz-explain">' + escapeHtml(current.hint) + '</div>' : '') +
        bonusHtml +
        '<button class="btn btn-accent quiz-next" type="button" data-act="next">СЛЕДУЮЩИЙ ВОПРОС (' + AUTO_NEXT_SECONDS + ')</button>';
      fb.hidden = false;

      const nextBtn = $('.quiz-next', fb);
      if (nextBtn) {
        nextBtn.addEventListener('click', function() { goNext(); });
      }
      startCountdown(nextBtn);
    }
  }

  function startCountdown(btn) {
    let left = AUTO_NEXT_SECONDS;
    stopTimers();
    tickTimer = setInterval(function() {
      left--;
      if (btn) btn.textContent = 'СЛЕДУЮЩИЙ ВОПРОС (' + Math.max(left, 0) + ')';
      if (left <= 0) goNext();
    }, 1000);
    nextTimer = setTimeout(goNext, AUTO_NEXT_SECONDS * 1000);
  }

  function stopTimers() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
  }

  function goNext() {
    stopTimers();
    render();
  }

  /* ── Клавиатура: 1-4 и Enter ── */
  function onKey(e) {
    if (!inView || !current) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const key = e.key;
    if (key >= '1' && key <= '4') {
      const order = currentOrder[parseInt(key, 10) - 1];
      if (order !== undefined && !answered[current.id]) {
        e.preventDefault();
        answer(order);
      }
    } else if (key === 'Enter' && answered[current.id]) {
      const btn = $('.quiz-next');
      if (btn) { e.preventDefault(); goNext(); }
    }
  }

  /* ── Данные ── */
  function load() {
    return fetch('assets/data/squadron.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        all = (data.quiz || []).filter(function(q) {
          return q && q.id && q.question && Array.isArray(q.options) &&
                 typeof q.correct === 'number';
        });
        render();
      })
      .catch(function(e) {
        console.error('[quiz] Failed to load questions:', e);
        const box = $('#quizBox');
        if (box) box.innerHTML = '<p class="quiz-load-error">Не удалось загрузить вопросы. Обнови страницу — и попробуй снова.</p>';
      });
  }

  /* ── Панель и значок Сокола не должны закрывать варианты ответа ── */
  function quietSokol(on) {
    const s = document.getElementById('sokol');
    if (s) s.classList.toggle('is-quiet', on);
    if (on && window.Sokol && typeof window.Sokol.hide === 'function') {
      window.Sokol.hide();
    }
  }

  /* ── Запуск ── */
  function init() {
    const box = $('#quizBox');
    if (!box) return;

    loadStore();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          inView = entry.isIntersecting;
          quietSokol(inView);
        });
      }, { threshold: 0.15 });
      io.observe(document.getElementById('quiz') || box);
    }

    document.addEventListener('keydown', onKey);
    load();
  }

  window.MakarQuiz = { init: init, load: load };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
