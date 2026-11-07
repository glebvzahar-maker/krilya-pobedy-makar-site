/* mvcarousel.js — карусель «Видео от Макара».
 *
 * Роликов уже восемь, и дальше будет больше: плитка на всю ширину
 * растягивает страницу и съедает место на телефоне. Поэтому показываем
 * одну плашку по центру, а переключаем стрелками (и пальцем по горизонтали).
 *
 * Прокрутка — нативная, со снапом: ползунок сам доводит карточку до центра.
 */
(function () {
  'use strict';

  function init() {
    var wrap = document.getElementById('mvCarousel');
    var track = document.getElementById('mvGrid');
    var prev = wrap && wrap.querySelector('.mv-prev');
    var next = wrap && wrap.querySelector('.mv-next');
    var counter = document.getElementById('mvCounter');
    if (!wrap || !track || !prev || !next) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.mv-card'));
    if (!cards.length) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function step() {
      if (cards.length < 2) return cards[0].offsetWidth + 24;
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }

    /* Номер ближайшей к центру карточки */
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      cards.forEach(function (c, i) {
        var center = c.offsetLeft + c.offsetWidth / 2;
        var d = Math.abs(center - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    }

    function update() {
      var i = current();
      if (counter) counter.textContent = (i + 1) + ' / ' + cards.length;
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }

    function go(dir) {
      var i = Math.min(cards.length - 1, Math.max(0, current() + dir));
      var card = cards[i];
      var left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      track.scrollTo({
        left: Math.max(0, left),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
      setTimeout(update, reduceMotion ? 60 : 420);
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });

    /* Клик по любой части плашки запускает видео.
       В браузере клик по самому ролику ничего не делает — играть надо
       только кнопкой Play, а она мелкая на телефоне. Нижние 46 px
       (панель управления) не трогаем: там своя кнопка Play. */
    cards.forEach(function (card) {
      var video = card.querySelector('video');
      if (!video) return;
      card.classList.add('mv-playable');
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var r = video.getBoundingClientRect();
        /* Панель управления — только нижние 46 px САМОГО видео */
        var inControls = e.clientY > r.bottom - 46 && e.clientY <= r.bottom &&
                         e.clientX > r.left && e.clientX < r.right;
        if (inControls) return;
        e.preventDefault();
        if (video.paused) {
          /* Одновременно пусть играет только один ролик */
          cards.forEach(function (other) {
            var ov = other.querySelector('video');
            if (ov && ov !== video && !ov.paused) ov.pause();
          });
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          video.pause();
        }
      });
    });

    track.addEventListener('scroll', function () {
      window.clearTimeout(track._mvT);
      track._mvT = window.setTimeout(update, 90);
    }, { passive: true });

    addEventListener('resize', update);
    /* Стрелки клавиатуры, когда фокус в карусели */
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    update();
    setTimeout(update, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
