/* The Four Gospels: one tall sheet, four columns. Data comes from data/*.js (built by build.py). */
(function () {
const G = window.GOSPELS, NOTES = window.NOTES || [], DICT = window.DICT || {forms:{},cards:{},greek:{}};
const LONG = {Matt:"Matthew",Mark:"Mark",Luke:"Luke",John:"John"};
const READ = 0.5;                                 // below this zoom the text is a picture: no selecting, clicks jump in
const $ = s => document.querySelector(s), el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const world = $("#world"), viewport = $("#viewport"), pop = $("#pop"), heads = $("#heads");

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
const secEls = [], stops = [];
const dim = a => { const z = (G.artSize || {})[a]; return z ? ` width="${z[0]}" height="${z[1]}"` : ""; };
const opsHTML = (ops, side) => ops.map(o => o[0] === "=" ? esc(side === "k" && o[2] ? o[2] : o[1])
  : o[0] === "+" ? (side === "k" ? "" : `<u>${esc(o[1])}</u>`) : (side === "j" ? "" : `<s>${esc(o[1])}</s>`)).filter(Boolean).join(" ");
function verseHTML(v, first, prevCh) {
  const [, cv] = v.r.split(" "), [c, n] = cv.split(":"), showCh = first || n === "1" || c !== prevCh;
  let h = `<span class="v${v.p ? " para" : ""}" data-r="${v.r}" data-s="${v.s}">` +
          `<span class="vn${showCh ? " ch" : ""}">${showCh ? c + ":" + n : n}</span>` +
          (v.j ? `<span class="jsm" title="Joseph Smith changed this verse">JS</span>` : "") +
          `<span class="vt">${v.h}</span></span> `;
  if (v.j) h += v.j.sm                                           // a one- or two-word change: show just the change
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
  `<a class="begin">Begin reading</a>`));
const jstOf = {}; let curPart = -1;
const BOT = Object.assign({wr: [], spray: [], vine: []}, G.bot || {});
G.sections.forEach((s, i) => {
  if (s.part !== curPart) {
    curPart = s.part; const p = G.parts[curPart];
    const NUM = ["One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"][curPart] || curPart + 1;
    const wr = BOT.wr.length ? BOT.wr[curPart % BOT.wr.length] : null;
    const head = `<div class="kick">Part ${NUM}</div><h2>${esc(p.t)}</h2>`;
    frame.appendChild(el("div", "part" + (wr ? " wreathed" : ""),
      (wr ? `<div class="wreath"><img${dim(wr)} src="art/${wr}.webp" alt=""><div class="in">${head}</div></div>`
          : ((G.garlands || []).includes(curPart) ? `<img class="garland"${dim("g_" + (curPart + 1))} src="art/g_${curPart + 1}.webp" alt="">` : "") + head) +
      (p.art ? `<img class="scene" loading="lazy"${dim(p.art)} src="art/${p.art}.webp" alt="">` : "")));
    stops.push({t: "p", i, name: p.t});
  }
  stops.push({t: "s", i, name: s.t});
  const sec = el("div", "sec"); sec.dataset.i = i;
  const spr = BOT.spray.length ? BOT.spray[(i * 5 + 1) % BOT.spray.length] : null;
  const sprI = spr ? `<img class="spr" loading="lazy"${dim(spr)} src="art/${spr}.webp" alt="">` : "";
  const vine = BOT.vine.length && i % 4 === 1 ? BOT.vine[((i - 1) / 4) % BOT.vine.length] : null;
  let h = (vine ? `<img class="mvine ${((i - 1) / 4) % 2 ? "r" : "l"}" loading="lazy"${dim(vine)} src="art/${vine}.webp" alt="">` : "") +
    `<h3${spr ? ' class="sprayed"' : ""}>${sprI}<span>${esc(s.t)}</span>${sprI.replace('class="spr"', 'class="spr r"')}</h3><div class="cols">`;
  s.c.forEach((col, bi) => {
    if (s.wide && bi === s.wide[0]) { h += `<div class="col empty wide" style="grid-column:span ${s.wide[1]}"><img loading="lazy"${dim(s.wide[2])} src="art/${s.wide[2]}.webp" alt=""></div>`; return; }
    if (s.wide && bi > s.wide[0] && bi < s.wide[0] + s.wide[1]) return;
    if (!col.length) { h += `<div class="col empty${s.study ? " study " + s.study : ""}">${s.art && s.art[bi] ? `<img loading="lazy"${dim(s.art[bi])} src="art/${s.art[bi]}.webp" alt="">` : ""}</div>`; return; }
    let prev = null; h += `<div class="col">`;
    col.forEach((v, n) => { if (v.j) jstOf[v.r] = v.j; h += verseHTML(v, n === 0, prev); prev = v.r.split(" ")[1].split(":")[0]; });
    h += `</div>`;
  });
  sec.innerHTML = h + `</div>`; frame.appendChild(sec); secEls.push(sec);
});
frame.appendChild(el("div", "end", (G.flourish ? `<img${dim("title_flourish")} src="art/title_flourish.webp" alt="">` : "") + `<div>Here end the four Gospels.</div>` +
  `<p class="credits">The King James Version, 1769 text. Joseph Smith's translation from the edition printed at Plano, Illinois, 1867. ` +
  `Definitions from Noah Webster's <i>American Dictionary of the English Language</i>, 1828 (transcription: github.com/akaitsurugi/webster1828, CC BY-SA 4.0). ` +
  `Greek from James Strong's dictionary, 1890 (Open Scriptures, CC BY-SA). Order of the passages after A. T. Robertson's <i>Harmony of the Gospels</i>, 1922.</p>`));

/* ---------- camera ---------- */
let x = 0, y = 0, k = 1, fitK = 1, geo = null, anim = 0, raf = 0;
const BAR = 82, RAIL = () => 0;
function measure() {                                          // world-space geometry, cached; redone when layout changes
  const fr = frame.getBoundingClientRect(), W = world.getBoundingClientRect();
  geo = {fx: (fr.left - x) / k, fw: fr.width / k, w: W.width / k, h: W.height / k,
         secs: secEls.map(e => { const r = e.getBoundingClientRect(); return {y: (r.top - y) / k, h: r.height / k}; })};
  const cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--colw")), gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gut"));
  geo.cw = cw; geo.step = cw + gut; layoutTL();
}
function apply() { if (!raf) raf = requestAnimationFrame(paintCam); }
function paintCam() {
  raf = 0;
  const minY = innerHeight * 0.6 - geo.h * k; y = Math.min(BAR + 40, Math.max(minY, y));        // stay on the sheet
  const fl = x + geo.fx * k, fwid = geo.fw * k, lo = innerWidth - 80 - fwid - geo.fx * k, hi = RAIL() + 80 - geo.fx * k;
  x = fwid < innerWidth - RAIL() ? RAIL() + (innerWidth - RAIL() - fwid) / 2 - geo.fx * k : Math.min(Math.max(x, Math.min(lo, hi)), Math.max(lo, hi));
  world.style.transform = `translate(${x}px,${y}px) scale(${k})`;
  document.body.classList.toggle("small", k < READ);
  document.body.classList.toggle("top", y > BAR - 620 * k);
  [...heads.children].forEach((h, n) => { h.style.left = x + (geo.fx + n * geo.step) * k + "px"; h.style.width = geo.cw * k + "px"; });
  drawRail(); saveSpot();
  if (x !== last.x || y !== last.y || k !== last.k) { closePop(); $("#selbar").hidden = true; last = {x, y, k}; }
}
let last = {};
function zoomAt(cx, cy, nk) { cancelAnimationFrame(anim);
  nk = Math.max(0.08, Math.min(2.4, nk)); x = cx - (cx - x) * (nk / k); y = cy - (cy - y) * (nk / k); k = nk; apply(); }
function fitWidth() { return Math.min(1.25, (innerWidth - RAIL() - 40) / geo.fw); }
function fit() { const a = anchor(); fitK = fitWidth(); k = fitK; restore(a); }
function anchor() {                                           // the section at the top of the reading area, and how far into it
  const ty = (BAR + 60 - y) / k; let i = 0;
  geo.secs.forEach((s, n) => { if (s.y <= ty) i = n; });
  if (ty < geo.secs[0].y) return {top: (BAR - y) / k / Math.max(1, geo.secs[0].y)};
  return {i, f: Math.min(1, (ty - geo.secs[i].y) / Math.max(1, geo.secs[i].h))};
}
function restore(a) {
  if (a.top != null) y = BAR - a.top * geo.secs[0].y * k;
  else { const s = geo.secs[Math.min(a.i, geo.secs.length - 1)]; y = BAR + 60 - (s.y + a.f * s.h) * k; }
  apply();
}
function flyTo(wy, nk) {                                      // bring world line wy to just under the header
  cancelAnimationFrame(anim);
  const sy = y, sk = k, ty = BAR + 34 - wy * nk, t0 = performance.now(), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cx = RAIL() + (innerWidth - RAIL()) / 2, wx = (cx - x) / k;
  (function step(t) {
    let u = still ? 1 : Math.min(1, (t - t0) / 700); u = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    k = Math.exp(Math.log(sk) + (Math.log(nk) - Math.log(sk)) * u); y = sy + (ty - sy) * u; x = cx - wx * k; apply();
    if (u < 1) anim = requestAnimationFrame(step);
  })(t0);
}
function goSection(i, nk) { flyTo(geo.secs[i].y - 10, nk || Math.max(k, fitK)); }
function relayout() { const a = anchor(); measure(); restore(a); }

viewport.addEventListener("wheel", e => {
  e.preventDefault(); cancelAnimationFrame(anim);
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, k * Math.exp(-e.deltaY * 0.012));
  else { x -= e.deltaX; y -= e.deltaY; apply(); }
}, {passive: false});
let drag = null, moved = false;
viewport.addEventListener("pointerdown", e => {
  moved = false; closeMenus();
  if (!e.target.closest(".leaf,.vn,mark.hl,.jsm,.ja")) closePop();
  if (e.button !== 0) return;
  if (k >= READ && e.target.closest(".vt,.jstw,.vn,.leaf,.jsm,.ja,.begin")) return;      // reading: let text be selected and clicked
  getSelection().removeAllRanges(); cancelAnimationFrame(anim);
  drag = {px: e.clientX, py: e.clientY, x, y}; viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener("pointermove", e => {
  if (!drag) return; const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
  if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; viewport.classList.add("drag"); }
  x = drag.x + dx; y = drag.y + dy; apply();
});
const endDrag = () => { drag = null; viewport.classList.remove("drag"); };
viewport.addEventListener("pointerup", endDrag); viewport.addEventListener("pointercancel", endDrag);
const zin = () => zoomAt(innerWidth / 2, innerHeight / 2, k * 1.25), zout = () => zoomAt(innerWidth / 2, innerHeight / 2, k / 1.25);
$("#brand").onclick = () => flyTo(0, fitK);
addEventListener("keydown", e => {
  if (e.target.matches("textarea,input,select")) return;
  if (e.key === "Escape") { closePop(); closeMenus(); }
  if (e.key === "0") fit();
  if (e.key === "+" || e.key === "=") zin();
  if (e.key === "-") zout();
  if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") { y -= innerHeight * (e.key === "ArrowDown" ? 0.15 : 0.8); apply(); e.preventDefault(); }
  if (e.key === "ArrowUp" || e.key === "PageUp") { y += innerHeight * (e.key === "ArrowUp" ? 0.15 : 0.8); apply(); e.preventDefault(); }
  if (e.key === "Home") flyTo(0, fitK);
});
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { const a = anchor(); measure(); fitK = fitWidth(); k = Math.min(k, 2.4); restore(a); }, 120); });

/* ---------- timeline along the top: the whole story on one line ---------- */
const tlLine = $("#tlLine"), tlTip = $("#tlTip"), tlPanel = $("#tlPanel");
const partStart = G.parts.map((p, n) => G.sections.findIndex(s => s.part === n));
function layoutTL() {                                         // each part gets width in proportion to its length on the page
  const y0 = geo.secs[0].y, span = geo.h - y0 - 300;
  tlLine.innerHTML = G.parts.map((p, n) => {
    const a = geo.secs[partStart[n]].y, b = n + 1 < G.parts.length ? geo.secs[partStart[n + 1]].y : geo.h - 300;
    return `<a class="tl-part" data-p="${n}" style="left:${(a - y0) / span * 100}%;width:${(b - a) / span * 100}%"><span>${esc(p.t)}</span></a>`;
  }).join("") + `<i id="tlHere"></i>`;
  tlLine._y0 = y0; tlLine._span = span;
}
const secAtFrac = f => { const wy = tlLine._y0 + f * tlLine._span; let i = 0; geo.secs.forEach((s, n) => { if (s.y <= wy) i = n; }); return i; };
const fracAt = e => { const r = tlLine.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
tlLine.addEventListener("mousemove", e => {
  const i = secAtFrac(fracAt(e)), r = tlLine.getBoundingClientRect();
  tlTip.hidden = false; tlTip.textContent = G.sections[i].t;
  tlTip.style.left = Math.max(80, Math.min(innerWidth - 80, e.clientX)) + "px";
});
tlLine.addEventListener("mouseleave", () => tlTip.hidden = true);
tlLine.addEventListener("click", e => {
  const lab = e.target.closest(".tl-part span");
  if (lab) { openPart(+lab.parentElement.dataset.p, lab); return; }         // a part's name opens its list of passages
  closeMenus(); goSection(secAtFrac(fracAt(e)));
});
function openPart(n, at) {
  const on = tlPanel.classList.contains("on") && tlPanel.dataset.p == n; closeMenus(); if (on) return;
  const end = n + 1 < G.parts.length ? partStart[n + 1] : G.sections.length, cur = currentSec();
  tlPanel.dataset.p = n;
  tlPanel.innerHTML = `<h5>${esc(G.parts[n].t)}</h5><div class="tl-list">` +
    G.sections.slice(partStart[n], end).map((s, k) => `<a data-i="${partStart[n] + k}"${partStart[n] + k === cur ? ' class="on"' : ""}>${esc(s.t)}</a>`).join("") + `</div>`;
  tlPanel.classList.add("on");
  const r = at.getBoundingClientRect(), w = tlPanel.offsetWidth;
  tlPanel.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + "px"; tlPanel.style.right = "auto";
  const on2 = tlPanel.querySelector(".on"); if (on2) on2.scrollIntoView({block: "center"});
}
tlPanel.addEventListener("click", e => { const i = e.target.dataset.i; if (i != null) { closeMenus(); goSection(+i); } });
tlPanel.addEventListener("wheel", e => e.stopPropagation());
function currentSec() { const line = (BAR + 80 - y) / k; let on = 0; geo.secs.forEach((s, n) => { if (s.y <= line) on = n; }); return on; }
function drawRail() {
  const h = $("#tlHere"); if (!h) return;
  const f = ((BAR + 60 - y) / k - tlLine._y0) / tlLine._span;
  h.style.left = Math.max(0, Math.min(1, f)) * 100 + "%";
  const p = G.sections[currentSec()].part;
  tlLine.querySelectorAll(".tl-part").forEach((a, n) => a.classList.toggle("on", n === p && f >= 0));
}

/* ---------- bubbles ---------- */
function showPop(html, rect, wide) {
  pop.className = "pop" + (wide ? " wide" : ""); pop.innerHTML = `<button class="x" aria-label="Close">×</button><div class="body">${html}</div>`; pop.hidden = false;
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  const left = Math.max(RAIL() + 8, Math.min(innerWidth - pw - 12, rect.left + rect.width / 2 - 40));
  let top = rect.bottom + 12;
  if (top + ph > innerHeight - 8 && rect.top - ph - 12 > BAR) { top = rect.top - ph - 12; pop.classList.add("below"); }
  top = Math.max(BAR + 4, Math.min(top, innerHeight - ph - 8));
  pop.style.left = left + "px"; pop.style.top = top + "px";
  pop.style.setProperty("--tail", Math.max(14, Math.min(pw - 28, rect.left + rect.width / 2 - left - 6)) + "px");
  pop.querySelector(".x").onclick = closePop;
}
function closePop() { if (!pop.hidden) { pop.hidden = true; pop.innerHTML = ""; } }
pop.addEventListener("pointerdown", e => e.stopPropagation());
pop.addEventListener("wheel", e => e.stopPropagation());
const srcHTML = list => (list || []).map(s => { const [t, u] = s.split(" | "); return u && /^https?:/.test(u.trim()) ? `<a href="${esc(u.trim())}" target="_blank" rel="noopener">${esc(t)}</a>` : esc(s); }).join("<br>");
function leafPop(leaf) {
  const n = NOTES[+leaf.dataset.n], ty = G.types[n.type];
  showPop(`<div class="kind"><b class="leaf t-${n.type}"></b>${esc(ty.label)}</div><h4>${esc(n.title || "")}</h4><div>${esc(n.text || "")}</div>` +
    (n.src && n.src.length ? `<div class="src">${srcHTML(n.src)}</div>` : "") +
    (G.draft && n.status !== "verified" ? `<div class="draft">Draft: ${n.status === "ruling" ? "waiting on a ruling" : "source still to check"}</div>` : ""), leaf.getBoundingClientRect());
}
const refName = r => { const [b, cv] = r.split(" "); return LONG[b] + " " + cv; };
const bgUrl = ref => "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(refName(ref)) + "&version=KJV;NIV;MSG";
function comparePop(v, at) {
  const ref = v.dataset.r, j = jstOf[ref];
  let h = `<h4>${refName(ref)}</h4>`;
  if (j) h += `<div class="cmp"><div><span class="lbl">King James</span>${opsHTML(j.ops, "k")}</div>` +
    `<div><span class="lbl">Joseph Smith${j.j && j.j.length ? ` <span class="ref">${esc(j.j.map(refName).join(", "))}</span>` : ""}</span>${opsHTML(j.ops, "j")}</div></div>` +
    (j.q ? `<div class="cmp-note">Unsettled: ${esc(j.q)}</div>` : "");
  else h += `<div class="pos">Joseph Smith's translation reads the same here.</div>`;
  h += `<div class="btns"><a href="${bgUrl(ref)}" target="_blank" rel="noopener">Read it in the NIV and The Message</a><button data-bm>Bookmark this verse</button></div>`;
  showPop(h, (at || v.querySelector(".vn")).getBoundingClientRect(), !!j);
  pop.querySelector("[data-bm]").onclick = () => { addMark(refName(ref)); closePop(); };
}
const WORD = /[A-Za-zÆæŒœ]+(?:[’'\-][A-Za-zÆæ]+)*/g;
function caretAt(cx, cy) {
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(cx, cy); return p ? {node: p.offsetNode, off: p.offset} : null; }
  const r = document.caretRangeFromPoint && document.caretRangeFromPoint(cx, cy); return r ? {node: r.startContainer, off: r.startOffset} : null;
}
function wordAt(e) {
  const c = caretAt(e.clientX, e.clientY); if (!c || c.node.nodeType !== 3) return null;
  const vt = c.node.parentElement.closest(".vt"); if (!vt) return null;
  let off = c.off; const tw = document.createTreeWalker(vt, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode()) && n !== c.node) off += n.data.length;
  return wordIn(vt, off);
}
function wordIn(vt, off, nth) {
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
  showPop(h, rangeIn(w.vt, w.start, w.end).getBoundingClientRect());
}

/* ---------- highlights and notes ---------- */
let HL = load("gh-highlights", []);
function paint(h) {
  const v = world.querySelector(`.v[data-r="${h.r}"] .vt`); if (!v) return;
  const tw = document.createTreeWalker(v, NodeFilter.SHOW_TEXT), nodes = []; let n, pos = 0;
  while ((n = tw.nextNode())) { const s = Math.max(h.a, pos), e = Math.min(h.b, pos + n.data.length); if (s < e) nodes.push([n, s - pos, e - pos]); pos += n.data.length; }
  nodes.forEach(([node, s, e]) => { const r = document.createRange(); r.setStart(node, s); r.setEnd(node, e); const m = el("mark", "hl" + (h.note ? " has-note" : "")); m.dataset.id = h.id; r.surroundContents(m); });
}
function unpaint(id) { world.querySelectorAll(`mark.hl[data-id="${id}"]`).forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); }); }
HL.forEach(paint);
let pending = null;
document.addEventListener("mouseup", e => {
  if (e.target.closest("#selbar,#pop,#bar,.menu,#timeline")) return;
  setTimeout(() => {
    const s = getSelection(), bar = $("#selbar");
    if (!s.rangeCount || s.isCollapsed || k < READ) { bar.hidden = true; return; }
    const r = s.getRangeAt(0), vt = (r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer).closest(".vt");
    if (!vt) { bar.hidden = true; return; }
    const pre = document.createRange(); pre.selectNodeContents(vt); pre.setEnd(r.startContainer, r.startOffset);
    const a = pre.toString().length, b = vt.contains(r.endContainer) ? a + r.toString().length : vt.textContent.length;
    if (b - a < 2) { bar.hidden = true; return; }
    pending = {r: vt.closest(".v").dataset.r, a, b};
    const rc = r.getBoundingClientRect(); bar.hidden = false;
    bar.style.left = Math.max(8, rc.left + rc.width / 2 - 100) + "px"; bar.style.top = Math.max(BAR + 4, rc.top - 42) + "px";
  }, 0);
});
$("#selbar").addEventListener("mousedown", e => e.preventDefault());
$("#selbar").addEventListener("click", e => {
  const c = e.target.dataset.c; if (!c || !pending) return;
  const h = {...pending, id: Date.now().toString(36), note: ""}; HL.push(h); save("gh-highlights", HL); getSelection().removeAllRanges(); paint(h); $("#selbar").hidden = true;
  if (c === "n") notePop(world.querySelector(`mark.hl[data-id="${h.id}"]`), true);
});
function notePop(m, edit) {
  const h = HL.find(z => z.id === m.dataset.id); if (!h) return;
  showPop(`<div class="kind">Your note</div>` + (edit || !h.note ? `<textarea placeholder="Write your note here">${esc(h.note || "")}</textarea>` : `<div style="white-space:pre-wrap">${esc(h.note)}</div>`) +
    `<div class="btns">${edit || !h.note ? `<button data-a="save">Save</button>` : `<button data-a="edit">Edit</button>`}<button data-a="del">Remove highlight</button></div>`, m.getBoundingClientRect());
  const ta = pop.querySelector("textarea"); if (ta) { ta.focus(); ta.oninput = () => { h.note = ta.value; save("gh-highlights", HL); }; }
  pop.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
    if (b.dataset.a === "save") { h.note = ta.value.trim(); save("gh-highlights", HL); world.querySelectorAll(`mark.hl[data-id="${h.id}"]`).forEach(z => z.classList.toggle("has-note", !!h.note)); closePop(); }
    else if (b.dataset.a === "edit") notePop(m, true);
    else { HL = HL.filter(z => z.id !== h.id); save("gh-highlights", HL); unpaint(h.id); closePop(); }
  });
}

/* ---------- clicks on the sheet ---------- */
world.addEventListener("click", e => {
  if (moved || !getSelection().isCollapsed) return;
  const t = e.target;
  if (t.classList.contains("begin")) return goSection(0, fitK);
  if (k < READ) { const s = t.closest(".sec"); if (s) goSection(+s.dataset.i, fitK); return; }
  if (t.classList.contains("leaf")) return leafPop(t);
  if (t.classList.contains("vn") || t.classList.contains("jsm")) return comparePop(t.closest(".v"), t);
  if (t.classList.contains("ja") || (t.classList.contains("jc") && document.body.classList.contains("jst-in"))) return comparePop(t.closest(".v"), t);
  if (t.closest("mark.hl")) return notePop(t.closest("mark.hl"));
  const w = wordAt(e); if (w) return wordPop(w);
  closePop();
});

/* ---------- study menu, bookmarks ---------- */
const prefs = Object.assign({jst: "in", wj: "green", off: []}, load("gh-prefs5", {}));
function setBody() {
  document.body.classList.toggle("jst-in", prefs.jst === "in"); document.body.classList.toggle("jst-mark", prefs.jst === "mark"); document.body.classList.toggle("jst-full", prefs.jst === "full");
  document.body.classList.toggle("wj", prefs.wj !== "off"); document.body.classList.toggle("wj-wash", prefs.wj === "wash");
  world.querySelectorAll(".leaf").forEach(l => l.classList.toggle("off", prefs.off.includes(NOTES[+l.dataset.n].type)));
}
const studyMenu = $("#studyMenu"), markMenu = $("#markMenu");
function closeMenus() { studyMenu.classList.remove("on"); markMenu.classList.remove("on"); tlPanel.classList.remove("on"); $("#readPanel").classList.remove("on"); }
const counts = {}; NOTES.forEach(n => counts[n.type] = (counts[n.type] || 0) + 1);
studyMenu.innerHTML = `<h5>Joseph Smith's changes</h5><div class="seg">` +
  [["in","Set into the verse"],["full","Written out under the verse"],["mark","Marked only"],["off","Hidden"]].map(([v, l]) => `<label><input type="radio" name="jst" value="${v}" ${prefs.jst === v ? "checked" : ""}>${l}</label>`).join("") + `</div>` +
  `<h5>The words of Christ</h5><div class="seg">` +
  [["green","Green ink"],["wash","Green ink on a gold wash"],["off","Plain"]].map(([v, l]) => `<label><input type="radio" name="wj" value="${v}" ${prefs.wj === v ? "checked" : ""}>${l}</label>`).join("") + `</div>` +
  `<h5>Notes</h5>` + Object.entries(G.types).filter(([t]) => counts[t]).map(([t, d]) =>
    `<label><input type="checkbox" data-t="${t}" ${prefs.off.includes(t) ? "" : "checked"}><b class="leaf t-${t}"></b>${esc(d.label)}<span class="n">${counts[t]}</span></label>`).join("");
studyMenu.addEventListener("change", e => {
  const t = e.target;
  if (t.name === "jst") prefs.jst = t.value; else if (t.name === "wj") prefs.wj = t.value;
  else if (t.dataset.t) { prefs.off = prefs.off.filter(z => z !== t.dataset.t); if (!t.checked) prefs.off.push(t.dataset.t); }
  save("gh-prefs5", prefs); const a = anchor(); setBody(); measure(); restore(a);
});
let MARKS = load("gh-bookmarks2", []);
const here = () => Object.assign(anchor(), {z: k / fitK});
function goMark(m) { k = Math.max(0.08, (m.z || 1) * fitK); restore(m); }
function addMark(name) { const a = here(); MARKS.push(Object.assign({name: name || (a.i != null ? G.sections[a.i].t : "The beginning")}, a)); save("gh-bookmarks2", MARKS); drawMarks(); markMenu.classList.add("on"); }
const spotAtOpen = load("gh-spot2", null);
function drawMarks() {
  markMenu.innerHTML = `<h5>Jump to</h5><input id="jumpIn" type="text" placeholder="John 3:16, or a phrase" autocomplete="off" spellcheck="false"><div id="jumpOut"></div><h5>Bookmarks</h5>` + (spotAtOpen && spotAtOpen.i != null ? `<div class="row"><a data-go="last">Where I left off: ${esc(G.sections[Math.min(spotAtOpen.i, G.sections.length - 1)].t)}</a></div>` : "") +
    MARKS.map((m, i) => `<div class="row"><a data-go="${i}">${esc(m.name)}</a><button class="x" data-del="${i}">×</button></div>`).join("") +
    `<button class="add">Bookmark this place</button>` +
    `<h5>Reading</h5><div class="row"><a data-fit>Fit all four columns</a></div><div class="row"><a data-study>Reading settings</a></div>` + ((G.reading || []).length ? `<div class="row"><a data-reading>Reading list for the year</a></div>` : "");
}
markMenu.addEventListener("click", e => {
  const t = e.target;
  const jr = t.closest("[data-jr],[data-ji]");
  if (jr) { closeMenus(); jr.dataset.jr ? goVerse(jr.dataset.jr) : goSection(+jr.dataset.ji); return; }
  if (t.dataset.fit != null) { fit(); closeMenus(); }
  else if (t.dataset.study != null) { closeMenus(); studyMenu.classList.add("on"); }
  else if (t.dataset.reading != null) { closeMenus(); openReading(); }
  else if (t.dataset.go != null) { const m = t.dataset.go === "last" ? spotAtOpen : MARKS[+t.dataset.go]; if (m) goMark(m); closeMenus(); }
  else if (t.dataset.del != null) { MARKS.splice(+t.dataset.del, 1); save("gh-bookmarks2", MARKS); drawMarks(); }
  else if (t.classList.contains("add")) addMark();
});
/* the reading list: all four Gospels, a portion with each cohort */
const readPanel = $("#readPanel"), BK = [["Matt","Matthew"],["Mark","Mark"],["Luke","Luke"],["John","John"]];
function openReading() {
  const cur = currentSec();
  readPanel.innerHTML = `<button class="x" aria-label="Close">×</button><h4>Reading list for the year</h4>` +
    `<p class="lead">Read all four Gospels this year, one portion with each cohort. The story of his mortal life begins with John, so the reading begins with The Lord and follows the story to the end. Together the portions take in every verse once. Each portion lists its passages by the same titles as the timeline. Choose any passage to go to it.</p>` +
    G.reading.map(r => {
      let body = "", part = -1;                                  // the portion, part by part, by passage title
      for (let i = r.at; i <= r.end; i++) {
        const sc = G.sections[i];
        if (sc.part !== part) { part = sc.part; body += `${body ? "</span>" : ""}<span class="pt"><i>${esc(G.parts[part].t)}</i>`; }
        body += `<a data-i="${i}"${i === cur ? ' class="here"' : ""}>${esc(sc.t)}</a>`;
      }
      return `<div class="rd${cur >= r.at && cur <= r.end ? " on" : ""}">` +
        `<span class="wk">${r.week ? "Week of " + esc(r.week) : "Cohort " + r.n}</span>` +
        `<b data-i="${r.at}">${esc(r.title)}</b>${body}</span></div>`;
    }).join("");
  readPanel.classList.add("on"); const on = readPanel.querySelector(".on"); if (on) on.scrollIntoView({block: "center"});
}
readPanel.addEventListener("click", e => { if (e.target.classList.contains("x")) return closeMenus(); const a = e.target.closest("[data-i]"); if (a) { closeMenus(); goSection(+a.dataset.i); } });
readPanel.addEventListener("wheel", e => e.stopPropagation());

/* jump to a reference ("John 3:16", "Matt 5") or a phrase ("lost sheep") */
const BOOKKEY = [[/^m(at|t)/i, "Matt"], [/^m(ar|k|rk)/i, "Mark"], [/^l(u|k)/i, "Luke"], [/^j(o|n|hn)/i, "John"]];
let verseIndex = null;
function goVerse(ref) {
  const v = world.querySelector(`.v[data-r="${ref}"]`); if (!v) return;
  const r = v.getBoundingClientRect(), nk = Math.max(k, fitK); flyTo((r.top - y) / k - 70 / nk, nk);
  v.classList.add("flash"); setTimeout(() => v.classList.remove("flash"), 2600);
}
function jumpFind(q) {
  q = q.trim(); if (q.length < 2) return [];
  const m = /^([1-3]?\s*[a-z]+)\.?\s*(\d+)(?:\s*[:.,\s]\s*(\d+))?$/i.exec(q), out = [];
  if (m) { const b = (BOOKKEY.find(([re]) => re.test(m[1])) || [])[1];
    if (b) { const v = world.querySelector(m[3] ? `.v[data-r="${b} ${m[2]}:${m[3]}"]` : `.v[data-r^="${b} ${m[2]}:"]`); if (v) out.push({ref: v.dataset.r, label: refName(v.dataset.r), text: v.querySelector(".vt").textContent.slice(0, 70)}); } }
  const lq = q.toLowerCase();
  G.sections.forEach((sct, i) => { if (out.length < 6 && sct.t.toLowerCase().includes(lq)) out.push({i, label: sct.t, text: ""}); });
  if (!verseIndex) verseIndex = [...world.querySelectorAll(".v")].map(v => ({r: v.dataset.r, t: v.querySelector(".vt").textContent, l: v.querySelector(".vt").textContent.toLowerCase()}));
  for (const v of verseIndex) { if (out.length >= 14) break; const at = v.l.indexOf(lq); if (at >= 0) out.push({ref: v.r, label: refName(v.r), text: (at > 24 ? "…" : "") + v.t.slice(Math.max(0, at - 24), at + lq.length + 40)}); }
  return out;
}
markMenu.addEventListener("input", e => {
  if (e.target.id !== "jumpIn") return;
  const res = jumpFind(e.target.value);
  $("#jumpOut").innerHTML = res.map(r => `<a ${r.ref ? `data-jr="${r.ref}"` : `data-ji="${r.i}"`}><b>${esc(r.label)}</b>${r.text ? ` <span>${esc(r.text)}</span>` : ""}</a>`).join("") || (e.target.value.trim().length > 1 ? `<span class="none">Nothing found.</span>` : "");
});
markMenu.addEventListener("keydown", e => { if (e.target.id === "jumpIn" && e.key === "Enter") { const a = $("#jumpOut a"); if (a) a.click(); } });
$("#markBtn").onclick = e => { e.stopPropagation(); studyMenu.classList.remove("on"); drawMarks(); markMenu.classList.toggle("on"); if (markMenu.classList.contains("on")) $("#jumpIn").focus(); };
let spotTimer; function saveSpot() { clearTimeout(spotTimer); spotTimer = setTimeout(() => { const a = here(); if (a.i != null) save("gh-spot2", a); }, 700); }

/* ---------- go ---------- */
setBody(); measure(); fitK = k = fitWidth(); y = BAR; apply();
function settle() { relayout(); hashGo(); }
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(settle, 60));
addEventListener("load", () => relayout());

/* review hook: index.html#go=<section title or number>,<zoom as a multiple of four-column fit>[,leaf|word|verse] */
function hashGo() {
  let m; try { m = /go=([^,]+),([\d.]+)(?:,(\w+))?/.exec(decodeURIComponent(location.hash)); } catch (e) { return; }
  if (!m) return;
  const i = /^\d+$/.test(m[1]) ? +m[1] : G.sections.findIndex(s => s.t === m[1]); if (i < 0 || !secEls[i]) { console.warn("hash: no section", m[1]); return; }
  k = Math.max(0.08, Math.min(2.4, (+m[2] || 1) * fitK)); y = BAR + 34 - (geo.secs[i].y - 10) * k; paintCam();
  const vs = [...secEls[i].querySelectorAll(".v")], v = vs[Math.min(2, vs.length - 1)];
  if (m[3] === "leaf") { const l = secEls[i].querySelector(".leaf:not(.off)"); l ? leafPop(l) : console.warn("hash: no leaf"); }
  if (m[3] === "verse") { const jv = vs.find(z => z.querySelector(".jsm")) || v; comparePop(jv); }
  if (m[3] === "word") { const w = wordIn(v.querySelector(".vt"), 0, 3); w ? wordPop(w) : console.warn("hash: no word"); }
}
addEventListener("hashchange", hashGo);
window.GH = {goSection, fit, flyTo, state: () => ({x, y, k, fitK})};
})();
