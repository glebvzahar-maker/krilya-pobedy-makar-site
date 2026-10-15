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
  let flash = 0, dens = 1;

  /* Плотность эффекта считаем от площади секции в CSS-пикселях. На телефоне
     секция вчетверо меньше десктопной, и при одинаковом числе частиц
     экран забивается так, что салюта не видно. */
  const DENS_REF = 430000;

  function resize() {
    if (!canvas) return;
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    const cssArea = (w / devicePixelRatio) * (h / devicePixelRatio);
    dens = Math.max(.4, Math.min(1.4, cssArea / DENS_REF));
  }

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* Силуэт самолёта — тот же, что в фоновом эффекте финала, только тут он
     летит по вектору скорости. */
  function drawPlane(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.quadraticCurveTo(p.s * .18, -p.s * .2, p.s * .95, p.s * .55);
    ctx.lineTo(p.s * .1, p.s * .32);
    ctx.quadraticCurveTo(p.s * .12, p.s * .75, 0, p.s);
    ctx.quadraticCurveTo(-p.s * .12, p.s * .75, -p.s * .1, p.s * .32);
    ctx.lineTo(-p.s * .95, p.s * .55);
    ctx.quadraticCurveTo(-p.s * .18, -p.s * .2, 0, -p.s);
    ctx.fill();
    ctx.restore();
  }

  /* Ракета: летит снизу вверх, замедляясь, и разрывается в верхней точке. */
  function launchRocket() {
    rockets.push({
      x: w * (.12 + Math.random() * .76),
      y: h,
      vx: (Math.random() * 2 - 1) * .35 * devicePixelRatio,
      vy: -(5.2 + Math.random() * 2.6) * devicePixelRatio,
      hue: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      trail: []
    });
  }

  function explode(x, y, hue) {
    const n = Math.round((80 + Math.random() * 46) * devicePixelRatio * dens);
    const speed = (1.7 + Math.random() * 2.1) * devicePixelRatio;
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
        size: (2 + Math.random() * 2.6) * devicePixelRatio
      });
    }
    rings.push({ x, y, r: 0, hue, alpha: .8 });
  }

  /* Волна самолётов из центра секции — во все стороны сразу. */
  function launchPlanes() {
    const cx = w / 2, cy = h * .44;
    const n = Math.round(30 * devicePixelRatio * dens);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = (3.6 + Math.random() * 2.8) * devicePixelRatio;
      const c = PALETTE[Math.floor(Math.random() * 3)];
      planes.push({
        x: cx, y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - .5 * devicePixelRatio,
        s: (11 + Math.random() * 10) * devicePixelRatio,
        color: 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.95)',
        life: 1
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,240,210,' + flash + ')';
      ctx.fillRect(0, 0, w, h);
      flash -= .028;
      if (flash < 0) flash = 0;
    }

    rockets = rockets.filter(function (r) {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 9) r.trail.shift();
      r.x += r.vx;
      r.vy += .045 * devicePixelRatio;
      r.y += r.vy;
      if (r.vy >= -.35 * devicePixelRatio) {
        explode(r.x, r.y, r.hue);
        flash = Math.min(.5, flash + .16);
        return false;
      }
      /* Шлейф ракеты — без него в тёмном небе не видно, что летит. */
      for (let i = 1; i < r.trail.length; i++) {
        ctx.fillStyle = rgba(r.hue, i / r.trail.length * .55);
        ctx.beginPath();
        ctx.arc(r.trail[i].x, r.trail[i].y, 2 * devicePixelRatio * (i / r.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = rgba(r.hue, 1);
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3.4 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    sparks = sparks.filter(function (s) {
      s.px = s.x; s.py = s.y;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += .055 * devicePixelRatio;
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
      r.r += 3.4 * devicePixelRatio;
      r.alpha -= .022;
      if (r.alpha <= 0) return false;
      ctx.strokeStyle = rgba(r.hue, r.alpha);
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    planes = planes.filter(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += .028 * devicePixelRatio;
      p.life -= .0045;
      if (p.life <= 0) return false;
      drawPlane(p);
      return true;
    });

    ctx.globalCompositeOperation = 'source-over';

    /* Досылаем ракеты, пока салют идёт: сначала плотно, потом реже. На узком
       экране частота ниже, иначе за секунду в небо уходит целая полчища. */
    if (running) {
      const n = Math.random() < .45 * dens ? 2 : 1;
      for (let i = 0; i < n; i++) launchRocket();
    }

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
    flash = .55;
    clearTimeout(start._t);
    start._t = setTimeout(function () { running = false; }, durationMs || 4200);
  }

  function stamp() {
    const btn = document.getElementById('acceptBtn');
    const panel = document.getElementById('verdict');
    const dateEl = document.getElementById('verdictDate');
    if (!btn || !panel) return;

    const d = new Date();
    const text = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    if (dateEl) dateEl.textContent = text;

    panel.hidden = false;
    btn.classList.add('done');
    btn.disabled = true;
    btn.textContent = 'ПРОЕКТ ПРИНЯТ КОМИССИЕЙ';

    try { localStorage.setItem(KEY, text); } catch (e) { /* приватный режим — не страшно */ }

    panel.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
    if (window.showToast) {
      window.showToast('Комиссия приняла проект!', 'Макар Захаренко, «Крылья Победы. От Ил-2 до Су-57»');
    }
  }

  function restore() {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* нет доступа */ }
    if (!saved) return;
    const btn = document.getElementById('acceptBtn');
    const panel = document.getElementById('verdict');
    const dateEl = document.getElementById('verdictDate');
    if (!btn || !panel) return;
    if (dateEl) dateEl.textContent = saved;
    panel.hidden = false;
    btn.classList.add('done');
    btn.disabled = true;
    btn.textContent = 'ПРОЕКТ ПРИНЯТ КОМИССИЕЙ';
  }

  function init() {
    canvas = document.getElementById('finaleBoom');
    const btn = document.getElementById('acceptBtn');
    if (!canvas || !btn) return;

    ctx = canvas.getContext('2d');
    resize();
    addEventListener('resize', resize);

    btn.addEventListener('click', function () {
      btn.disabled = true;
      if (REDUCE) {
        stamp();
        btn.disabled = true;
        return;
      }
      start(4200);
      setTimeout(stamp, 420);
      setTimeout(function () { btn.disabled = true; }, 5200);
    });

    restore();
  }

  /* main.js вызывает это из DOMContentLoaded. */
  window.MakarFinale = { init: init, celebrate: start };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();