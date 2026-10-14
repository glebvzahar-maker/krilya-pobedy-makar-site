(() => {
  'use strict';

  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preBar');
  const pct = document.getElementById('prePct');
  const startBtn = document.getElementById('startEngine');
  if (!preloader || !startBtn) return;

  const CLIP_START = 13;
  const CLIP_LEN = 4;

  const setProgress = p => {
    const v = Math.max(0, Math.min(100, p));
    if (bar) bar.style.width = v + '%';
    if (pct) pct.textContent = Math.round(v) + '%';
  };
  setProgress(0);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    setProgress(100);
    setTimeout(() => preloader.classList.add('done'), 180);
  };

  const tryLoadFile = () => new Promise(res => {
    const a = new Audio('assets/media/engine-start.mp3');
    a.preload = 'auto';
    const ok = () => res(a);
    const fail = () => res(null);
    a.addEventListener('loadedmetadata', ok, { once: true });
    a.addEventListener('error', fail, { once: true });
    a.load();
    setTimeout(fail, 2500);
  });

  const playSynth = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return { end: performance.now() + 1800 };
    const ctx = new AC();
    const t0 = ctx.currentTime;
    const dur = 1.8;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.9, t0 + 0.12);
    master.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(32, t0);
    osc.frequency.exponentialRampToValueAtTime(125, t0 + dur * 0.65);
    osc.frequency.exponentialRampToValueAtTime(96, t0 + dur);
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(64, t0);
    osc2.frequency.exponentialRampToValueAtTime(250, t0 + dur * 0.65);
    const tone = ctx.createGain();
    tone.gain.setValueAtTime(0.0001, t0);
    tone.gain.exponentialRampToValueAtTime(0.22, t0 + 0.22);
    tone.gain.setValueAtTime(0.22, t0 + dur * 0.8);
    tone.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nF = ctx.createBiquadFilter();
    nF.type = 'lowpass';
    nF.frequency.setValueAtTime(280, t0);
    nF.frequency.exponentialRampToValueAtTime(2000, t0 + dur * 0.65);
    const nG = ctx.createGain();
    nG.gain.setValueAtTime(0.0001, t0);
    nG.gain.exponentialRampToValueAtTime(0.32, t0 + 0.18);
    nG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(tone); osc2.connect(tone); tone.connect(master);
    noise.connect(nF); nF.connect(nG); nG.connect(master);
    osc.start(t0); osc2.start(t0); noise.start(t0);
    osc.stop(t0 + dur); osc2.stop(t0 + dur); noise.stop(t0 + dur);
    return { end: performance.now() + dur * 1000 };
  };

  const start = async () => {
    if (startBtn.disabled) return;
    startBtn.disabled = true;
    startBtn.classList.add('hidden');
    const preHint = document.querySelector('.pre-hint');
    if (preHint) preHint.classList.add('hidden');

    /* Мотор завёлся — можно отпускать тяжёлое видео из шапки.
       Раньше оно качалось само при загрузке страницы (25 МБ до клика).
       CustomEvent не имеет bubbles по умолчанию, поэтому слушаем
       именно на window, а не на document. */
    window.dispatchEvent(new CustomEvent('engine:started'));

    const file = await tryLoadFile();
    if (file && isFinite(file.duration) && file.duration > 0) {
      const startAt = Math.min(CLIP_START, Math.max(0, file.duration - CLIP_LEN));
      const len = Math.min(CLIP_LEN, file.duration - startAt);
      file.currentTime = startAt;
      file.volume = 0;
      const t0 = performance.now();
      const fade = now => {
        /* rAF-метка времени и performance.now() могут разойтись на доли
           миллисекунды — без нижней границы k уходил в минус, и браузер
           бросал ошибку на установку volume. */
        const k = Math.max(0, Math.min(1, (now - t0) / (len * 1000)));
        file.volume = k;
        if (k < 1) requestAnimationFrame(fade);
      };
      requestAnimationFrame(fade);
      const onTime = () => {
        const pos = file.currentTime - startAt;
        setProgress(pos / len * 100);
        if (file.currentTime >= startAt + len) { file.pause(); finish(); }
      };
      file.addEventListener('timeupdate', onTime);
      file.addEventListener('ended', finish, { once: true });
      try { await file.play(); } catch (e) { console.warn('[engine] play blocked:', e.message); animateBar(len); setTimeout(finish, len * 1000); }
    } else {
      const { end } = playSynth();
      animateBar(1.8);
      setTimeout(finish, end - performance.now());
    }
  };

  const animateBar = dur => {
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / (dur * 1000));
      setProgress(k * 100);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  startBtn.addEventListener('click', start);
  preloader.addEventListener('click', e => { if (e.target === startBtn) return; if (!finished && document.body.classList.contains('unlocked')) start(); });
  const onKey = () => { if (finished) return; if (!document.body.classList.contains('unlocked')) return; window.removeEventListener('keydown', onKey); start(); };
  window.addEventListener('keydown', onKey);
})();
