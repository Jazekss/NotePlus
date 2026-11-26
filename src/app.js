/* Note+ – augšējā josla, sākuma ekrāns (kartiņas), piezīmes skats, cilnes, rīkjosla, eksports */
(() => {
  const $ = id => document.getElementById(id);
  const CARD_COLORS = ['#664496', '#1c7ed6', '#0c8599', '#2f9e44', '#e8590c', '#d63a4a', '#c2255c', '#5f3dc4', '#495057', '#9c6b30'];
  const FORE = ['#d63a4a', '#e8590c', '#d9a400', '#2f9e44', '#0c8599', '#1c7ed6', '#7048e8', '#c2255c', '#9c6b30', '#868e96', '#5c940d', '#1864ab'];
  const BACK = ['rgba(255,212,0,.45)', 'rgba(255,146,43,.4)', 'rgba(255,99,99,.35)', 'rgba(64,192,87,.35)', 'rgba(32,201,151,.32)', 'rgba(77,171,247,.35)',
    'rgba(151,117,250,.35)', 'rgba(240,101,149,.35)', 'rgba(134,142,150,.3)', 'rgba(250,176,5,.6)', 'rgba(116,192,252,.55)', 'rgba(140,233,154,.55)'];
  const VIEWS = ['list', 'small', 'medium', 'large'];
  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    open: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7M10 14 21 3M21 14v7H3V3h7"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" class="fill"/><circle cx="12" cy="12" r="1.6" class="fill"/><circle cx="19" cy="12" r="1.6" class="fill"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    md: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 15V9l2.5 3L11 9v6M15 9v6M13 13l2 2 2-2"/></svg>',
    txt: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    max: '<svg viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1"/></svg>',
    restore: '<svg viewBox="0 0 12 12"><rect x="2" y="4" width="6" height="6" rx="1"/><path d="M4 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H8"/></svg>'
  };

  let notebooks = [];
  let current = null;          // atvērtā piezīme
  let editors = new Map();     // tabId -> editor
  let saveTimer = 0;
  let savedRange = null;
  let lastFore = FORE[0], lastBack = BACK[0];

  /* ================= iestatījumi ================= */
  const pref = {
    get(k, d) { try { return localStorage.getItem('np_' + k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('np_' + k, v); } catch (e) { } }
  };
  function applyTheme() {
    document.documentElement.dataset.theme = pref.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function applyFont() {
    document.documentElement.dataset.font = pref.get('font', 'ui');
    $('fontBtn').classList.toggle('on', pref.get('font', 'ui') === 'mono');
  }
  let zoom = Math.min(2.5, Math.max(0.6, parseFloat(pref.get('zoom', '1')) || 1));
  function applyZoom(show) {
    zoom = Math.round(Math.min(2.5, Math.max(0.6, zoom)) * 10) / 10;
    document.documentElement.style.setProperty('--zoom', zoom);
    $('zoomLbl').textContent = zoom === 1 ? '' : Math.round(zoom * 100) + '%';
    pref.set('zoom', zoom);
    editors.forEach(e => e.refresh());
    if (show) toast(`Teksta izmērs: ${Math.round(zoom * 100)}%`);
  }
  let view = VIEWS.includes(pref.get('view', 'medium')) ? pref.get('view', 'medium') : 'medium';
  function applyView() {
    $('cards').className = 'cards v-' + view;
    document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    pref.set('view', view);
  }
  applyTheme();
  applyFont();
  applyZoom(false);
  applyView();
  $('themeBtn').onclick = () => {
    pref.set('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    applyTheme();
  };
  $('viewSeg').onclick = e => {
    const b = e.target.closest('button');
    if (b) { view = b.dataset.v; applyView(); }
  };

  /* ================= loga pogas (logs bez rāmja) ================= */
  const win = Store.win;
  async function syncMaxIcon() {
    if (!win) return;
    try { $('wMax').innerHTML = (await win.isMaximized()) ? ICON.restore : ICON.max; } catch (e) { }
  }
  $('wMin').onclick = () => win && win.minimize();
  $('wMax').onclick = () => win && win.toggleMaximize();
  $('wClose').onclick = async () => {
    try { await flushSave(); } catch (e) { }
    if (win) win.close(); else window.close();
  };
  if (win) { win.onResized(syncMaxIcon); syncMaxIcon(); }

  /* ================= palīgi ================= */
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function ago(ts) {
    if (!ts) return '';
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'tikko';
    if (s < 3600) return `pirms ${Math.floor(s / 60)} min`;
    if (s < 86400) return `pirms ${Math.floor(s / 3600)} h`;
    if (s < 172800) return 'vakar';
    if (s < 7 * 86400) return `pirms ${Math.floor(s / 86400)} d`;
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }
  function plainText(html, limit = 260) {
    const t = document.createElement('template');
    t.innerHTML = html || '';
    t.content.querySelectorAll('.cblock-head, .cb-copy, .hover-ring, img').forEach(x => x.remove());
    t.content.querySelectorAll('br').forEach(b => b.replaceWith(String.fromCharCode(10)));
    const parts = [];
    const walk = el => {
      for (const ch of el.childNodes) {
        if (ch.nodeType === 1 && ch.matches('div,p,h1,h2,h3,li,pre,ul,ol,.cblock')) {
          if (ch.matches('ul,ol,.cblock')) walk(ch);
          else { const s = ch.textContent.trim(); if (s) parts.push((ch.tagName === 'LI' ? '• ' : '') + s); }
        } else if (ch.textContent.trim()) parts.push(ch.textContent.trim());
        if (parts.join('\n').length > limit) return;
      }
    };
    walk(t.content);
    return parts.join('\n').slice(0, limit);
  }
  function nbText(nb) {
    for (const tab of nb.tabs) { const s = plainText(tab.html); if (s) return s; }
    return '';
  }
  function logoHTML(nb, cls) {
    if (nb.logo) return `<div class="${cls}"><img src="${nb.logo}" alt=""></div>`;
    const letter = Editor.esc((nb.title || '?').trim().charAt(0).toUpperCase() || '?');
    return `<div class="${cls}">${letter}</div>`;
  }
  function readLogo(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        if (file.type === 'image/svg+xml') return res(fr.result);
        const img = new Image();
        img.onload = () => {
          const S = 160, c = document.createElement('canvas');
          const k = Math.min(1, S / Math.max(img.width, img.height));
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/png'));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function pickFile(input) {
    return new Promise(res => {
      input.value = '';
      input.onchange = () => res(input.files[0] || null);
      input.click();
    });
  }
  const safeName = s => (s || 'piezime').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 80) || 'piezime';

  /* ================= modālis ================= */
  function modal({ title, body = '', input = null, ok = 'Labi', danger = false, cancel = true }) {
    return new Promise(res => {
      $('modalTitle').textContent = title;
      $('modalBody').innerHTML = body;
      let inp = null;
      if (input !== null) {
        inp = document.createElement('input');
        inp.type = 'text';
        inp.value = input;
        $('modalBody').appendChild(inp);
      }
      const okB = $('modalOk'), cB = $('modalCancel');
      okB.textContent = ok;
      okB.className = 'btn ' + (danger ? 'danger' : 'primary');
      cB.style.display = cancel ? '' : 'none';
      $('modal').classList.remove('hidden');
      setTimeout(() => (inp ? (inp.focus(), inp.select()) : okB.focus()), 20);
      const done = v => {
        $('modal').classList.add('hidden');
        okB.onclick = cB.onclick = null;
        document.removeEventListener('keydown', key, true);
        res(v);
      };
      const key = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); }
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(inp ? inp.value.trim() : true); }
      };
      document.addEventListener('keydown', key, true);
      okB.onclick = () => done(inp ? inp.value.trim() : true);
      cB.onclick = () => done(null);
    });
  }

  /* ================= konteksta izvēlne ================= */
  const ctx = $('ctxMenu');
  function menu(x, y, items) {
    ctx.innerHTML = '';
    items.forEach(it => {
      if (it === '-') { ctx.appendChild(document.createElement('hr')); return; }
      if (it.title) { const d = document.createElement('div'); d.className = 'ctx-label'; d.textContent = it.title; ctx.appendChild(d); return; }
      if (it.colors) {
        const row = document.createElement('div');
        row.className = 'colors';
        it.colors.forEach(c => {
          const b = document.createElement('button');
          b.style.background = c;
          if (c === it.current) b.className = 'on';
          b.onclick = () => { hideMenu(); it.pick(c); };
          row.appendChild(b);
        });
        ctx.appendChild(row);
        return;
      }
      const b = document.createElement('button');
      b.innerHTML = (it.icon || '') + `<span>${it.label}</span>`;
      if (it.danger) b.className = 'danger';
      b.onclick = () => { hideMenu(); it.action(); };
      ctx.appendChild(b);
    });
    ctx.classList.remove('hidden');
    const r = ctx.getBoundingClientRect();
    ctx.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 8)) + 'px';
    ctx.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  }
  function hideMenu() { ctx.classList.add('hidden'); }
  document.addEventListener('mousedown', e => {
    if (!ctx.contains(e.target)) hideMenu();
    if (!e.target.closest('.dd')) document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
  });

  /* ================= SĀKUMA EKRĀNS ================= */
  async function loadAll() {
    try { notebooks = await Store.list(); }
    catch (e) { notebooks = []; toast('Neizdevās ielādēt: ' + e); }
    notebooks.forEach(nb => { if (!nb.tabs || !nb.tabs.length) nb.tabs = [{ id: uid(), title: 'Piezīmes', html: '' }]; });
    renderHome();
  }

  function renderHome() {
    const q = current ? '' : $('search').value.trim().toLowerCase();
    const sort = $('sortSel').value;
    let list = notebooks.slice();
    if (q) {
      list = list.filter(nb => (nb.title || '').toLowerCase().includes(q) ||
        nb.tabs.some(t => (t.title || '').toLowerCase().includes(q) || plainText(t.html, 1e6).toLowerCase().includes(q)));
    }
    list.sort((a, b) => sort === 'title' ? (a.title || '').localeCompare(b.title || '', 'lv')
      : sort === 'created' ? (b.created || 0) - (a.created || 0)
        : (b.updated || 0) - (a.updated || 0));

    const box = $('cards');
    box.innerHTML = '';
    if (!q) {
      const add = document.createElement('div');
      add.className = 'card new';
      add.innerHTML = `<div class="plus">${ICON.plus}</div><div>Jauna piezīme</div>`;
      add.onclick = newNotebook;
      box.appendChild(add);
    }
    list.forEach(nb => box.appendChild(cardEl(nb)));
    if (q && !list.length) box.innerHTML = `<div class="empty-state">Nekas netika atrasts pēc “${Editor.esc(q)}”</div>`;
    const n = notebooks.length;
    $('countLbl').textContent = `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'piezīme' : 'piezīmes'}`;
  }

  function cardEl(nb) {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.setProperty('--c', nb.color || CARD_COLORS[0]);
    const copiedRecently = nb.lastCopied && Date.now() - nb.lastCopied < 24 * 3600e3;
    if (copiedRecently) el.classList.add('copied');
    const prev = nbText(nb);
    el.innerHTML = `
      <div class="card-top">
        ${logoHTML(nb, 'card-logo')}
        <div class="card-title">${Editor.esc(nb.title || 'Bez nosaukuma')}</div>
        <button class="icon-btn card-menu" title="Darbības">${ICON.dots}</button>
      </div>
      <div class="card-preview ${prev ? '' : 'empty'}">${prev ? Editor.esc(prev) : 'Tukšs – klikšķini, lai sāktu rakstīt'}</div>
      <div class="card-foot">
        <span class="pill tabs-pill" title="${nb.tabs.length} ${nb.tabs.length % 10 === 1 && nb.tabs.length % 100 !== 11 ? 'cilne' : 'cilnes'}: ${Editor.esc(nb.tabs.map(t => t.title).join(', '))}"><svg viewBox="0 0 24 24"><path d="M3 20V8a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9"/><path d="M3 20h18"/></svg>${nb.tabs.length}</span>
        ${copiedRecently ? `<span class="pill copied" title="No šīs piezīmes nesen kopēts teksts">Kopēts ${ago(nb.lastCopied)}</span>` : ''}
        <span class="grow"></span>
        <span title="Pēdējās izmaiņas">${ago(nb.updated)}</span>
      </div>
      ${nb._unsaved ? '<span class="dot" title="Nav saglabāts"></span>' : ''}`;
    el.onclick = e => {
      const mb = e.target.closest('.card-menu');
      if (mb) { const r = mb.getBoundingClientRect(); cardMenu(nb, r.left, r.bottom + 4); return; }
      openNotebook(nb);
    };
    el.oncontextmenu = e => { e.preventDefault(); cardMenu(nb, e.clientX, e.clientY); };
    return el;
  }

  function cardMenu(nb, x, y) {
    menu(x, y, [
      { label: 'Atvērt', icon: ICON.open, action: () => openNotebook(nb) },
      { label: 'Pārsaukt', icon: ICON.edit, action: () => renameNotebook(nb) },
      { label: 'Mainīt logotipu…', icon: ICON.img, action: () => changeLogo(nb) },
      ...(nb.logo ? [{ label: 'Noņemt logotipu', icon: ICON.x, action: () => { nb.logo = null; persist(nb); renderHome(); } }] : []),
      { colors: CARD_COLORS, current: nb.color, pick: c => { nb.color = c; persist(nb); renderHome(); } },
      '-',
      { label: 'Eksportēt .md', icon: ICON.md, action: () => exportNote(nb, 'all', 'md') },
      { label: 'Eksportēt .txt', icon: ICON.txt, action: () => exportNote(nb, 'all', 'txt') },
      { label: 'Dublēt', icon: ICON.copy, action: () => duplicateNotebook(nb) },
      { label: 'Datu mape', icon: ICON.folder, action: async () => modal({ title: 'Dati glabājas šeit', body: `<p style="user-select:all;word-break:break-all">${Editor.esc(await Store.dataDir())}</p>`, cancel: false }) },
      '-',
      { label: 'Dzēst', icon: ICON.trash, danger: true, action: () => deleteNotebook(nb) }
    ]);
  }

  async function newNotebook() {
    const title = await modal({ title: 'Jauna piezīme', body: '<p style="margin-bottom:10px">Projekta / piezīmes nosaukums:</p>', input: '', ok: 'Izveidot' });
    if (!title) return;
    if (current) await closeNotebook(true);
    const nb = {
      id: uid(), title, color: CARD_COLORS[notebooks.length % CARD_COLORS.length], logo: null,
      created: Date.now(), updated: Date.now(), lastCopied: 0,
      tabs: [{ id: uid(), title: 'Piezīmes', html: '' }]
    };
    nb.activeTab = nb.tabs[0].id;
    notebooks.push(nb);
    await persist(nb);
    openNotebook(nb);
  }
  async function renameNotebook(nb) {
    const t = await modal({ title: 'Pārsaukt piezīmi', input: nb.title, ok: 'Saglabāt' });
    if (!t) return;
    nb.title = t;
    nb.updated = Date.now();
    await persist(nb);
    if (current === nb) renderNbHead(); else renderHome();
  }
  async function changeLogo(nb) {
    const f = await pickFile($('fileLogo'));
    if (!f) return;
    nb.logo = await readLogo(f);
    await persist(nb);
    if (current === nb) renderNbHead(); else renderHome();
  }
  async function duplicateNotebook(nb) {
    const copy = JSON.parse(JSON.stringify(nb));
    copy.id = uid();
    copy.title = nb.title + ' (kopija)';
    copy.created = copy.updated = Date.now();
    copy.tabs.forEach(t => t.id = uid());
    copy.activeTab = copy.tabs[0].id;
    notebooks.push(copy);
    await persist(copy);
    renderHome();
  }
  async function deleteNotebook(nb) {
    const ok = await modal({ title: 'Dzēst piezīmi?', body: `<p>“${Editor.esc(nb.title)}” tiks pārvietota uz atkritni (mape <b>_trash</b> datu mapē).</p>`, ok: 'Dzēst', danger: true });
    if (!ok) return;
    await Store.remove(nb.id);
    notebooks = notebooks.filter(n => n !== nb);
    renderHome();
  }
  function cleanCopy(nb) {
    const data = {};
    Object.keys(nb).forEach(k => { if (!k.startsWith('_')) data[k] = nb[k]; });
    data.tabs = nb.tabs.map(({ id, title, html }) => ({ id, title, html }));
    return data;
  }
  async function persist(nb) {
    try { await Store.save(cleanCopy(nb)); }
    catch (e) { toast('Neizdevās saglabāt: ' + e); }
  }

  $('newNotebookBtn').onclick = newNotebook;
  $('sortSel').value = pref.get('sort', 'updated');
  $('sortSel').onchange = () => { pref.set('sort', $('sortSel').value); renderHome(); };

  /* ================= PIEZĪME ================= */
  function setMode(nb) {
    document.body.className = nb ? 'mode-nb' : 'mode-home';
    $('search').value = '';
    $('search').placeholder = nb ? 'Meklēt šajā cilnē…  (Ctrl+F)' : 'Meklēt piezīmēs…  (Ctrl+F)';
    $('fCount').textContent = '';
    clearFind();
  }

  function openNotebook(nb) {
    current = nb;
    if (!nb.tabs.find(t => t.id === nb.activeTab)) nb.activeTab = nb.tabs[0].id;
    $('home').classList.add('hidden');
    $('notebook').classList.remove('hidden');
    setMode(nb);
    renderNbHead();
    switchTab(nb.activeTab);
  }

  async function closeNotebook(silent) {
    const nb = current;
    const p = flushSave();
    editors.forEach(ed => ed.destroy());
    editors.clear();
    $('editorWrap').innerHTML = '';
    current = null;
    $('notebook').classList.add('hidden');
    $('home').classList.remove('hidden');
    setMode(null);
    if (!silent) renderHome();
    await p;
    if (!silent && !current) renderHome();
    return nb;
  }
  $('backBtn').onclick = () => closeNotebook();

  function renderNbHead() {
    const nb = current;
    const t = $('nbTitle');
    t.style.setProperty('--c', nb.color || CARD_COLORS[0]);
    t.innerHTML = logoHTML(nb, 'mini-logo') + `<span>${Editor.esc(nb.title)}</span>`;
    t.onclick = () => renameNotebook(nb);
    t.oncontextmenu = e => {
      e.preventDefault();
      menu(e.clientX, e.clientY, [
        { label: 'Pārsaukt', icon: ICON.edit, action: () => renameNotebook(nb) },
        { label: 'Mainīt logotipu…', icon: ICON.img, action: () => changeLogo(nb) },
        { colors: CARD_COLORS, current: nb.color, pick: c => { nb.color = c; persist(nb); renderNbHead(); } }
      ]);
    };
    renderTabs();
  }

  let dragTab = null;
  function renderTabs() {
    const box = $('tabs');
    box.innerHTML = '';
    current.tabs.forEach(tab => {
      const el = document.createElement('div');
      el.className = 'tab' + (tab.id === current.activeTab ? ' active' : '') + (tab._unsaved ? ' unsaved' : '');
      el.dataset.id = tab.id;
      el.draggable = true;
      el.innerHTML = `<span class="tab-name">${Editor.esc(tab.title || 'Cilne')}</span><button class="tab-x" title="Aizvērt (dzēst) cilni"><span class="dot"></span>${ICON.x}</button>`;
      el.title = 'Dubultklikšķis – pārsaukt';
      el.onclick = e => {
        if (e.target.closest('.tab-x')) { deleteTab(tab); return; }
        if (tab.id !== current.activeTab) switchTab(tab.id);
      };
      el.ondblclick = e => { if (!e.target.closest('.tab-x')) renameTabInline(el, tab); };
      el.onauxclick = e => { if (e.button === 1) deleteTab(tab); };
      el.oncontextmenu = e => {
        e.preventDefault();
        menu(e.clientX, e.clientY, [
          { label: 'Pārsaukt', icon: ICON.edit, action: () => renameTabInline(el, tab) },
          { label: 'Dublēt cilni', icon: ICON.copy, action: () => duplicateTab(tab) },
          { label: 'Eksportēt cilni .md', icon: ICON.md, action: () => exportNote(current, tab, 'md') },
          { label: 'Eksportēt cilni .txt', icon: ICON.txt, action: () => exportNote(current, tab, 'txt') },
          '-',
          { label: 'Dzēst cilni', icon: ICON.trash, danger: true, action: () => deleteTab(tab) }
        ]);
      };
      el.ondragstart = e => { dragTab = tab; e.dataTransfer.effectAllowed = 'move'; };
      el.ondragover = e => { if (dragTab) { e.preventDefault(); el.classList.add('drag-over'); } };
      el.ondragleave = () => el.classList.remove('drag-over');
      el.ondrop = e => {
        e.preventDefault();
        el.classList.remove('drag-over');
        if (!dragTab || dragTab === tab) return;
        const arr = current.tabs;
        arr.splice(arr.indexOf(dragTab), 1);
        arr.splice(arr.indexOf(tab), 0, dragTab);
        dragTab = null;
        scheduleSave();
        renderTabs();
      };
      el.ondragend = () => { dragTab = null; };
      box.appendChild(el);
    });
    const act = box.querySelector('.tab.active');
    if (act) act.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function paintUnsaved() {
    if (!current) return;
    document.querySelectorAll('#tabs .tab').forEach(el => {
      const t = current.tabs.find(x => x.id === el.dataset.id);
      el.classList.toggle('unsaved', !!(t && t._unsaved));
    });
    const st = $('stSaved');
    st.classList.toggle('dirty', !!current._unsaved);
    st.innerHTML = current._unsaved ? '<span class="dot"></span>Saglabā…' : 'Saglabāts';
  }

  function renameTabInline(el, tab) {
    const name = el.querySelector('.tab-name');
    if (!name) return;
    const inp = document.createElement('input');
    inp.value = tab.title;
    name.replaceWith(inp);
    inp.focus();
    inp.select();
    let done = false;
    const finish = save => {
      if (done) return;
      done = true;
      if (save && inp.value.trim()) { tab.title = inp.value.trim(); scheduleSave(); }
      renderTabs();
    };
    inp.onkeydown = e => {
      e.stopPropagation();
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    };
    inp.onblur = () => finish(true);
    inp.onclick = e => e.stopPropagation();
    inp.ondblclick = e => e.stopPropagation();
  }

  function addTab() {
    const tab = { id: uid(), title: `Cilne ${current.tabs.length + 1}`, html: '' };
    current.tabs.push(tab);
    switchTab(tab.id);
    scheduleSave();
    const el = [...$('tabs').children].pop();
    if (el) renameTabInline(el, tab);
  }
  $('addTabBtn').onclick = addTab;

  function duplicateTab(tab) {
    syncTab(tab);
    const copy = { id: uid(), title: tab.title + ' (kopija)', html: tab.html };
    current.tabs.splice(current.tabs.indexOf(tab) + 1, 0, copy);
    switchTab(copy.id);
    scheduleSave();
  }

  async function deleteTab(tab) {
    syncTab(tab);
    if (plainText(tab.html) || /<img/.test(tab.html)) {
      const ok = await modal({ title: 'Dzēst cilni?', body: `<p>Cilne “${Editor.esc(tab.title)}” un tās saturs tiks dzēsts.</p>`, ok: 'Dzēst', danger: true });
      if (!ok) return;
    }
    const i = current.tabs.indexOf(tab);
    current.tabs.splice(i, 1);
    const ed = editors.get(tab.id);
    if (ed) { ed.destroy(); ed.page.remove(); editors.delete(tab.id); }
    if (!current.tabs.length) current.tabs.push({ id: uid(), title: 'Piezīmes', html: '' });
    if (current.activeTab === tab.id) switchTab(current.tabs[Math.max(0, i - 1)].id);
    else renderTabs();
    scheduleSave();
  }

  function editorFor(tab) {
    let ed = editors.get(tab.id);
    if (ed) return ed;
    const nb = current;
    ed = Editor.create(tab.html, {
      onChange: () => { tab._dirty = true; tab._unsaved = true; scheduleSave(); },
      onCopied: () => { nb.lastCopied = Date.now(); scheduleSave(true); },
      onStats: s => { if (current && current.activeTab === tab.id) showStats(s); }
    });
    editors.set(tab.id, ed);
    $('editorWrap').appendChild(ed.page);
    return ed;
  }

  function switchTab(id) {
    const tab = current.tabs.find(t => t.id === id);
    if (!tab) return;
    if (current.activeTab !== id) { current.activeTab = id; scheduleSave(true); }
    const ed = editorFor(tab);
    editors.forEach(e => e.page.classList.toggle('active', e === ed));
    Editor.active = ed;
    renderTabs();
    ed.refresh();
    setTimeout(() => ed.focus(), 0);
    if ($('search').value) runFind();
  }

  function syncTab(tab) {
    const ed = editors.get(tab.id);
    if (ed) tab.html = ed.html();
    tab._dirty = false;
  }

  /* --- automātiskā saglabāšana; oranžā bumbiņa = izmaiņas vēl nav ierakstītas diskā --- */
  function scheduleSave(quiet) {
    if (!current) return;
    current._rev = (current._rev || 0) + 1;
    if (!quiet) { current._unsaved = true; paintUnsaved(); }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 600);
  }
  function flushSave() {
    clearTimeout(saveTimer);
    const nb = current;
    if (!nb) return Promise.resolve();
    let content = false;
    nb.tabs.forEach(t => { if (t._dirty) content = true; syncTab(t); });
    if (content) nb.updated = Date.now();
    const rev = nb._rev;
    return Store.save(cleanCopy(nb)).then(() => {
      if (nb._rev === rev) {
        nb._unsaved = false;
        nb.tabs.forEach(t => { t._unsaved = false; });
      }
      if (current === nb) paintUnsaved();
    }).catch(e => {
      nb._unsaved = true;
      toast('Neizdevās saglabāt: ' + e);
    });
  }
  window.addEventListener('beforeunload', () => { flushSave(); });

  function showStats(s) {
    $('stLines').textContent = `Rinda ${s.cur > 0 ? s.cur : '–'} / ${s.lines}`;
    $('stWords').textContent = `${s.words} vārdi`;
    $('stChars').textContent = `${s.chars} rakstzīmes`;
  }

  /* ================= eksports ================= */
  async function exportNote(nb, scope, ext) {
    if (nb === current) nb.tabs.forEach(syncTab);
    const md = ext === 'md';
    const ctxE = { md, images: [] };
    let content = '', name;
    if (scope && scope !== 'all') {
      content = Exporter.convert(scope.html, md, ctxE).text;
      name = `${nb.title} - ${scope.title}`;
    } else {
      name = nb.title;
      const multi = nb.tabs.length > 1;
      content = md ? `# ${nb.title}\n\n` : `${nb.title}\n${'='.repeat(Math.min(60, nb.title.length))}\n\n`;
      nb.tabs.forEach(t => {
        if (multi) content += md ? `## ${t.title}\n\n` : `--- ${t.title} ---\n\n`;
        content += Exporter.convert(t.html, md, ctxE).text.trim() + '\n\n';
      });
    }
    content = content.replace(/\s+$/, '') + '\n';
    try {
      const path = await Store.exportFile(`${safeName(name)}.${ext}`, ext, content, ctxE.images);
      if (path) toast(`Eksportēts: ${path}` + (ctxE.images.length ? ` (+${ctxE.images.length} attēli)` : ''));
    } catch (e) { toast('Eksports neizdevās: ' + e); }
  }
  $('exportBtn').onclick = () => {
    const r = $('exportBtn').getBoundingClientRect();
    const tab = current.tabs.find(t => t.id === current.activeTab);
    menu(r.left - 120, r.bottom + 4, [
      { title: `Visa piezīme (${current.tabs.length} ${current.tabs.length === 1 ? 'cilne' : 'cilnes'})` },
      { label: 'Markdown (.md)', icon: ICON.md, action: () => exportNote(current, 'all', 'md') },
      { label: 'Teksts (.txt)', icon: ICON.txt, action: () => exportNote(current, 'all', 'txt') },
      '-',
      { title: `Tikai cilne “${tab.title}”` },
      { label: 'Markdown (.md)', icon: ICON.md, action: () => exportNote(current, tab, 'md') },
      { label: 'Teksts (.txt)', icon: ICON.txt, action: () => exportNote(current, tab, 'txt') }
    ]);
  };

  /* ================= rīkjosla ================= */
  document.addEventListener('selectionchange', () => {
    const ed = Editor.active;
    if (!ed || !current) return;
    const r = Editor.rangeIn(ed.ed);
    if (!r) return;
    savedRange = r.cloneRange();
    ed.updateCurrent();
    showStats(lastStatsFor(ed));
    updateToolbarState(r);
  });
  function lastStatsFor(ed) {
    const cur = ed.page.querySelector('.gutter .cur');
    const spans = [...ed.page.querySelector('.gutter').children];
    const t = ed.ed.innerText || '';
    return { lines: spans.length, words: (t.match(/[^\s]+/g) || []).length, chars: t.replace(/\n/g, '').length, cur: cur ? spans.indexOf(cur) + 1 : 0 };
  }
  function updateToolbarState(r) {
    document.querySelectorAll('#toolbar [data-cmd]').forEach(b => {
      try { b.classList.toggle('on', document.queryCommandState(b.dataset.cmd)); } catch (e) { }
    });
    const blk = Editor.closest(r.startContainer, 'h1,h2,h3', Editor.active.ed);
    $('blockSel').value = blk ? blk.tagName.toLowerCase() : 'div';
    const list = Editor.closest(r.startContainer, 'ul,ol', Editor.active.ed);
    const kind = !list ? '' : list.tagName === 'OL' ? (list.classList.contains('alpha') || list.classList.contains('alpha-up') ? 'ola' : 'ol') : (list.classList.contains('check') ? 'check' : 'ul');
    document.querySelectorAll('#toolbar [data-act]').forEach(b => {
      if (['ul', 'ol', 'ola', 'check'].includes(b.dataset.act)) b.classList.toggle('on', b.dataset.act === kind);
    });
  }
  function restoreSel() {
    const ed = Editor.active;
    if (!ed) return false;
    if (savedRange && ed.ed.contains(savedRange.commonAncestorContainer)) {
      const node = savedRange.startContainer.nodeType === 3 ? savedRange.startContainer.parentNode : savedRange.startContainer;
      const host = node.closest('[contenteditable="true"]') || ed.ed;
      host.focus({ preventScroll: true });
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(savedRange);
    } else ed.focus();
    return true;
  }

  $('toolbar').addEventListener('mousedown', e => {
    if (e.target.closest('button') && !e.target.closest('input')) e.preventDefault();
  });
  $('toolbar').addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b || !Editor.active) return;
    const ed = Editor.active;
    if (b.dataset.cmd) {
      restoreSel();
      Editor.exec(b.dataset.cmd);
      ed.api.changed();
      return;
    }
    if (b.dataset.dd) {
      const dd = b.parentNode;
      const open = dd.classList.contains('open');
      document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
      if (!open) dd.classList.add('open');
      return;
    }
    const act = b.dataset.act;
    if (!act) return;
    if (act === 'font') {
      pref.set('font', pref.get('font', 'ui') === 'mono' ? 'ui' : 'mono');
      applyFont();
      editors.forEach(x => x.refresh());
      return;
    }
    if (act === 'image') {
      restoreSel();
      const keep = savedRange && savedRange.cloneRange();
      const f = await pickFile($('fileImg'));
      if (!f) return;
      savedRange = keep;
      restoreSel();
      ed.api.insertImageFile(f);
      return;
    }
    restoreSel();
    if (['ul', 'ol', 'ola', 'check'].includes(act)) ed.api.list(act);
    else if (act === 'inlinecode') ed.api.inlineCode();
    else if (act === 'code' || act === 'cmd') ed.api.insertCblock(act);
    else if (act === 'hr') { Editor.exec('insertHorizontalRule'); ed.api.changed(); }
  });
  $('blockSel').addEventListener('change', () => {
    restoreSel();
    Editor.exec('formatBlock', $('blockSel').value);
    Editor.active && Editor.active.api.changed();
  });

  /* krāsas */
  const SENT_FORE = '#010203';
  function setColor(kind, color) {
    if (!restoreSel()) return;
    Editor.exec('styleWithCSS', true);
    if (kind === 'fore') {
      Editor.exec('foreColor', color || SENT_FORE);
      if (!color) Editor.active.ed.querySelectorAll('[style*="color"]').forEach(el => {
        if (el.style.color === 'rgb(1, 2, 3)') { el.style.removeProperty('color'); unwrapIfBare(el); }
      });
      else { lastFore = color; $('foreSwatch').style.background = color; }
    } else {
      Editor.exec('hiliteColor', color || 'transparent');
      if (!color) Editor.active.ed.querySelectorAll('[style*="background"]').forEach(el => {
        const bg = el.style.backgroundColor;
        if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') { el.style.removeProperty('background-color'); unwrapIfBare(el); }
      });
      else { lastBack = color; $('backSwatch').style.background = color; }
    }
    document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
    Editor.active.api.changed();
  }
  function unwrapIfBare(el) {
    if (!el.getAttribute('style')) el.removeAttribute('style');
    if (el.tagName === 'SPAN' && !el.attributes.length) el.replaceWith(...el.childNodes);
  }
  function buildPalette(id, colors, kind) {
    const box = $(id);
    box.innerHTML = '<div class="sw-grid"></div><div class="pal-row"><button class="none">Bez krāsas</button><input type="color" title="Cita krāsa"></div>';
    const grid = box.querySelector('.sw-grid');
    colors.forEach(c => {
      const b = document.createElement('button');
      b.className = 'sw';
      b.style.background = c;
      b.title = c;
      b.onclick = () => setColor(kind, c);
      grid.appendChild(b);
    });
    box.querySelector('.none').onclick = () => setColor(kind, null);
    const inp = box.querySelector('input');
    inp.addEventListener('mousedown', e => e.stopPropagation());
    inp.addEventListener('change', () => {
      let c = inp.value;
      if (kind === 'back') { const n = parseInt(c.slice(1), 16); c = `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},.45)`; }
      setColor(kind, c);
    });
  }
  buildPalette('forePal', FORE, 'fore');
  buildPalette('backPal', BACK, 'back');
  $('foreSwatch').style.background = lastFore;
  $('backSwatch').style.background = lastBack;

  /* ================= meklēšana: sākumā – filtrē kartiņas, piezīmē – meklē cilnē ================= */
  let findRanges = [], findIdx = 0;
  function clearFind() {
    findRanges = [];
    if (window.CSS && CSS.highlights) { CSS.highlights.delete('np-find'); CSS.highlights.delete('np-find-cur'); }
  }
  function runFind() {
    findRanges = [];
    const q = $('search').value.toLowerCase();
    const ed = Editor.active && Editor.active.ed;
    if (q && ed) {
      const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.parentNode.closest('button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      let n;
      while ((n = w.nextNode())) {
        const t = n.textContent.toLowerCase();
        let i = t.indexOf(q);
        while (i >= 0) {
          const r = document.createRange();
          r.setStart(n, i); r.setEnd(n, i + q.length);
          findRanges.push(r);
          i = t.indexOf(q, i + q.length);
        }
      }
    }
    findIdx = Math.min(findIdx, Math.max(0, findRanges.length - 1));
    paintFind();
  }
  function paintFind() {
    $('fCount').textContent = $('search').value ? (findRanges.length ? `${findIdx + 1}/${findRanges.length}` : '0') : '';
    if (!(window.CSS && CSS.highlights)) return;
    if (!findRanges.length) { clearFind(); return; }
    CSS.highlights.set('np-find', new Highlight(...findRanges));
    const cur = findRanges[findIdx];
    CSS.highlights.set('np-find-cur', new Highlight(cur));
    const page = Editor.active.page;
    const rr = cur.getBoundingClientRect(), pr = page.getBoundingClientRect();
    if (rr.top < pr.top + 30 || rr.bottom > pr.bottom - 30) page.scrollTop += rr.top - pr.top - pr.height / 3;
  }
  function stepFind(d) {
    if (!findRanges.length) return;
    findIdx = (findIdx + d + findRanges.length) % findRanges.length;
    paintFind();
  }
  function selectFound() {
    const r = findRanges[findIdx];
    if (!r || !Editor.active) return;
    (r.startContainer.parentNode.closest('[contenteditable="true"]') || Editor.active.ed).focus();
    getSelection().removeAllRanges();
    getSelection().addRange(r);
  }
  $('search').addEventListener('input', () => {
    if (current) { findIdx = 0; runFind(); } else renderHome();
  });
  $('search').addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      const had = $('search').value;
      $('search').value = '';
      if (current) { if (had) selectFound(); clearFind(); $('fCount').textContent = ''; if (!had) Editor.active && Editor.active.focus(); }
      else renderHome();
      return;
    }
    if (current && e.key === 'Enter') { e.preventDefault(); stepFind(e.shiftKey ? -1 : 1); }
  });
  $('fPrev').onclick = () => stepFind(-1);
  $('fNext').onclick = () => stepFind(1);

  /* ================= Ctrl + peles ritulis ================= */
  document.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    if (current) { zoom += dir * 0.1; applyZoom(true); }
    else {
      const i = Math.min(VIEWS.length - 1, Math.max(0, VIEWS.indexOf(view) + dir));
      if (VIEWS[i] !== view) { view = VIEWS[i]; applyView(); }
    }
  }, { passive: false });

  /* ================= globālie īsinājumtaustiņi ================= */
  document.addEventListener('keydown', e => {
    if (!$('modal').classList.contains('hidden')) return;
    const ctrl = (e.ctrlKey || e.metaKey) && !e.altKey;
    if (e.key === 'Escape') { hideMenu(); document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open')); }
    if (ctrl && e.code === 'KeyF') { e.preventDefault(); $('search').focus(); $('search').select(); if (current) runFind(); return; }
    if (!current) {
      if (ctrl && e.code === 'KeyN') { e.preventDefault(); newNotebook(); }
      return;
    }
    if (ctrl && e.code === 'KeyT') { e.preventDefault(); addTab(); }
    else if (ctrl && e.code === 'KeyS') { e.preventDefault(); flushSave().then(() => toast('Saglabāts')); }
    else if (ctrl && (e.code === 'Equal' || e.code === 'NumpadAdd')) { e.preventDefault(); zoom += 0.1; applyZoom(true); }
    else if (ctrl && (e.code === 'Minus' || e.code === 'NumpadSubtract')) { e.preventDefault(); zoom -= 0.1; applyZoom(true); }
    else if (ctrl && (e.code === 'Digit0' || e.code === 'Numpad0')) { e.preventDefault(); zoom = 1; applyZoom(true); }
    else if (ctrl && e.key === 'Tab') {
      e.preventDefault();
      const i = current.tabs.findIndex(t => t.id === current.activeTab);
      const n = current.tabs.length;
      switchTab(current.tabs[(i + (e.shiftKey ? -1 : 1) + n) % n].id);
    }
    else if (ctrl && e.shiftKey && e.code === 'KeyH') { e.preventDefault(); setColor('back', lastBack); }
    else if (e.altKey && !e.ctrlKey && e.key === 'ArrowLeft') { e.preventDefault(); closeNotebook(); }
  });

  setInterval(() => { if (!current) renderHome(); }, 60e3);

  loadAll();
})();
