/* HTML -> Markdown / vienkāršs teksts (eksportam un teksta bloku kopēšanai).
 * Attēliem: ctx.images saraksts; ceļā ievieto {{IMGDIR}}, ko Rust aizvieto ar īsto mapes nosaukumu. */
const Exporter = (() => {
  const NL = '\n';

  function wrap(s, mk) {
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[2] ? m[1] + mk + m[2] + mk + m[3] : s;
  }

  function imgRef(wrapEl, ctx) {
    const img = wrapEl.tagName === 'IMG' ? wrapEl : wrapEl.querySelector('img');
    if (!img || !ctx || !ctx.images) return ctx && ctx.md ? '' : '[attēls]';
    const m = (img.getAttribute('src') || '').match(/^data:image\/([a-z+]+);base64,(.*)$/i);
    if (!m) return '';
    const ext = m[1].toLowerCase().replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const name = `${ctx.images.length + 1}.${ext}`;
    ctx.images.push({ name, data: m[2] });
    const path = `{{IMGDIR}}/${name}`;
    return ctx.md ? `![${name}](<${path}>)` : `[Attēls: ${path}]`;
  }

  function inline(node, ctx) {
    let out = '';
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out += n.textContent.replace(/ /g, ' '); continue; }
      if (n.nodeType !== 1) continue;
      const tag = n.tagName;
      if (tag === 'BR') { out += NL; continue; }
      if (tag === 'UL' || tag === 'OL' || tag === 'svg' || tag === 'BUTTON') continue;
      if (n.classList.contains('img-wrap') || tag === 'IMG') { out += imgRef(n, ctx); continue; }
      if (tag === 'DIV' || tag === 'P') { if (out && !out.endsWith(NL)) out += NL; out += inline(n, ctx); continue; }
      let inner = inline(n, ctx);
      if (ctx.md) {
        const st = n.style;
        if (tag === 'CODE') inner = '`' + n.textContent + '`';
        else {
          if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || /line-through/.test(st.textDecoration || '')) inner = wrap(inner, '~~');
          if (tag === 'I' || tag === 'EM' || st.fontStyle === 'italic') inner = wrap(inner, '*');
          if (tag === 'B' || tag === 'STRONG' || st.fontWeight === 'bold' || +st.fontWeight >= 600) inner = wrap(inner, '**');
        }
      }
      out += inner;
    }
    return out;
  }

  function letter(i, upper) {
    let s = '';
    while (i > 0) { i--; s = String.fromCharCode(97 + (i % 26)) + s; i = Math.floor(i / 26); }
    return upper ? s.toUpperCase() : s;
  }

  function roman(n) {
    let s = '';
    [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']].forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } });
    return s;
  }

  function listLines(list, depth, ctx, out) {
    const isOl = list.tagName === 'OL';
    const check = list.classList.contains('check');
    let idx = +(list.getAttribute('start') || 1);
    const pad = '   '.repeat(depth);
    for (const ch of list.children) {
      if (ch.tagName === 'UL' || ch.tagName === 'OL') { listLines(ch, depth + 1, ctx, out); continue; }
      if (ch.tagName !== 'LI') continue;
      let mark;
      if (check) mark = (ctx.md ? '- ' : '') + (ch.classList.contains('done') ? '[x] ' : '[ ] ');
      else if (isOl) {
        const a = list.classList.contains('alpha') ? letter(idx, false) : list.classList.contains('alpha-up') ? letter(idx, true)
          : depth % 3 === 1 ? letter(idx, false) : depth % 3 === 2 ? roman(idx) : idx;
        mark = a + '. ';
      } else mark = '- ';
      idx++;
      const text = inline(ch, ctx).split(NL).join(NL + pad + ' '.repeat(mark.length));
      out.push({ k: 'list', s: pad + mark + text });
      ch.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => listLines(sub, depth + 1, ctx, out));
    }
  }

  function blocks(nodes, ctx) {
    const out = [];
    for (const el of nodes) {
      if (el.nodeType === 3) { if (el.textContent.trim()) out.push({ k: 'text', s: el.textContent }); continue; }
      if (el.nodeType !== 1) continue;
      const tag = el.tagName;
      if (el.classList.contains('cblock')) {
        const pre = el.querySelector('pre');
        let code = '';
        if (pre) {
          const c = pre.cloneNode(true);
          c.querySelectorAll('br').forEach(b => b.replaceWith(NL));
          c.querySelectorAll('div').forEach(d => d.before(NL));
          code = c.textContent.replace(/^\n/, '').replace(/\n$/, '');
        }
        if (ctx.md) out.push({ k: 'code', s: '```' + (el.dataset.kind === 'cmd' ? 'sh' : '') + NL + code + NL + '```' });
        else out.push({ k: 'code', s: code });
      } else if (tag === 'UL' || tag === 'OL') {
        listLines(el, 0, ctx, out);
      } else if (/^H[1-6]$/.test(tag)) {
        const t = inline(el, ctx).trim();
        out.push({ k: 'head', s: ctx.md ? '#'.repeat(+tag[1]) + ' ' + t : t });
      } else if (tag === 'HR') {
        out.push({ k: 'hr', s: ctx.md ? '---' : '----------' });
      } else {
        const t = inline(el, ctx);
        if (!t.trim()) out.push({ k: 'empty', s: '' });
        else t.split(NL).forEach(line => out.push({ k: 'text', s: line }));
      }
    }
    // salīmē rindas
    const lines = [];
    out.forEach((b, i) => {
      const prev = out[i - 1];
      if (ctx.md && prev && prev.k !== 'empty' && b.k !== 'empty' && (prev.k !== b.k || b.k === 'code' || b.k === 'head')) lines.push('');
      if (ctx.md && prev && prev.k === 'text' && b.k === 'text') lines[lines.length - 1] += '  ';
      lines.push(b.s);
    });
    return lines.join(NL).replace(/\n{3,}/g, NL + NL);
  }

  function htmlToNodes(html) {
    const t = document.createElement('template');
    t.innerHTML = html || '';
    return [...t.content.childNodes];
  }

  return {
    /** Teksts no redaktora elementiem (teksta bloka kopēšana) */
    nodesToText(nodes) { return blocks(nodes, { md: false }); },
    /** Viena cilne -> {text, images} */
    convert(html, md, ctx) {
      ctx = ctx || { md, images: [] };
      return { text: blocks(htmlToNodes(html), ctx), images: ctx.images };
    }
  };
})();
