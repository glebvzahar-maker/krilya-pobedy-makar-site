(function(){
  var play = window.__mgPlay;
  var wrap = document.querySelector('#training .target-wrap');
  if(!wrap) return;
  var win = document.getElementById('trainWin');
  var GOAL = 18;
  var hits = 0;
  var MAX = 80;
  function hole(x,y){
    var h = document.createElement('div');
    h.className = 'bullet-hole game';
    var sz = 10 + Math.random()*9;
    h.style.left = (x - sz/2) + 'px';
    h.style.top = (y - sz/2) + 'px';
    h.style.width = sz + 'px';
    h.style.height = sz + 'px';
    wrap.appendChild(h);
  }
  function spawn(x,y,n){
    for(var i=0;i<n;i++){ hole(x + (Math.random()-0.5)*40, y + (Math.random()-0.5)*40); }
    var holes = wrap.querySelectorAll('.bullet-hole');
    if(holes.length > MAX){ for(var j=0;j<holes.length-MAX;j++) holes[j].remove(); }
  }
  wrap.addEventListener('pointerdown', function(e){
    if(win.classList.contains('show')) return;
    if(play) play();
    hits++;
    var r = wrap.getBoundingClientRect();
    spawn(e.clientX - r.left, e.clientY - r.top, 4);
    if(hits >= GOAL){ win.classList.add('show'); }
  });
  var reset = document.getElementById('trainReset');
  if(reset) reset.addEventListener('click', function(){
    hits = 0;
    wrap.querySelectorAll('.bullet-hole').forEach(function(h){ h.remove(); });
    win.classList.remove('show');
  });
})();
