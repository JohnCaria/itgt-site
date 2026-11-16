(function () {
  var d = document, site = d.querySelector('.site'), slug = site && site.getAttribute('data-post'), box = d.querySelector('.art-b');
  if (!slug || !box) return;
  var hero = box.querySelector('.art-hero'), fix = function (t) { return t.replace(/\s+/g, ' ').replace(/([.?!:”"])(?=[A-ZÇĞİÖŞÜ“])/g, '$1 ').trim(); };
  var done = function () { box.classList.remove('loading'); };
  fetch('/wp-json/wp/v2/posts?slug=' + encodeURIComponent(slug) + '&_fields=content').then(function (r) { return r.json(); }).then(function (ps) {
    if (!ps || !ps[0]) return done();
    var doc = new DOMParser().parseFromString(ps[0].content.rendered, 'text/html'), raw = [], out = [];
    doc.querySelectorAll('script,style,noscript,form,iframe,svg,figure,img').forEach(function (e) { e.remove(); });
    doc.body.querySelectorAll('h1,h2,h3,h4,p,li,blockquote').forEach(function (e) {
      if (e.tagName !== 'BLOCKQUOTE' && e.closest('blockquote')) return;
      if (e.tagName === 'P' && e.closest('li')) return;
      var t = fix(e.textContent); if (!t) return;
      raw.push([e.tagName === 'LI' ? 'l' : e.tagName === 'BLOCKQUOTE' ? 'q' : e.tagName.charAt(0) === 'H' ? 'h' : 'p', t]);
    });
    for (var i = 0; i < raw.length; i++) {
      var k = raw[i][0], t = raw[i][1], next = raw[i + 1];
      if (k === 'h' && /nasıl çalışıyoruz/i.test(t)) break;                      // old-site footer links start here
      if (k === 'p' && /^(Diğer yazılar|Kurumunuzun yapay zeka olgunluğunu on dakikada)/.test(t)) continue;
      if (k === 'p' && i > 0 && t.length <= 90 && !/[.…:;,]$/.test(t) && next && (next[0] !== 'p' || next[1].length > t.length)) k = 'h';   // bold-paragraph headings
      out.push([k, t]);
    }
    var frag = d.createDocumentFragment();
    out.forEach(function (b) {
      var el = d.createElement(b[0] === 'h' ? 'h2' : 'p');
      el.className = b[0] === 'h' ? 'd3' : b[0] === 'q' ? 'art-q' : b[0] === 'l' ? 'p art-li' : 'p';
      el.textContent = b[1]; frag.appendChild(el);
    });
    if (hero && hero.nextSibling) box.insertBefore(frag, hero.nextSibling); else box.appendChild(frag);
    done();
  }).catch(done);
})();
