/* checklist.js — «Лист заданий пилота».
 *
 * Мотивационный лист: видно, что лендинг уже наполнен и что ещё нужно
 * донести. Закрытие пункта бывает двух видов:
 *   • материал положен на сервер — пункт проверяется HEAD-запросом
 *     по полю probe и зеленеет сам, без правки кода;
 *   • Макар отметил «сделал» сам — галочка живёт в localStorage.
 */
(function () {
  'use strict';

  var DATA = 'assets/data/checklist.json';
  var STORE = 'makarChecklist';
  var root = null;

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function writeStore(obj) {
    try { localStorage.setItem(STORE, JSON.stringify(obj)); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Есть ли файл на сервере. HEAD дешёвый: тело не качаем. */
  function probe(url) {
    if (!url) return Promise.resolve(false);
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  function render(data) {
    if (!root) return;
    var marked = readStore();
    var blocks = [];
    var total = 0;

    data.groups.forEach(function (g) {
      var rows = g.items.map(function (it) {
        total += 1 + (it.voice ? 1 : 0);
        var photoOk = !!marked['photo:' + it.id];
        var voiceOk = !it.voice || !!marked['voice:' + it.id];
        var all = photoOk && voiceOk;

        var voiceRow = it.voice
          ? '<label class="ck-sub' + (voiceOk ? ' is-done' : '') + '" data-kind="voice" data-id="' + esc(it.id) + '">' +
              '<span class="ck-box"></span>' +
              '<span class="ck-sub-text">Голос: расскажи, зачем он нужен</span>' +
            '</label>'
          : '';

        return '<li class="ck-item' + (all ? ' is-done' : '') + '">' +
          '<div class="ck-main">' +
            '<button type="button" class="ck-title' + (all ? ' is-done' : '') + '" data-kind="photo" data-id="' + esc(it.id) + '">' +
              '<span class="ck-box"></span>' +
              '<b>' + esc(it.title) + '</b>' +
            '</button>' +
            '<span class="ck-what">' + esc(it.what) + '</span>' +
            voiceRow +
          '</div>' +
          '<span class="ck-state">' + (all ? '✓ на сайте' : photoOk ? (it.voice ? 'остался голос' : 'фото готово') : 'ждём фото') + '</span>' +
        '</li>';
      }).join('');

      blocks.push(
        '<section class="ck-group panel hud ck-in">' +
          '<header class="ck-head">' +
            '<div><h3 class="ck-group-title">' + esc(g.title) + '</h3>' +
            '<p class="ck-group-sub">' + esc(g.subtitle) + '</p></div>' +
            '<span class="ck-group-count" data-group="' + esc(g.id) + '">0 / ' + g.items.length + '</span>' +
          '</header>' +
          '<p class="ck-lead">' + esc(g.lead) + '</p>' +
          '<ul class="ck-list">' + rows + '</ul>' +
        '</section>'
      );
    });

    root.innerHTML =
      '<div class="ck-total panel hud ck-in">' +
        '<span class="ck-total-num" id="ckTotalNum">0</span>' +
        '<span class="ck-total-den">/ ' + total + '</span>' +
        '<span class="ck-total-text">пунктов уже на сайте. Остальные — твоя следующая цель.</span>' +
        '<div class="ck-bar"><i id="ckBar"></i></div>' +
      '</div>' +
      '<div class="ck-grid">' + blocks.join('') + '</div>';
  }

  function recount() {
    /* Считаем не группы, а подпункты: у предмета их два — фото и голос.
       Иначе галочка «сделал фото» не двигает счётчик и выглядит как баг. */
    var boxes = root.querySelectorAll('.ck-title, .ck-sub');
    var ticked = root.querySelectorAll('.ck-title.is-done, .ck-sub.is-done');
    var num = document.getElementById('ckTotalNum');
    var bar = document.getElementById('ckBar');
    var den = document.querySelector('.ck-total-den');
    if (num) num.textContent = ticked.length;
    if (den) den.textContent = '/ ' + boxes.length;
    if (bar) bar.style.width = (boxes.length ? (ticked.length / boxes.length) * 100 : 0) + '%';

    root.querySelectorAll('.ck-group').forEach(function (gsec) {
      var gid = gsec.querySelector('.ck-group-count');
      if (!gid) return;
      var gb = gsec.querySelectorAll('.ck-title, .ck-sub');
      var gd = gsec.querySelectorAll('.ck-title.is-done, .ck-sub.is-done').length;
      gid.textContent = gd + ' / ' + gb.length;
      gid.classList.toggle('is-full', gd === gb.length && gb.length > 0);
    });
  }

  /* По клику ставим/снимаем отметку. Факт появления файла перебивает отметку. */
  function toggle(el) {
    var kind = el.dataset.kind;
    var id = el.dataset.id;
    var key = kind + ':' + id;
    var store = readStore();
    if (store[key]) { delete store[key]; }
    else { store[key] = true; }
    writeStore(store);
    var item = el.closest('.ck-item');
    if (item) {
      var photo = item.querySelector('[data-kind="photo"]');
      var voice = item.querySelector('[data-kind="voice"]');
      var photoOk = !!readStore()['photo:' + id];
      var voiceOk = !voice || !!readStore()['voice:' + id];
      item.classList.toggle('is-done', photoOk && voiceOk);
      photo.classList.toggle('is-done', photoOk);
      if (voice) voice.classList.toggle('is-done', voiceOk);
      var state = item.querySelector('.ck-state');
      if (state) {
        state.textContent = photoOk && voiceOk ? '✓ на сайте'
          : photoOk ? (voice ? 'остался голос' : 'фото готово')
          : 'ждём фото';
      }
    }
    recount();
    if (typeof window.showToast === 'function') {
      window.showToast(
        store[kind + ':' + id] ? '✓ Отмечено! Осталось донести материал' : 'Отметка снята',
        'info', 1600
      );
    }
  }

  /* Материал уже лежит на сервере — закрываем пункт сами. */
  function autoFill(data) {
    var jobs = [];
    data.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        var todo = [{ url: it.probe, kind: 'photo' }];
        if (it.voice) todo.push({ url: it.voice, kind: 'voice' });
        todo.forEach(function (t) {
          jobs.push(probe(t.url).then(function (ok) {
            if (!ok) return;
            var btn = root.querySelector('[data-kind="' + t.kind + '"][data-id="' + it.id + '"]');
            if (!btn) return;
            btn.classList.add('is-done');
            var item = btn.closest('.ck-item');
            if (!item) return;
            var photoBtn = item.querySelector('[data-kind="photo"]');
            var voiceBtn = item.querySelector('[data-kind="voice"]');
            var photoOk = photoBtn.classList.contains('is-done');
            var voiceOk = !voiceBtn || voiceBtn.classList.contains('is-done');
            item.classList.toggle('is-done', photoOk && voiceOk);
            var st = item.querySelector('.ck-state');
            if (st) {
              st.textContent = photoOk && voiceOk ? '✓ на сайте'
                : photoOk ? 'остался голос'
                : 'ждём фото';
            }
          }));
        });
      });
    });
    return Promise.all(jobs).then(recount);
  }

  function init() {
    root = document.getElementById('checklistBody');
    if (!root) return;
    fetch(DATA)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        render(data);
        recount();
        root.addEventListener('click', function (e) {
          var el = e.target.closest('[data-kind]');
          if (el && root.contains(el)) toggle(el);
        });
        return autoFill(data);
      })
      .catch(function (e) {
        root.innerHTML = '<p class="ck-error">Лист заданий не загрузился.</p>';
        console.error('checklist:', e);
      });
  }

  window.MakarChecklist = { init: init, recount: recount };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();