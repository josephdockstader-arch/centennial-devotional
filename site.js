(function () {
  var btn = document.querySelector('.menubtn');
  var nav = document.getElementById('cohortnav');
  if (!btn || !nav) return;

  function setOpen(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.hidden = !open;
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(nav.hidden);
  });

  document.addEventListener('click', function (e) {
    if (!nav.hidden && !nav.contains(e.target) && e.target !== btn) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();

/* term tabs (added 2026-09-14) */
(function () {
  var tabsets = document.querySelectorAll('.tabs');
  Array.prototype.forEach.call(tabsets, function (tabs) {
    var btns = tabs.querySelectorAll('.tab');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(btns, function (o) {
          o.classList.toggle('active', o === b);
          var p = document.getElementById(o.getAttribute('data-panel'));
          if (p) p.hidden = o !== b;
        });
      });
    });
  });
})();

/* find-your-cohort name search (added 2026-09-19) */
(function () {
  var input = document.getElementById('nfq');
  var out = document.getElementById('nf-out');
  var data = document.getElementById('nf-data');
  if (!input || !out || !data) return;

  var people;
  try { people = JSON.parse(data.textContent); } catch (e) { return; }

  function fold(s) {
    s = s.toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  people.forEach(function (p) { p._k = fold(p.n).split(' '); });

  /* every word typed has to start some word of the name, so
     "gray tim" finds Graydon Timpson and "hammond" finds them all */
  function score(p, terms) {
    var used = [], i, j, hit;
    for (i = 0; i < terms.length; i++) {
      hit = -1;
      for (j = 0; j < p._k.length; j++) {
        if (used.indexOf(j) === -1 && p._k[j].indexOf(terms[i]) === 0) {
          hit = j; break;
        }
      }
      if (hit === -1) return null;
      used.push(hit);
    }
    /* lower ranks first: whole-word and first-name matches win */
    var s = 0;
    for (i = 0; i < used.length; i++) {
      if (p._k[used[i]].length === terms[i].length) s -= 2;
      if (used[i] === 0) s -= 1;
    }
    return s;
  }

  var active = -1, rows = [];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(matches, q, total) {
    rows = [];
    active = -1;
    if (!q) {
      out.innerHTML = '';
      out.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    if (!matches.length) {
      out.innerHTML = '<p class="nf-none">No match yet. Check the spelling, '
        + 'or <a href="#cohorts">browse the year below</a>.</p>';
      out.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      return;
    }
    out.innerHTML = matches.map(function (p) {
      return '<a class="nf-row" role="option" href="' + esc(p.u) + '">'
        + '<span class="nf-name">' + esc(p.n) + '</span>'
        + '<span class="nf-co">' + esc(p.t) + '</span>'
        + '<span class="nf-when">' + esc(p.d) + '</span></a>';
    }).join('');
    if (total > matches.length) {
      out.insertAdjacentHTML('beforeend',
        '<p class="nf-more">Showing ' + matches.length + ' of ' + total
        + '. Keep typing to narrow it down.</p>');
    }
    rows = out.querySelectorAll('.nf-row');
    out.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  }

  function search() {
    var q = fold(input.value);
    if (!q) return render([], '');
    var terms = q.split(' ');
    var hits = [];
    people.forEach(function (p) {
      var s = score(p, terms);
      if (s !== null) hits.push([s, p]);
    });
    hits.sort(function (a, b) {
      return a[0] - b[0] || a[1].n.localeCompare(b[1].n);
    });
    render(hits.slice(0, 8).map(function (h) { return h[1]; }), q, hits.length);
  }

  function setActive(i) {
    if (!rows.length) return;
    if (active > -1) rows[active].classList.remove('on');
    active = (i + rows.length) % rows.length;
    rows[active].classList.add('on');
    rows[active].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', search);
  input.addEventListener('focus', search);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      if (rows.length) {
        e.preventDefault();
        rows[active > -1 ? active : 0].click();
      }
    } else if (e.key === 'Escape') {
      input.value = '';
      render([], '');
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target !== input && !out.contains(e.target)) {
      out.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
    }
  });
})();
