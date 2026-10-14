(function(){
  var r=document.getElementById('reticle');
  if(!r) return;
  document.documentElement.classList.add('reticle-on');
  var shown=false;
  function move(e){
    r.style.left=e.clientX+'px';
    r.style.top=e.clientY+'px';
    if(!shown){ shown=true; r.classList.add('show'); }
  }
  window.addEventListener('pointermove', move, {passive:true});
  window.addEventListener('pointerdown', function(){
    r.classList.add('fire');
    setTimeout(function(){ r.classList.remove('fire'); }, 140);
  });
})();
