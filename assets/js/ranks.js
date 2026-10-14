/* ranks.js — звания на основе медалей + серия вылетов */
(function(){
  'use strict';

  var TOTAL = 8;
  var promoteAudio = new Audio('assets/media/rank-promote.m4a');
  promoteAudio.preload = 'auto';
  promoteAudio.volume = 0.7;

  /* Пороги медалей для каждого звания */
  var RANK_THRESHOLDS = {
    '01': 0,   /* Курсант — старт */
    '02': 2,   /* Мл. лейтенант — 2 медали */
    '03': 4,   /* Лейтенант — 4 медали */
    '04': 6,   /* Ст. лейтенант — 6 медалей */
    '05': 8,   /* Капитан — 8 медалей */
    '06': 10,  /* Майор — 10 медалей */
    '07': 12,  /* Подполковник — 12 медалей */
    '08': 14   /* Лётчик-ас — 14 медалей + 90% золота */
  };

  /* Названия званий */
  var RANK_NAMES = {
    '01': 'Курсант',
    '02': 'Мл. лейтенант',
    '03': 'Лейтенант',
    '04': 'Ст. лейтенант',
    '05': 'Капитан',
    '06': 'Майор',
    '07': 'Подполковник',
    '08': 'Лётчик-ас'
  };

  /* Проверка особого условия для Лётчик-аса: 90% золотых медалей */
  function checkAceCondition(medals){
    if(!medals || medals.length < 14) return false;
    var goldCount = 0;
    medals.forEach(function(m){ if(m.level === 'gold') goldCount++; });
    var ratio = goldCount / medals.length;
    return ratio >= 0.9;
  }

  /* Подсчёт медалей по уровням */
  function countByLevel(medals){
    var counts = {bronze:0, silver:0, gold:0};
    if(!medals) return counts;
    medals.forEach(function(m){
      if(counts.hasOwnProperty(m.level)) counts[m.level]++;
    });
    return counts;
  }

  function applyProgress(medals, streak){
    var medalCount = medals ? medals.length : 0;
    var n = 0;
    var nextRank = null;
    var medalsNeeded = 0;
    var aceUnlocked = checkAceCondition(medals);

    document.querySelectorAll('.rank-card').forEach(function(card){
      var step = card.getAttribute('data-step');
      var threshold = RANK_THRESHOLDS[step] || 0;
      var has = false;

      if(step === '08'){
        /* Особое условие для Лётчик-аса: 14 медалей + 90% золота */
        has = aceUnlocked;
      } else {
        has = medalCount >= threshold;
      }

      if(has) n++;

      card.classList.toggle('is-earned', has);
      card.classList.toggle('is-locked', !has);

      var st = card.querySelector('.state');
      if(st){
        st.className = 'state ' + (has ? 'done' : 'lock');
        st.textContent = has ? '✓ ПОЛУЧЕНО' : 'ЗАКРЫТО';
      }

      /* Найти следующее незакрытое звание */
      if(!has && !nextRank){
        nextRank = step;
        medalsNeeded = threshold - medalCount;
      }
    });

    /* Обновить счётчик */
    var count = document.getElementById('rankCount');
    if(count) count.textContent = n + ' / ' + TOTAL + ' ЗВАНИЙ';

    /* Обновить прогресс-бар */
    var bar = document.querySelector('.rank-bar i');
    if(bar) bar.style.setProperty('--p', (n/TOTAL*100) + '%');

    /* Показать информацию о следующем звании */
    var nextInfo = document.getElementById('nextRankInfo');
    if(nextInfo){
      if(nextRank === '08' && medalCount >= 14){
        /* До Лётчик-аса осталось: перевыполнить на золото */
        var counts = countByLevel(medals);
        var goldNeeded = Math.ceil(medalCount * 0.9) - counts.gold;
        if(goldNeeded > 0){
          nextInfo.textContent = 'До «Лётчик-аса»: перевыполни ' + goldNeeded + ' заданий на золото!';
        } else {
          nextInfo.textContent = 'Готово к званию «Лётчик-ас»!';
        }
      } else if(nextRank){
        nextInfo.textContent = 'До звания «' + RANK_NAMES[nextRank] + '» нужно ещё ' + medalsNeeded + ' мед.';
      } else {
        nextInfo.textContent = 'Все звания получены! Лётчик-ас!';
      }
    }

    /* Показать серию */
    var streakEl = document.getElementById('streakCount');
    if(streakEl && streak > 0){
      streakEl.textContent = '🔥 Серия: ' + streak + ' вылет' + (streak > 1 ? (streak < 5 ? 'а' : '') : '');
      streakEl.style.display = '';
    } else if(streakEl) {
      streakEl.style.display = 'none';
    }
  }

  function wireVideos(){
    document.querySelectorAll('.rank-card.has-video').forEach(function(card){
      if(!card.classList.contains('is-earned')) return;
      var img = card.querySelector('.rank-photo img');
      var video = card.querySelector('video');
      if(!video) return;
      video.src = video.dataset.src;
      var timer = null, playing = false, loops = 0;
      function play(){
        if(playing) return;
        playing = true; loops = 0;
        video.classList.add('show');
        if(img) img.style.visibility = 'hidden';
        video.play().catch(function(){});
        try { promoteAudio.currentTime = 0; } catch(e){}
        promoteAudio.play().catch(function(){});
      }
      function stop(){
        playing = false;
        video.pause();
        video.classList.remove('show');
        if(img) img.style.visibility = 'visible';
        try { video.currentTime = 0; } catch(e){}
      }
      video.addEventListener('ended', function(){
        loops++;
        if(loops < 1){ video.play().catch(function(){}); }
        else { stop(); }
      });
      function arm(){ if(timer || playing) return; timer = setTimeout(play, 1000); }
      function disarm(){ if(timer){ clearTimeout(timer); timer = null; } }
      card.addEventListener('mouseenter', arm);
      card.addEventListener('click', arm);
      card.addEventListener('mouseleave', disarm);
    });
  }

  function defaultEarned(){
    var a = [];
    document.querySelectorAll('.rank-card.is-earned').forEach(function(c){ a.push(c.getAttribute('data-step')); });
    return a;
  }

  fetch('assets/data/progress.json').then(function(r){ return r.json(); }).then(function(d){
    var medals = (d && d.medals) || [];
    var streak = (d && d.streak) || 0;

    applyProgress(medals, streak);
    wireVideos();
  }).catch(function(){
    /* Fallback: читаем из статики */
    var n = 0;
    document.querySelectorAll('.rank-card.is-earned').forEach(function(){ n++; });
    applyProgress(new Array(n * 2), 0);
    wireVideos();
  });
})();
