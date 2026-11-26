/* Note+ redaktors: contenteditable ar rindu numuriem (kā Notepad++),
 * automātiskiem sarakstiem, koda/komandu blokiem un attēliem. */
const Editor = (() => {
  const ICON_COPY = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const ICON_OK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  const RING = '<svg class="hover-ring" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>';
  const MARK = '<!--noteplus-->';
  const BLOCK_SEL = 'div,p,h1,h2,h3,h4,li,blockquote,pre';
  const KEEP_STYLE = ['color', 'background-color', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'width'];

  let active = null;          // aktīvā redaktora objekts
  const all = new Set();

  /* ---------- palīgfunkcijas ---------- */
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sel = () => window.getSelection();
  const exec = (c, v = null) => document.execCommand(c, false, v);

  function rangeIn(ed) {
    const s = sel();
    if (!s.rangeCount) return null;
    const r = s.getRangeAt(0);
    return ed.contains(r.commonAncestorContainer) ? r : null;
  }
  function blockOf(node, ed) {
    let n = node && node.nodeType === 3 ? node.parentNode : node;
    while (n && n !== ed) {
      if (n.nodeType === 1 && n.matches(BLOCK_SEL)) return n;
      n = n.parentNode;
    }
    return null;
  }
  function closest(node, selector, ed) {
    let n = node && node.nodeType === 3 ? node.parentNode : node;
    while (n && n !== ed) {
      if (n.nodeType === 1 && n.matches(selector)) return n;
      n = n.parentNode;
    }
    return null;
  }
  function topLevel(node, ed) {
    let n = node;
    while (n && n.parentNode !== ed) n = n.parentNode;
    return n;
  }
  function caretTo(el, atEnd = false) {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(!atEnd);
    const s = sel();
    s.removeAllRanges();
    s.addRange(r);
    const host = el.isContentEditable ? (el.closest('[contenteditable="true"]') || el) : el;
    if (host.focus) host.focus({ preventScroll: true });
    s.removeAllRanges();
    s.addRange(r);
  }
  function textBefore(container, r) {
    const pr = document.createRange();
    pr.setStart(container, 0);
    pr.setEnd(r.startContainer, r.startOffset);
    return pr;
  }
  function newLine() {
    const d = document.createElement('div');
    d.innerHTML = '<br>';
    return d;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      exec('copy');
      ta.remove();
    }
  }

  const copyBtn = () => `<button class="cb-copy" title="${t('copy')}">${ICON_COPY}</button>`;
  function makeCblock(kind, text = '') {
    const b = document.createElement('div');
    b.className = 'cblock';
    b.dataset.kind = kind;
    b.setAttribute('contenteditable', 'false');
    b.innerHTML = `${copyBtn()}<pre contenteditable="true" spellcheck="false"></pre>`;
    b.querySelector('pre').textContent = text;
    return b;
  }

  function cleanStyles(root) {
    root.querySelectorAll('[style]').forEach(el => {
      if (el.classList.contains('img-wrap')) return;
      const st = el.style;
      const keep = {};
      KEEP_STYLE.forEach(p => { const v = st.getPropertyValue(p); if (v) keep[p] = v; });
      el.removeAttribute('style');
      Object.entries(keep).forEach(([p, v]) => el.style.setProperty(p, v));
      if (!el.getAttribute('style')) el.removeAttribute('style');
    });
    root.querySelectorAll('font').forEach(f => {
      const span = document.createElement('span');
      if (f.color) span.style.color = f.color;
      while (f.firstChild) span.appendChild(f.firstChild);
      f.replaceWith(span);
    });
  }

  function flashOk(btn) {
    btn.innerHTML = ICON_OK;
    btn.classList.add('ok');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.innerHTML = ICON_COPY; btn.classList.remove('ok'); }, 1300);
  }

  /* ---------- redaktora izveide ---------- */
  function create(initialHTML, opts) {
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = '<div class="page-inner"><div class="gutter"></div><div class="curline"></div><div class="tblock-hl"></div>' +
      `<button class="tb-copy" title="${t('copyBlock')}">${ICON_COPY}</button>` +
      '<div class="editor" contenteditable="true" spellcheck="false"></div></div>';
    const gutter = page.querySelector('.gutter');
    const curline = page.querySelector('.curline');
    const ed = page.querySelector('.editor');
    const pageInner = page.querySelector('.page-inner');
    const tbHl = page.querySelector('.tblock-hl');
    const tbCopy = page.querySelector('.tb-copy');
    ed.innerHTML = initialHTML || '';

    const widths = new WeakMap();
    const ro = new ResizeObserver(entries => {
      let resized = false;
      for (const en of entries) {
        const t = en.target;
        if (t === ed) continue;
        const w = t.style.width;
        if (widths.get(t) !== w) { widths.set(t, w); resized = true; }
      }
      scheduleGutter();
      if (resized) opts.onChange();
    });
    ro.observe(ed);

    const self = {
      page, ed,
      html() {
        const c = ed.cloneNode(true);
        c.querySelectorAll('.arming').forEach(x => x.classList.remove('arming'));
        c.querySelectorAll('.cb-copy.ok').forEach(x => { x.classList.remove('ok'); x.innerHTML = ICON_COPY; });
        c.querySelectorAll('[data-copied][title]').forEach(x => x.removeAttribute('title'));
        return c.innerHTML;
      },
      focus() { ed.focus({ preventScroll: true }); },
      refresh: scheduleGutter,
      updateCurrent,
      destroy() { ro.disconnect(); all.delete(self); if (active === self) active = null; },
      opts
    };
    all.add(self);

    /* normalizācija – pēc ielādes / ielīmēšanas */
    function normalize(full) {
      if (full) {
        // brīvus teksta mezglus augšējā līmenī ietin rindās
        [...ed.childNodes].forEach(n => {
          if (n.nodeType === 3) {
            if (n.textContent.trim()) { const d = document.createElement('div'); n.replaceWith(d); d.appendChild(n); }
            else n.remove();
          }
        });
      }
      if (!ed.firstChild || ed.innerHTML === '<br>') ed.innerHTML = '<div><br></div>';
      ed.querySelectorAll('.cblock').forEach(b => {
        b.setAttribute('contenteditable', 'false');
        b.querySelectorAll(':scope > .cblock-head, :scope > .cb-copy').forEach(x => x.remove());
        b.insertAdjacentHTML('afterbegin', copyBtn());
        let pre = b.querySelector('pre');
        if (!pre) { pre = document.createElement('pre'); b.appendChild(pre); }
        pre.setAttribute('contenteditable', 'true');
        pre.setAttribute('spellcheck', 'false');
        if (b.parentNode === ed && !b.nextSibling) ed.appendChild(newLine());
      });
      ed.querySelectorAll('img').forEach(img => {
        if (!img.parentNode.classList.contains('img-wrap')) {
          const w = document.createElement('span');
          w.className = 'img-wrap';
          img.replaceWith(w);
          w.appendChild(img);
          w.style.width = Math.min(img.naturalWidth || 480, 480) + 'px';
          img.removeAttribute('style'); img.removeAttribute('width'); img.removeAttribute('height');
        }
      });
      ed.querySelectorAll('.img-wrap').forEach(w => {
        w.setAttribute('contenteditable', 'false');
        if (!w.querySelector('.hover-ring')) w.insertAdjacentHTML('beforeend', RING);
        widths.set(w, w.style.width);
        ro.observe(w);
      });
      cleanStyles(ed);
      scheduleGutter();
    }

    /* ---------- rindu numuri ---------- */
    let raf = 0;
    let lines = [];
    function scheduleGutter() {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; drawGutter(); });
    }
    function lh(el) {
      const cs = getComputedStyle(el);
      const v = parseFloat(cs.lineHeight);
      return isNaN(v) ? parseFloat(cs.fontSize) * 1.25 : v;
    }
    function drawGutter() {
      if (!page.classList.contains('active')) return;
      const base = ed.getBoundingClientRect().top;
      lines = [];
      const push = (el, top, h, extra) => lines.push(Object.assign({ el, top, h }, extra));
      for (const ch of ed.children) {
        if (ch.matches('ul,ol')) {
          ch.querySelectorAll('li').forEach(li => push(li, li.getBoundingClientRect().top - base, lh(li)));
        } else if (ch.classList.contains('cblock')) {
          const pre = ch.querySelector('pre');
          const t = pre.getBoundingClientRect().top - base + parseFloat(getComputedStyle(pre).paddingTop);
          const h = lh(pre);
          let txt = pre.innerText;
          if (txt.endsWith('\n')) txt = txt.slice(0, -1);
          const n = Math.max(1, txt.split('\n').length);
          for (let i = 0; i < n; i++) push(pre, t + i * h, h, { idx: i });
        } else if (ch.tagName !== 'HR') {
          const cs = getComputedStyle(ch);
          push(ch, ch.getBoundingClientRect().top - base + parseFloat(cs.paddingTop || 0), lh(ch));
        }
      }
      let html = '';
      lines.forEach((l, i) => {
        html += `<span style="top:${Math.round(l.top + (l.h - 12) / 2)}px">${i + 1}</span>`;
      });
      gutter.innerHTML = html;
      updateCurrent();
      if (opts.onStats) opts.onStats(stats());
    }
    function stats() {
      const t = ed.innerText || '';
      const words = (t.match(/[^\s]+/g) || []).length;
      return { lines: lines.length, words, chars: t.replace(/\n/g, '').length, cur: curIdx + 1 };
    }

    let curIdx = -1;
    function updateCurrent() {
      const r = rangeIn(ed);
      const spans = gutter.children;
      if (curIdx >= 0 && spans[curIdx]) spans[curIdx].classList.remove('cur');
      curIdx = -1;
      if (!r || document.activeElement === null) { curline.style.display = 'none'; return; }
      const node = r.startContainer;
      const base = ed.getBoundingClientRect().top;
      // atrodam rindas indeksu
      const pre = closest(node, 'pre', ed);
      if (pre) {
        const before = textBefore(pre, r).toString();
        const idx = (before.match(/\n/g) || []).length;
        curIdx = lines.findIndex(l => l.el === pre && l.idx === idx);
      } else {
        const li = closest(node, 'li', ed);
        const target = li || topLevel(node, ed);
        curIdx = lines.findIndex(l => l.el === target);
      }
      if (curIdx >= 0 && spans[curIdx]) spans[curIdx].classList.add('cur');
      // izgaismotā rinda – pēc kursora pozīcijas
      let rect = r.getClientRects()[0];
      let top, h;
      if (rect && rect.height) {
        top = rect.top - base; h = rect.height;
        const L = lines[curIdx];
        if (L) { h = Math.max(h, L.h); top = top - (h - rect.height) / 2; }
      } else if (lines[curIdx]) {
        top = lines[curIdx].top; h = lines[curIdx].h;
      }
      if (top === undefined || !r.collapsed) { curline.style.display = 'none'; return; }
      curline.style.display = 'block';
      curline.style.top = top + 'px';
      curline.style.height = h + 'px';
    }

    /* ---------- automātiskie saraksti ---------- */
    function isolate(li) {
      // izceļ <li> atsevišķā sarakstā (lai “a. ” neapvienotos ar blakus esošu 1,2,3 sarakstu)
      const list = li.parentNode;
      const items = [...list.children];
      if (items.length === 1) return list;
      const i = items.indexOf(li);
      const nl = document.createElement(list.tagName);
      list.after(nl);
      nl.appendChild(li);
      if (i < items.length - 1) {
        const tail = list.cloneNode(false);
        nl.after(tail);
        items.slice(i + 1).forEach(x => tail.appendChild(x));
      }
      if (!list.children.length) list.remove();
      caretTo(li);
      return nl;
    }
    // Chromium dažreiz ieliek <ol>/<ul> iekš <div> – izceļam sarakstu augšējā līmenī
    function liftLists() {
      const s = sel();
      const r = s.rangeCount ? s.getRangeAt(0) : null;
      const keep = r && ed.contains(r.startContainer) ? [r.startContainer, r.startOffset] : null;
      let moved = false;
      ed.querySelectorAll(':scope > div > ul, :scope > div > ol, :scope > p > ul, :scope > p > ol').forEach(list => {
        const box = list.parentNode;
        const others = [...box.childNodes].filter(n => n !== list && !(n.nodeType === 3 && !n.textContent.trim()) && n.nodeName !== 'BR');
        if (others.length) return;
        box.replaceWith(list);
        moved = true;
      });
      if (moved && keep) {
        const nr = document.createRange();
        nr.setStart(keep[0], Math.min(keep[1], keep[0].nodeType === 3 ? keep[0].length : keep[0].childNodes.length));
        s.removeAllRanges();
        s.addRange(nr);
      }
    }
    function currentLi() {
      const r = rangeIn(ed);
      return r ? closest(r.startContainer, 'li', ed) : null;
    }
    function applyList(a) {
      if (a.type === 'ul' || a.type === 'check') exec('insertUnorderedList');
      else exec('insertOrderedList');
      liftLists();
      const li = currentLi();
      if (!li) return;
      const list = li.parentNode;
      const want = a.type === 'check' ? 'check' : a.alpha === 'lower' ? 'alpha' : a.alpha === 'upper' ? 'alpha-up' : '';
      const has = ['check', 'alpha', 'alpha-up'].find(c => list.classList.contains(c)) || '';
      let target = list;
      if (want !== has || (a.start && a.start > 1)) target = isolate(li);
      target.classList.remove('check', 'alpha', 'alpha-up');
      if (want) target.classList.add(want);
      if (target.tagName === 'OL') {
        if (a.start && a.start > 1) target.setAttribute('start', a.start);
        else target.removeAttribute('start');
      }
      if (a.done) li.classList.add('done');
    }

    // Izsauc pēc atstarpes ievadīšanas: “1. ”, “- ”, “a. ”, “[] ”, “``` ”, “$$ ” rindas sākumā
    function tryAutoFormat() {
      const r = rangeIn(ed);
      if (!r || !r.collapsed) return false;
      if (closest(r.startContainer, 'pre,.cblock,li,code', ed)) return false;
      const block = blockOf(r.startContainer, ed);
      if (!block || !['DIV', 'P'].includes(block.tagName) || block.parentNode !== ed) return false;
      const pr = textBefore(block, r);
      const full = pr.toString();
      if (!/[  ]$/.test(full)) return false;
      const t = full.slice(0, -1);
      let m, a = null;
      if (/^[-*•]$/.test(t)) a = { type: 'ul' };
      else if ((m = t.match(/^(\d{1,5})[.)]$/))) a = { type: 'ol', start: +m[1] };
      else if ((m = t.match(/^([a-z])[.)]$/))) a = { type: 'ol', alpha: 'lower', start: m[1].charCodeAt(0) - 96 };
      else if ((m = t.match(/^([A-Z])[.)]$/))) a = { type: 'ol', alpha: 'upper', start: m[1].charCodeAt(0) - 64 };
      else if (/^\[[ xX ]?\]$/.test(t)) a = { type: 'check', done: /x/i.test(t) };
      else if (t === '```') a = { type: 'code' };
      else if (t === '$$') a = { type: 'cmd' };
      if (!a) return false;
      const s = sel();
      s.removeAllRanges();
      s.addRange(pr);
      exec('delete');
      if (a.type === 'code' || a.type === 'cmd') insertCblock(a.type);
      else applyList(a);
      return true;
    }

    /* ---------- koda / komandu bloki ---------- */
    function insertCblock(kind) {
      const r = rangeIn(ed);
      let text = '';
      if (r && !r.collapsed) { text = r.toString(); exec('delete'); }
      const r2 = rangeIn(ed);
      const b = makeCblock(kind, text);
      const top = r2 ? topLevel(r2.startContainer, ed) : null;
      if (top && top.nodeType === 1 && top.matches('div,p') && !top.classList.contains('cblock') && !top.textContent.trim() && !top.querySelector('img')) {
        top.replaceWith(b);
      } else if (top) {
        top.after(b);
      } else {
        ed.appendChild(b);
      }
      if (!b.nextSibling) b.after(newLine());
      caretTo(b.querySelector('pre'), true);
      changed();
    }
    function leaveCblock(pre, forward = true) {
      const b = pre.closest('.cblock');
      let target = forward ? b.nextElementSibling : b.previousElementSibling;
      if (!target || target.classList.contains('cblock')) {
        target = newLine();
        forward ? b.after(target) : b.before(target);
        changed();
      }
      caretTo(target, !forward);
    }

    /* ---------- attēli ---------- */
    function readImage(file) {
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => {
          const img = new Image();
          img.onload = () => {
            const MAX = 2000;
            let { width: w, height: h } = img;
            let src = fr.result;
            if (w > MAX || h > MAX || file.size > 1.5e6) {
              const k = Math.min(1, MAX / Math.max(w, h));
              w = Math.round(w * k); h = Math.round(h * k);
              const c = document.createElement('canvas');
              c.width = w; c.height = h;
              c.getContext('2d').drawImage(img, 0, 0, w, h);
              src = file.type === 'image/png' && file.size < 4e6 ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88);
            }
            res({ src, w, h });
          };
          img.onerror = rej;
          img.src = fr.result;
        };
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
    }
    async function insertImageFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const { src, w } = await readImage(file);
      const disp = Math.min(w, 520);
      if (!rangeIn(ed)) caretTo(ed.lastElementChild || ed, true);
      exec('insertHTML', `<span class="img-wrap" contenteditable="false" style="width:${disp}px"><img src="${src}" alt="">${RING}</span>&nbsp;`);
      normalize(false);
      changed();
    }

    /* lielais skats pēc 1 s virs attēla */
    let hoverTimer = 0, armed = null;
    function disarm() {
      clearTimeout(hoverTimer);
      if (armed) armed.classList.remove('arming');
      armed = null;
    }
    ed.addEventListener('mouseover', e => {
      const w = e.target.closest && e.target.closest('.img-wrap');
      if (!w || w === armed) return;
      disarm();
      armed = w;
      w.classList.add('arming');
      hoverTimer = setTimeout(() => {
        const img = w.querySelector('img');
        disarm();
        if (img) openLightbox(img.src);
      }, 1000);
    });
    ed.addEventListener('mouseout', e => {
      if (!armed) return;
      const to = e.relatedTarget;
      if (!to || !armed.contains(to)) disarm();
    });
    ed.addEventListener('mousedown', e => {
      if (armed) disarm();
    }, true);

    /* ---------- teksta bloki (atdala tukša rinda vai koda bloks) ---------- */
    const isGap = el => el.nodeType !== 1 || el.tagName === 'HR' || el.classList.contains('cblock') ||
      (el.matches('div,p') && !el.textContent.trim() && !el.querySelector('img'));
    let tbGroup = null;
    function groupAt(y) {
      const kids = [...ed.children];
      const hit = kids.find(c => { const r = c.getBoundingClientRect(); return y >= r.top - 2 && y <= r.bottom + 2; });
      if (!hit || isGap(hit)) return null;
      let a = hit, b = hit;
      while (a.previousElementSibling && !isGap(a.previousElementSibling)) a = a.previousElementSibling;
      while (b.nextElementSibling && !isGap(b.nextElementSibling)) b = b.nextElementSibling;
      const els = [];
      for (let n = a; n; n = n.nextElementSibling) { els.push(n); if (n === b) break; }
      return els;
    }
    function hideTb() { tbGroup = null; tbHl.style.display = 'none'; tbCopy.style.display = 'none'; }
    let tbRaf = 0, tbY = 0;
    pageInner.addEventListener('mousemove', e => {
      if (e.target === tbCopy || tbCopy.contains(e.target)) return;
      tbY = e.clientY;
      if (tbRaf) return;
      tbRaf = requestAnimationFrame(() => {
        tbRaf = 0;
        const g = groupAt(tbY);
        if (!g) return hideTb();
        tbGroup = g;
        const base = pageInner.getBoundingClientRect().top;
        const t = g[0].getBoundingClientRect().top - base;
        const btm = g[g.length - 1].getBoundingClientRect().bottom - base;
        tbHl.style.display = tbCopy.style.display = 'block';
        tbHl.style.top = (t - 3) + 'px';
        tbHl.style.height = (btm - t + 6) + 'px';
        tbCopy.style.top = (t - 2) + 'px';
      });
    });
    pageInner.addEventListener('mouseleave', hideTb);
    tbCopy.addEventListener('mousedown', e => e.preventDefault());
    tbCopy.addEventListener('click', () => {
      if (!tbGroup) return;
      const text = Exporter.nodesToText(tbGroup).replace(/\s+$/, '');
      copyText(text);
      flashOk(tbCopy);
      markCopied(tbGroup);
    });

    /* ---------- kopētā teksta atzīmes (vāji zaļš fons, pele virsū – kad kopēts) ---------- */
    function markCopied(els) {
      const ts = String(Date.now());
      els.filter(Boolean).forEach(el => el.setAttribute('data-copied', ts));
      opts.onCopied();
      changed();
    }
    ed.addEventListener('mouseover', e => {
      const el = e.target.closest && e.target.closest('[data-copied]');
      if (el && ed.contains(el)) el.title = t('copiedAgo', I18n.ago(+el.dataset.copied));
    });

    /* ---------- notikumi ---------- */
    function changed() {
      scheduleGutter();
      opts.onChange();
    }
    ed.addEventListener('keydown', hideTb);
    ed.addEventListener('input', e => {
      if (/List|outdent|indent/i.test(e.inputType || '')) liftLists();
      if (e.inputType === 'insertText' && e.data && /[  ]$/.test(e.data) && e.data.length === 1) tryAutoFormat();
      if (!ed.firstChild || ed.innerHTML === '<br>') {
        ed.innerHTML = '<div><br></div>';
        caretTo(ed.firstChild);
      }
      changed();
    });
    ed.addEventListener('load', scheduleGutter, true);
    ed.addEventListener('focus', () => { active = self; }, true);

    ed.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (btn && btn.classList.contains('cb-copy')) {
        e.preventDefault();
        const pre = btn.closest('.cblock').querySelector('pre');
        copyText(pre.innerText.replace(/\n$/, ''));
        flashOk(btn);
        markCopied([btn.closest('.cblock')]);
        return;
      }
      if (btn && btn.classList.contains('cb-del')) {
        e.preventDefault();
        const b = btn.closest('.cblock');
        const next = b.nextElementSibling || b.previousElementSibling;
        b.remove();
        if (next) caretTo(next);
        normalize(false);
        changed();
        return;
      }
      const li = e.target.closest('ul.check > li');
      if (li && e.target === li && e.clientX - li.getBoundingClientRect().left < 22) {
        li.classList.toggle('done');
        changed();
      }
    });

    function handleCopy(e, cut) {
      const s = sel();
      if (!s.rangeCount || s.isCollapsed) return;
      const r = s.getRangeAt(0);
      const inPre = closest(r.commonAncestorContainer, 'pre', ed);
      if (!cut) {
        // atzīmējam nokopēto: koda bloku / saraksta punktus / rindas
        const marks = [];
        if (inPre) marks.push(inPre.closest('.cblock'));
        else [...ed.children].forEach(ch => {
          if (!r.intersectsNode(ch)) return;
          if (ch.matches('ul,ol')) ch.querySelectorAll('li').forEach(li => {
            // tikai punkta paša teksts (ne iekšējais saraksts)
            const own = [...li.childNodes].filter(n => !(n.nodeType === 1 && n.matches('ul,ol')));
            if (own.some(n => r.intersectsNode(n))) marks.push(li);
          });
          else if (!(ch.matches('div,p') && !ch.textContent.trim() && !ch.querySelector('img'))) marks.push(ch);
        });
        markCopied(marks);
      } else opts.onCopied();
      if (inPre) return; // kods – tikai teksts (pārlūks pats)
      const div = document.createElement('div');
      div.appendChild(r.cloneContents());
      div.querySelectorAll('.arming').forEach(x => x.classList.remove('arming'));
      div.querySelectorAll('[data-copied]').forEach(x => { x.removeAttribute('data-copied'); x.removeAttribute('title'); });
      e.clipboardData.setData('text/html', MARK + div.innerHTML);
      e.clipboardData.setData('text/plain', s.toString());
      e.preventDefault();
      if (cut) { exec('delete'); }
    }
    ed.addEventListener('copy', e => handleCopy(e, false));
    ed.addEventListener('cut', e => handleCopy(e, true));

    ed.addEventListener('paste', e => {
      const cd = e.clipboardData;
      const files = [...cd.files].filter(f => f.type.startsWith('image/'));
      if (files.length) {
        e.preventDefault();
        files.forEach(insertImageFile);
        return;
      }
      const html = cd.getData('text/html');
      const text = cd.getData('text/plain');
      e.preventDefault();
      const r = rangeIn(ed);
      if (r && closest(r.startContainer, 'pre', ed)) {
        exec('insertText', text);
      } else if (html && html.includes(MARK)) {
        let frag = html.slice(html.indexOf(MARK) + MARK.length);
        const endF = frag.indexOf('<!--EndFragment-->');
        if (endF >= 0) frag = frag.slice(0, endF);
        exec('insertHTML', frag);
        normalize(false);
      } else if (text) {
        exec('insertText', text);
      }
      changed();
    });

    ed.addEventListener('dragover', e => {
      if ([...e.dataTransfer.types].includes('Files')) e.preventDefault();
    });
    ed.addEventListener('drop', e => {
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      const pos = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (pos && ed.contains(pos.startContainer)) { const s = sel(); s.removeAllRanges(); s.addRange(pos); }
      files.forEach(insertImageFile);
    });

    ed.addEventListener('keydown', e => {
      const r = rangeIn(ed);
      const pre = r ? closest(r.startContainer, 'pre', ed) : null;
      const ctrl = (e.ctrlKey || e.metaKey) && !e.altKey; // AltGr (ā, č…) = Ctrl+Alt – ignorējam

      if (ctrl) {
        const k = e.code;
        if (!e.shiftKey && k === 'KeyB') { e.preventDefault(); exec('bold'); return; }
        if (!e.shiftKey && k === 'KeyI') { e.preventDefault(); exec('italic'); return; }
        if (!e.shiftKey && k === 'KeyU') { e.preventDefault(); exec('underline'); return; }
        if (e.shiftKey && k === 'KeyX') { e.preventDefault(); exec('strikeThrough'); return; }
        if (!e.shiftKey && k === 'KeyE') { e.preventDefault(); api.inlineCode(); return; }
        if (e.shiftKey && k === 'KeyK') { e.preventDefault(); insertCblock('code'); return; }
        if (e.shiftKey && k === 'KeyM') { e.preventDefault(); insertCblock('cmd'); return; }
        if (e.key === 'Enter' && pre) { e.preventDefault(); leaveCblock(pre, true); return; }
      }

      if (pre) {
        if (e.key === 'Enter' && !ctrl) {
          e.preventDefault();
          exec('insertLineBreak');
          return;
        }
        if (e.key === 'Tab') { e.preventDefault(); exec('insertText', '    '); return; }
        if (e.key === 'ArrowDown' && r.collapsed) {
          const after = document.createRange();
          after.setStart(r.endContainer, r.endOffset);
          after.setEnd(pre, pre.childNodes.length);
          if (!after.toString().replace(/\n$/, '').includes('\n')) { e.preventDefault(); leaveCblock(pre, true); }
          return;
        }
        if (e.key === 'ArrowUp' && r.collapsed) {
          if (!textBefore(pre, r).toString().includes('\n')) { e.preventDefault(); leaveCblock(pre, false); }
          return;
        }
        if (e.key === 'Backspace' && !pre.textContent.length) {
          e.preventDefault();
          const b = pre.closest('.cblock');
          const prev = b.previousElementSibling;
          const nl = newLine();
          b.replaceWith(nl);
          caretTo(nl);
          changed();
          return;
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (currentLi()) exec(e.shiftKey ? 'outdent' : 'indent');
        else if (!e.shiftKey) exec('insertText', '    ');
        changed();
        return;
      }
      if (e.key === 'Backspace' && r && r.collapsed) {
        const li = currentLi();
        if (li && !textBefore(li, r).toString().length && !li.querySelector('img')) {
          // Backspace saraksta punkta sākumā -> atpakaļ uz parastu rindu
          e.preventDefault();
          exec('outdent');
          changed();
          return;
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        setTimeout(() => {
          const li = currentLi();
          if (li && !li.textContent.trim()) li.classList.remove('done');
        });
      }
    });

    /* ---------- API rīkjoslai ---------- */
    const api = {
      inlineCode() {
        const r = rangeIn(ed);
        if (!r) return;
        const c = closest(r.startContainer, 'code', ed);
        if (c && !closest(r.startContainer, 'pre', ed)) {
          c.replaceWith(document.createTextNode(c.textContent));
          changed();
          return;
        }
        if (r.collapsed) {
          exec('insertHTML', '<code>kods</code>&nbsp;');
          const codes = ed.querySelectorAll('code');
          const s = sel(), rr = rangeIn(ed);
          const node = rr && closest(rr.startContainer.previousSibling || rr.startContainer, 'code', ed);
          const target = node || [...codes].find(x => x.textContent === 'kods');
          if (target) { const nr = document.createRange(); nr.selectNodeContents(target); s.removeAllRanges(); s.addRange(nr); }
        } else {
          exec('insertHTML', `<code>${esc(r.toString())}</code>`);
        }
        changed();
      },
      insertCblock,
      insertImageFile,
      clearCopied() {
        ed.querySelectorAll('[data-copied]').forEach(x => { x.removeAttribute('data-copied'); x.removeAttribute('title'); });
        changed();
      },
      list(kind) {
        const li = currentLi();
        const list = li && li.parentNode;
        if (kind === 'ul') {
          if (list && list.tagName === 'UL' && list.classList.contains('check')) list.classList.remove('check');
          else exec('insertUnorderedList');
        } else if (kind === 'ol') {
          if (list && list.tagName === 'OL' && list.classList.length) list.classList.remove('alpha', 'alpha-up');
          else exec('insertOrderedList');
        } else if (kind === 'ola') {
          if (list && list.tagName === 'OL') list.classList.toggle('alpha');
          else applyList({ type: 'ol', alpha: 'lower' });
        } else if (kind === 'check') {
          if (list && list.tagName === 'UL') list.classList.toggle('check');
          else applyList({ type: 'check' });
        }
        liftLists();
        changed();
      },
      changed
    };
    self.api = api;
    normalize(true);
    return self;
  }

  /* ---------- lielais attēla skats ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  let lbStart = null;
  function openLightbox(src) {
    lbImg.src = src;
    lb.classList.remove('hidden');
    lbStart = null;
  }
  function closeLightbox() { lb.classList.add('hidden'); lbImg.removeAttribute('src'); }
  lb.addEventListener('click', closeLightbox);
  lb.addEventListener('wheel', closeLightbox, { passive: true });
  lb.addEventListener('mousemove', e => {
    // aizveras, kad pele aiziet prom no attēla
    if (!lbStart) { lbStart = [e.clientX, e.clientY]; return; }
    const r = lbImg.getBoundingClientRect();
    const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    const moved = Math.hypot(e.clientX - lbStart[0], e.clientY - lbStart[1]);
    if (!over && moved > 60) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lb.classList.contains('hidden')) { e.stopPropagation(); closeLightbox(); }
  }, true);

  return {
    create,
    get active() { return active; },
    set active(v) { active = v; },
    exec,
    copyText,
    esc,
    rangeIn,
    blockOf,
    closest
  };
})();
