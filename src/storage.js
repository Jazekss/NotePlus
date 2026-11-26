/* Datu glabāšana.
 * Tauri: katra grāmatiņa = JSON fails %APPDATA%\lv.noteplus.app\notebooks\<id>.json
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

  /** Eksports: Tauri – saglabāšanas dialogs; pārlūkā – lejupielāde (bez attēlu failiem) */
  async function exportFile(defaultName, ext, content, images) {
    if (tauri) return await tauri.invoke('export_note', { defaultName, ext, content, images });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content.replaceAll('{{IMGDIR}}', defaultName.replace(/\.\w+$/, '') + '_attēli')], { type: 'text/plain' }));
    a.download = defaultName;
    a.click();
    return defaultName;
  }

  const win = window.__TAURI__ && window.__TAURI__.window ? window.__TAURI__.window.getCurrentWindow() : null;

  return { list, save, remove, dataDir, exportFile, win, isTauri: !!tauri };
})();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
