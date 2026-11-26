/* Datu glabāšana.
 * Tauri: katra piezīme = JSON fails %APPDATA%\lv.noteplus.app\notebooks\<id>.json
 * Pārlūkā (testēšanai): localStorage. */
const Store = (() => {
  const tauri = window.__TAURI__ && window.__TAURI__.core;
  const LS = 'np_nb_';

  async function list() {
    if (tauri) return await tauri.invoke('list_notebooks');
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(LS)) {
        try { out.push(JSON.parse(localStorage.getItem(k))); } catch (e) { /* bojāts ieraksts */ }
      }
    }
    return out;
  }

  async function save(nb) {
    const data = JSON.stringify(nb);
    if (tauri) return await tauri.invoke('save_notebook', { id: nb.id, data });
    localStorage.setItem(LS + nb.id, data);
  }

  async function remove(id) {
    if (tauri) return await tauri.invoke('delete_notebook', { id });
    localStorage.removeItem(LS + id);
  }

  async function dataDir() {
    if (tauri) return await tauri.invoke('data_dir');
    return 'localStorage (pārlūka režīms)';
  }

  /** Kopīgie iestatījumi (kategorijas) */
  async function loadMeta() {
    try {
      const txt = tauri ? await tauri.invoke('load_meta') : localStorage.getItem('np_meta');
      return txt ? JSON.parse(txt) : {};
    } catch (e) { return {}; }
  }
  async function saveMeta(meta) {
    const data = JSON.stringify(meta);
    if (tauri) return await tauri.invoke('save_meta', { data });
    localStorage.setItem('np_meta', data);
  }

  /** Eksports: Tauri – saglabāšanas dialogs; pārlūkā – lejupielāde (bez attēlu failiem) */
  async function exportFile(defaultName, ext, content, images, label, imgSuffix) {
    if (tauri) return await tauri.invoke('export_note', { defaultName, ext, content, images, label, imgSuffix });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content.replaceAll('{{IMGDIR}}', defaultName.replace(/\.\w+$/, '') + '_' + imgSuffix)], { type: 'text/plain' }));
    a.download = defaultName;
    a.click();
    return defaultName;
  }

  const win = window.__TAURI__ && window.__TAURI__.window ? window.__TAURI__.window.getCurrentWindow() : null;

  return { list, save, remove, dataDir, loadMeta, saveMeta, exportFile, win, isTauri: !!tauri };
})();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
