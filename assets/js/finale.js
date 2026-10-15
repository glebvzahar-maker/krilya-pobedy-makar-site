/* finale.js — кнопка приёмки проекта комиссией.
 *
 * Комиссия жмёт кнопку в финале: загорается фейерверк, из центра во все
 * стороны вылетают самолёты, а сверху падает «печать» ПРИНЯТО с датой.
 *
 * Отдельный модуль, а не строчка в main.js: там уже 700 строк, а здесь своя
 * анимация на весь экран со своим requestAnimationFrame.
 */
(function () {
  'use strict';

  const KEY = 'makarFinaleVerdict';
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PALETTE = [
    [255, 91, 35],   // акцент — оранжевый
    [240, 178, 60],  // золото
    [93, 240, 182],  // hud-зелёный
    [154, 167, 255], // ночной синий
    [255, 255, 255],
    [255, 122, 189]  // розовый
  ];

  let canvas, ctx, w, h, raf = 0, running = false;
  let rockets = [], sparks = [], planes = [], rings = [];
  let flash = 0, dens = 1, px = 1;
  let lastLaunch = 0;

  /* Плотность эффекта считаем от площади секции в CSS-пикселях. На телефоне
     секция вчетверо меньше десктопной, и при одинаковом числе частиц
     экран забивается так, что салюта не видно. */
  const DENS_REF = 430000;

  /* Пауза между запусками ракет, мс. 4-5 ракет в секунду: глазом разницы
     не видит, а нагрузки на прорисовку почти нет. */
  const LAUNCH_GAP = 210;

  /* Потолок на число живых искр. Перестраховка на случай, как если бы
     вкладка была свёрнута и ожила, пропустив кучу кадров разом. */
  const MAX_SPARKS = 1600;

  function resize() {
    if (!canvas) return;
    /* Праздничный канвас рисуем не в полном devicePixelRatio. На ноутбуке с
       Retina это 2880×1570 — 4,5 мегапикселя, и каждая вспышка и каждый
       разрыв обходятся слишком дорого. Искры и самолёты на 1.5 выглядят так
       же, а работы втрое меньше. */
    const scale = Math.min(devicePixelRatio, 1.5);
    w = canvas.width = Math.round(canvas.offsetWidth * scale);
    h = canvas.height = Math.round(canvas.offsetHeight * scale);
    px = scale;
    const cssArea = canvas.offsetWidth * canvas.offsetHeight;
    dens = Math.max(.4, Math.min(1.4, cssArea / DENS_REF));
  }

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* Силуэт самолёта — тот же, что в фоновом эффекте финала, только тут он
     летит по вектору скорости.
     Свечение сделано вторым проходом полупрозрачным силуэтом, а не
     shadowBlur: тень на каждом самолёте стоила дороже всего остального
     эффекта вместе взятого — картинка и так рисуется аддитивно. */
  function silhouette(ctx2, p, color, scale) {
    ctx2.fillStyle = color;
    ctx2.beginPath();
    ctx2.moveTo(0, -p.s * scale);
    ctx2.quadraticCurveTo(p.s * .18 * scale, -p.s * .2 * scale, p.s * .95 * scale, p.s * .55 * scale);
    ctx2.lineTo(p.s * .1 * scale, p.s * .32 * scale);
    ctx2.quadraticCurveTo(p.s * .12 * scale, p.s * .75 * scale, 0, p.s * scale);
    ctx2.quadraticCurveTo(-p.s * .12 * scale, p.s * .75 * scale, -p.s * .1 * scale, p.s * .32 * scale);
    ctx2.lineTo(-p.s * .95 * scale, p.s * .55 * scale);
    ctx2.quadraticCurveTo(-p.s * .18 * scale, -p.s * .2 * scale, 0, -p.s * scale);
    ctx2.fill();
  }

  function drawPlane(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
    silhouette(ctx, p, p.color, 1.5);
    silhouette(ctx, p, p.color, 1);
    ctx.restore();
  }

  /* Ракета: летит снизу вверх, замедляясь, и разрывается в верхней точке. */
  function launchRocket() {
    rockets.push({
      x: w * (.12 + Math.random() * .76),
      y: h,
      vx: (Math.random() * 2 - 1) * .35 * px,
      vy: -(5.2 + Math.random() * 2.6) * px,
      hue: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      trail: []
    });
  }

  function explode(x, y, hue) {
    const n = Math.round((80 + Math.random() * 46) * px * dens);
    const speed = (1.7 + Math.random() * 2.1) * px;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * .14;
      const v = speed * (.5 + Math.random() * .8);
      sparks.push({
        x, y, px: x, py: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        hue,
        life: 1,
        decay: .0045 + Math.random() * .0035,
        size: (2 + Math.random() * 2.6) * px
      });
    }
    rings.push({ x, y, r: 0, hue, alpha: .8 });
  }

  /* Волна самолётов из центра секции — во все стороны сразу. */
  function launchPlanes() {
    const cx = w / 2, cy = h * .44;
    const n = Math.round(30 * px * dens);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = (3.6 + Math.random() * 2.8) * px;
      const c = PALETTE[Math.floor(Math.random() * 3)];
      planes.push({
        x: cx, y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - .5 * px,
        s: (11 + Math.random() * 10) * px,
        color: 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.95)',
        life: 1
      });
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,240,210,' + flash + ')';
      ctx.fillRect(0, 0, w, h);
      flash -= .07;
      if (flash < 0) flash = 0;
    }

    rockets = rockets.filter(function (r) {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 9) r.trail.shift();
      r.x += r.vx;
      r.vy += .045 * px;
      r.y += r.vy;
      if (r.vy >= -.35 * px) {
        explode(r.x, r.y, r.hue);
        flash = Math.min(.42, flash + .12);
        return false;
      }
      /* Шлейф ракеты — без него в тёмном небе не видно, что летит. */
      for (let i = 1; i < r.trail.length; i++) {
        ctx.fillStyle = rgba(r.hue, i / r.trail.length * .55);
        ctx.beginPath();
        ctx.arc(r.trail[i].x, r.trail[i].y, 2 * px * (i / r.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = rgba(r.hue, 1);
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3.4 * px, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    sparks = sparks.filter(function (s) {
      s.px = s.x; s.py = s.y;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += .055 * px;
      s.vx *= .988;
      s.vy *= .988;
      s.life -= s.decay;
      if (s.life <= 0) return false;
      /* Хвост искры: отрезок от прошлой точки. Даёт ощущение взрыва,
         а не россыпи точек. */
      ctx.strokeStyle = rgba(s.hue, s.life * .8);
      ctx.lineWidth = s.size * s.life;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.fillStyle = rgba(s.hue, Math.min(1, s.life * 1.4));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life * .7, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    rings = rings.filter(function (r) {
      r.r += 3.4 * px;
      r.alpha -= .022;
      if (r.alpha <= 0) return false;
      ctx.strokeStyle = rgba(r.hue, r.alpha);
      ctx.lineWidth = 2 * px;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    planes = planes.filter(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += .028 * px;
      p.life -= .0045;
      if (p.life <= 0) return false;
      drawPlane(p);
      return true;
    });

    ctx.globalCompositeOperation = 'source-over';

    /* Ракета — по таймеру, а не каждый кадр. При запуске «по кадру» на
       60 Гц улетало 60-120 ракет в секунду, каждая разлеталась на 200-350
       искр, и на ноутбуке с Retina-экраном кадр проседал в заметную
       дробь. Здесь 4-5 ракет в секунду плюс жёсткий потолок на искры. */
    if (running && t - lastLaunch >= LAUNCH_GAP) {
      lastLaunch = t;
      launchRocket();
      if (Math.random() < .3) launchRocket();
    }
    if (sparks.length > MAX_SPARKS) sparks.splice(0, sparks.length - MAX_SPARKS);

    if (running || rockets.length || sparks.length || planes.length || rings.length || flash > 0) {
      raf = requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, w, h);
      raf = 0;
    }
  }

  function start(durationMs) {
    if (!canvas || !ctx) return;
    resize();
    if (!raf) raf = requestAnimationFrame(frame);
    running = true;
    launchPlanes();
    launchRocket();
    flash = .5;
    clearTimeout(start._t);
    start._t = setTimeout(function () { running = false; }, durationMs || 4200);
  }

  const ACCEPT_LABEL = 'ПРИНЯТЬ ПРОЕКТ КОМИССИЕЙ';
  const REPLAY_LABEL = 'ПОВТОРИТЬ САЛЮТ';
  const HINT_IDLE = 'Нажимает комиссия после защиты — и на экране появляется отметка о приёмке';
  const HINT_REPLAY = 'Салют можно посмотреть сколько угодно раз — кнопка работает при каждом обновлении страницы';

  /* Звук салюта. Громкость фоновой музыки на время гасим почти полностью,
     иначе две дорожки бьются друг о друга и обе звучат грязно — те же
     значения и приём, что в voice.js для доклада Макара. */
  const SALUTE_SRC = 'assets/media/zvuk-saljuta.mp3';
  const SALUTE_VOL = 0.85;
  const MUSIC_VOL = 0.45;

  let saluteAudio = null;

  function bgMusic() {
    return typeof window.__bgMusic === 'function' ? window.__bgMusic() : null;
  }

  function playSalute() {
    const m = bgMusic();
    if (m && !m.paused) m.volume = MUSIC_VOL * 0.1;
    if (REDUCE) return;

    if (!saluteAudio) {
      saluteAudio = new Audio(SALUTE_SRC);
      saluteAudio.preload = 'auto';
      saluteAudio.volume = SALUTE_VOL;
    }
    /* Повторное нажатие не должно начинать дорожку с середины. */
    saluteAudio.currentTime = 0;
    saluteAudio.play().catch(function () {
      /* Браузер не дал звук — салют всё равно идёт, это не поломка. */
    });
  }

  function restoreMusic() {
    const m = bgMusic();
    if (m && !m.paused) m.volume = MUSIC_VOL;
  }

  /* Дату не пересчитываем: приёмка уже была, повторный салют — это просто
     повтор просмотра. Иначе печать меняла бы дату на каждом запуске. */
  let acceptedDate = null;

  function label(btn, hint) {
    btn.textContent = acceptedDate ? REPLAY_LABEL : ACCEPT_LABEL;
    btn.classList.toggle('replay', !!acceptedDate);
    if (hint) hint.textContent = acceptedDate ? HINT_REPLAY : HINT_IDLE;
  }

  function stamp() {
    const panel = document.getElementById('verdict');
    const dateEl = document.getElementById('verdictDate');
    if (!panel) return;

    if (!acceptedDate) {
      acceptedDate = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      try { localStorage.setItem(KEY, acceptedDate); } catch (e) { /* приватный режим */ }
    }
    if (dateEl) dateEl.textContent = acceptedDate;

    panel.hidden = false;
    panel.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
    if (window.showToast) {
      window.showToast('Комиссия приняла проект!', 'Макар Захаренко, «Крылья Победы. От Ил-2 до Су-57»');
    }
  }

  function restore() {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* нет доступа */ }
    if (!saved) return;
    acceptedDate = saved;
    const panel = document.getElementById('verdict');
    const dateEl = document.getElementById('verdictDate');
    if (!panel) return;
    if (dateEl) dateEl.textContent = saved;
    panel.hidden = false;
  }

  function init() {
    canvas = document.getElementById('finaleBoom');
    const btn = document.getElementById('acceptBtn');
    if (!canvas || !btn) return;

    ctx = canvas.getContext('2d');
    resize();
    addEventListener('resize', resize);

    const hint = document.getElementById('acceptHint');

    /* Кнопка не блокируется навсегда: после перезагрузки страницы приёмку
       можно посмотреть снова. Блокируется только на время салюта, чтобы
       случайный второй клик не запустил вторую волну поверх первой. */
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      playSalute();
      if (REDUCE) {
        stamp();
        label(btn, hint);
        btn.disabled = false;
        return;
      }
      start(4200);
      setTimeout(stamp, 420);
      setTimeout(function () {
        label(btn, hint);
        btn.disabled = false;
        restoreMusic();
      }, 9800);
    });

    restore();
    label(btn, hint);
  }

  /* main.js вызывает это из DOMContentLoaded. */
  window.MakarFinale = { init: init, celebrate: start };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();