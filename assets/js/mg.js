/* Эффект огневого поражения: по клику — звук выстрела и дырки от пуль,
   привязанные к месту на странице (скроллятся вместе с контентом) */
(function () {
  const AUDIO_SRC = 'assets/media/mg-burst.mp3';
  let actx = null;
  let useFile = false;
  const file = new Audio(AUDIO_SRC);
  file.preload = 'auto';
  file.addEventListener('canplaythrough', () => { useFile = true; }, { once: true });
  file.addEventListener('error', () => { useFile = false; }, { once: true });

  function ensureCtx() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  /* Тяжёлый «пушечный» раскат — ниже и жирнее прежней пулемётной очереди */
  function synthBurst() {
    const ctx = ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.02;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    const shots = 6;
    const gap = 0.055;
    for (let i = 0; i < shots; i++) {
      const t = t0 + i * gap;

      // низкий «тумп» корпуса снаряда
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 - i * 8, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(og).connect(master);
      osc.start(t);
      osc.stop(t + 0.18);

      // хлёсткий «хлопок» — шум через низкочастотный фильтр
      const dur = 0.09;
      const len = Math.ceil(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < len; j++) {
        d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 1.6);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.6, t + 0.003);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      src.connect(lp).connect(ng).connect(master);
      src.start(t);
      src.stop(t + dur);
    }
  }

  function playBurst() {
    var ctx = ensureCtx();
    var fire = function () {
      if (useFile && file.readyState >= 3) {
        try { file.currentTime = 0; file.play().catch(() => {}); return; }
        catch (e) { /* fallthrough */ }
      }
      synthBurst();
    };
    if (!ctx) { fire(); return; }
    if (ctx.state === 'suspended') { ctx.resume().then(fire).catch(fire); }
    else { fire(); }
  }

  function spawnHoles(x, y) {
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const ox = (Math.random() - 0.5) * 48;
      const oy = (Math.random() - 0.5) * 48;
      const h = document.createElement('div');
      h.className = 'bullet-hole';
      const sz = 10 + Math.random() * 9;
      h.style.left = (x + ox) + 'px';
      h.style.top = (y + oy) + 'px';
      h.style.width = sz + 'px';
      h.style.height = sz + 'px';
      document.body.appendChild(h);
    }
    const holes = document.querySelectorAll('.bullet-hole');
    const max = 140;
    if (holes.length > max) {
      for (let i = 0; i < holes.length - max; i++) holes[i].remove();
    }
  }

  function isExcluded(target) {
    if (!target || !target.closest) return false;
    var rc = target.closest('.rank-card');
    if (rc && rc.querySelector('img')) return true;
    return !!(
      target.closest('#startEngine') ||
      target.closest('#preloader') ||
      target.closest('.dossier') ||
      target.closest('#modal') ||
      target.closest('#gate') ||
      target.closest('#training')
    );
  }

  window.__mgPlay = playBurst;
})();
