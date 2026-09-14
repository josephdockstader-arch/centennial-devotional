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
