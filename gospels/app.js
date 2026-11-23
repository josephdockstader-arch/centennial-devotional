/* The Four Gospels: one tall sheet, four columns. Data comes from data/*.js (built by build.py). */
(function () {
const G = window.GOSPELS, NOTES = window.NOTES || [], DICT = window.DICT || {forms:{},cards:{},greek:{}};
const LONG = {Matt:"Matthew",Mark:"Mark",Luke:"Luke",John:"John"}, BOOKS = ["Matt","Mark","Luke","John"];
const READ = 0.5;                                 // below this zoom the text is a picture: no selecting, clicks jump in
const $ = s => document.querySelector(s), el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const world = $("#world"), viewport = $("#viewport"), pop = $("#pop"), heads = $("#heads");
const BOT = Object.assign({wr: [], spray: [], tb: [], curl: []}, G.bot || {});

/* ---------- storage (the page works without it) ---------- */
const mem = {};
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return mem[k] || d; } };
const save = (k, v) => { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- leaf colours ---------- */
const LEAF_COL = {green:"#1d4634",gold:"#b0872f",blue:"#7d97a3",clay:"#b5694a",lavender:"#9a8fa8",olive:"#8a9a6b"};
const st = el("style");
st.textContent = Object.entries(G.types).map(([t, d]) => G.leaves ? `.t-${t}{background-image:url(art/leaf_${d.leaf}.png)}` : `.t-${t}{background-color:${LEAF_COL[d.leaf]};border-radius:50% 0}`).join("");
document.head.appendChild(st);

/* ---------- build the sheet ---------- */
const secEls = [], partEls = [];
const dim = a => { const z = (G.artSize || {})[a]; return z ? ` width="${z[0]}" height="${z[1]}"` : ""; };
const img = (a, cls) => `<img${cls ? ` class="${cls}"` : ""} loading="lazy"${dim(a)} src="art/${a}.webp" alt="">`;
const opsHTML = (ops, side) => ops.map(o => o[0] === "=" ? esc(side === "k" && o[2] ? o[2] : o[1])
  : o[0] === "+" ? (side === "k" ? "" : `<u>${esc(o[1])}</u>`) : (side === "j" ? "" : `<s>${esc(o[1])}</s>`)).filter(Boolean).join(" ");
function verseHTML(v, first, prevCh) {
  const [, cv] = v.r.split(" "), [c, n] = cv.split(":"), showCh = first || n === "1" || c !== prevCh;
  let h = `<span class="v${v.p ? " para" : ""}" data-r="${v.r}" data-s="${v.s}">` +
          `<span class="vn${showCh ? " ch" : ""}" tabindex="0" role="button" aria-label="${LONG[v.r.split(" ")[0]]} ${cv}: compare translations">${showCh ? c + ":" + n : n}</span>` +
          (v.j ? `<span class="jsm" title="Joseph Smith changed this verse">JS</span>` : "") +
          `<span class="vt">${v.h}</span></span> `;
  if (v.j) h += v.j.sm
    ? `<div class="jstw sm${v.j.fb ? " fb" : ""}"><span class="lbl">Joseph Smith</span>${v.j.ops.filter(o => o[0] !== "=").map(o => o[0] === "+" ? `<u>${esc(o[1])}</u>` : `<s>${esc(o[1])}</s>`).join(" ")}</div>`
    : `<div class="jstw${v.j.fb ? " fb" : ""}"><span class="lbl">Joseph Smith's translation</span>${opsHTML(v.j.ops, "j")}</div>`;
  return h;
}
const frame = el("div", "frame"); world.appendChild(frame);
frame.appendChild(el("div", "titlepage",
  (G.titleArt ? `<img class="pano"${dim("title_panorama")} src="art/title_panorama.webp" alt="">` : "") +
  `<div class="kick">The Life of Jesus Christ</div><h1>The Four Gospels</h1>` +
  `<div class="by">according to <b>Matthew</b>, <b>Mark</b>, <b>Luke</b> and <b>John</b></div>` +
  (G.flourish ? `<img class="fl"${dim("title_flourish")} src="art/title_flourish.webp" alt="">` : `<div class="rule"></div>`) +
  `<p class="how">Set side by side as one story, in the words of the King James Version, with the changes made by the Prophet Joseph Smith. ` +
  `Touch any word for its meaning, any verse number to compare translations, and any olive leaf for a note.</p>` +
  `<button class="begin">Begin reading</button>`));
const jstOf = {}; let curPart = -1;
const NUMS = ["One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"];
G.sections.forEach((s, i) => {
  if (s.part !== curPart) {
    curPart = s.part; const p = G.parts[curPart], wr = BOT.wr.length ? BOT.wr[curPart % BOT.wr.length] : null;
    const head = `<div class="kick">Part ${NUMS[curPart] || curPart + 1}</div><h2>${esc(p.t)}</h2>`;
    const d = el("div", "part" + (wr ? " wreathed" : ""),
      (wr ? `<div class="wreath"><img${dim(wr)} src="art/${wr}.webp" alt=""><div class="in">${head}</div></div>` : head) + (p.art ? img(p.art, "scene") : ""));
    frame.appendChild(d); partEls[curPart] = d;
  }
  const sec = el("div", "sec"); sec.dataset.i = i;
  // ornament: about one title in six has a branch winding under it, one in six a single spray; the rest a plain rule
  const tb = BOT.tb.length && i % 6 === 2 ? BOT.tb[((i - 2) / 6) % BOT.tb.length] : null;
  const spr = !tb && BOT.spray.length && i % 6 === 5 ? BOT.spray[((i - 5) / 6) % BOT.spray.length] : null;
  let h = `<h3 class="${tb ? "branched" : spr ? "sprayed" : ""}">${spr ? img(spr, "spr") : ""}<span>${esc(s.t)}</span>${tb ? img(tb, "tb") : ""}</h3><div class="cols">`;
  s.c.forEach((col, bi) => {
    if (s.wide && bi === s.wide[0]) { h += `<div class="col empty wide" style="grid-column:span ${s.wide[1]}">${img(s.wide[2])}</div>`; return; }
    if (s.wide && bi > s.wide[0] && bi < s.wide[0] + s.wide[1]) return;
    if (!col.length) { h += `<div class="col empty${s.study ? " study " + s.study : ""}">${s.art && s.art[bi] ? img(s.art[bi]) : ""}</div>`; return; }
    let prev = null; h += `<div class="col" data-b="${bi}">`;
    col.forEach((v, n) => { if (v.j) jstOf[v.r] = v.j; h += verseHTML(v, n === 0, prev); prev = v.r.split(" ")[1].split(":")[0]; });
    h += `</div>`;
  });
  sec.innerHTML = h + `</div>`; frame.appendChild(sec); secEls.push(sec);
});
frame.appendChild(el("div", "end", (G.flourish ? `<img${dim("title_flourish")} src="art/title_flourish.webp" alt="">` : "") + `<div>Here end the four Gospels.</div>` +
  `<p class="credits">The King James Version, 1769 text. Joseph Smith's translation from the edition printed at Plano, Illinois, 1867. ` +
  `Definitions from Noah Webster's <i>American Dictionary of the English Language</i>, 1828 (transcription: github.com/akaitsurugi/webster1828, CC BY-SA 4.0). ` +
  `Greek from James Strong's dictionary, 1890 (Open Scriptures, CC BY-SA). Order of the passages after A. T. Robertson's <i>Harmony of the Gospels</i>, 1922.</p>`));

/* ---------- camera: every move goes through here ---------- */
let x = 0, y = 0, k = 1, fitK = 1, geo = null, anim = 0, raf = 0, fitted = true, last = {};
const BAR = 82, REF = BAR + 70;                    // REF: the reading line used for "where am I"
const stopFlight = () => cancelAnimationFrame(anim);
const clampK = v => Math.max(0.08, Math.min(2.4, v));
function measure() {                               // world-space geometry, cached; redone when layout changes
  const fr = frame.getBoundingClientRect(), W = world.getBoundingClientRect(), cs = getComputedStyle(document.documentElement);
  const wy = e => { const r = e.getBoundingClientRect(); return {y: (r.top - y) / k, h: r.height / k}; };
  geo = {fx: (fr.left - x) / k, fw: fr.width / k, h: W.height / k, secs: secEls.map(wy), parts: partEls.map(wy)};
  geo.cw = parseFloat(cs.getPropertyValue("--colw")); geo.step = geo.cw + parseFloat(cs.getPropertyValue("--gut"));
  const lastS = geo.secs[geo.secs.length - 1]; geo.end = lastS.y + lastS.h;
  layoutTL();
}
function apply() { if (!raf) raf = requestAnimationFrame(paintCam); }
function paintCam() {
  raf = 0;
  y = Math.min(BAR + 30, Math.max(innerHeight * 0.6 - geo.h * k, y));                        // stay on the sheet
  const fwid = geo.fw * k, lo = innerWidth - 60 - fwid - geo.fx * k, hi = 60 - geo.fx * k;
  x = fwid <= innerWidth ? (innerWidth - fwid) / 2 - geo.fx * k : Math.min(Math.max(x, Math.min(lo, hi)), Math.max(lo, hi));
  world.style.transform = `translate(${x}px,${y}px) scale(${k})`;
  document.body.classList.toggle("small", k < READ);
  document.body.classList.toggle("top", y > BAR - 560 * k);
  [...heads.children].forEach((h, n) => { h.style.left = x + (geo.fx + n * geo.step) * k + "px"; h.style.width = geo.cw * k + "px"; });
  drawTL(); saveSpot();
  if (x !== last.x || y !== last.y || k !== last.k) { closePop(); $("#selbar").hidden = true; last = {x, y, k}; }
}
function zoomAt(cx, cy, nk) { stopFlight(); nk = clampK(nk); x = cx - (cx - x) * (nk / k); y = cy - (cy - y) * (nk / k); k = nk; fitted = false; apply(); }
const fitWidth = () => Math.min(1.25, (innerWidth - 40) / geo.fw);
function fit() { stopFlight(); const a = anchor(); fitK = fitWidth(); k = fitK; fitted = true; restore(a); }
/* Where the reader is: the verse nearest the reading line, and how far it sits from that line on screen. */
function currentSec() { const line = (REF - y) / k; let on = 0; for (let n = 0; n < geo.secs.length; n++) { if (geo.secs[n].y <= line) on = n; else break; } return on; }
function anchor() {
  const line = (REF - y) / k;
  if (line < geo.secs[0].y) return {top: (BAR - y) / k / Math.max(1, geo.secs[0].y)};
  const i = currentSec(), s = geo.secs[i]; let best = null, bd = 1e9;
  secEls[i].querySelectorAll(".v").forEach(v => { const r = v.getBoundingClientRect(), d = Math.abs(r.top - REF); if (d < bd) { bd = d; best = {ref: v.dataset.r, dy: r.top - REF}; } });
  return Object.assign({i, f: Math.min(1, Math.max(0, (line - s.y) / Math.max(1, s.h)))}, best && bd < innerHeight ? best : {});
}
function restore(a) {
  const v = a.ref && world.querySelector(`.v[data-r="${a.ref}"]`);
  if (a.top != null) y = BAR - a.top * geo.secs[0].y * k;
  else if (v) { const L = last.k ? last : {y, k}; y = REF + (a.dy || 0) - ((v.getBoundingClientRect().top - L.y) / L.k) * k; }   // the sheet is still painted at L until the next frame
  else { const s = geo.secs[Math.min(a.i || 0, geo.secs.length - 1)]; y = REF - (s.y + (a.f || 0) * s.h) * k; }
  apply();
}
function flyTo(wy, nk, wx) {                       // bring world line wy to just under the header; optionally centre world column wx
  stopFlight(); nk = clampK(nk); fitted = Math.abs(nk - fitK) < 1e-4;
  const sy = y, sk = k, sx = x, ty = BAR + 34 - wy * nk, t0 = performance.now(), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cx = innerWidth / 2, keep = (cx - x) / k, tx = cx - (wx != null ? wx : keep) * nk;
  (function step(t) {
    let u = still ? 1 : Math.min(1, (t - t0) / 700); u = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    k = Math.exp(Math.log(sk) + (Math.log(nk) - Math.log(sk)) * u); y = sy + (ty - sy) * u; x = sx + (tx - sx) * u; apply();
    if (u < 1) anim = requestAnimationFrame(step);
  })(t0);
}
const colX = bi => geo.fx + bi * geo.step + geo.cw / 2;
function goSection(i, nk) { flyTo(geo.secs[i].y - 10, nk || Math.max(k, fitK)); }
function goPart(n) { flyTo(geo.parts[n].y - 10, Math.max(k, fitK)); }
function goVerse(ref, nk) {
  const v = world.querySelector(`.v[data-r="${ref}"]`); if (!v) return false;
  nk = nk || Math.max(k, fitK); const r = v.getBoundingClientRect(), col = v.closest(".col");
  flyTo((r.top - y) / k - 70 / nk, nk, nk > fitK * 1.02 && col ? colX(+col.dataset.b) : null);
  v.classList.add("flash"); setTimeout(() => v.classList.remove("flash"), 2600); return true;
}
function relayout() { const a = anchor(); measure(); if (fitted) k = fitK = fitWidth(); else fitK = fitWidth(); restore(a); placeCurls(); }
function comfortable() {                           // one Gospel at a comfortable size: about 19.5px type on screen
  const base = parseFloat(getComputedStyle(document.querySelector(".col")).fontSize) || 20, nk = Math.max(clampK(19.5 / base), fitK * 1.12), a = anchor();
  if (!(a.ref && goVerse(a.ref, nk))) zoomAt(innerWidth / 2, REF, nk);
}

viewport.addEventListener("wheel", e => {
  e.preventDefault(); stopFlight(); const u = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, k * Math.exp(-e.deltaY * u * 0.012));
  else { x -= e.deltaX * u; y -= e.deltaY * u; apply(); }
}, {passive: false});
let drag = null, moved = false;
viewport.addEventListener("pointerdown", e => {
  moved = false; closeMenus();
  if (!e.target.closest(".leaf,.vn,mark.hl,.jsm,.ja,.jc")) closePop();
  if (e.button !== 0) return;
  if (k >= READ && e.target.closest(".vt,.jstw,.vn,.leaf,.jsm,.ja,.begin")) return;      // reading: let text be selected and clicked
  getSelection().removeAllRanges(); stopFlight();
  drag = {px: e.clientX, py: e.clientY, x, y}; viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener("pointermove", e => {
  if (!drag) return; const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
  if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; viewport.classList.add("drag"); }
  x = drag.x + dx; y = drag.y + dy; apply();
});
const endDrag = () => { drag = null; viewport.classList.remove("drag"); };
viewport.addEventListener("pointerup", endDrag); viewport.addEventListener("pointercancel", endDrag);
$("#brand").onclick = () => flyTo(0, fitK);
const menuOpen = () => !!document.querySelector(".menu.on");
addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!pop.hidden || menuOpen()) { closePop(); closeMenus(); if (lastFocus && lastFocus.focus) lastFocus.focus(); } return; }
  const t = e.target;
  if (e.key === "Enter" && t.matches("[tabindex],[role=button]") && !t.matches("button,input,textarea")) { t.click(); e.preventDefault(); return; }
  if (t.matches("textarea,input,select,button") || menuOpen()) return;         // keys below move the sheet only when nothing else has them
  const mid = innerWidth / 2;
  if (e.key === "0") fit();
  else if (e.key === "+" || e.key === "=") zoomAt(mid, innerHeight / 2, k * 1.2);
  else if (e.key === "-") zoomAt(mid, innerHeight / 2, k / 1.2);
  else if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") { stopFlight(); y -= innerHeight * (e.key === "ArrowDown" ? 0.15 : 0.8); apply(); e.preventDefault(); }
  else if (e.key === "ArrowUp" || e.key === "PageUp") { stopFlight(); y += innerHeight * (e.key === "ArrowUp" ? 0.15 : 0.8); apply(); e.preventDefault(); }
  else if (e.key === "Home") flyTo(0, fitK);
});
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(relayout, 120); });

/* ---------- timeline along the top: the whole story on one line ---------- */
const tlLine = $("#tlLine"), tlTip = $("#tlTip"), tlPanel = $("#tlPanel");
const partStart = G.parts.map((p, n) => G.sections.findIndex(s => s.part === n));
let TL = {y0: 0, span: 1};
function layoutTL() {                              // each part's width is its share of the page, from its opening to the next one's
  const y0 = geo.parts[0].y, span = geo.end - y0; TL = {y0, span};
  tlLine.innerHTML = G.parts.map((p, n) => {
    const a = geo.parts[n].y, b = n + 1 < G.parts.length ? geo.parts[n + 1].y : geo.end;
    return `<div class="tl-part" data-p="${n}" style="left:${(a - y0) / span * 100}%;width:${(b - a) / span * 100}%"><button class="tl-name" data-p="${n}" aria-label="${esc(p.t)}: list of passages">${esc(p.t)}</button></div>`;
  }).join("") + `<i id="tlHere"></i>`;
  tlLine.querySelectorAll(".tl-part").forEach(d => { const b = d.firstChild; b.classList.toggle("tight", b.scrollWidth > d.clientWidth - 6); });   // a name that does not fit is not shown cut off
}
const secAtFrac = f => { const wy = TL.y0 + f * TL.span; let i = 0; for (let n = 0; n < geo.secs.length; n++) { if (geo.secs[n].y <= wy) i = n; else break; } return i; };
const fracAt = e => { const r = tlLine.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
tlLine.addEventListener("mousemove", e => {
  const i = secAtFrac(fracAt(e)), sc = G.sections[i], onName = e.target.classList.contains("tl-name") && !e.target.classList.contains("tight");
  tlTip.hidden = false; tlTip.innerHTML = onName ? `<i>${esc(G.parts[+e.target.dataset.p].t)}</i> list of passages` : `<i>${esc(G.parts[sc.part].t)}</i> ${esc(sc.t)}`;
  const w = tlTip.offsetWidth / 2 + 12; tlTip.style.left = Math.max(w, Math.min(innerWidth - w, e.clientX)) + "px";
});
tlLine.addEventListener("mouseleave", () => tlTip.hidden = true);
tlLine.addEventListener("click", e => {
  const nm = e.target.closest(".tl-name");
  if (nm && !nm.classList.contains("tight")) { openContents(+nm.dataset.p, nm); return; }
  closeMenus(); goSection(secAtFrac(fracAt(e)));
});
function openContents(part, at) {                  // the list of passages: one part, or (part == null) the whole story
  const same = tlPanel.classList.contains("on") && tlPanel.dataset.p === String(part); closeMenus(); if (same) return;
  lastFocus = document.activeElement; const cur = currentSec(), list = part == null ? G.parts.map((p, n) => n) : [part];
  tlPanel.dataset.p = String(part);
  tlPanel.innerHTML = `<div class="mh"><h4>${part == null ? "All the passages" : esc(G.parts[part].t)}</h4><button class="x" aria-label="Close">×</button></div><div class="mb">` +
    list.map(n => { const end = n + 1 < G.parts.length ? partStart[n + 1] : G.sections.length;
      return (part == null ? `<h5><a tabindex="0" role="button" data-part="${n}">${esc(G.parts[n].t)}</a></h5>` : "") + `<div class="tl-list">` +
        G.sections.slice(partStart[n], end).map((s, q) => `<a tabindex="0" role="button" data-i="${partStart[n] + q}"${partStart[n] + q === cur ? ' class="on"' : ""}>${esc(s.t)}</a>`).join("") + `</div>`; }).join("") + `</div>`;
  tlPanel.classList.add("on");
  const w = tlPanel.offsetWidth, r = at ? at.getBoundingClientRect() : {left: innerWidth / 2, width: 0};
  tlPanel.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + "px"; tlPanel.style.right = "auto";
  const on = tlPanel.querySelector(".on"), body = tlPanel.querySelector(".mb"); if (on) body.scrollTop = on.offsetTop - body.clientHeight / 2;
}
tlPanel.addEventListener("click", e => { const t = e.target;
  if (t.classList.contains("x")) return closeMenus();
  if (t.dataset.part != null) { closeMenus(); return goPart(+t.dataset.part); }
  if (t.dataset.i != null) { closeMenus(); goSection(+t.dataset.i); } });
function drawTL() {
  const h = $("#tlHere"); if (!h) return; const f = ((REF - y) / k - TL.y0) / TL.span;
  h.style.left = Math.max(0, Math.min(1, f)) * 100 + "%";
  let p = -1; if (f >= 0) for (let n = 0; n < geo.parts.length; n++) if (geo.parts[n].y <= (REF - y) / k) p = n;
  tlLine.querySelectorAll(".tl-part").forEach((a, n) => a.classList.toggle("on", n === p));
}

/* ---------- bubbles: beside the words when there is an empty column to hold them ---------- */
let lastFocus = null;
function showPop(html, src, wide) {
  const rect = src.getBoundingClientRect ? src.getBoundingClientRect() : src;
  pop.className = "pop" + (wide ? " wide" : ""); pop.innerHTML = `<button class="x" aria-label="Close">×</button><div class="body">${html}</div>`; pop.hidden = false;
  const pw = pop.offsetWidth, ph = pop.offsetHeight, M = 12; let left = null, top;
  const col = src.closest && src.closest(".col");
  if (col && !wide) {                              // an empty neighbour column? float the bubble there, level with the words
    for (const nb of [col.nextElementSibling, col.previousElementSibling]) {
      if (!nb || !nb.classList.contains("empty")) continue; const nr = nb.getBoundingClientRect();
      if (nr.width < pw * 0.7) continue;
      const l = nb === col.nextElementSibling ? Math.max(nr.left + 6, col.getBoundingClientRect().right + 14) : Math.min(nr.right - pw - 6, col.getBoundingClientRect().left - pw - 14);
      if (l >= M && l + pw <= innerWidth - M) { left = l; break; }
    }
  }
  if (left != null) { top = Math.max(BAR + 6, Math.min(rect.top - 18, innerHeight - ph - M)); pop.classList.add("side"); }
  else {
    left = Math.max(M, Math.min(innerWidth - pw - M, rect.left + rect.width / 2 - 40)); top = rect.bottom + 12;
    if (top + ph > innerHeight - M && rect.top - ph - 12 > BAR) { top = rect.top - ph - 12; pop.classList.add("below"); }
    const t2 = Math.max(BAR + 4, Math.min(top, innerHeight - ph - M)); if (t2 !== top) pop.classList.add("side"); top = t2;   // no pointer when it no longer points
    pop.style.setProperty("--tail", Math.max(14, Math.min(pw - 28, rect.left + rect.width / 2 - left - 6)) + "px");
  }
  pop.style.left = left + "px"; pop.style.top = top + "px";
  pop.querySelector(".x").onclick = () => { closePop(); if (lastFocus && lastFocus.focus) lastFocus.focus(); };
}
function closePop() { if (!pop.hidden) { pop.hidden = true; pop.innerHTML = ""; } }
pop.addEventListener("pointerdown", e => e.stopPropagation());
pop.addEventListener("wheel", e => e.stopPropagation());
const srcHTML = list => (list || []).map(s => { const [t, u] = s.split(" | "); return u && /^https?:/.test(u.trim()) ? `<a href="${esc(u.trim())}" target="_blank" rel="noopener">${esc(t)}</a>` : esc(s); }).join("<br>");
function leafPop(leaf) {
  const n = NOTES[+leaf.dataset.n], ty = G.types[n.type];
  showPop(`<div class="kind"><b class="leaf t-${n.type}"></b>${esc(ty.label)}</div><h4>${esc(n.title || "")}</h4><div>${esc(n.text || "")}</div>` +
    (n.src && n.src.length ? `<div class="src">${srcHTML(n.src)}</div>` : "") +
    (G.draft && n.status !== "verified" ? `<div class="draft">Draft: ${n.status === "ruling" ? "waiting on a ruling" : "source still to check"}</div>` : ""), leaf);
}
const refName = r => { const [b, cv] = r.split(" "); return LONG[b] + " " + cv; };
const bgUrl = ref => "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(refName(ref)) + "&version=KJV;NIV;MSG";
function comparePop(v, at) {
  const ref = v.dataset.r, j = jstOf[ref]; lastFocus = at || v.querySelector(".vn");
  let h = `<h4>${refName(ref)}</h4>`;
  if (j) h += `<div class="cmp"><div><span class="lbl">King James</span>${opsHTML(j.ops, "k")}</div>` +
    `<div><span class="lbl">Joseph Smith${j.j && j.j.length ? ` <span class="ref">${esc(j.j.map(refName).join(", "))}</span>` : ""}</span>${opsHTML(j.ops, "j")}</div></div>` +
    (j.q ? `<div class="cmp-note">Unsettled: ${esc(j.q)}</div>` : "");
  else h += `<div class="pos">Joseph Smith's translation reads the same here.</div>`;
  h += `<div class="btns"><a href="${bgUrl(ref)}" target="_blank" rel="noopener">Read it in the NIV and The Message</a><button data-bm>Bookmark this verse</button></div>`;
  showPop(h, at || v.querySelector(".vn"), !!j);
  pop.querySelector("[data-bm]").onclick = () => { addMark(refName(ref), ref); closePop(); };
}
const WORD = /[A-Za-zÆæŒœ]+(?:[’'\-][A-Za-zÆæ]+)*/g;
function caretAt(cx, cy) {
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(cx, cy); return p ? {node: p.offsetNode, off: p.offset} : null; }
  const r = document.caretRangeFromPoint && document.caretRangeFromPoint(cx, cy); return r ? {node: r.startContainer, off: r.startOffset} : null;
}
const vtOffset = (vt, node, off) => { const tw = document.createTreeWalker(vt, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode()) && n !== node) off += n.data.length; return off; };
function wordAt(e) {
  const c = caretAt(e.clientX, e.clientY); if (!c || c.node.nodeType !== 3) return null;
  const vt = c.node.parentElement.closest(".vt"); return vt ? wordIn(vt, vtOffset(vt, c.node, c.off)) : null;
}
function wordIn(vt, off, nth) {                    // counts KJV words only; Joseph Smith's added words are drawn by CSS and are not in the text
  const text = vt.textContent; let m, idx = 0; WORD.lastIndex = 0;
  while ((m = WORD.exec(text))) { if (nth != null ? idx === nth : (off >= m.index && off <= m.index + m[0].length)) return {vt, word: m[0], idx, start: m.index, end: m.index + m[0].length}; idx++; }
  return null;
}
function rangeIn(vt, a, b) {
  const r = document.createRange(), tw = document.createTreeWalker(vt, NodeFilter.SHOW_TEXT); let n, pos = 0, set = false;
  while ((n = tw.nextNode())) { const len = n.data.length;
    if (!set && a <= pos + len) { r.setStart(n, a - pos); set = true; }
    if (set && b <= pos + len) { r.setEnd(n, b - pos); return r; }
    pos += len; }
  return r;
}
function wordPop(w) {
  const key = w.word.toLowerCase().replace(/’/g, "'").replace(/'s$/, "");
  let hws = DICT.forms[key]; if (hws && !Array.isArray(hws)) hws = [hws];
  let h = "";
  (hws || []).forEach(hw => (DICT.cards[hw] || []).forEach(c => {
    h += `<div class="${h ? "sec2" : ""}"><div class="kind">Webster's 1828</div><h4>${esc(c.hw.charAt(0) + c.hw.slice(1).toLowerCase())} <span class="pos">${esc(c.pos || "")}</span></h4><ol>${c.card.map(d => `<li>${esc(d)}</li>`).join("")}</ol></div>`;
  }));
  (w.vt.closest(".v").dataset.s.split("|")[w.idx] || "").split(",").filter(Boolean).forEach(s => { const g = DICT.greek[s]; if (!g) return;
    h += `<div class="${h ? "sec2" : ""}"><div class="kind">The Greek</div><span class="greek">${esc(g.lemma)}</span> <i>${esc(g.translit)}</i> <span class="sn">${s}</span><div>${esc(g.def || "")}</div></div>`; });
  if (!h) h = `<h4>${esc(w.word)}</h4><div class="pos">No entry for this word.</div>`;
  const r = rangeIn(w.vt, w.start, w.end).getBoundingClientRect();
  showPop(h, {getBoundingClientRect: () => r, closest: sel => w.vt.closest(sel)});
}

/* ---------- highlights and notes: stored as verse ranges, drawn without nesting ---------- */
let HL = load("gh-highlights2", null);
if (!HL) HL = load("gh-highlights", []).map(h => ({id: h.id, note: h.note || "", parts: [{r: h.r, a: h.a, b: h.b}]}));
function paint(h) {
  (h.parts || []).forEach(p => {
    const v = world.querySelector(`.v[data-r="${p.r}"] .vt`); if (!v) return;
    const tw = document.createTreeWalker(v, NodeFilter.SHOW_TEXT), nodes = []; let n, pos = 0;
    while ((n = tw.nextNode())) { const s = Math.max(p.a, pos), e = Math.min(p.b, pos + n.data.length);
      if (s < e && !n.parentElement.closest("mark.hl")) nodes.push([n, s - pos, e - pos]); pos += n.data.length; }      // text already highlighted is left alone
    nodes.forEach(([node, s, e]) => { const r = document.createRange(); r.setStart(node, s); r.setEnd(node, e); const m = el("mark", "hl" + (h.note ? " has-note" : "")); m.dataset.id = h.id; r.surroundContents(m); });
  });
}
function unpaint(id) { world.querySelectorAll(`mark.hl[data-id="${id}"]`).forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); }); }
const repaintAll = () => { world.querySelectorAll("mark.hl").forEach(m => unpaint(m.dataset.id)); HL.forEach(paint); };
HL.forEach(paint);
let pending = null;
function selectionParts() {                        // the selection as ranges inside each verse it touches, within one Gospel
  const s = getSelection(); if (!s.rangeCount || s.isCollapsed) return null;
  const r = s.getRangeAt(0), node = n => (n.nodeType === 3 ? n.parentElement : n), a = node(r.startContainer).closest(".col"), b = node(r.endContainer).closest(".col");
  if (!a || a.classList.contains("empty")) return null;
  if (a !== b) return {error: "Highlight within one Gospel at a time."};
  const parts = [];
  a.querySelectorAll(".vt").forEach(vt => {
    if (!r.intersectsNode(vt)) return; const pre = document.createRange(); pre.selectNodeContents(vt);
    let s0 = 0, e0 = vt.textContent.length;
    if (vt.contains(r.startContainer)) s0 = vtOffset(vt, r.startContainer, r.startOffset);
    if (vt.contains(r.endContainer)) e0 = vtOffset(vt, r.endContainer, r.endOffset);
    if (e0 - s0 > 0) parts.push({r: vt.closest(".v").dataset.r, a: s0, b: e0});
  });
  return parts.length && parts.reduce((t, p) => t + p.b - p.a, 0) > 1 ? {parts, rect: r.getClientRects()[0] || r.getBoundingClientRect()} : null;
}
document.addEventListener("mouseup", e => {
  if (e.target.closest("#selbar,#pop,#bar,.menu,#timeline")) return;
  setTimeout(() => {
    const bar = $("#selbar"), sp = k >= READ ? selectionParts() : null;
    if (!sp) { bar.hidden = true; return; }
    const rc = sp.rect || getSelection().getRangeAt(0).getBoundingClientRect();
    bar.innerHTML = sp.error ? `<span>${sp.error}</span>` : `<button data-c="y">Highlight</button><button data-c="n">Highlight and note</button><button data-c="w">Look up the word</button>`;
    pending = sp.error ? null : sp; bar.hidden = false;
    bar.style.left = Math.max(12, Math.min(innerWidth - bar.offsetWidth - 12, rc.left + rc.width / 2 - bar.offsetWidth / 2)) + "px";
    bar.style.top = Math.max(BAR + 4, rc.top - 44) + "px";
  }, 0);
});
$("#selbar").addEventListener("mousedown", e => e.preventDefault());
$("#selbar").addEventListener("click", e => {
  const c = e.target.dataset.c; if (!c || !pending) return; $("#selbar").hidden = true;
  if (c === "w") { const p = pending.parts[0], vt = world.querySelector(`.v[data-r="${p.r}"] .vt`), w = wordIn(vt, p.a + 1); getSelection().removeAllRanges(); if (w) wordPop(w); return; }
  const h = {id: Date.now().toString(36), note: "", parts: pending.parts}; HL.push(h); save("gh-highlights2", HL); getSelection().removeAllRanges(); paint(h);
  if (c === "n") { const m = world.querySelector(`mark.hl[data-id="${h.id}"]`); if (m) notePop(m, true); }
});
function notePop(m, edit) {
  const h = HL.find(z => z.id === m.dataset.id); if (!h) return; lastFocus = null;
  const mark = () => world.querySelectorAll(`mark.hl[data-id="${h.id}"]`).forEach(z => z.classList.toggle("has-note", !!h.note.trim()));
  showPop(`<div class="kind">Your note</div>` + (edit || !h.note ? `<textarea placeholder="Write your note here" aria-label="Your note">${esc(h.note || "")}</textarea>` : `<div style="white-space:pre-wrap">${esc(h.note)}</div>`) +
    `<div class="btns">${edit || !h.note ? `<button data-a="save">Done</button>` : `<button data-a="edit">Edit</button>`}<button data-a="del">Remove highlight</button></div>`, m);
  const ta = pop.querySelector("textarea"); if (ta) { ta.focus(); ta.oninput = () => { h.note = ta.value; save("gh-highlights2", HL); mark(); }; }
  pop.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
    if (b.dataset.a === "save") { h.note = (ta ? ta.value : h.note).trim(); save("gh-highlights2", HL); mark(); closePop(); }
    else if (b.dataset.a === "edit") notePop(m, true);
    else { HL = HL.filter(z => z.id !== h.id); save("gh-highlights2", HL); closePop(); repaintAll(); }
  });
}

/* ---------- clicks on the sheet ---------- */
world.addEventListener("click", e => {
  if (moved || !getSelection().isCollapsed) return;
  const t = e.target, hit = sel => t.closest(sel);
  if (hit(".begin")) return goSection(0, fitK);
  if (k < READ) { const s = hit(".sec"); if (s) goSection(+s.dataset.i, fitK); return; }
  if (hit(".leaf")) { lastFocus = hit(".leaf"); return leafPop(hit(".leaf")); }
  if (hit(".vn") || hit(".jsm")) return comparePop(hit(".v"), hit(".vn") || hit(".jsm"));
  if (hit(".ja")) return comparePop(hit(".v"), hit(".ja"));
  if (hit("mark.hl")) return notePop(hit("mark.hl"));
  if (hit(".jc") && document.body.classList.contains("jst-in") && e.altKey) return comparePop(hit(".v"), hit(".jc"));
  const w = wordAt(e); if (w) { lastFocus = null; return wordPop(w); }
  closePop();
});

/* ---------- reading settings, bookmarks, reading list, jump ---------- */
const prefs = Object.assign({jst: "in", wj: "green", off: []}, load("gh-prefs5", {}));
function setBody() {
  const b = document.body.classList;
  b.toggle("jst-in", prefs.jst === "in"); b.toggle("jst-mark", prefs.jst === "mark"); b.toggle("jst-full", prefs.jst === "full");
  b.toggle("wj", prefs.wj !== "off"); b.toggle("wj-wash", prefs.wj === "wash");
  world.querySelectorAll(".leaf").forEach(l => l.classList.toggle("off", prefs.off.includes(NOTES[+l.dataset.n].type)));
}
const studyMenu = $("#studyMenu"), markMenu = $("#markMenu"), readPanel = $("#readPanel");
function closeMenus() { document.querySelectorAll(".menu.on").forEach(m => m.classList.remove("on")); $("#markBtn").setAttribute("aria-expanded", "false"); }
const counts = {}; NOTES.forEach(n => counts[n.type] = (counts[n.type] || 0) + 1);
const radio = (name, opts, cur) => `<div class="seg">` + opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${cur === v ? "checked" : ""}>${l}</label>`).join("") + `</div>`;
studyMenu.innerHTML = `<div class="mh"><h4>Reading settings</h4><button class="x" aria-label="Close">×</button></div><div class="mb"><h5>Joseph Smith's changes</h5>` +
  radio("jst", [["in","Set into the verse"],["full","Written out under the verse"],["mark","Marked only"],["off","Hidden"]], prefs.jst) +
  `<h5>The words of Christ</h5>` + radio("wj", [["green","Green ink"],["wash","Green ink on a gold wash"],["off","Plain"]], prefs.wj) +
  `<h5>Notes</h5>` + Object.entries(G.types).filter(([t]) => counts[t]).map(([t, d]) =>
    `<label><input type="checkbox" data-t="${t}" ${prefs.off.includes(t) ? "" : "checked"}><b class="leaf t-${t}"></b>${esc(d.label)}<span class="n">${counts[t]}</span></label>`).join("") + `</div>`;
studyMenu.addEventListener("click", e => { if (e.target.classList.contains("x")) closeMenus(); });
studyMenu.addEventListener("change", e => {
  const t = e.target;
  if (t.name === "jst") prefs.jst = t.value; else if (t.name === "wj") prefs.wj = t.value;
  else if (t.dataset.t) { prefs.off = prefs.off.filter(z => z !== t.dataset.t); if (!t.checked) prefs.off.push(t.dataset.t); }
  save("gh-prefs5", prefs); const a = anchor(); setBody(); measure(); restore(a); placeCurls();
});
let MARKS = load("gh-bookmarks3", []);
const here = () => Object.assign(anchor(), {z: k / fitK});
function goMark(m) { stopFlight(); if (m.verse && goVerse(m.verse, clampK((m.z || 1) * fitK))) return; k = clampK((m.z || 1) * fitK); fitted = Math.abs(k - fitK) < 1e-4; restore(m); }
function addMark(name, verse) { const a = here(); if (verse) a.verse = verse; MARKS.push(Object.assign({name: name || (a.ref ? refName(a.ref) + ", " + G.sections[a.i].t : a.i != null ? G.sections[a.i].t : "The beginning")}, a)); save("gh-bookmarks3", MARKS); drawMarks(); }
const spotAtOpen = load("gh-spot3", null);
const link = (attr, text) => `<a tabindex="0" role="button" ${attr}>${text}</a>`;
function drawMarks() {
  const q = ($("#jumpIn") || {}).value || "";
  markMenu.innerHTML = `<div class="mb"><h5>Jump to</h5><input id="jumpIn" type="text" placeholder="John 3:16, or a phrase" autocomplete="off" spellcheck="false" aria-label="Jump to a reference or a phrase"><div id="jumpOut"></div>` +
    `<h5>Bookmarks</h5>` + (spotAtOpen && spotAtOpen.i != null ? `<div class="row">${link('data-go="last"', "Where I left off: " + esc(G.sections[Math.min(spotAtOpen.i, G.sections.length - 1)].t))}</div>` : "") +
    MARKS.map((m, i) => `<div class="row">${link(`data-go="${i}"`, esc(m.name))}<button class="x" data-del="${i}" aria-label="Remove bookmark">×</button></div>`).join("") +
    `<div class="row">${link("data-add", "<i>Bookmark this place</i>")}</div>` +
    `<h5>Reading</h5><div class="row">${link("data-contents", "All the passages")}</div>` + ((G.reading || []).length ? `<div class="row">${link("data-reading", "Reading list for the year")}</div>` : "") +
    `<div class="row">${link("data-fit", "All four columns")}</div><div class="row">${link("data-comfy", "Comfortable reading: one Gospel, larger")}</div><div class="row">${link("data-study", "Reading settings")}</div></div>`;
  if (q) { $("#jumpIn").value = q; showJump(q); }
}
markMenu.addEventListener("click", e => {
  const t = e.target.closest("[data-jr],[data-ji],[data-fit],[data-comfy],[data-study],[data-reading],[data-contents],[data-go],[data-del],[data-add]"); if (!t) return; const d = t.dataset;
  if (d.del != null) { MARKS.splice(+d.del, 1); save("gh-bookmarks3", MARKS); return drawMarks(); }
  if (d.add != null) { addMark(); return; }
  closeMenus();
  if (d.jr) goVerse(d.jr); else if (d.ji != null) goSection(+d.ji);
  else if (d.fit != null) fit(); else if (d.comfy != null) comfortable();
  else if (d.study != null) studyMenu.classList.add("on"); else if (d.reading != null) openReading(); else if (d.contents != null) openContents(null);
  else if (d.go != null) { const m = d.go === "last" ? spotAtOpen : MARKS[+d.go]; if (m) goMark(m); }
});
$("#markBtn").onclick = e => { e.stopPropagation(); const on = markMenu.classList.contains("on"); closeMenus(); if (on) return;
  lastFocus = $("#markBtn"); drawMarks(); markMenu.classList.add("on"); $("#markBtn").setAttribute("aria-expanded", "true"); $("#jumpIn").focus(); };
let spotTimer; function saveSpot() { clearTimeout(spotTimer); spotTimer = setTimeout(() => { const a = here(); if (a.i != null) save("gh-spot3", a); }, 700); }

function openReading() {                           // all four Gospels, a portion with each cohort, in the order to read them
  lastFocus = document.activeElement; const cur = currentSec();
  readPanel.innerHTML = `<div class="mh"><h4>Reading list for the year</h4><button class="x" aria-label="Close">×</button></div><div class="mb">` +
    `<p class="lead">Read all four Gospels this year, one portion with each cohort. The story of his mortal life begins with John, so the reading begins with The Lord and follows the story to the end. Read the portions in the order given here. Choose any passage to go to it.</p>` +
    G.reading.map(r => {
      let body = "", part = -1;
      for (let i = r.at; i <= r.end; i++) { const sc = G.sections[i];
        if (sc.part !== part) { part = sc.part; body += `${body ? "</span>" : ""}<span class="pt"><i>${esc(G.parts[part].t)}</i>`; }
        body += `<a tabindex="0" role="button" data-i="${i}"${i === cur ? ' class="here"' : ""}>${esc(sc.t)}</a>`; }
      return `<div class="rd${cur >= r.at && cur <= r.end ? " on" : ""}"><span class="wk">${r.week ? "Week of " + esc(r.week) : "Cohort " + r.n}</span>` +
        `<div class="rb"><b tabindex="0" role="button" data-i="${r.at}">${esc(r.title)}</b>${body}</span></div></div>`;
    }).join("") + `</div>`;
  readPanel.classList.add("on"); const on = readPanel.querySelector(".rd.on"), body = readPanel.querySelector(".mb"); if (on) body.scrollTop = on.offsetTop - 80;
}
readPanel.addEventListener("click", e => { if (e.target.classList.contains("x")) return closeMenus(); const a = e.target.closest("[data-i]"); if (a) { closeMenus(); goSection(+a.dataset.i); } });
document.querySelectorAll(".menu").forEach(m => m.addEventListener("wheel", e => e.stopPropagation()));

/* jump to a reference ("John 3:16", "Matt 5") or a phrase, in the King James wording or in Joseph Smith's */
const BOOKKEY = [[/^(matthew|matt|mat|mt)$/i, "Matt"], [/^(mark|mar|mrk|mk)$/i, "Mark"], [/^(luke|luk|lk|lu)$/i, "Luke"], [/^(john|joh|jhn|jn|jo)$/i, "John"]];
const norm = s => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
let verseIndex = null;
function jumpFind(q) {
  q = q.trim(); if (q.length < 2) return {out: []};
  const m = /^([a-z]+)\.?\s*(\d+)(?:\s*[:.,\s]\s*(\d+))?$/i.exec(q), out = [], seen = new Set();
  const push = o => { const key = o.ref || "s" + o.i; if (!seen.has(key)) { seen.add(key); out.push(o); } };
  if (m) { const b = (BOOKKEY.find(([re]) => re.test(m[1])) || [])[1], ref = b && `${b} ${m[2]}:${m[3] || 1}`, v = ref && world.querySelector(`.v[data-r="${ref}"]`);
    if (v) push({ref, label: refName(ref), text: v.querySelector(".vt").textContent.slice(0, 70)}); }
  const lq = norm(q); let more = false;
  G.sections.forEach((sct, i) => { if (out.length < 5 && norm(sct.t).includes(lq)) push({i, label: sct.t, text: ""}); });
  if (!verseIndex) verseIndex = [...world.querySelectorAll(".v")].map(v => { const vt = v.querySelector(".vt"), t = vt.textContent.replace(/\s+/g, " ");
    return {r: v.dataset.r, t, l: norm(t), js: norm([...vt.querySelectorAll(".ja")].map(a => a.dataset.t).join(" · ")), jt: [...vt.querySelectorAll(".ja")].map(a => a.dataset.t).join(" … ")}; });
  for (const v of verseIndex) {
    const at = v.l.indexOf(lq), aj = at < 0 && v.js ? v.js.indexOf(lq) : -1; if (at < 0 && aj < 0) continue;
    if (out.length >= 14) { more = true; break; }
    push(at >= 0 ? {ref: v.r, label: refName(v.r), text: (at > 24 ? "…" : "") + v.t.slice(Math.max(0, at - 24), at + lq.length + 40)}
                 : {ref: v.r, label: refName(v.r), text: v.jt.slice(0, 70), js: 1});
  }
  return {out, more};
}
function showJump(q) {
  const {out, more} = jumpFind(q);
  $("#jumpOut").innerHTML = out.map(r => `<a tabindex="0" role="button" ${r.ref ? `data-jr="${r.ref}"` : `data-ji="${r.i}"`}><b>${esc(r.label)}</b>${r.js ? ` <em>Joseph Smith</em>` : ""}${r.text ? ` <span>${esc(r.text)}</span>` : ""}</a>`).join("") +
    (more ? `<span class="none">Showing the first 14. Add a word to narrow it.</span>` : "") || (q.trim().length > 1 ? `<span class="none">Nothing found.</span>` : "");
}
markMenu.addEventListener("input", e => { if (e.target.id === "jumpIn") showJump(e.target.value); });
markMenu.addEventListener("keydown", e => { if (e.target.id === "jumpIn" && e.key === "Enter") { const a = $("#jumpOut a"); if (a) a.click(); } });

/* ---------- a curling branch under a shorter account, where a neighbour keeps going ---------- */
function placeCurls() {
  world.querySelectorAll("img.curl").forEach(c => c.remove()); if (!BOT.curl.length) return;
  let n = 0, lastAt = -9;
  secEls.forEach((sec, i) => {
    if (i - lastAt < 3) return; const cols = sec.querySelector(".cols"), ch = cols.getBoundingClientRect().height / k; let done = false;
    sec.querySelectorAll(".col:not(.empty)").forEach(col => {
      if (done) return; const free = ch - col.getBoundingClientRect().height / k;
      if (free < 260) return;
      const a = BOT.curl[n % BOT.curl.length], z = (G.artSize || {})[a] || [300, 200], w = Math.min(230, geo.cw * 0.62), h = w * z[1] / z[0];
      if (h + 40 > free) return;
      const im = el("img", "curl"); im.src = `art/${a}.webp`; im.alt = ""; im.width = z[0]; im.height = z[1]; im.style.width = w + "px"; im.loading = "lazy";
      col.appendChild(im); n++; lastAt = i; done = true;
    });
  });
}

/* ---------- go ---------- */
setBody(); measure(); fitK = k = fitWidth(); y = BAR; last = {x, y, k}; apply();
function settle() { measure(); if (fitted) k = fitK = fitWidth(); placeCurls(); apply(); hashGo(); }
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(settle, 60));
addEventListener("load", () => { const a = anchor(); measure(); restore(a); });

/* review hook: index.html#go=<passage title, number, or reference>,<zoom as a multiple of four-column fit>[,leaf|word|verse|marks|reading|parts|jump|settings] */
function hashGo() {
  let m; try { m = /go=([^,]+),([\d.]+)(?:,(\w+))?/.exec(decodeURIComponent(location.hash)); } catch (e) { return; }
  if (!m) return; const z = +m[2]; if (!(z > 0)) return console.warn("hash: bad zoom");
  const refEl = /^(Matt|Mark|Luke|John) \d+:\d+$/.test(m[1]) && world.querySelector(`.v[data-r="${m[1]}"]`);
  const i = refEl ? +refEl.closest(".sec").dataset.i : /^\d+$/.test(m[1]) ? +m[1] : G.sections.findIndex(s => s.t === m[1]);
  if (i < 0 || !secEls[i]) return console.warn("hash: no passage", m[1]);
  k = clampK(z * fitK); fitted = Math.abs(k - fitK) < 1e-4; y = BAR + 34 - (geo.secs[i].y - 10) * k; paintCam();
  const vs = [...secEls[i].querySelectorAll(".v")], v = refEl || vs[Math.min(2, vs.length - 1)];
  const act = {marks: () => $("#markBtn").click(), reading: openReading, settings: () => studyMenu.classList.add("on"),
    parts: () => { const nm = tlLine.querySelector(`.tl-name[data-p="${G.sections[i].part}"]`); openContents(G.sections[i].part, nm); },
    jump: () => { $("#markBtn").click(); const inp = $("#jumpIn"); inp.value = "lost sheep"; showJump(inp.value); },
    leaf: () => { const l = secEls[i].querySelector(".leaf:not(.off)"); l ? leafPop(l) : console.warn("hash: no leaf"); },
    verse: () => comparePop(vs.find(q => q.querySelector(".jsm")) || v),
    word: () => { const w = wordIn(v.querySelector(".vt"), 0, 3); w ? wordPop(w) : console.warn("hash: no word"); }}[m[3]];
  if (act) act();
}
addEventListener("hashchange", hashGo);
window.GH = {goSection, goVerse, fit, flyTo, state: () => ({x, y, k, fitK}), anchor};
})();
