/* medals.js — система медалей с уровнями bronze/silver/gold */
(function(){
  'use strict';

  var STAR = 'M0,-16 L4.7,-4.9 L16.2,-4.9 L6.8,2.6 L10.5,14.2 L0,7 L-10.5,14.2 L-6.8,2.6 L-16.2,-4.9 L-4.7,-4.9 Z';

  var medalAudio = new Audio('assets/media/medal-sound.mp3');
  medalAudio.preload = 'auto';
  medalAudio.volume = 0.7;
  var medalAudioHover = new Audio('assets/media/medal-sound.mp3');
  medalAudioHover.preload = 'auto';
  medalAudioHover.volume = 0.35;

  /* Все 15 медалей — определение */
  var ALL_MEDALS = [
    { id:'m01', name:'Разведчик неба', sortie:1, color:'#5df0b6',
      note:'Нашёл фото Ил-2, Як-3, По-2 и доложил голосом.',
      silver:'Прислал фото + письменный доклад + голосовой разбор каждого.',
      gold:'Всё серебро + самостоятельно нашёл дополнительные источники.',
      img:'assets/img/medals/medal-01.png',
      icon:'<ellipse rx="14" ry="9"/><circle r="4.5" fill="#5df0b6" stroke="none"/>' },
    { id:'m02', name:'Летающий танк', sortie:2, color:'#ff5b23',
      note:'Посмотрел видео про Ил-2 и доложил голосом.',
      silver:'Голосовой + письменный доклад из 3 предложений.',
      gold:'Всё серебро + дополнительные факты (конструктор, история).',
      img:'assets/img/medals/medal-02.png',
      icon:'<path d="'+STAR+'" fill="#ff5b23" stroke="none"/>' },
    { id:'m03', name:'Бумажный ас', sortie:3, color:'#5df0b6',
      note:'Сложил 1 бумажный самолётик и замерил дальность.',
      silver:'Сложил все 3 самолётика (истребитель, бомбардировщик, планер).',
      gold:'Всё серебро + видео сверху с пошаговым комментарием.',
      img:'assets/img/medals/medal-03.png',
      icon:'<path d="M-14 -10 L16 -14 L4 14 L0 2 L-14 -2 Z"/>' },
    { id:'m04', name:'Ночной разведчик', sortie:4, color:'#9aa7ff',
      note:'Узнал про Ночных ведьм и доложил 2 факта.',
      silver:'Доклад с 3 фактами + назвал имена.',
      gold:'Всё серебро + нашёл фото или видео о полках.',
      img:'assets/img/medals/medal-04.png',
      icon:'<circle r="9" fill="none" stroke="#9aa7ff" stroke-width="2.4"/><circle cx="-3" cy="-2" r="1.5" fill="#9aa7ff"/><circle cx="4" cy="1" r="1" fill="#9aa7ff"/><circle cx="1" cy="5" r=".7" fill="#9aa7ff"/>' },
    { id:'m05', name:'Киноархивист', sortie:5, color:'#ff5b23',
      note:'Посмотрел фильм/ролик и рассказал 3 факта.',
      silver:'Посмотрел ПОЛНЫЙ фильм + развёрнутый доклад.',
      gold:'Всё серебро + письменный отзыв «Что фильм значит для меня».',
      img:'assets/img/medals/medal-05.png',
      icon:'<rect x="-14" y="-10" width="28" height="20" rx="2"/><circle cx="-8" cy="-4" r="1.6" fill="#ff5b23" stroke="none"/><circle cx="0" cy="-4" r="1.6" fill="#ff5b23" stroke="none"/><circle cx="8" cy="-4" r="1.6" fill="#ff5b23" stroke="none"/><circle cx="-8" cy="4" r="1.6" fill="#ff5b23" stroke="none"/><circle cx="0" cy="4" r="1.6" fill="#ff5b23" stroke="none"/><circle cx="8" cy="4" r="1.6" fill="#ff5b23" stroke="none"/>' },
    { id:'m06', name:'Инженер', sortie:6, color:'#9aa7ff',
      note:'Назвал 5 частей самолёта на схеме.',
      silver:'Назвал 5 частей + объяснил назначение каждой.',
      gold:'Всё серебро + объяснил как работает шасси По-2.',
      img:'assets/img/medals/medal-06.png',
      icon:'<circle r="9"/><circle r="3.2" fill="#131c27" stroke="none"/><path d="M9 0 L13 0 M-9 0 L-13 0 M0 9 L0 13 M0 -9 L0 -13 M6.4 6.4 L9 9 M-6.4 6.4 L-9 9 M6.4 -6.4 L9 -9 M-6.4 -6.4 L-9 -9"/>' },
    { id:'m07', name:'Знаток снаряжения', sortie:7, color:'#f0b23c',
      note:'Определил 4 предмета экипировки.',
      silver:'Определил 4 предмета + аргументировал выбор №1.',
      gold:'Всё серебро + нашёл дополнительные предметы или сравнил с современными.',
      img:'assets/img/medals/medal-07.png',
      icon:'<rect x="-11" y="-11" width="22" height="22" rx="3"/><path d="M-5 0 L0 5 L5 0 M0 5 L0 -5" stroke="#f0b23c" stroke-width="2" fill="none"/>' },
    { id:'m08', name:'Голос эскадрильи', sortie:8, color:'#ff5b23',
      note:'Записал стих о лётчиках.',
      silver:'Записал стих + может рассказать наизусть без подсказки.',
      gold:'Всё серебро + записал песню с дядей Глебом.',
      img:'assets/img/medals/medal-08.png',
      icon:'<rect x="-5" y="-13" width="10" height="16" rx="5"/><path d="M-8 4 Q0 13 8 4"/><line x1="0" y1="2" x2="0" y2="-2"/>' },
    { id:'m09', name:'Музейный рейд', sortie:9, color:'#f0b23c',
      note:'Побывал в музее (или онлайн-туре) и нашёл самолёт из проекта.',
      silver:'Побывал + сфотографировался + голосовой доклад.',
      gold:'Всё серебро + письменный отчёт «Что узнал нового».',
      img:'assets/img/medals/medal-09.png',
      icon:'<rect x="-13" y="-12" width="26" height="3"/><rect x="-13" y="9" width="26" height="3"/><rect x="-9" y="-9" width="4" height="18"/><rect x="-2" y="-9" width="4" height="18"/><rect x="5" y="-9" width="4" height="18"/>' },
    { id:'m10', name:'Мост поколений', sortie:10, color:'#5df0b6',
      note:'Сравнил Ил-2 и Су-57, нашёл различия.',
      silver:'Нашёл 5 различий + объяснил что улучшилось.',
      gold:'Всё серебро + сделал визуальную сравнительную таблицу.',
      img:'assets/img/medals/medal-10.png',
      icon:'<path d="M-14 8 L-6 -8 L0 -12 L6 -8 L14 8" fill="none" stroke="#5df0b6" stroke-width="2.4"/><circle cx="-14" cy="8" r="2" fill="#5df0b6"/><circle cx="14" cy="8" r="2" fill="#5df0b6"/>' },
    { id:'m11', name:'Моторист', sortie:11, color:'#ff5b23',
      note:'Объяснил как работает двигатель самолёта.',
      silver:'Объяснил своими словами + назвал главные детали.',
      gold:'Всё серебро + записал видео-объяснение или нарисовал схему.',
      img:'assets/img/medals/medal-11.png',
      icon:'<circle r="8" fill="none" stroke="#ff5b23" stroke-width="2"/><path d="M0 -8 L0 -3 M8 0 L3 0 M0 8 L0 3 M-8 0 L-3 0" stroke="#ff5b23" stroke-width="2"/><circle r="2" fill="#ff5b23"/>' },
    { id:'m12', name:'Штурман', sortie:12, color:'#9aa7ff',
      note:'Выстроил план доклада: 7 частей по порядку.',
      silver:'Наговорил весь доклад голосом — две записи (части 1–4 и 5–7).',
      gold:'Всё серебро + записал видео полного доклада за один проход.',
      img:'assets/img/medals/medal-12.png',
      icon:'<rect x="-12" y="-9" width="24" height="18" rx="2"/><rect x="-9" y="-6" width="8" height="4" rx="1" fill="#9aa7ff" stroke="none"/><rect x="-9" y="0" width="14" height="2" rx="1" fill="#9aa7ff" stroke="none" opacity=".5"/><rect x="-9" y="4" width="10" height="2" rx="1" fill="#9aa7ff" stroke="none" opacity=".5"/>' },
    { id:'m13', name:'Моделист', sortie:13, color:'#f0b23c',
      note:'Собрал модель самолёта (пластик или дерево).',
      silver:'Собрал модель + покрасил / оформил.',
      gold:'Всё серебро + рассказал голосом, что было сложнее всего.',
      img:'assets/img/medals/medal-13.png',
      icon:'<path d="M-12 6 L0 -10 L12 6 Z" fill="none" stroke="#f0b23c" stroke-width="2.4"/><line x1="0" y1="-10" x2="0" y2="6" stroke="#f0b23c" stroke-width="1.5"/>' },
    { id:'m14', name:'Оратор', sortie:14, color:'#5df0b6',
      note:'Отрепетировал доклад перед «комиссией».',
      silver:'Отрепетировал + выучил вступление наизусть.',
      gold:'Всё серебро + сделал репетицию перед зеркалом или на видео.',
      img:'assets/img/medals/medal-14.png',
      icon:'<circle r="6" fill="none" stroke="#5df0b6" stroke-width="2"/><path d="M-6 6 Q0 14 6 6" fill="none" stroke="#5df0b6" stroke-width="2"/>' },
    { id:'m15', name:'Золотая звезда', sortie:15, color:'#ffd23c',
      note:'Выступление перед классом — финал проекта!',
      silver:'Выступление + ответы на вопросы комиссии.',
      gold:'Всё серебро + особый вклад (дополнительный материал, помощь другим).',
      img:'assets/img/medals/medal-15.png',
      icon:'<path d="'+STAR+'" fill="#ffd23c" stroke="none"/>' }
  ];

  /* Уровни: bronze=базовый, silver=качественно, gold=исключительно */
  var LEVEL_ORDER = ['bronze','silver','gold'];
  var LEVEL_LABELS = { bronze:'БРОНЗА', silver:'СЕРЕБРО', gold:'ЗОЛОТО' };
  var LEVEL_COLORS = { bronze:'#cd7f32', silver:'#c0c0c0', gold:'#ffd700' };

  /* Определяем уровень медали из данных */
  function getMedalLevel(medalId, earnedMedals){
    for(var i=0; i<earnedMedals.length; i++){
      if(earnedMedals[i].id === medalId) return earnedMedals[i].level || 'bronze';
    }
    return null;
  }

  function isEarned(medalId, earnedMedals){
    return getMedalLevel(medalId, earnedMedals) !== null;
  }

  /* SVG медали БЕЗ текста уровня (уровень показываем только в статусе карточки) */
  function medalSVG(color, icon){
    return '<svg class="medal-svg" viewBox="0 0 100 124" aria-hidden="true">' +
      '<path d="M34 10 L22 60 L46 50 Z" fill="' + color + '"/>' +
      '<path d="M66 10 L78 60 L54 50 Z" fill="' + color + '"/>' +
      '<path d="'+STAR+'" transform="translate(50 11) scale(.34)" fill="' + color + '"/>' +
      '<circle cx="50" cy="78" r="34" fill="#0c1219" stroke="' + color + '" stroke-width="3"/>' +
      '<circle cx="50" cy="78" r="27" fill="#131c27"/>' +
      '<g stroke="' + color + '" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(50 78)">' + icon + '</g>' +
      '</svg>';
  }

  /* Рендер сетки медалей */
  function renderMedals(earnedMedals){
    var grid = document.getElementById('medalGrid');
    if(!grid) return;

    var html = ALL_MEDALS.map(function(m){
      var level = getMedalLevel(m.id, earnedMedals);
      var earned = level !== null;
      var statusText = earned ? LEVEL_LABELS[level] : 'ЗАКРЫТО';

      // Текст для подсказки при клике: что нужно для каждого уровня
      var hintText = earned
        ? ('Бронза: ' + m.note + ' | Серебро: ' + m.silver + ' | Золото: ' + m.gold)
        : ('Для получения: ' + m.note);

      var art = m.img
        ? '<img class="medal-img" src="' + m.img + '" alt="' + m.name + '" loading="lazy" style="width:108px;height:auto;">'
        : medalSVG(m.color, m.icon);

      return '<article class="medal ' + (earned ? 'earned' : 'locked') + ' medal-' + (level || 'locked') + '" data-medal-id="' + m.id + '">' +
        '<div class="medal-art">' + art + '</div>' +
        '<div class="medal-name">' + m.name + '</div>' +
        '<div class="medal-status">' + statusText + '</div>' +
        '<div class="medal-hint">' + hintText + '</div>' +
        '</article>';
    }).join('');

    grid.innerHTML = html;

    /* Звук при hover/click на заработанные медали */
    grid.querySelectorAll('.medal.earned').forEach(function(el){
      el.addEventListener('mouseenter', function(){
        try { medalAudioHover.currentTime = 0; } catch(e){}
        medalAudioHover.play().catch(function(){});
      });
      el.addEventListener('click', function(){
        try { medalAudio.currentTime = 0; } catch(e){}
        medalAudio.play().catch(function(){});
      });
    });

    /* Обновить счётчик */
    var got = earnedMedals.length;
    var prog = document.getElementById('awardProgress');
    if(prog) prog.textContent = 'Получено ' + got + ' из ' + ALL_MEDALS.length + ' наград — путь к званию «Лётчик-ас» продолжается';
  }

  /* Fallback: читаем из HTML (для file:// когда fetch падает) */
  function defaultMedals(){
    var earned = [];
    document.querySelectorAll('#medalGrid .medal.earned').forEach(function(el){
      var name = el.querySelector('.medal-name');
      if(!name) return;
      var nameText = name.textContent.trim();
      for(var i=0; i<ALL_MEDALS.length; i++){
        if(ALL_MEDALS[i].name === nameText){
          earned.push({id: ALL_MEDALS[i].id, name: nameText, level: 'gold', sortie: ALL_MEDALS[i].sortie});
          break;
        }
      }
    });
    return earned;
  }

  /* Показать toast для новой медали */
  function checkAndToast(earnedMedals){
    if(typeof window.showToast !== 'function') return;
    /* Показываем toast для последней полученной медали */
    if(earnedMedals.length > 0){
      var last = earnedMedals[earnedMedals.length - 1];
      var def = null;
      for(var i=0; i<ALL_MEDALS.length; i++){
        if(ALL_MEDALS[i].id === last.id){ def = ALL_MEDALS[i]; break; }
      }
      if(def){
        window.showToast('Медаль «' + def.name + '» — ' + LEVEL_LABELS[last.level], 'medal');
      }
    }
  }

  /* Загрузка и инициализация */
  fetch('assets/data/progress.json').then(function(r){ return r.json(); }).then(function(d){
    var earned = (d && d.medals) || [];
    renderMedals(earned);
    checkAndToast(earned);
  }).catch(function(){
    /* Fallback: читаем из статики или дефолтные медали */
    var earned = defaultMedals();
    if(earned.length === 0){
      /* Если в HTML ничего нет — ставим дефолт (2 золотые медали) */
      earned = [
        {id:'m01', name:'Разведчик неба', level:'gold', sortie:1},
        {id:'m02', name:'Летающий танк', level:'gold', sortie:2}
      ];
    }
    renderMedals(earned);
  });

  /* Экспорт для других модулей */
  window.MedalsSystem = {
    ALL_MEDALS: ALL_MEDALS,
    LEVEL_LABELS: LEVEL_LABELS,
    LEVEL_COLORS: LEVEL_COLORS,
    getMedalLevel: getMedalLevel,
    isEarned: isEarned,
    renderMedals: renderMedals
  };
})();
