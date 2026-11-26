/* Valodas: lv / en / ru. Sākotnēji – pēc sistēmas valodas, pēc tam – lietotāja izvēle. */
const I18n = (() => {
  const LANGS = {
    lv: { name: 'Latviešu', locale: 'lv-LV' },
    en: { name: 'English', locale: 'en-GB' },
    ru: { name: 'Русский', locale: 'ru-RU' }
  };

  const D = {
    lv: {
      'back': 'Uz sākumu (Alt+←)',
      'renameHint': 'Klikšķini, lai pārsauktu',
      'searchHome': 'Meklēt piezīmēs…  (Ctrl+F)',
      'searchTab': 'Meklēt šajā cilnē…  (Ctrl+F)',
      'findPrev': 'Iepriekšējais (Shift+Enter)',
      'findNext': 'Nākamais (Enter)',
      'export': 'Eksportēt (.md / .txt)',
      'theme': 'Gaišs / tumšs režīms',
      'language': 'Valoda',
      'newNote': 'Jauna piezīme (Ctrl+N)',
      'minimize': 'Minimizēt', 'maximize': 'Maksimizēt', 'close': 'Aizvērt',
      'sort': 'Kārtot', 'sortUpdated': 'pēc izmaiņām', 'sortTitle': 'pēc nosaukuma', 'sortCreated': 'pēc izveides',
      'view': 'Skats (arī Ctrl + peles ritulis)',
      'viewList': 'Saraksts', 'viewSmall': 'Mazas kartiņas', 'viewMedium': 'Vidējas kartiņas', 'viewLarge': 'Lielas kartiņas',
      'addCategory': 'Kategorija', 'addCategoryTitle': 'Jauna kategorija (piem., Darbs / Savi)',
      'blockStyle': 'Rindas stils', 'text': 'Teksts', 'h1': 'Virsraksts 1', 'h2': 'Virsraksts 2', 'h3': 'Virsraksts 3',
      'bold': 'Treknraksts (Ctrl+B)', 'italic': 'Slīpraksts (Ctrl+I)', 'underline': 'Pasvītrots (Ctrl+U)', 'strike': 'Pārsvītrots (Ctrl+Shift+X)',
      'foreColor': 'Teksta krāsa', 'backColor': 'Iekrāsot fonu (Ctrl+Shift+H)', 'clearFormat': 'Notīrīt formatējumu',
      'ul': 'Punkti (rindas sākumā: “- ”)', 'ol': 'Numurēts saraksts (rindas sākumā: “1. ”)', 'ola': 'Saraksts ar burtiem (rindas sākumā: “a. ”)',
      'check': 'Uzdevumu saraksts (rindas sākumā: “[] ”)', 'inlineCode': 'Kods rindā (Ctrl+E)',
      'codeBlock': 'Koda bloks (Ctrl+Shift+K vai “``` ”)', 'cmdBlock': 'Komandas bloks (Ctrl+Shift+M vai “$$ ”)',
      'image': 'Ievietot attēlu (vai ielīmē / ievelc)', 'hr': 'Atdalītājlīnija',
      'zoom': 'Teksta izmērs (Ctrl + peles ritulis, Ctrl+0 – atiestatīt)', 'font': 'Pamatteksta fonts: parasts / monospace',
      'newTab': 'Jauna cilne (Ctrl+T)', 'cancel': 'Atcelt', 'ok': 'Labi',
      'noColor': 'Bez krāsas', 'otherColor': 'Cita krāsa',
      'copy': 'Kopēt', 'copyBlock': 'Kopēt šo teksta bloku', 'copiedAgo': 'Nokopēts {0}', 'copiedToast': 'Nokopēts',
      'zoomToast': 'Teksta izmērs: {0}%',
      'newNoteCard': 'Jauna piezīme', 'emptyNote': 'Tukšs – klikšķini, lai sāktu rakstīt', 'actions': 'Darbības',
      'noResults': 'Nekas netika atrasts pēc “{0}”', 'untitled': 'Bez nosaukuma',
      'created': 'Izveidots {0}', 'updated': 'Mainīts {0}', 'unsaved': 'Nav saglabāts',
      'open': 'Atvērt', 'rename': 'Pārsaukt', 'changeLogo': 'Mainīt logotipu…', 'removeLogo': 'Noņemt logotipu',
      'exportMd': 'Eksportēt .md', 'exportTxt': 'Eksportēt .txt', 'duplicate': 'Dublēt', 'dataFolder': 'Datu mape',
      'delete': 'Dzēst', 'moveTo': 'Pārvietot uz', 'dataHere': 'Dati glabājas šeit',
      'newNoteTitle': 'Jauna piezīme', 'newNotePrompt': 'Projekta / piezīmes nosaukums:', 'create': 'Izveidot',
      'renameNote': 'Pārsaukt piezīmi', 'save': 'Saglabāt', 'copySuffix': ' (kopija)',
      'deleteNote': 'Dzēst piezīmi?', 'deleteNoteBody': '“{0}” tiks pārvietota uz atkritni (mape <b>_trash</b> datu mapē).',
      'defaultTab': 'Piezīmes', 'tabN': 'Cilne {0}', 'tabRenameHint': 'Dubultklikšķis – pārsaukt',
      'closeTab': 'Aizvērt (dzēst) cilni', 'duplicateTab': 'Dublēt cilni', 'exportTabMd': 'Eksportēt cilni .md',
      'exportTabTxt': 'Eksportēt cilni .txt', 'deleteTab': 'Dzēst cilni', 'deleteTabQ': 'Dzēst cilni?',
      'deleteTabBody': 'Cilne “{0}” un tās saturs tiks dzēsts.', 'clearCopied': 'Notīrīt kopēšanas atzīmes',
      'saving': 'Saglabā…', 'saved': 'Saglabāts', 'saveFailed': 'Neizdevās saglabāt: {0}', 'loadFailed': 'Neizdevās ielādēt: {0}',
      'line': 'Rinda {0} / {1}', 'words': '{0} vārdi', 'chars': '{0} rakstzīmes',
      'exportAll': 'Visa piezīme ({0})', 'exportOnlyTab': 'Tikai cilne “{0}”', 'markdown': 'Markdown (.md)', 'plainText': 'Teksts (.txt)',
      'exported': 'Eksportēts: {0}', 'exportedImgs': ' (+{0} attēli)', 'exportFailed': 'Eksports neizdevās: {0}',
      'imgFolder': 'attēli', 'image1': 'Attēls', 'txtLabel': 'Teksta fails',
      'uncategorized': 'Bez kategorijas', 'categoryName': 'Kategorijas nosaukums:', 'renameCategory': 'Pārsaukt kategoriju',
      'deleteCategory': 'Dzēst kategoriju', 'deleteCategoryQ': 'Dzēst kategoriju?',
      'deleteCategoryBody': 'Kategorija “{0}” tiks dzēsta, piezīmes paliks (pārvietosies uz “Bez kategorijas”).',
      'moveUp': 'Pārvietot augšup', 'moveDown': 'Pārvietot lejup', 'dropHere': 'Ievelc kartiņu šeit',
      'justNow': 'tikko', 'minAgo': 'pirms {0} min', 'hAgo': 'pirms {0} h', 'yesterday': 'vakar', 'dAgo': 'pirms {0} d',
      'backups': 'Kopijas', 'backupsTitle': 'Rezerves kopijas (Dokumenti\Note+\backups)',
      'backupNow': 'Izveidot kopiju tagad', 'backupFolder': 'Atvērt kopiju mapi', 'backupDone': 'Rezerves kopija izveidota',
      'backupEmpty': 'Nav ko kopēt – piezīmju nav', 'restore': 'Atjaunot', 'restoreQ': 'Atjaunot no rezerves kopijas?',
      'restoreBody': 'Tiks atjaunots stāvoklis no {0} ({1}). Pašreizējās piezīmes vispirms tiks saglabātas kā atsevišķa kopija.',
      'restored': 'Atjaunots: {0}', 'restoreFailed': 'Neizdevās atjaunot: {0}',
      'emptyFoundBackup': 'Piezīmes nav atrastas', 'emptyFoundBackupBody': 'Atrasta rezerves kopija no {0} ({1}). Atjaunot to?',
      'backups': 'Backups', 'backupsTitle': 'Backups (Documents\Note+\backups)',
      'backupNow': 'Back up now', 'backupFolder': 'Open backup folder', 'backupDone': 'Backup created',
      'backupEmpty': 'Nothing to back up – no notes', 'restore': 'Restore', 'restoreQ': 'Restore from backup?',
      'restoreBody': 'The state from {0} ({1}) will be restored. Your current notes are saved as a separate backup first.',
      'restored': 'Restored: {0}', 'restoreFailed': 'Could not restore: {0}',
      'emptyFoundBackup': 'No notes found', 'emptyFoundBackupBody': 'A backup from {0} ({1}) was found. Restore it?',
      'tabs': n => n % 10 === 1 && n % 100 !== 11 ? `${n} cilne` : `${n} cilnes`,
      'notes': n => n % 10 === 1 && n % 100 !== 11 ? `${n} piezīme` : `${n} piezīmes`
    },
    en: {
      'back': 'Home (Alt+←)',
      'renameHint': 'Click to rename',
      'searchHome': 'Search notes…  (Ctrl+F)',
      'searchTab': 'Search in this tab…  (Ctrl+F)',
      'findPrev': 'Previous (Shift+Enter)',
      'findNext': 'Next (Enter)',
      'export': 'Export (.md / .txt)',
      'theme': 'Light / dark mode',
      'language': 'Language',
      'newNote': 'New note (Ctrl+N)',
      'minimize': 'Minimize', 'maximize': 'Maximize', 'close': 'Close',
      'sort': 'Sort', 'sortUpdated': 'by last change', 'sortTitle': 'by title', 'sortCreated': 'by creation',
      'view': 'View (also Ctrl + mouse wheel)',
      'viewList': 'List', 'viewSmall': 'Small cards', 'viewMedium': 'Medium cards', 'viewLarge': 'Large cards',
      'addCategory': 'Category', 'addCategoryTitle': 'New category (e.g. Work / Personal)',
      'blockStyle': 'Line style', 'text': 'Text', 'h1': 'Heading 1', 'h2': 'Heading 2', 'h3': 'Heading 3',
      'bold': 'Bold (Ctrl+B)', 'italic': 'Italic (Ctrl+I)', 'underline': 'Underline (Ctrl+U)', 'strike': 'Strikethrough (Ctrl+Shift+X)',
      'foreColor': 'Text color', 'backColor': 'Highlight (Ctrl+Shift+H)', 'clearFormat': 'Clear formatting',
      'ul': 'Bullets (at line start: “- ”)', 'ol': 'Numbered list (at line start: “1. ”)', 'ola': 'Lettered list (at line start: “a. ”)',
      'check': 'Checklist (at line start: “[] ”)', 'inlineCode': 'Inline code (Ctrl+E)',
      'codeBlock': 'Code block (Ctrl+Shift+K or “``` ”)', 'cmdBlock': 'Command block (Ctrl+Shift+M or “$$ ”)',
      'image': 'Insert image (or paste / drop)', 'hr': 'Divider line',
      'zoom': 'Text size (Ctrl + mouse wheel, Ctrl+0 to reset)', 'font': 'Body font: regular / monospace',
      'newTab': 'New tab (Ctrl+T)', 'cancel': 'Cancel', 'ok': 'OK',
      'noColor': 'No color', 'otherColor': 'Other color',
      'copy': 'Copy', 'copyBlock': 'Copy this text block', 'copiedAgo': 'Copied {0}', 'copiedToast': 'Copied',
      'zoomToast': 'Text size: {0}%',
      'newNoteCard': 'New note', 'emptyNote': 'Empty – click to start writing', 'actions': 'Actions',
      'noResults': 'Nothing found for “{0}”', 'untitled': 'Untitled',
      'created': 'Created {0}', 'updated': 'Changed {0}', 'unsaved': 'Not saved',
      'open': 'Open', 'rename': 'Rename', 'changeLogo': 'Change logo…', 'removeLogo': 'Remove logo',
      'exportMd': 'Export .md', 'exportTxt': 'Export .txt', 'duplicate': 'Duplicate', 'dataFolder': 'Data folder',
      'delete': 'Delete', 'moveTo': 'Move to', 'dataHere': 'Data is stored here',
      'newNoteTitle': 'New note', 'newNotePrompt': 'Project / note name:', 'create': 'Create',
      'renameNote': 'Rename note', 'save': 'Save', 'copySuffix': ' (copy)',
      'deleteNote': 'Delete note?', 'deleteNoteBody': '“{0}” will be moved to the trash (<b>_trash</b> folder in the data folder).',
      'defaultTab': 'Notes', 'tabN': 'Tab {0}', 'tabRenameHint': 'Double-click to rename',
      'closeTab': 'Close (delete) tab', 'duplicateTab': 'Duplicate tab', 'exportTabMd': 'Export tab .md',
      'exportTabTxt': 'Export tab .txt', 'deleteTab': 'Delete tab', 'deleteTabQ': 'Delete tab?',
      'deleteTabBody': 'Tab “{0}” and its content will be deleted.', 'clearCopied': 'Clear copy marks',
      'saving': 'Saving…', 'saved': 'Saved', 'saveFailed': 'Could not save: {0}', 'loadFailed': 'Could not load: {0}',
      'line': 'Line {0} / {1}', 'words': '{0} words', 'chars': '{0} characters',
      'exportAll': 'Whole note ({0})', 'exportOnlyTab': 'Only tab “{0}”', 'markdown': 'Markdown (.md)', 'plainText': 'Text (.txt)',
      'exported': 'Exported: {0}', 'exportedImgs': ' (+{0} images)', 'exportFailed': 'Export failed: {0}',
      'imgFolder': 'images', 'image1': 'Image', 'txtLabel': 'Text file',
      'uncategorized': 'Uncategorized', 'categoryName': 'Category name:', 'renameCategory': 'Rename category',
      'deleteCategory': 'Delete category', 'deleteCategoryQ': 'Delete category?',
      'deleteCategoryBody': 'Category “{0}” will be deleted; its notes stay (moved to “Uncategorized”).',
      'moveUp': 'Move up', 'moveDown': 'Move down', 'dropHere': 'Drop a card here',
      'justNow': 'just now', 'minAgo': '{0} min ago', 'hAgo': '{0} h ago', 'yesterday': 'yesterday', 'dAgo': '{0} d ago',
      'tabs': n => n === 1 ? '1 tab' : `${n} tabs`,
      'notes': n => n === 1 ? '1 note' : `${n} notes`
    },
    ru: {
      'back': 'На главную (Alt+←)',
      'renameHint': 'Нажмите, чтобы переименовать',
      'searchHome': 'Поиск по заметкам…  (Ctrl+F)',
      'searchTab': 'Поиск во вкладке…  (Ctrl+F)',
      'findPrev': 'Предыдущее (Shift+Enter)',
      'findNext': 'Следующее (Enter)',
      'export': 'Экспорт (.md / .txt)',
      'theme': 'Светлая / тёмная тема',
      'language': 'Язык',
      'newNote': 'Новая заметка (Ctrl+N)',
      'minimize': 'Свернуть', 'maximize': 'Развернуть', 'close': 'Закрыть',
      'sort': 'Сортировка', 'sortUpdated': 'по изменению', 'sortTitle': 'по названию', 'sortCreated': 'по созданию',
      'view': 'Вид (также Ctrl + колесо мыши)',
      'viewList': 'Список', 'viewSmall': 'Маленькие карточки', 'viewMedium': 'Средние карточки', 'viewLarge': 'Большие карточки',
      'addCategory': 'Категория', 'addCategoryTitle': 'Новая категория (напр. Работа / Личное)',
      'blockStyle': 'Стиль строки', 'text': 'Текст', 'h1': 'Заголовок 1', 'h2': 'Заголовок 2', 'h3': 'Заголовок 3',
      'bold': 'Жирный (Ctrl+B)', 'italic': 'Курсив (Ctrl+I)', 'underline': 'Подчёркнутый (Ctrl+U)', 'strike': 'Зачёркнутый (Ctrl+Shift+X)',
      'foreColor': 'Цвет текста', 'backColor': 'Выделить цветом (Ctrl+Shift+H)', 'clearFormat': 'Очистить форматирование',
      'ul': 'Маркеры (в начале строки: “- ”)', 'ol': 'Нумерованный список (в начале строки: “1. ”)', 'ola': 'Список с буквами (в начале строки: “a. ”)',
      'check': 'Список задач (в начале строки: “[] ”)', 'inlineCode': 'Код в строке (Ctrl+E)',
      'codeBlock': 'Блок кода (Ctrl+Shift+K или “``` ”)', 'cmdBlock': 'Блок команды (Ctrl+Shift+M или “$$ ”)',
      'image': 'Вставить изображение (или вставьте / перетащите)', 'hr': 'Разделитель',
      'zoom': 'Размер текста (Ctrl + колесо мыши, Ctrl+0 – сброс)', 'font': 'Шрифт текста: обычный / моноширинный',
      'newTab': 'Новая вкладка (Ctrl+T)', 'cancel': 'Отмена', 'ok': 'OK',
      'noColor': 'Без цвета', 'otherColor': 'Другой цвет',
      'copy': 'Копировать', 'copyBlock': 'Копировать этот блок текста', 'copiedAgo': 'Скопировано {0}', 'copiedToast': 'Скопировано',
      'zoomToast': 'Размер текста: {0}%',
      'newNoteCard': 'Новая заметка', 'emptyNote': 'Пусто – нажмите, чтобы начать писать', 'actions': 'Действия',
      'noResults': 'Ничего не найдено по запросу “{0}”', 'untitled': 'Без названия',
      'created': 'Создано {0}', 'updated': 'Изменено {0}', 'unsaved': 'Не сохранено',
      'open': 'Открыть', 'rename': 'Переименовать', 'changeLogo': 'Сменить логотип…', 'removeLogo': 'Убрать логотип',
      'exportMd': 'Экспорт .md', 'exportTxt': 'Экспорт .txt', 'duplicate': 'Дублировать', 'dataFolder': 'Папка данных',
      'delete': 'Удалить', 'moveTo': 'Переместить в', 'dataHere': 'Данные хранятся здесь',
      'newNoteTitle': 'Новая заметка', 'newNotePrompt': 'Название проекта / заметки:', 'create': 'Создать',
      'renameNote': 'Переименовать заметку', 'save': 'Сохранить', 'copySuffix': ' (копия)',
      'deleteNote': 'Удалить заметку?', 'deleteNoteBody': '“{0}” будет перемещена в корзину (папка <b>_trash</b> в папке данных).',
      'defaultTab': 'Заметки', 'tabN': 'Вкладка {0}', 'tabRenameHint': 'Двойной щелчок – переименовать',
      'closeTab': 'Закрыть (удалить) вкладку', 'duplicateTab': 'Дублировать вкладку', 'exportTabMd': 'Экспорт вкладки .md',
      'exportTabTxt': 'Экспорт вкладки .txt', 'deleteTab': 'Удалить вкладку', 'deleteTabQ': 'Удалить вкладку?',
      'deleteTabBody': 'Вкладка “{0}” и её содержимое будут удалены.', 'clearCopied': 'Убрать отметки копирования',
      'saving': 'Сохранение…', 'saved': 'Сохранено', 'saveFailed': 'Не удалось сохранить: {0}', 'loadFailed': 'Не удалось загрузить: {0}',
      'line': 'Строка {0} / {1}', 'words': 'слов: {0}', 'chars': 'символов: {0}',
      'exportAll': 'Вся заметка ({0})', 'exportOnlyTab': 'Только вкладка “{0}”', 'markdown': 'Markdown (.md)', 'plainText': 'Текст (.txt)',
      'exported': 'Экспортировано: {0}', 'exportedImgs': ' (+{0} изобр.)', 'exportFailed': 'Ошибка экспорта: {0}',
      'imgFolder': 'images', 'image1': 'Изображение', 'txtLabel': 'Текстовый файл',
      'uncategorized': 'Без категории', 'categoryName': 'Название категории:', 'renameCategory': 'Переименовать категорию',
      'deleteCategory': 'Удалить категорию', 'deleteCategoryQ': 'Удалить категорию?',
      'deleteCategoryBody': 'Категория “{0}” будет удалена, заметки останутся (перейдут в “Без категории”).',
      'moveUp': 'Переместить вверх', 'moveDown': 'Переместить вниз', 'dropHere': 'Перетащите карточку сюда',
      'justNow': 'только что', 'minAgo': '{0} мин назад', 'hAgo': '{0} ч назад', 'yesterday': 'вчера', 'dAgo': '{0} дн. назад',
      'backups': 'Копии', 'backupsTitle': 'Резервные копии (Документы\Note+\backups)',
      'backupNow': 'Создать копию сейчас', 'backupFolder': 'Открыть папку копий', 'backupDone': 'Резервная копия создана',
      'backupEmpty': 'Нечего копировать – заметок нет', 'restore': 'Восстановить', 'restoreQ': 'Восстановить из копии?',
      'restoreBody': 'Будет восстановлено состояние от {0} ({1}). Текущие заметки сначала сохранятся отдельной копией.',
      'restored': 'Восстановлено: {0}', 'restoreFailed': 'Не удалось восстановить: {0}',
      'emptyFoundBackup': 'Заметки не найдены', 'emptyFoundBackupBody': 'Найдена резервная копия от {0} ({1}). Восстановить?',
      'tabs': n => `${n} ${ruPlural(n, 'вкладка', 'вкладки', 'вкладок')}`,
      'notes': n => `${n} ${ruPlural(n, 'заметка', 'заметки', 'заметок')}`
    }
  };
  function ruPlural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  function detect() {
    let saved = null;
    try { saved = localStorage.getItem('np_lang'); } catch (e) { }
    if (saved && LANGS[saved]) return saved;
    const sys = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const code = sys.slice(0, 2).toLowerCase();
    return LANGS[code] ? code : 'en';
  }
  let lang = detect();

  function t(key, ...args) {
    const v = (D[lang] && D[lang][key]) ?? D.en[key] ?? key;
    if (typeof v === 'function') return v(...args);
    return v.replace(/\{(\d)\}/g, (_, i) => args[+i] ?? '');
  }

  function setLang(l) {
    if (!LANGS[l]) return;
    lang = l;
    try { localStorage.setItem('np_lang', l); } catch (e) { }
    apply();
  }

  /** Statiskie teksti: data-i18n (teksts), data-i18n-title, data-i18n-ph */
  function apply(root = document) {
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  }

  function ago(ts) {
    if (!ts) return '';
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return t('justNow');
    if (s < 3600) return t('minAgo', Math.floor(s / 60));
    if (s < 86400) return t('hAgo', Math.floor(s / 3600));
    if (s < 172800) return t('yesterday');
    if (s < 7 * 86400) return t('dAgo', Math.floor(s / 86400));
    return date(ts);
  }
  /** Īsi: šodien – “pirms 5 min / 3 h”, citādi – datums */
  function short(ts) {
    if (!ts) return '';
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return ago(ts);
    return date(ts);
  }
  function date(ts) {
    return new Date(ts).toLocaleDateString(LANGS[lang].locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function full(ts) {
    return new Date(ts).toLocaleString(LANGS[lang].locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return { t, setLang, apply, ago, short, date, full, LANGS, get lang() { return lang; } };
})();
const t = I18n.t;
