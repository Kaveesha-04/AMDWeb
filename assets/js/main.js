/* AMD Labs website behaviour. Plain JavaScript with no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Circuit-board background with travelling light pulses ---------- */
  function circuit() {
    var c = $('#circuit'); if (!c) return;
    var x = c.getContext('2d'), W, H, traces = [], pulses = [], dpr = Math.min(window.devicePixelRatio || 1, 2), seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function build() {
      W = window.innerWidth; H = window.innerHeight; seed = 7;
      if (!W || !H) return;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      traces = [];
      var n = Math.round(Math.max(W, H) / 62);
      for (var i = 0; i < n; i++) {
        var fromLeft = rnd() > 0.5, px = fromLeft ? -10 : W + 10, py = rnd() * H, dir = fromLeft ? 1 : -1, pts = [[px, py]];
        var segs = 2 + Math.floor(rnd() * 3);
        for (var s = 0; s < segs; s++) {
          px += dir * (70 + rnd() * W * 0.26); pts.push([px, py]);
          var d = (rnd() > 0.5 ? 1 : -1) * (24 + rnd() * 90);
          px += dir * Math.abs(d); py += d; pts.push([px, py]);
        }
        var len = 0; for (var k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        traces.push({ pts: pts, len: len });
      }
      pulses = traces.filter(function (_, i) { return i % (W < 760 ? 5 : 3) === 0; }).map(function (t) { return { t: t, p: rnd(), v: 0.0009 + rnd() * 0.0016 }; });
      drawBase();
    }
    var base = document.createElement('canvas');
    function drawBase() {
      base.width = c.width; base.height = c.height;
      var b = base.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
      var phone = W < 760; /* Fainter on phones, where text sits right on top of the lines. */
      b.lineWidth = phone ? 1 : 1.5; b.strokeStyle = phone ? 'rgba(32,88,112,.3)' : 'rgba(32,88,112,.5)'; b.fillStyle = phone ? 'rgba(44,110,138,.4)' : 'rgba(44,110,138,.75)';
      traces.forEach(function (t) {
        b.beginPath(); t.pts.forEach(function (p, i) { i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1]); }); b.stroke();
        var e = t.pts[t.pts.length - 1]; b.beginPath(); b.arc(e[0], e[1], 4.5, 0, 7); b.fill();
      });
      x.clearRect(0, 0, W, H); x.drawImage(base, 0, 0, W, H);
    }
    function at(t, f) {
      var want = f * t.len;
      for (var i = 1; i < t.pts.length; i++) {
        var a = t.pts[i - 1], b = t.pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (want <= l) return [a[0] + (b[0] - a[0]) * want / l, a[1] + (b[1] - a[1]) * want / l];
        want -= l;
      }
      return t.pts[t.pts.length - 1];
    }
    function frame() {
      if (document.hidden || !W) { requestAnimationFrame(frame); return; }
      x.clearRect(0, 0, W, H); x.drawImage(base, 0, 0, W, H);
      pulses.forEach(function (p) {
        p.p += p.v; if (p.p > 1.05) p.p = -0.05;
        var q = at(p.t, Math.max(0, Math.min(1, p.p)));
        var g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], 8);
        g.addColorStop(0, 'rgba(120,235,245,.75)'); g.addColorStop(1, 'rgba(77,212,224,0)');
        x.fillStyle = g; x.beginPath(); x.arc(q[0], q[1], 8, 0, 7); x.fill();
      });
      requestAnimationFrame(frame);
    }
    build();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    if (!reduce) requestAnimationFrame(frame);
  }

  /* ---------- Reveal on scroll, counters, scroll bar, timeline fill ---------- */
  function reveal() {
    var els = $$('.rv');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); $$('[data-count]').forEach(function (e) { e.textContent = e.dataset.prefix + Number(e.dataset.count).toLocaleString('en-US') + e.dataset.suffix; }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
        $$('[data-count]', e.target).concat(e.target.dataset.count ? [e.target] : []).forEach(count);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function count(el) {
    if (el.dataset.ran) return; el.dataset.ran = 1;
    var to = Number(el.dataset.count), t0 = performance.now(), dur = 1300, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    (function tick(t) {
      var f = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - f, 3)));
      el.textContent = pre + v.toLocaleString('en-US') + suf;
      if (f < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function scrollFx() {
    var bar = $('.scrollbar'), tl = $('.tl'), fill = $('.tl-fill');
    function on() {
      var h = document.documentElement, m = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.transform = 'scaleX(' + (m > 0 ? h.scrollTop / m : 0) + ')';
      if (tl && fill) {
        var r = tl.getBoundingClientRect(), p = (window.innerHeight * 0.7 - r.top) / r.height;
        fill.style.height = Math.max(0, Math.min(1, p)) * (r.height - 12) + 'px';
      }
    }
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on); on();
  }

  /* ---------- Menu, lightbox ---------- */
  function menu() {
    var b = $('.menu-btn'), n = $('.nav'); if (!b) return;
    b.addEventListener('click', function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
    $$('a', n).forEach(function (a) { a.addEventListener('click', function () { n.classList.remove('open'); b.setAttribute('aria-expanded', false); }); });
  }


  /* ---------- Site search ---------- */
  function search() {
    var ov = $('#search'), btn = $('.search-btn'); if (!ov || !btn) return;
    var inp = $('input', ov), out = $('#results');
    function open() { ov.classList.add('open'); inp.value = ''; render(''); inp.focus(); }
    function close() { ov.classList.remove('open'); btn.focus(); }
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function render(q) {
      q = q.trim().toLowerCase();
      var idx = window.SEARCH_INDEX || [];
      if (!q) { out.innerHTML = '<li class="none">Try "PID", "wiring", "LiPo", "I2C" or "hover".</li>'; return; }
      var words = q.split(/\s+/);
      var hits = idx.map(function (it) {
        var t = it.t.toLowerCase(), b = it.b.toLowerCase(), sc = 0;
        for (var i = 0; i < words.length; i++) { var w = words[i]; if (t.indexOf(w) > -1) sc += 5; else if (b.indexOf(w) > -1) sc += 1; else return null; }
        return { it: it, sc: sc };
      }).filter(Boolean).sort(function (a, c) { return c.sc - a.sc; }).slice(0, 12);
      out.innerHTML = hits.length ? hits.map(function (h) { return '<li><a href="' + h.it.u + '">' + esc(h.it.t) + '<small>' + esc(h.it.p) + '</small></a></li>'; }).join('') : '<li class="none">No matches.</li>';
    }
    btn.addEventListener('click', open);
    inp.addEventListener('input', function () { render(inp.value); });
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('a')) { ov.classList.remove('open'); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('open')) close();
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
  }

  /* ---------- Checklists remembered in this browser ---------- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function checklists() {
    var boxes = $$('.checks input[type=checkbox]'); if (!boxes.length) return;
    var key = 'amd-' + (document.body.dataset.page || 'x') + '-checks', saved = {};
    try { saved = JSON.parse(store(key) || '{}'); } catch (e) { saved = {}; }
    boxes.forEach(function (b) { if (saved[b.id]) b.checked = true; b.addEventListener('change', function () { saved[b.id] = b.checked; store(key, JSON.stringify(saved)); update(); }); });
    var reset = $('[data-reset-checks]');
    if (reset) reset.addEventListener('click', function () { saved = {}; store(key, '{}'); boxes.forEach(function (b) { b.checked = false; }); update(); });
    function update() {
      var total = boxes.length, n = boxes.filter(function (b) { return b.checked; }).length;
      var bar = $('[data-progress]'), lab = $('[data-progress-label]');
      if (bar) bar.style.width = (100 * n / total) + '%';
      if (lab) lab.textContent = n + ' of ' + total + ' checks done';
      $$('.stage-block').forEach(function (s) {
        var cs = $$('.checks input', s), link = $('.side a[href="#' + s.id + '"]');
        if (link && cs.length) link.classList.toggle('done', cs.every(function (c) { return c.checked; }));
      });
    }
    update();
  }
  function spy() {
    var links = $$('.side a[href^="#"]'); if (!links.length || !('IntersectionObserver' in window)) return;
    if (window.innerWidth < 920) { var fold = $('.side details'); if (fold) fold.open = false; }
    var map = {}; links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove('active'); }); var l = map[e.target.id]; if (l) l.classList.add('active'); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var t = document.getElementById(id); if (t) io.observe(t); });
  }

  /* ---------- Quizzes ---------- */
  function quizzes() {
    $$('.q').forEach(function (q) {
      var btns = $$('button', q);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.disabled = true; if (x.dataset.ok) x.classList.add('right'); });
          if (!b.dataset.ok) b.classList.add('wrong');
          q.classList.add('done');
        });
      });
    });
  }

  /* ---------- Interactive block diagram ---------- */
  function diagram() {
    var info = $('#node-info'); if (!info) return;
    var nodes = $$('.node'), data = window.NODE_INFO || {};
    function pick(n) {
      nodes.forEach(function (o) { o.classList.toggle('on', o.dataset.node === n.dataset.node); });
      var d = data[n.dataset.node]; if (!d) return;
      info.innerHTML = '<span class="eyebrow">' + d.tag + '</span><h3>' + d.t + '</h3><p>' + d.b + '</p>';
    }
    nodes.forEach(function (n) {
      n.addEventListener('click', function () { pick(n); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n); } });
    });
    if (nodes[0]) pick($('.node[data-node=stm32]') || nodes[0]);
  }

  /* ---------- Motor mixing explorer. Uses the firmware's mixing formula. ---------- */
  function mixer() {
    var root = $('#mixer'); if (!root) return;
    var get = function (id) { return Number($('#' + id, root).value); };
    function run() {
      var t = get('m-th'), r = get('m-ro'), p = get('m-pi'), y = get('m-ya');
      ['th', 'ro', 'pi', 'ya'].forEach(function (k) { $('#o-' + k, root).textContent = $('#m-' + k, root).value; });
      var m = [t + r - p + y, t - r - p - y, t + r + p - y, t - r + p + y];
      var lo = Math.min.apply(null, m); if (lo < 1150) m = m.map(function (v) { return v + (1150 - lo); });
      m = m.map(function (v) { return Math.min(1940, Math.round(v)); });
      m.forEach(function (v, i) { $('#mv' + (i + 1), root).textContent = v + ' µs'; $('#mb' + (i + 1), root).style.width = ((v - 1100) / 9) + '%'; });
      window.dispatchEvent(new CustomEvent('amd-controls', { detail: { throttle: (t - 1150) / 790, roll: r / 200, pitch: p / 200, yaw: y / 200 } }));
    }
    $$('input', root).forEach(function (i) { i.addEventListener('input', run); });
    var c = $('[data-mix-center]', root); if (c) c.addEventListener('click', function () { ['ro', 'pi', 'ya'].forEach(function (k) { $('#m-' + k, root).value = 0; }); run(); });
    run();
  }

  /* ---------- One-axis PID simulator for teaching ---------- */
  function pidSim() {
    var c = $('#pid-canvas'); if (!c) return;
    var x = c.getContext('2d'), ids = ['kp', 'ki', 'kd'];
    function draw() {
      var kp = +$('#s-kp').value, ki = +$('#s-ki').value, kd = +$('#s-kd').value, wind = $('#s-wind').checked;
      ids.forEach(function (k) { $('#o-' + k).textContent = $('#s-' + k).value; });
      var dpr = Math.min(window.devicePixelRatio || 1, 2), W = c.clientWidth, H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Teaching model only: a rotating mass with light drag and 40 ms of delay, stepped at 250 Hz like the real loop. */
      var dt = 0.004, ang = 15, rate = 0, I = 0, prev = ang, dF = 0, data = [], N = 1250, out = 0, sat = 200, delay = [], lag = 10;
      for (var i = 0; i < N; i++) {
        var err = 0 - ang, raw = -(ang - prev) / dt; prev = ang; dF = 0.3 * raw + 0.7 * dF;
        var cmd = kp * err + I + kd * dF;
        if (!(Math.abs(cmd) >= sat && err * cmd > 0)) I += ki * 8 * err * dt;
        cmd = Math.max(-sat, Math.min(sat, cmd));
        delay.push(cmd); out = delay.length > lag ? delay.shift() : 0;
        rate += (out * 60 - rate * 2 + (wind ? -360 : 0)) * dt; ang += rate * dt;
        if (ang > 60) { ang = 60; rate = 0; } if (ang < -60) { ang = -60; rate = 0; }
        data.push(ang);
      }
      x.clearRect(0, 0, W, H);
      x.font = '11px "Fira Sans",sans-serif';
      var pad = 30, Y = function (a) { return H / 2 - a / 30 * (H / 2 - 12); }, X = function (i) { return pad + i / N * (W - pad - 8); };
      x.strokeStyle = '#1b3a52'; x.fillStyle = '#7f97a9'; x.lineWidth = 1;
      [-30, -15, 0, 15, 30].forEach(function (a) { x.beginPath(); x.moveTo(pad, Y(a)); x.lineTo(W - 8, Y(a)); x.stroke(); x.fillText(a + '°', 3, Y(a) + 4); });
      [1, 2, 3, 4].forEach(function (s) { x.fillText(s + ' s', X(s / 5 * N) - 7, H - 3); });
      x.strokeStyle = '#f2a63b'; x.setLineDash([5, 5]); x.beginPath(); x.moveTo(pad, Y(0)); x.lineTo(W - 8, Y(0)); x.stroke(); x.setLineDash([]);
      x.strokeStyle = '#4dd4e0'; x.lineWidth = 2.2; x.beginPath();
      data.forEach(function (a, i) { var v = Y(Math.max(-30, Math.min(30, a))); i ? x.lineTo(X(i), v) : x.moveTo(X(i), v); }); x.stroke();
      var tail = data.slice(-250), amp = Math.max.apply(null, tail) - Math.min.apply(null, tail), mean = tail.reduce(function (s, v) { return s + v; }, 0) / tail.length;
      var v = amp > 3 ? (ki > 0.8 ? 'Slow rocking: too much I. Lower it.' : 'Still oscillating: lower P or add D.') : wind && Math.abs(mean) > 1.5 ? 'Settled away from level. This steady offset is what I removes.' : Math.abs(data[500]) > 2 ? 'Reaches level, but slowly. Try more P or less D.' : 'Settles close to level. A good starting point on this model.';
      $('#pid-verdict').textContent = v;
    }
    ids.forEach(function (k) { $('#s-' + k).addEventListener('input', draw); });
    $('#s-wind').addEventListener('change', draw);
    window.addEventListener('resize', draw);
    draw();
  }

  /* ---------- Survey gallery filter on Challenges ---------- */
  function filters() {
    var bar = $('.filters'); if (!bar) return;
    var btns = $$('button', bar), items = $$('.ch');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
        var f = b.dataset.f;
        items.forEach(function (i) { i.style.display = f === 'all' || i.dataset.cat === f ? '' : 'none'; });
      });
    });
    if (location.hash) { var t = document.querySelector(location.hash); if (t && t.tagName === 'DETAILS') t.open = true; }
  }

  /* ---------- Print ---------- */
  function printing() {
    $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
    window.addEventListener('beforeprint', function () { $$('details').forEach(function (d) { d.dataset.was = d.open ? '1' : ''; d.open = true; }); $$('.rv').forEach(function (e) { e.classList.add('in'); }); });
  }

  document.documentElement.classList.add('js');
  document.addEventListener('DOMContentLoaded', function () {
    /* Each feature runs on its own, so one failure cannot stop the rest of the page. */
    [circuit, reveal, scrollFx, menu, lightbox, search, checklists, spy, quizzes, diagram, mixer, pidSim, filters, printing].forEach(function (f) {
      try { f(); } catch (e) { if (window.console) console.error(e); }
    });
  });
})();
