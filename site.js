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
