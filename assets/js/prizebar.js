/* prizebar.js — шкала готовности проекта: от нуля до главного приза.
 *
 * Слева ноль боеприпасов, справа — цена наушников, главного приза.
 * Подарки расставлены по шкале не поровну, а по своей цене: сначала
 * дешёвые (мороженое), потом всё более серьёзные, и в самом конце — наушники.
 *
 * Шкала нелинейная: позиция считается как корень от доли цены. Иначе
 * первые шесть подарков слипаются в первых 16% шкалы и наезжают друг
 * на друга. Порядок по цене при этом сохраняется, а подписи оси
 * показывают настоящие боеприпасы.
 *
 * При наведении на подарок появляется плашка: можно его взять сейчас
 * или что ещё надо доделать.
 */
(function () {
  'use strict';

  var POWER = 0.65;          /* степень «сжатия» шкалы */
  var root = null;

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Позиция на шкале в процентах: 0 — начало, 100 — цена главного приза */
  function pos(cost, max) {
    if (!max || cost <= 0) return 0;
    var p = Math.pow(cost / max, POWER) * 100;
    return Math.min(100, Math.max(0, p));
  }

  /* Сколько ещё боеприпасов до подарка */
  function lack(prize, ammo) {
    return Math.max(0, prize.cost - ammo);
  }

  function buildTip(prize, ammo, gate) {
    var can = !gate.locked && ammo >= prize.cost;
    var lines = [];

    if (can) {
      lines.push('<b class="pt-ok">МОЖНО ЗАКАЗАТЬ</b>');
      lines.push('<span class="pt-line">Хватает боеприпасов: ' + fmt(prize.cost) +
        '. После покупки останется ' + fmt(ammo - prize.cost) + '</span>');
    } else {
      if (gate.locked) {
        lines.push('<b class="pt-locked">ПОКА НЕЛЬЗЯ</b>');
        gate.reasons.forEach(function (r) {
          lines.push('<span class="pt-line">— ' + esc(r) + '</span>');
        });
      }
      var l = lack(prize, ammo);
      if (l > 0) {
        lines.push('<span class="pt-line">Не хватает <b>' + fmt(l) + '</b> боеприпасов</span>');
      }
    }
    if (prize.hero) {
      lines.push('<span class="pt-hero">' + esc(prize.hero) + '</span>');
    }
    return lines.join('');
  }

  function render(prizes, progress, ammo) {
    if (!root) return;
    var max = prizes.reduce(function (m, p) { return Math.max(m, p.cost); }, 0);
    if (!max) return;

    var gate = window.Sokol && window.Sokol.prizeGate
      ? window.Sokol.prizeGate
      : function () { return { locked: false, reason: '', reasons: [] }; };

    /* линия и заливка */
    var fill = root.querySelector('.prize-scale-fill');
    if (fill) fill.style.width = pos(ammo, max) + '%';

    var badge = root.querySelector('.prize-scale-badge');
    if (badge) {
      badge.style.left = pos(ammo, max) + '%';
      badge.innerHTML = fmt(ammo) + ' <span>✦</span>';
    }

    /* подарки на шкале */
    var track = root.querySelector('.prize-scale-track');
    if (track) {
      track.querySelectorAll('.prize-marker').forEach(function (m) { m.remove(); });
      prizes.forEach(function (p) {
        var g = gate(p, progress);
        var can = !g.locked && ammo >= p.cost;
        var place = pos(p.cost, max);
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'prize-marker' + (can ? ' is-open' : (g.locked ? ' is-locked' : ' is-pending'));
        if (place < 16) el.classList.add('is-edge-left');
        if (place > 84) el.classList.add('is-edge-right');
        el.style.left = place + '%';
        el.setAttribute('aria-label', p.name + ' — ' + fmt(p.cost) + ' боеприпасов');
        el.innerHTML =
          '<span class="prize-marker-icon">' + esc(p.icon) + '</span>' +
          '<span class="prize-tip" role="tooltip">' +
            '<span class="pt-name">' + esc(p.icon) + ' ' + esc(p.name) + '</span>' +
            '<span class="pt-cost">' + fmt(p.cost) + ' боеприпасов</span>' +
            buildTip(p, ammo, g) +
          '</span>';
        track.appendChild(el);
      });
    }

    /* подписи оси — настоящие боеприпасы на своей warped-позиции */
    var axis = root.querySelector('.prize-scale-axis');
    if (axis) {
      var ticks = [0, 25000, 50000, 75000, 100000, 125000, max];
      axis.innerHTML = ticks.map(function (t) {
        return '<span class="prize-tick" style="left:' + pos(t, max) + '%">' + fmt(t) + '</span>';
      }).join('');
    }

    /* строка состояния под шкалой */
    var status = root.querySelector('.prize-scale-status');
    if (status) {
      var pct = Math.round(pos(ammo, max));
      var top = prizes[prizes.length - 1];
      var need = Math.max(0, top.cost - ammo);
      status.innerHTML = 'Сейчас <b>' + fmt(ammo) + '</b> боеприпасов — это <b>' + pct + '%</b> шкалы к главному призу. ' +
        (need > 0
          ? 'До «' + esc(top.name) + '» осталось <b>' + fmt(need) + '</b>.'
          : 'Боеприпасов хватает на главный приз — проверь условия.');
    }
  }

  function load() {
    root = document.getElementById('prizeScale');
    if (!root) return;
    Promise.all([
      fetch('assets/data/prizes.json').then(function (r) { return r.json(); }),
      fetch('assets/data/progress.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      var prizes = (res[0] && res[0].prizes) || [];
      var progress = res[1] || {};
      var ammo = parseInt(progress.ammo || '0', 10) || 0;
      render(prizes, progress, ammo);
    }).catch(function (e) {
      console.error('[prizebar]', e);
    });
  }

  window.MakarPrizeBar = { render: render, reload: load };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
