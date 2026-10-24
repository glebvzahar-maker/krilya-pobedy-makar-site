(function(){
  var r=document.getElementById('reticle');
  if(!r) return;
  document.documentElement.classList.add('reticle-on');
  var shown=false;
  var over=false;

  /* Прицел не нужен над кнопками и ссылками: он попадал прямо на текст
     вариантов ответа и мешал нажимать. Над интерактивом его прячем. */
  function isInteractive(e){
    var t=e.target;
    return !!(t && t.closest && t.closest('button, a, input, select, textarea, [role="radio"]'));
  }

  function move(e){
    r.style.left=e.clientX+'px';
    r.style.top=e.clientY+'px';
    var hide=isInteractive(e);
    if(hide===over) return;
    over=hide;
    if(hide){
      shown=false;
      r.classList.remove('show');
    }else{
      shown=true;
      r.classList.add('show');
    }
  }

  window.addEventListener('pointermove', move, {passive:true});
  window.addEventListener('pointerdown', function(){
    if(over) return;
    r.classList.add('fire');
    setTimeout(function(){ r.classList.remove('fire'); }, 140);
  });
})();
