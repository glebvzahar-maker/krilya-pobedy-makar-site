/* pilotquiz.js — Тест «Какой ты пилот?»
   --
   Короткий личностный тест для гостей и комиссии: шесть вопросов и тип
   самолёта. Живёт под основной викториной в секции #quiz отдельной
   карточкой, чтобы не спорить с ней за внимание.

   Отличие от викторины эскадрильи: тут нет правильных ответов и нет
   наград — это развлечение. Но есть счётчик вопросов, отклик на выбор
   и сохранение результата, чтобы после перезагрузки страницы не
   приходилось проходить заново.
*/
(function(){
  'use strict';

  const STORE = 'makarPilotQuiz';

  const QUIZ_TYPES = {
    fighter: { name: 'ИСТРЕБИТЕЛЬ ЯК-3', desc: 'Ты быстрый, смелый и любишь быть первым! Как легендарный Як-3: вступай в бой первым и побеждай манёвром. Такие пилоты прикрывают друзей и не бросают своих.' },
    storm: { name: 'ШТУРМОВИК ИЛ-2', desc: 'Ты надёжный боец и настоящий товарищ! Как «летающий танк» Ил-2: идёшь вперёд, защищаешь пехоту и доводишь дело до конца, что бы ни случилось.' },
    bomber: { name: 'БОМБАРДИРОВЩИК ПЕ-2', desc: 'Ты стратег команды! Как скоростной Пе-2: сначала думаешь, потом действуешь. Точно выполняешь задачу и всегда знаешь план Б.' },
    scout: { name: 'НОЧНОЙ РАЗВЕДЧИК ПО-2', desc: 'Ты тихий, терпеливый и очень точный! Как По-2 «ночных ведьм»: никто тебя не слышит, а работу ты делаешь идеально. Хитрость и спокойствие — твоё оружие.' },
    balanced: { name: 'УНИВЕРСАЛЬНЫЙ ЛЁТЧИК', desc: 'Ты одинаково готов и в ближнем бою, и в разведке, и под бомбами. В сложный момент ты выбираешь не любимое дело, а нужное — а это самый ценный пилотский навык.' }
  };

  const QUESTIONS = [
    { q: 'Задача кажется совсем сложной. Что делаешь?', a: [['Атакую сразу — разберусь на месте!', 'fighter'], ['Иду напролом, я же в броне!', 'storm'], ['Сначала продумаю план действий', 'bomber'], ['Подожду нужный момент и сделаю тихо', 'scout']] },
    { q: 'Какая роль тебе ближе в команде?', a: [['Защищать друзей', 'fighter'], ['Пробиваться первым и прикрывать всех', 'storm'], ['Придумывать общий план', 'bomber'], ['Разведать и добыть важные сведения', 'scout']] },
    { q: 'Выбери время для вылета:', a: [['Ясный день — видно всё вокруг!', 'fighter'], ['Мне любое время года — броня держит', 'storm'], ['Рассвет — чтобы успеть до жары', 'bomber'], ['Ночь — моя любимая пора', 'scout']] },
    { q: 'Что важнее в работе?', a: [['Скорость реакции', 'fighter'], ['Надёжность и сила', 'storm'], ['Точный расчёт', 'bomber'], ['Терпение и точность', 'scout']] },
    { q: 'Друг попал в трудную ситуацию. Ты…', a: [['Мчусь помогать сразу!', 'fighter'], ['Стану стеной между другом и бедой', 'storm'], ['Быстро придумаю, как выручить', 'bomber'], ['Тихо помогу так, что он даже не заметит', 'scout']] },
    { q: 'Твоё девиз:', a: [['«Быстрее всех — сильнее всех!»', 'fighter'], ['«Не пройдёшь, пока я стою!»', 'storm'], ['«Семь раз отмерь — один отрежь»', 'bomber'], ['«Тихо едет — далеко увидит»', 'scout']] }
  ];

  const LETTERS = ['А', 'Б', 'В', 'Г'];

  let step = 0;
  let scores = { fighter: 0, storm: 0, bomber: 0, scout: 0 };
  let lastResult = null;
  let lockTimer = null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (raw && raw.winner) lastResult = raw.winner;
    } catch (e) {
      console.error('[pilotquiz] Failed to read result:', e);
    }
  }

  function saveStore(winner) {
    try {
      localStorage.setItem(STORE, JSON.stringify({ winner: winner, ts: Date.now() }));
    } catch (e) {
      console.error('[pilotquiz] Failed to save result:', e);
    }
  }

  function container() {
    return $('#pilotQuizBox');
  }

  function render() {
    const box = container();
    if (!box) return;

    if (step < QUESTIONS.length) {
      const item = QUESTIONS[step];
      box.innerHTML =
        '<div class="quiz-head">' +
          '<div class="quiz-counter">ВОПРОС <b>' + (step + 1) + '</b> / ' + QUESTIONS.length + '</div>' +
          '<div class="quiz-bar"><i style="width:' + Math.round((step / QUESTIONS.length) * 100) + '%"></i></div>' +
        '</div>' +
        '<div class="quiz-q" aria-live="polite">' + escapeHtml(item.q) + '</div>' +
        '<div class="quiz-answers" role="radiogroup" aria-label="Варианты ответа">' +
          item.a.map(function(pair, i) {
            return '<button class="quiz-answer" type="button" role="radio" aria-checked="false" data-i="' + i + '">' +
              '<span class="quiz-letter">' + LETTERS[i] + '</span>' +
              '<span class="quiz-text">' + escapeHtml(pair[0]) + '</span>' +
            '</button>';
          }).join('') +
        '</div>';

      $$('.quiz-answer', box).forEach(function(btn) {
        btn.addEventListener('click', function() { pick(parseInt(btn.dataset.i, 10), btn); });
      });
      return;
    }

    renderResult(box);
  }

  function pick(index, btn) {
    const item = QUESTIONS[step];
    scores[item.a[index][1]]++;

    /* Отклик: показываем, что выбор засчитан, и только потом идём дальше */
    $$('.quiz-answer', container()).forEach(function(b) {
      b.disabled = true;
      if (b === btn) b.classList.add('is-picked');
      else b.classList.add('is-dim');
    });

    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(function() {
      step++;
      render();
    }, 320);
  }

  function renderResult(box) {
    const entries = Object.keys(scores).map(function(k) { return [k, scores[k]]; });
    const max = Math.max.apply(null, entries.map(function(e) { return e[1]; }));
    const winners = entries.filter(function(e) { return e[1] === max; });

    /* Ничья — честный ответ «универсал», а не всегда первый в списке */
    const key = winners.length > 1 ? 'balanced' : winners[0][0];
    const t = QUIZ_TYPES[key];

    lastResult = key;
    saveStore(key);

    box.innerHTML =
      '<div class="quiz-result">' +
        '<div class="stamp">ДОПУСК В НЕБО ПОЛУЧЕН</div>' +
        '<h3>' + t.name + '</h3>' +
        '<p>' + t.desc + '</p>' +
        '<button class="btn btn-ghost quiz-restart" type="button">ПРОЙТИ ЗАНОВО</button>' +
      '</div>';

    const restart = $('.quiz-restart', box);
    if (restart) {
      restart.addEventListener('click', function() {
        step = 0;
        Object.keys(scores).forEach(function(k) { scores[k] = 0; });
        render();
      });
    }
  }

  function init() {
    const box = container();
    if (!box) return;

    loadStore();

    if (lastResult && QUIZ_TYPES[lastResult]) {
      const t = QUIZ_TYPES[lastResult];
      box.innerHTML =
        '<div class="quiz-result">' +
          '<div class="stamp">ТВОЙ САМОЛЁТ</div>' +
          '<h3>' + t.name + '</h3>' +
          '<p>' + t.desc + '</p>' +
          '<button class="btn btn-ghost quiz-restart" type="button">ПРОЙТИ ЗАНОВО</button>' +
        '</div>';
      const restart = $('.quiz-restart', box);
      if (restart) {
        restart.addEventListener('click', function() {
          step = 0;
          Object.keys(scores).forEach(function(k) { scores[k] = 0; });
          render();
        });
      }
      return;
    }

    render();
  }

  window.MakarPilotQuiz = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
