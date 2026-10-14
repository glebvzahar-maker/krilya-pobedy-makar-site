/* toast.js — popup-уведомления о наградах */
(function(){
  'use strict';

  var container = null;

  function escapeHtml(s){
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function ensureContainer(){
    if(!container){
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  /*
   * showToast(text, type, duration)
   * type: 'medal' | 'rank' | 'streak' | 'info'
   * duration: ms (default 3500)
   */
  window.showToast = function(text, type, duration){
    ensureContainer();
    type = type || 'info';
    duration = duration || 3500;

    var icons = {
      medal: '🎖',
      rank: '⭐',
      streak: '🔥',
      info: '📻'
    };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type]||'') + '</span><span class="toast-text"></span>';
    toast.querySelector('.toast-text').textContent = text;

    container.appendChild(toast);

    requestAnimationFrame(function(){
      toast.classList.add('toast-show');
    });

    setTimeout(function(){
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(function(){
        if(toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, duration);
  };
})();
