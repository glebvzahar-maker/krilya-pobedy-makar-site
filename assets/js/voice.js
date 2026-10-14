/* voice.js — голос Макара как сопроводительный рассказ.
 *
 * Один модуль на все разделы: карточки героев, фильмы, части самолёта.
 * Разметка: на любом кликабельном элементе ставим data-voice="assets/media/voice/x.mp3".
 * Клик по нему запускает запись; повторный клик по той же карточке — останавливает.
 *
 * Индикатор «Макар рассказывает» рисуется автоматически рядом с карточкой
 * и убирается, когда дорожка доиграла или её прервали.
 */
(function () {
  'use strict';

  var MUSIC_VOL = 0.45;
  var DUCK_FACTOR = 0.1;   /* на время доклада музыка почти не слышна */
  var VOLUME = 0.9;

  /* Плеер и индикатор */
  var player = null;
  var src = '';
  var holder = null;       /* элемент, у которого показан индикатор */
  var indicator = null;
  var stopBtn = null;

  /* Фоновая музыка живёт в main.js — отдаём ссылку наружу */
  function bgMusic() {
    return typeof window.__bgMusic === 'function' ? window.__bgMusic() : null;
  }

  function duckOn() {
    var m = bgMusic();
    if (m && !m.paused) m.volume = MUSIC_VOL * DUCK_FACTOR;
  }
  function duckOff() {
    var m = bgMusic();
    if (m && !m.paused) m.volume = MUSIC_VOL;
  }

  function buildIndicator() {
    if (indicator) return indicator;
    indicator = document.createElement('div');
    indicator.className = 'voice-on';
    indicator.setAttribute('role', 'status');
    indicator.innerHTML =
      '<span class="voice-on-dots"><i></i><i></i><i></i></span>' +
      '<span class="voice-on-text">Макар рассказывает</span>';
    return indicator;
  }

  function showIndicator(el) {
    if (!el) return;
    if (holder && holder !== el) hideIndicator();
    holder = el;
    el.classList.add('voice-active');
    /* карточка — блочная, индикатор вставляем внутрь как последний узел */
    var box = buildIndicator();
    el.appendChild(box);
  }

  function hideIndicator() {
    if (holder) holder.classList.remove('voice-active');
    if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
    holder = null;
  }

  function stop() {
    if (player) {
      try { player.pause(); } catch (e) { /* Safari */ }
      try { player.currentTime = 0; } catch (e) { /* Safari */ }
    }
    hideIndicator();
    duckOff();
  }

  function ensurePlayer() {
    if (player) return player;
    player = new Audio();
    player.preload = 'none';
    player.volume = VOLUME;
    player.addEventListener('ended', function () {
      hideIndicator();
      duckOff();
    });
    return player;
  }

  /* Запустить дорожку. card — элемент, у которого показать индикатор. */
  function play(file, card) {
    if (!file) return;
    if (player && src === file) { stop(); return; }  /* повторный клик — пауза */

    stop();
    src = file;
    var p = ensurePlayer();
    p.src = file;
    try { p.currentTime = 0; } catch (e) { /* Safari */ }
    showIndicator(card);
    var started = p.play();
    if (started && started.catch) {
      started.catch(function () {
        /* Браузер запретил автозапуск — убираем индикатор, молча */
        hideIndicator();
        duckOff();
      });
      started.then(function () { duckOn(); }).catch(function () {});
    }
  }

  /* Навешиваем обработчик на все [data-voice] внутри контейнера */
  function bind(root) {
    (root || document).querySelectorAll('[data-voice]').forEach(function (el) {
      if (el.dataset.voiceBound) return;
      el.dataset.voiceBound = '1';
      el.addEventListener('click', function () {
        play(el.dataset.voice, el);
      });
    });
  }

  /* Автозапуск при появлении раздела во вьюпорте — один раз за сессию */
  function auto(root) {
    (root || document).querySelectorAll('[data-voice-auto]').forEach(function (el) {
      if (el.dataset.voiceAutoBound) return;
      el.dataset.voiceAutoBound = '1';
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          play(el.dataset.voiceAuto, el);
        });
      }, { threshold: 0.45 });
      io.observe(el);
    });
  }

  function init() {
    bind();
    auto();
  }

  window.MakarVoice = { play: play, stop: stop, bind: bind, init: init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();