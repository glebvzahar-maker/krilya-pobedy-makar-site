/* squadron.js — Эскадрилья: воздушные новости
   --
   Раньше здесь же была мини-викторина, но она пряталась в модальном окне
   и обрезалась по высоте. Теперь викторина живёт в секции #quiz
   (assets/js/quiz.js), а отсюда остались только новости эскадрильи.
*/
(function(){
  'use strict';

  let _data = null;
  let _currentNews = null;

  /* Загрузка данных */
  function load() {
    return fetch('assets/data/squadron.json')
      .then(r => r.json())
      .then(data => {
        _data = data;
        return data;
      })
      .catch(e => {
        console.error('[squadron] Failed to load:', e);
        return null;
      });
  }

  /* Случайная новость (не повторяем предыдущую) */
  function pickNews() {
    if (!_data || !_data.news || _data.news.length === 0) return null;

    const available = _data.news.filter(n => n.id !== (_currentNews && _currentNews.id));
    if (available.length === 0) return _data.news[0];

    _currentNews = available[Math.floor(Math.random() * available.length)];
    return _currentNews;
  }

  /* Рендер новостей */
  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const news = pickNews();
    if (!news) {
      container.innerHTML = '<div class="squadron-empty">Новостей пока нет.</div>';
      return;
    }

    const eraIcon = news.era === 'ww2' ? '⚔️' : '✈️';
    const eraLabel = news.era === 'ww2' ? 'ВОВ' : 'Наши дни';

    container.innerHTML = `
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

  /* Экспорт */
  window.Squadron = {
    load: load,
    render: render,
    pickNews: pickNews
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
    .squadron-empty {
      color: #5a6a7a;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => load());
  } else {
    load();
  }
})();
