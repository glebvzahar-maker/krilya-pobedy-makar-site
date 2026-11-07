(function(){
  var FALLBACK_CODE = '1945';
  var gate = document.getElementById('gate');
  var input = document.getElementById('gateCode');
  var btn = document.getElementById('gateBtn');
  var err = document.getElementById('gateErr');
  if(!gate) return;
  function fail(){ if(err) err.textContent = 'Неверный код. Попробуй ещё раз.'; if(input) input.value=''; }
  function open(){
    gate.classList.add('hide');
    document.body.classList.add('unlocked');
    try { var ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac && ac.state === 'suspended') ac.resume(); } catch (e) {}
  }
  function check(){
    var val = (input && input.value || '').trim();
    fetch('assets/data/site.json').then(function(r){return r.json();}).then(function(d){
      var code = (d && d.gateCode) ? String(d.gateCode) : '';
      if(val === code){ open(); } else { fail(); }
    }).catch(function(){ if(val === FALLBACK_CODE){ open(); } else { fail(); } });
  }
  if(btn) btn.addEventListener('click', check);
  if(input) input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ check(); } });
})();
