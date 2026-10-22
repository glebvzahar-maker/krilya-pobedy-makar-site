(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  document.body.append(toastEl);
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  };

  // прелоадер и звук двигателя управляются в assets/js/engine.js

  const slotPlaceholder = slot => {
    const s1 = document.createElement('span');
    s1.textContent = 'SLOT';
    const s2 = document.createElement('span');
    s2.textContent = slot.dataset.file || '';
    slot.append(s1, s2);
  };

  const slotImage = (slot, src, alt) => {
    slot.textContent = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    const focus = slot.dataset.focus;
    if (focus) {
      slot.style.setProperty('--focus', focus);
      slot.classList.add('static');
    }
    img.addEventListener('error', () => {
      img.remove();
      slot.classList.remove('photo', 'static');
      if (!slot.children.length) slotPlaceholder(slot);
    }, { once: true });
    slot.append(img);
    slot.classList.add('photo');
  };

  // по умолчанию все слоты — текстовые заглушки «SLOT»
  $$('.slot[data-file]').forEach(slot => {
    if (slot.children.length) return;
    slotPlaceholder(slot);
  });

  // в досье героев и в карточках снаряжения показываем настоящее фото
  $$('.dossier .slot[data-file], .gear-item .slot[data-file]').forEach(slot => {
    slotImage(slot, slot.dataset.file, slot.dataset.alt || '');
  });


  const topbar = $('#topbar');
  const scrollbarSpan = $('#scrollbar span');
  const onScroll = () => {
    topbar.classList.toggle('visible', scrollY > innerHeight * .35);
    const h = document.documentElement.scrollHeight - innerHeight;
    scrollbarSpan.style.width = (scrollY / h * 100) + '%';
    let current = '';
    $$('main section[id]').forEach(sec => {
      if (sec.getBoundingClientRect().top < innerHeight * .45) current = sec.id;
    });
    $$('#mainNav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('#burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .15 });
  $$('.rv').forEach(el => io.observe(el));

  const fmt = n => n.toLocaleString('ru-RU');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const target = +e.target.dataset.count;
      const t0 = performance.now();
      const dur = 1400;
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        e.target.textContent = fmt(Math.round(target * eased));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => {
    if (reduceMotion) el.textContent = fmt(+el.dataset.count);
    else cio.observe(el);
  });

  function drawSky(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let w, h, stars = [], meteors = [];
    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      stars = Array.from({ length: Math.min(140, w * h / 16000 / devicePixelRatio) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 * devicePixelRatio + .4,
        p: Math.random() * Math.PI * 2,
        v: .3 + Math.random() * 1.2
      }));
    };
    resize();
    addEventListener('resize', resize);
    const spawnMeteor = () => {
      if (Math.random() < .012) meteors.push({
        x: Math.random() * w, y: -20,
        vx: (2 + Math.random() * 3) * devicePixelRatio,
        vy: (5 + Math.random() * 4) * devicePixelRatio,
        life: 1
      });
    };
    const frame = t => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = .35 + .65 * Math.abs(Math.sin(s.p + t / (900 / s.v)));
        ctx.globalAlpha = tw * (opts.dim ?? .8);
        ctx.fillStyle = '#cfe0f5';
        ctx.fillRect(s.x, s.y, s.r, s.r);
        s.y += s.v * .06;
        if (s.y > h) s.y = 0;
      }
      spawnMeteor();
      meteors = meteors.filter(m => m.life > 0);
      for (const m of meteors) {
        ctx.globalAlpha = m.life;
        ctx.strokeStyle = '#ffd9a8';
        ctx.lineWidth = 1.6 * devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 7, m.y - m.vy * 7);
        ctx.stroke();
        m.x += m.vx; m.y += m.vy; m.life -= .016;
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function drawPlanes(canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, fleet = [];
    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    addEventListener('resize', resize);
    setInterval(() => {
      if (fleet.length < 14) fleet.push({
        x: Math.random() * w,
        y: h + 30,
        s: (6 + Math.random() * 9) * devicePixelRatio,
        vy: (.5 + Math.random() * 1.1) * devicePixelRatio,
        drift: Math.random() * 2 - 1,
        rot: Math.random() * .6 - .3,
        color: Math.random() < .5 ? 'rgba(255,91,35,.55)' : 'rgba(240,178,60,.45)'
      });
    }, 700);
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      fleet = fleet.filter(p => p.y > -40);
      for (const p of fleet) {
        p.y -= p.vy;
        p.x += p.drift;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + Math.sin(p.y / 60) * .08);
        ctx.fillStyle = p.color;
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
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  if (!reduceMotion) {
    const heroCanvas = $('#skyFx');
    if (heroCanvas) drawSky(heroCanvas);
    const finaleCanvas = $('#finaleFx');
    if (finaleCanvas) drawPlanes(finaleCanvas);
  } else {
    document.body.classList.add('no-motion');
  }

  const PARTS = {
    prop: { title: 'ДВИГАТЕЛЬ АМ-38 И ВИНТ', text: 'Мощный 12-цилиндровый двигатель АМ-38 — сердце Ил-2. Он вращал трёхлопастной винт и развивал скорость до 400 км/ч. Мотор защищала броня толщиной до 12 мм.', fact: 'Интересно: при повреждении одного из двух топливных баков Ил-2 мог вернуться на аэродром даже с пробитым мотором.', audio: 'assets/media/voice/makar-anatomy-prop.mp3' },
    cockpit: { title: 'БРОНИРОВАННАЯ КАБИНА', text: 'Рабочее место лётчика-штурмовика. Кабина была полностью закрыта бронестеклом толщиной 55 мм. Пилот видел цель через прицел ПАК-1.', fact: 'Интересно: у первых Ил-2 стрелка не было сзади, поэтому немцы атаковали их с хвоста. Потом добавили второго члена экипажа — стрелка.', audio: 'assets/media/voice/makar-anatomy-cockpit.mp3' },
    wing: { title: 'КРЫЛЬЯ И ОРУЖИЕ', text: 'Низкопланное крыло Ил-2 держало две пушки ШВАК и два реактивных снаряда РС-132. Залп таких «эресов» сжигал немецкие танковые колонны.', fact: 'Интересно: реактивные снаряды РС под крылом придумали советские инженеры — это было грозное оружие для штурмовки.', audio: 'assets/media/voice/makar-anatomy-wing.mp3' },
    gear: { title: 'ШАССИ', text: 'Убирающееся шасси — передние колёса убирались в крылья, хвостовое оставалось на месте. Это снижало сопротивление воздуха в полёте.', fact: 'Интересно: у По-2 шасси не убирались никогда — зато он садился на любую поляну размером с футбольное поле.', audio: 'assets/media/voice/makar-anatomy-gear.mp3' },
    fus: { title: 'БРОНИРОВАННЫЙ ФЮЗЕЛЯЖ', text: 'Корпус Ил-2 — это сплошная бронекорпус-скорлупа из стали толщиной 4-8 мм. Он защищал мотор, кабину, радиатор и топливные баки.', fact: 'Интересно: летающая броня Ил-2 выдерживала десятки попаданий пуль и осколков и всё равно возвращалась домой.', audio: 'assets/media/voice/makar-anatomy-fus.mp3' },
    tail: { title: 'ХВОСТОВОЕ ОПЕРЕНИЕ', text: 'Рули высоты и направления управляли самолётом. Хвост Ил-2 был цельнометаллический — надёжный и крепкий.', fact: 'Интересно: известны случаи, когда лётчики возвращались с оторванной частью хвоста — машина слушалась рулей даже так.', audio: 'assets/media/voice/makar-anatomy-tail.mp3' }
  };

  /* Голос Макара описывает выбранную часть. Общий плеер — voice.js,
     он же приглушает фоновую музыку и рисует индикатор в панели. */
  function playPartVoice(id) {
    const d = PARTS[id];
    if (!d || !d.audio) return;
    if (window.MakarVoice) window.MakarVoice.play(d.audio, anatInfo);
    else {
      const a = new Audio(d.audio);
      a.volume = 0.9;
      a.play().catch(function () {});
    }
  }
  const hotspotsData = [
    ['prop', 200, 42], ['cockpit', 200, 118], ['wing', 100, 230],
    ['gear', 252, 238], ['fus', 200, 330], ['tail', 200, 468]
  ];
  const svg = $('#planeSvg');
  if (svg) {
    const hotLayer = $('#hotspots');
    const anatTitle = $('#anatTitle');
    const anatText = $('#anatText');
    const anatInfo = $('#anatInfo');
    const stage = svg.closest('.anat-stage');
    hotspotsData.forEach(([id, x, y]) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'hotspot');
      g.dataset.part = id;
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('class', 'pulse');
      pulse.setAttribute('cx', x); pulse.setAttribute('cy', y); pulse.setAttribute('r', 11);
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('class', 'core');
      core.setAttribute('cx', x); core.setAttribute('cy', y); core.setAttribute('r', 6);
      g.append(pulse, core);
      g.addEventListener('click', () => {
        $$('.hotspot.active, .part.active', svg).forEach(el => el.classList.remove('active'));
        g.classList.add('active');
        $(`#p-${id}`, svg)?.classList.add('active');
        const d = PARTS[id];
        anatTitle.textContent = d.title;
        anatText.innerHTML = `${d.text}<div class="fact">${d.fact}</div>`;
        /* Позиционировать панель рядом с точкой */
        const svgRect = svg.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const svgW = svgRect.width;
        const svgH = svgRect.height;
        const pctX = x / 400;
        const pctY = y / 560;
        let left = pctX * svgW + 20;
        let top = pctY * svgH - 40;
        /* Не выходить за пределы stage */
        const infoW = 280;
        if (left + infoW > svgW) left = pctX * svgW - infoW - 20;
        if (top < 10) top = 10;
        anatInfo.style.left = left + 'px';
        anatInfo.style.top = top + 'px';
        anatInfo.classList.add('visible');
        /* Голос Макара описывает выбранную часть */
        playPartVoice(id);
      });
      hotLayer.append(g);
    });
  }

  const HEROES = {
    pokryshkin: {
      rank: 'Первый трижды Герой Советского Союза',
      name: 'Александр Покрышкин',
      photo: 'assets/img/heroes/pokryshkin.jpg',
      bio: 'Летчик-ас № 1 страны. Сбил 59 вражеских самолётов лично и ещё 6 — в группе. Придумал свою формулу боя: «Высота — скорость — манёвр — огонь», по которой учились целые полки. Его «Аэрокобра» наводила на немцев такой ужас, что они предупреждали друг друга по радио: «Внимание, Покрышкин в воздухе!»',
      video: ''
    },
    maresev: {
      rank: 'Герой Советского Союза',
      name: 'Алексей Маресьев',
      photo: 'assets/img/heroes/marseev.jpg',
      bio: 'В 1942 году его самолёт был сбит, а после тяжёлого ранения лётчику ампутировали обе ноги. Но Маресьев не сдался: тренировался каждый день и весной 1943 года снова поднялся в небо! После возвращения совершил 86 боевых вылетов и сбил 11 вражеских самолётов. О нём написана книга «Повесть о настоящем человеке».',
      video: ''
    },
    gastello: {
      rank: 'Герой Советского Союза',
      name: 'Николай Гастелло',
      photo: 'assets/img/heroes/gastello.jpg',
      bio: '26 июня 1941 года, всего через четыре дня после начала войны, его бомбардировщик был подбит зениткой. Капитан Гастелло направил горящую машину прямо в скопление вражеских танков и машин. Это был первый знаменитый «огненный таран» Великой Отечественной войны.',
      video: ''
    },
    witches: {
      rank: '46-й гвардейский женский авиаполк',
      name: '«Ночные ведьмы»',
      photo: 'assets/img/heroes/witches.jpg',
      bio: 'Полк, в котором воевали только девушки — от курсанток до командира. Они летали ночами на тихих учебных По-2 без парашютов и оружия защиты, глуша мотор и планируя к цели. Немцы прозвали их Nachthexen — «ночные ведьмы» — и очень боялись тихого «шороха» над головой. Лётчицы совершали по 6–8 боевых вылетов за ночь.',
      video: ''
    },
    modern: {
      rank: 'Герой Российской Федерации',
      name: 'Илья Сизов',
      photo: 'assets/img/heroes/sizov.jpg',
      bio: 'Современный защитник неба. Илья Сизов родился в 1985 году в Кинешме, в семье военного лётчика, и с детства знал, что тоже станет пилотом. Он окончил Краснодарское военное авиационное училище, летал на МиГ-29, Су-30 и Су-35 — налетал больше тысячи часов, участвовал в операции в Сирии и победил в соревнованиях лётчиков «Авиадартс». 9 мая 2022 года во время патрулирования он заметил вражеский вертолёт, летевший над Чёрным морем всего в пятнадцати метрах от воды, рядом с островом Змеиный. Сизов рискнул: его самолёт уже вели на автосопровождение зенитные ракеты, но он всё равно поразил цель. Высадка противника на остров провалилась. За этот подвиг Президент России вручил ему звание Героя Российской Федерации с медалью «Золотая Звезда». Всего за время операции Илья Сизов уничтожил 11 вражеских самолётов и вертолётов. Сегодня он — заместитель командира 23-го гвардейского истребительного авиационного полка.',
      video: ''
    }
  };
  const modal = $('#modal');
  const openModal = id => {
    const h = HEROES[id];
    if (!h) return;
    $('#modalRank').textContent = h.rank.toUpperCase();
    $('#modalName').textContent = h.name;
    $('#modalBio').textContent = h.bio;
    const photo = $('#modalPhoto');
    photo.textContent = '';
    slotImage(photo, h.photo, h.name);
    const video = $('#modalVideo');
    if (h.video) {
      video.outerHTML = h.video;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };
  $$('.dossier').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.hero)));
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  $$('#origamiTabs .tab-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#origamiTabs .tab-nav button').forEach(b => b.classList.remove('active'));
      $$('#origamiTabs .tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(`.tab-pane[data-pane="${btn.dataset.tab}"]`).classList.add('active');
    });
  });

  const QUIZ_TYPES = {
    fighter: { name: 'ИСТРЕБИТЕЛЬ ЯК-3', desc: 'Ты быстрый, смелый и любишь быть первым! Как легендарный Як-3: вступай в бой первым и побеждай манёвром. Такие пилоты прикрывают друзей и не бросают своих.' },
    storm: { name: 'ШТУРМОВИК ИЛ-2', desc: 'Ты надёжный боец и настоящий товарищ! Как «летающий танк» Ил-2: идёшь вперёд, защищаешь пехоту и доводишь дело до конца, что бы ни случилось.' },
    bomber: { name: 'БОМБАРДИРОВЩИК ПЕ-2', desc: 'Ты стратег команды! Как скоростной Пе-2: сначала думаешь, потом действуешь. Точно выполняешь задачу и всегда знаешь план Б.' },
    scout: { name: 'НОЧНОЙ РАЗВЕДЧИК ПО-2', desc: 'Ты тихий, терпеливый и очень точный! Как По-2 «ночных ведьм»: никто тебя не слышит, а работу ты делаешь идеально. Хитрость и спокойствие — твоё оружие.' }
  };
  const QUESTIONS = [
    { q: 'Задача кажется совсем сложной. Что делаешь?', a: [['Атакую сразу — разберусь на месте!', 'fighter'], ['Иду напролом, я же в броне!', 'storm'], ['Сначала продумаю план действий', 'bomber'], ['Подожду нужный момент и сделаю тихо', 'scout']] },
    { q: 'Какая роль тебе ближе в команде?', a: [['Защищать друзей', 'fighter'], ['Пробиваться первым и прикрывать всех', 'storm'], ['Придумывать общий план', 'bomber'], ['Разведать и добыть важные сведения', 'scout']] },
    { q: 'Выбери время для вылета:', a: [['Ясный день — видно всё вокруг!', 'fighter'], ['Мне любое время года — броня держит', 'storm'], ['Рассвет — чтобы успеть до жары', 'bomber'], ['Ночь — моя любимая пора', 'scout']] },
    { q: 'Что важнее в работе?', a: [['Скорость реакции', 'fighter'], ['Надёжность и сила', 'storm'], ['Точный расчёт', 'bomber'], ['Терпение и точность', 'scout']] },
    { q: 'Друг попал в трудную ситуацию. Ты…', a: [['Мчусь помогать сразу!', 'fighter'], ['Стану стеной между другом и бедой', 'storm'], ['Быстро придумаю, как выручить', 'bomber'], ['Тихо помогу так, что он даже не заметит', 'scout']] },
    { q: 'Твоё девиз:', a: [['«Быстрее всех — сильнее всех!»', 'fighter'], ['«Не пройдёшь, пока я стою!»', 'storm'], ['«Семь раз отмерь — один отрежь»', 'bomber'], ['«Тихо едет — далеко увидит»', 'scout']] }
  ];
  const quizBox = $('#quizBox');
  if (quizBox) {
    let step = 0;
    const scores = { fighter: 0, storm: 0, bomber: 0, scout: 0 };
    const renderQ = () => {
      const item = QUESTIONS[step];
      quizBox.innerHTML =
        '<div class="quiz-progress">' +
        QUESTIONS.map((_, i) => `<i class="${i < step ? 'done' : ''}"></i>`).join('') +
        '</div>' +
        `<div class="quiz-q">${item.q}</div>` +
        '<div class="quiz-answers">' +
        item.a.map(([text, type], i) =>
          `<button class="quiz-answer" data-i="${i}">${String.fromCharCode(1040 + i)}) ${text}</button>`
        ).join('') +
        '</div>';
      $$('.quiz-answer', quizBox).forEach(btn =>
        btn.addEventListener('click', () => {
          scores[item.a[+btn.dataset.i][1]]++;
          step++;
          /* Сброс hover-состояния */
          quizBox.style.pointerEvents = 'none';
          requestAnimationFrame(() => {
            step < QUESTIONS.length ? renderQ() : renderResult();
            requestAnimationFrame(() => { quizBox.style.pointerEvents = ''; });
          });
        })
      );
    };
    const renderResult = () => {
      const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
      const t = QUIZ_TYPES[winner];
      quizBox.innerHTML =
        '<div class="quiz-result">' +
        '<div class="stamp">ДОПУСК В НЕБО ПОЛУЧЕН</div>' +
        `<h3>${t.name}</h3>` +
        `<p>${t.desc}</p>` +
        '<button class="btn btn-ghost quiz-restart" type="button">ПРОЙТИ ЗАНОВО</button>' +
        '</div>';
      $('.quiz-restart', quizBox).addEventListener('click', () => {
        step = 0;
        Object.keys(scores).forEach(k => scores[k] = 0);
        renderQ();
      });
    };
    renderQ();
  }

  const soundToggle = $('#soundToggle');
  const prevTrack = $('#prevTrack');
  const nextTrack = $('#nextTrack');
  const mpProgress = $('#mpProgress');
  const mpSeek = $('#mpSeek');
  const mpTime = $('#mpTime');
  const trackName = $('#trackName');
  const miniPlayer = $('#miniPlayer');
  const iconPlay = $('.mp-icon-play', miniPlayer);
  const iconPause = $('.mp-icon-pause', miniPlayer);
  let audioCtx = null;
  let bgPlaylist = [];
  let bgIndex = 0;
  const TRACKS = ['assets/media/vysotsky-yak-istrebitel.mp3', 'assets/media/vysotsky-vozdushnyy-boy.mp3'];
  const TRACK_NAMES = ['Як-истребитель', 'Воздушный бой'];
  let isPlaying = false;

  function fmtTime(s) {
    if (!s || !isFinite(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function updateUI() {
    if (!audioCtx) return;
    var cur = audioCtx.currentTime || 0;
    var dur = audioCtx.duration || 0;
    var pct = dur ? (cur / dur * 100) : 0;
    mpProgress.style.width = pct + '%';
    mpSeek.value = pct;
    mpTime.textContent = fmtTime(cur) + ' / ' + fmtTime(dur);
    trackName.textContent = TRACK_NAMES[bgIndex] || 'Высоцкий';
  }

  function setPlaying(p) {
    isPlaying = p;
    miniPlayer.classList.toggle('playing', p);
    if (iconPlay) iconPlay.style.display = p ? 'none' : '';
    if (iconPause) iconPause.style.display = p ? '' : 'none';
  }

  async function playTrack(idx) {
    if (!audioCtx) {
      audioCtx = new Audio();
      audioCtx.preload = 'none';
      audioCtx.volume = .45;
      audioCtx.addEventListener('ended', () => {
        bgIndex = (bgIndex + 1) % TRACKS.length;
        audioCtx.src = TRACKS[bgIndex];
        audioCtx.play().catch(() => {});
      });
      audioCtx.addEventListener('timeupdate', updateUI);
      audioCtx.addEventListener('loadedmetadata', updateUI);
    }
    /* voice.js приглушает музыку на время доклада Макара */
    window.__bgMusic = () => audioCtx;
    bgIndex = idx;
    audioCtx.src = TRACKS[bgIndex];
    try {
      await audioCtx.play();
      setPlaying(true);
    } catch {
      toast('Добавь файлы vysotsky-yak-istrebitel.mp3 и vysotsky-vozdushnyy-boy.mp3 в assets/media/');
    }
  }

  soundToggle?.addEventListener('click', () => {
    if (!audioCtx) {
      playTrack(bgIndex);
      return;
    }
    if (isPlaying) {
      audioCtx.pause();
      setPlaying(false);
    } else {
      audioCtx.src = TRACKS[bgIndex];
      audioCtx.play().catch(() => {});
      setPlaying(true);
    }
  });

  prevTrack?.addEventListener('click', () => {
    bgIndex = (bgIndex - 1 + TRACKS.length) % TRACKS.length;
    playTrack(bgIndex);
  });

  nextTrack?.addEventListener('click', () => {
    bgIndex = (bgIndex + 1) % TRACKS.length;
    playTrack(bgIndex);
  });

  mpSeek?.addEventListener('input', () => {
    if (!audioCtx || !audioCtx.duration) return;
    audioCtx.currentTime = mpSeek.value / 100 * audioCtx.duration;
    updateUI();
  });

  /* ── collapsible radio log ── */
  var radioBtn = document.getElementById('radioToggle');
  var radioLog = document.getElementById('radioLog');
  if (radioBtn && radioLog) {
    /* Высота ровно по содержимому. Раньше стоял жёсткий max-height:4000px,
       и как только журнал стал длиннее (добавили фото и видео), нижняя
       часть просто обрезалась. Наблюдаем за элементами журнала: когда
       видео подгружает метаданные и меняет высоту, пересчитываем. */
    var fitRadioLog = function() {
      if (!radioLog.classList.contains('open')) return;
      radioLog.style.maxHeight = radioLog.scrollHeight + 'px';
    };
    var radioRO = null;

    radioBtn.addEventListener('click', function() {
      radioLog.classList.toggle('open');
      radioBtn.classList.toggle('open');
      var exp = radioLog.classList.contains('open');
      radioBtn.setAttribute('aria-expanded', exp);
      /* innerHTML затирал счётчик сообщений — переносим его обратно,
         иначе подпись исчезает после первого же клика. */
      var hintEl = radioBtn.querySelector('.radio-toggle-hint');
      radioBtn.innerHTML = '<span class="radio-toggle-icon">&#9654;</span> ' + (exp ? 'Скрыть переговоры' : 'Показать переговоры');
      if (hintEl) radioBtn.appendChild(hintEl);

      if (exp) {
        requestAnimationFrame(fitRadioLog);
        if (window.ResizeObserver) {
          if (radioRO) radioRO.disconnect();
          radioRO = new ResizeObserver(fitRadioLog);
          Array.prototype.forEach.call(radioLog.children, function(kid) {
            radioRO.observe(kid);
          });
        }
      } else {
        radioLog.style.maxHeight = '';
        if (radioRO) { radioRO.disconnect(); radioRO = null; }
      }
    });
  }

  /* ── duck music when radio audio/video plays ── */
  var MUSIC_VOL = .45;
  var DUCK_FACTOR = .1; // 90% reduction
  document.querySelectorAll('#radioLog audio, #radioLog video, #mvGrid video').forEach(function(el) {
    el.addEventListener('play', function() {
      if (audioCtx && !audioCtx.paused) audioCtx.volume = MUSIC_VOL * DUCK_FACTOR;
    });
    ['pause','ended'].forEach(function(evt) {
      el.addEventListener(evt, function() {
        if (audioCtx && !audioCtx.paused) audioCtx.volume = MUSIC_VOL;
      });
    });
  });

  const toTop = $('#toTop');
  if (toTop) {
    const footerEl = document.querySelector('footer');
    const updateToTop = () => {
      toTop.classList.toggle('show', scrollY > innerHeight);
      if (footerEl) {
        const fr = footerEl.getBoundingClientRect();
        toTop.style.bottom = (fr.top < innerHeight ? Math.max(22, fr.height + 16) : 22) + 'px';
      }
    };
    addEventListener('scroll', updateToTop, { passive: true });
    updateToTop();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }
  $('#menuScrim')?.addEventListener('click', () => document.body.classList.remove('menu-open'));

  /* ── Timeline navigation: map flight numbers to section IDs ── */
  const FLIGHT_SECTIONS = {
    1: 'chronicle', 2: 'chronicle', 3: 'origami', 4: 'heroes',
    5: 'cinema', 6: 'anatomy', 7: 'gear', 8: 'voices',
    9: 'exhibits', 10: 'expedition', 11: 'anatomy', 12: 'quiz',
    13: null, 14: 'training', 15: 'finale'
  };
  $$('.ft-item').forEach(item => {
    item.addEventListener('click', () => {
      const flight = +item.dataset.flight;
      const sectionId = FLIGHT_SECTIONS[flight];
      if (sectionId) {
        const sec = document.getElementById(sectionId);
        if (sec) sec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  /* ── «Где был Макар»: переходы по карточкам ──
     Нативный переход по якорю здесь промахивается: пока идёт плавная
     прокрутка, ленивые картинки выше подгружаются, высота страницы меняется
     и секция уезжает на 400-500 px. Поэтому считаем позицию сами и делаем
     ещё два прохода — на случай, если вёрстка осела после загрузки. */
  function jumpTo(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    const go = function () {
      const top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    go();
    setTimeout(go, 350);
    setTimeout(go, 900);
  }
  $$('.wb-jump, .wb-film-links a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const h = a.getAttribute('href');
      if (!h || h.charAt(0) !== '#') return;
      e.preventDefault();
      try { history.replaceState(null, '', h); } catch (err) { /* старый браузер */ }
      jumpTo(h);
    });
  });

  /* ── Лента вылетов: статусы берём из progress.json ──
     Дядя Глеба подтверждает вылет → правит medals и nextSortie в
     progress.json → пушит. Здесь плашки перестраиваются сами. */
  function syncFlightTimeline(progress) {
    const next = +progress.nextSortie || 1;
    const doneSet = new Set((progress.medals || []).map(m => +m.sortie));
    $$('.ft-item').forEach(item => {
      const f = +item.dataset.flight;
      const status = item.querySelector('.ft-status');
      item.classList.remove('done', 'active');
      if (doneSet.has(f)) {
        item.classList.add('done');
        if (status) status.textContent = '✅';
      } else if (f === next) {
        item.classList.add('active');
        if (status) status.textContent = '⏳';
      } else if (status) {
        status.textContent = '—';
      }
    });
  }

  fetch('assets/data/progress.json')
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (!d) return;
      syncFlightTimeline(d);
      syncMapPaths(d);
    })
    .catch(() => { /* не сменился — остаётся разметка из HTML */ });

  /* ── Карта: показываем маршрут только пройденных вылетов ── */
  function syncMapPaths(progress) {
    const doneSet = new Set((progress.medals || []).map(m => +m.sortie));
    $$('.flight-path').forEach(g => {
      const f = +g.dataset.flight;
      const done = doneSet.has(f);
      g.style.display = done ? '' : 'none';
      // легенда тоже прячем, если вылета ещё не было
      const legendText = g.querySelector('text');
      if (legendText) legendText.style.opacity = done ? '1' : '.35';
    });
    // строки легенды гасим для непройденных — ориентируемся на data-flight
    $$('.map-legend-row').forEach(row => {
      const f = +row.dataset.flight;
      row.style.opacity = doneSet.has(f) ? '1' : '.3';
    });
  }

  const heroVideos = $$('.hero-video');
  if (heroVideos.length) {
    let cur = 0;
    /* Источник не подставляем заранее: preload="none" без src не тянет
       ни байта. Ролик весит 10–15 МБ, а качать его до клика смысла нет. */
    const playIdx = i => {
      const v = heroVideos[i];
      if (v.dataset.src && !v.getAttribute('src')) v.setAttribute('src', v.dataset.src);
      v.play().catch(() => {});
    };
    const show = i => heroVideos.forEach((v, idx) => v.classList.toggle('active', idx === i));
    show(0);
    heroVideos.forEach(v => v.addEventListener('ended', () => {
      const n = (cur + 1) % heroVideos.length;
      heroVideos[n].currentTime = 0; playIdx(n); show(n); cur = n;
    }));
    let started = false;
    const kick = () => {
      if (started) return;
      started = true;
      playIdx(0);
      window.removeEventListener('engine:started', kick);
    };
    window.addEventListener('engine:started', kick);
    /* Подстраховка: прелоадер уже пройден, а событие проскочило. */
    if (document.getElementById('preloader')?.classList.contains('done')) kick();
  }

  /* Touch support for gear/exhibit hover descriptions on mobile */
  $$('.gear-item, .exhibit').forEach(el => {
    el.addEventListener('click', e => {
      const wasOpen = el.classList.contains('touch-open');
      $$('.gear-item.touch-open, .exhibit.touch-open').forEach(x => x.classList.remove('touch-open'));
      if (!wasOpen) el.classList.add('touch-open');
    });
  });

})();
