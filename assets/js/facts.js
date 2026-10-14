/* facts.js — ротация фактов 2 раза в неделю (понедельник и четверг) */
(function(){
  'use strict';

  var WEEKS_PER_CYCLE = 4;

  function getWeekNumber(){
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 1);
    var diff = now - start;
    var oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneWeek);
  }

  function getFactSetIndex(totalSets){
    var weekNum = getWeekNumber();
    return weekNum % totalSets;
  }

  function fmt(n){
    return n.toLocaleString('ru-RU');
  }

  fetch('assets/data/facts.json').then(function(r){ return r.json(); }).then(function(sets){
    if(!sets || !sets.length) return;
    var idx = getFactSetIndex(sets);
    var factSet = sets[idx];
    var stats = factSet.stats;
    var statEls = document.querySelectorAll('.stat');

    stats.forEach(function(s, i){
      if(statEls[i]){
        var b = statEls[i].querySelector('b');
        var span = statEls[i].querySelector('span');
        if(b){
          b.dataset.count = s.value;
          b.textContent = fmt(s.value);
        }
        if(span) span.textContent = s.label;
      }
    });
  }).catch(function(e){ console.error('[facts]', e); });

})();
