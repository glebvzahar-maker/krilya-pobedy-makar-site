/* squadron.js — Эскадрилья: воздушные новости + мини-викторина */
(function(){
  'use strict';

  let _data = null;
  let _currentNews = null;
  let _currentQuiz = null;
  let _quizAnswered = {};

  /* Загрузка данных */
  function load() {
    return fetch('assets/data/squadron.json')
      .then(r => r.json())
      .then(data => {
        _data = data;
        _quizAnswered = JSON.parse(localStorage.getItem('squadronQuizAnswered') || '{}');
        return data;
      })
      .catch(e => {
        console.error('[squadron] Failed to load:', e);
        return null;
      });
  }

  /* Случайная новость (учитываем дату — берём «свежую» или случайную) */
  function pickNews() {
    if (!_data || !_data.news || _data.news.length === 0) return null;

    // Берём случайную, но не повторяем
    const available = _data.news.filter(n => n.id !== (_currentNews && _currentNews.id));
    if (available.length === 0) return _data.news[0];

    _currentNews = available[Math.floor(Math.random() * available.length)];
    return _currentNews;
  }

  /* Случайный вопрос викторины (не отвеченный) */
  function pickQuiz() {
    if (!_data || !_data.quiz || _data.quiz.length === 0) return null;

    const unanswered = _data.quiz.filter(q => !_quizAnswered[q.id]);
    if (unanswered.length === 0) {
      // Все отвечены — повторяем случайный
      _quizAnswered = {};
      localStorage.removeItem('squadronQuizAnswered');
      return _data.quiz[Math.floor(Math.random() * _data.quiz.length)];
    }

    _currentQuiz = unanswered[Math.floor(Math.random() * unanswered.length)];
    return _currentQuiz;
  }

  /* Ответить на вопрос */
  function answerQuiz(questionId, answerIndex) {
    if (!_data) return { correct: false };

    const q = _data.quiz.find(x => x.id === questionId);
    if (!q) return { correct: false };

    const correct = q.correct === answerIndex;
    _quizAnswered[questionId] = { correct, timestamp: Date.now() };

    try {
      localStorage.setItem('squadronQuizAnswered', JSON.stringify(_quizAnswered));
    } catch (e) {
      console.error('[squadron] Failed to save answer:', e);
    }

    return {
      correct,
      hint: correct ? null : q.hint,
      text: q.options[answerIndex]
    };
  }

  /* Рендер новостей + викторины */
  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const news = pickNews();
    const quiz = pickQuiz();

    if (!news && !quiz) {
      container.innerHTML = '<div class="squadron-empty">Загрузка данных эскадрильи...</div>';
      return;
    }

    let html = '';

    // Блок новостей
    if (news) {
      const eraIcon = news.era === 'ww2' ? '⚔️' : '✈️';
      const eraLabel = news.era === 'ww2' ? 'ВОВ' : 'Наши дни';
      html += `
        <div class="squadron-news">
          <div class="squadron-news-header">
            <span class="squadron-era">${eraIcon} ${eraLabel}</span>
            <span class="squadron-date">${news.date}</span>
          </div>
          <h4 class="squadron-headline">${news.headline}</h4>
          <p class="squadron-text">${news.text}</p>
          <div class="squadron-fact">💡 ${news.fact}</div>
        </div>
      `;
    }

    // Блок викторины
    if (quiz) {
      html += `
        <div class="squadron-quiz" id="squadronQuiz">
          <div class="squadron-quiz-header">
            <span class="squadron-quiz-icon">🎯</span>
            <span>Воздушная викторина</span>
          </div>
          <div class="squadron-question">${quiz.question}</div>
          <div class="squadron-options">
            ${quiz.options.map((opt, i) => `
              <button class="squadron-option" data-qid="${quiz.id}" data-idx="${i}">${opt}</button>
            `).join('')}
          </div>
          <div class="squadron-hint" id="squadronHint" style="display:none"></div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Привязка событий викторины
    container.querySelectorAll('.squadron-option').forEach(btn => {
      btn.addEventListener('click', handleQuizAnswer);
    });
  }

  /* Обработка ответа */
  function handleQuizAnswer(e) {
    const btn = e.currentTarget;
    const qid = btn.dataset.qid;
    const idx = parseInt(btn.dataset.idx, 10);

    const result = answerQuiz(qid, idx);

    // Подсветить кнопки
    const options = btn.closest('.squadron-options');
    options.querySelectorAll('.squadron-option').forEach((b, i) => {
      b.disabled = true;
      b.classList.add('disabled');
      if (i === _currentQuiz.correct) {
        b.classList.add('correct');
      }
      if (b === btn && !result.correct) {
        b.classList.add('wrong');
      }
    });

    // Показать подсказку
    const hintEl = document.getElementById('squadronHint');
    if (hintEl) {
      if (result.correct) {
        hintEl.innerHTML = '✅ Правильно! Штурман Сокол гордится!';
        hintEl.style.display = 'block';
        hintEl.className = 'squadron-hint correct';

        // Выдать бонус
        if (window.AmmoSystem) {
          window.AmmoSystem.maybe();
        }
      } else {
        hintEl.innerHTML = `❌ Неправильно. ${result.hint}`;
        hintEl.style.display = 'block';
        hintEl.className = 'squadron-hint wrong';
      }

      // Добавить кнопку «Следующий вопрос»
      const nextBtn = document.createElement('button');
      nextBtn.className = 'squadron-next-btn';
      nextBtn.textContent = '➡️ Следующий вопрос';
      nextBtn.addEventListener('click', function() {
        const container = document.getElementById('squadronContent');
        if (container) render('squadronContent');
      });
      hintEl.parentNode.insertBefore(nextBtn, hintEl.nextSibling);
    }
  }

  /* Экспорт */
  window.Squadron = {
    load: load,
    render: render,
    pickNews: pickNews,
    pickQuiz: pickQuiz
  };

  /* CSS */
  const style = document.createElement('style');
  style.textContent = `
    .squadron-news {
      background: rgba(42, 56, 73, 0.4);
      border: 1px solid #2a3849;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .squadron-news-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .squadron-era {
      font-size: 11px;
      color: #ff5b23;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .squadron-date {
      font-size: 11px;
      color: #5a6a7a;
    }
    .squadron-headline {
      color: #f0b23c;
      font-family: 'Russo One', sans-serif;
      font-size: 16px;
      margin: 0 0 8px 0;
      letter-spacing: 0.02em;
    }
    .squadron-text {
      color: #c8d0dc;
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 10px 0;
    }
    .squadron-fact {
      background: rgba(93, 240, 182, 0.1);
      border-left: 3px solid #5df0b6;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 12px;
      color: #5df0b6;
    }

    /* Викторина */
    .squadron-quiz {
      background: rgba(42, 56, 73, 0.4);
      border: 1px solid #2a3849;
      border-radius: 10px;
      padding: 16px;
    }
    .squadron-quiz-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #9aa7ff;
      font-weight: 600;
    }
    .squadron-quiz-icon {
      font-size: 18px;
    }
    .squadron-question {
      color: #e9eef5;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .squadron-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .squadron-option {
      background: rgba(42, 56, 73, 0.5);
      border: 1px solid #2a3849;
      color: #e9eef5;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      text-align: left;
      transition: all 0.2s;
    }
    .squadron-option:hover:not(.disabled) {
      background: rgba(42, 56, 73, 0.8);
      border-color: #9aa7ff;
    }
    .squadron-option.correct {
      background: rgba(93, 240, 182, 0.2);
      border-color: #5df0b6;
      color: #5df0b6;
    }
    .squadron-option.wrong {
      background: rgba(255, 91, 35, 0.2);
      border-color: #ff5b23;
      color: #ff5b23;
    }
    .squadron-option.disabled {
      cursor: default;
      opacity: 0.7;
    }
    .squadron-hint {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.4;
    }
    .squadron-hint.correct {
      background: rgba(93, 240, 182, 0.15);
      color: #5df0b6;
    }
    .squadron-hint.wrong {
      background: rgba(255, 91, 35, 0.15);
      color: #ff5b23;
    }
    .squadron-empty {
      color: #5a6a7a;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
    .squadron-next-btn {
      display: block;
      width: 100%;
      margin-top: 12px;
      padding: 10px 16px;
      background: rgba(93, 240, 182, 0.15);
      border: 1px solid #5df0b6;
      color: #5df0b6;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .squadron-next-btn:hover {
      background: rgba(93, 240, 182, 0.25);
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => load());
  } else {
    load();
  }
})();
