(function () {
  var d = document, root = d.documentElement, site = d.querySelector('.site'), cur = d.querySelector('.curtain');
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // curtain out on arrival
  if (root.className.indexOf('cv-out') > -1 && cur && !reduce) { cur.className = 'curtain out'; setTimeout(function () { cur.className = 'curtain'; root.className = ''; }, 760); } else { root.className = ''; }
  // curtain in on internal navigation
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-nav],a[data-lang]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reduce || !cur || a.hasAttribute('data-lang')) return;
    e.preventDefault(); try { sessionStorage.setItem('itgt-nav', '1'); } catch (x) {}
    cur.className = 'curtain in'; setTimeout(function () { location.href = a.href; }, 520);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && cur) cur.className = 'curtain'; });
  // mobile menu
  var mb = d.querySelector('.menubtn'), nav = d.querySelector('.nav');
  if (mb && nav) mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  // hero carousel
  var copies = d.querySelectorAll('.hero-copy'), marks = d.querySelectorAll('.marks .mk:not(.pp)'), pp = d.querySelector('.mk.pp'), sph = d.querySelector('.hero-art .sph'), bar = d.querySelector('.bar-f'), txt = d.querySelector('.hero-txt');
  if (copies.length === 3 && sph) {
    var imgs = ['im-meeting', 'im-boardroom', 'im-fiber'], i = 0, tick = 0, hold = false, timer;
    var show = function (n) {
      i = n; tick++;
      for (var k = 0; k < 3; k++) { copies[k].classList.toggle('on', k === n); marks[k].classList.toggle('act', k === n); marks[k].setAttribute('aria-pressed', k === n ? 'true' : 'false'); }
      var cells = sph.querySelectorAll('.bd i'); for (var c = 0; c < cells.length; c++) { if (cells[c].className) cells[c].className = imgs[n]; }
      sph.classList.remove('swA', 'swB'); void sph.offsetWidth; sph.classList.add(tick % 2 ? 'swB' : 'swA');
      if (bar) bar.style.animationName = tick % 2 ? 'bar2' : 'bar';
    };
    var start = function () { clearInterval(timer); timer = setInterval(function () { if (!hold) show((i + 1) % 3); }, 7000); };
    var setHold = function (h) { hold = h; if (txt) txt.classList.toggle('paused', h); if (pp) pp.textContent = h ? pp.getAttribute('data-play') : pp.getAttribute('data-pause'); };
    for (var m = 0; m < marks.length; m++) (function (n) { marks[n].addEventListener('click', function () { setHold(true); show(n); }); })(m);
    if (pp) pp.addEventListener('click', function () { setHold(!hold); if (!hold) start(); });
    start();
  }
  // capability tabs
  var tabs = d.querySelectorAll('.tabs .tab'), panel = d.querySelector('.cap-panel'), caps = window.ITGT_CAPS;
  if (tabs.length && panel && caps) {
    var ct = 0, two = function (n) { return (n < 9 ? '0' : '') + (n + 1); };
    for (var t = 0; t < tabs.length; t++) (function (n) { tabs[n].addEventListener('click', function () {
      for (var k = 0; k < tabs.length; k++) { tabs[k].classList.toggle('act', k === n); tabs[k].setAttribute('aria-pressed', k === n ? 'true' : 'false'); }
      panel.querySelector('.cap-n').textContent = two(n); panel.querySelector('.d3').textContent = caps[n].t; panel.querySelector('.p').textContent = caps[n].d;
      ct++; panel.classList.remove('fa', 'fb'); panel.classList.add(ct % 2 ? 'fb' : 'fa');
    }); })(t);
  }
  // contact form: no backend on the static build, so hand the request to the visitor's mail client
  var form = d.querySelector('form.form');
  if (form) {
    var send = form.querySelector('.pill');
    var go = function (e) {
      if (e) e.preventDefault();
      var f = form.elements, need = ['name', 'org', 'email'];
      for (var k = 0; k < need.length; k++) { if (!f[need[k]].value.trim()) { f[need[k]].focus(); return; } }
      if (!f.consent.checked) { f.consent.focus(); return; }
      var lab = function (n) { var l = f[n].closest('label'); return l ? l.firstChild.textContent.replace(/\s*\*\s*$/, '').trim() : n; };
      var lines = ['name', 'org', 'role', 'email', 'topic', 'score', 'msg'].map(function (n) { return lab(n) + ': ' + f[n].value; });
      location.href = 'mailto:info@itgovernanceturkey.com?subject=' + encodeURIComponent(form.getAttribute('aria-label') + ' / ' + f.org.value) + '&body=' + encodeURIComponent(lines.join('\n'));
    };
    form.addEventListener('submit', go); if (send) send.addEventListener('click', go);
  }
})();
