# Note+

Personiska pierakstu grāmatiņa Windows datoram (Tauri 2 + vienkāršs HTML/JS). English: [README.md](README.md)

## Struktūra
- `src/` – saskarne (`index.html`, `styles.css`, `storage.js`, `editor.js`, `app.js`)
- `src-tauri/` – Rust daļa (failu saglabāšana), ikonas, konfigurācija
- `_materials/` – oriģinālā ikona `AppIcons_Note+.svg`
- Instalācija: `C:\Program Files\JKapps\Note+`
- Dati: `%LOCALAPPDATA%\JKapps\Note+\notebooks\<id>.json` (dzēstās piezīmes → `_trash`), kategorijas un iestatījumi → `meta.json`
- **Rezerves kopijas:** `Dokumenti\Note+\backups`
  - Atrodas ārpus programmas datu mapes, tāpēc atinstalētājs tās neizdzēš.
  - Kopija tiek veidota startā, ik pēc 20 min un aizverot, ja kas mainījies; glabā pēdējās 30.
  - Poga “Kopijas” sākuma ekrānā: izveidot kopiju, atvērt mapi, atjaunot.
  - Ja piezīmju nav, bet ir kopija, programma startā piedāvā to atjaunot.

## Komandas
```powershell
pnpm install          # vienreiz
pnpm dev              # palaist izstrādes režīmā
pnpm build            # .exe + NSIS instalētājs (src-tauri/target/release)
pnpm icons            # ikonas no _materials/AppIcons_Note+.svg
```

## Rakstīšana
| Darbība | Kā |
|---|---|
| Punkti | rindas sākumā `- ` vai `* ` |
| Numurēts saraksts | `1. ` (vai jebkurš skaitlis, piem. `5. `) |
| Saraksts ar burtiem | `a. ` / `A. ` |
| Uzdevumu saraksts | `[] ` (klikšķis uz kvadrātiņa – atzīmēt) |
| Koda bloks | ` ``` ` + atstarpe vai Ctrl+Shift+K |
| Komandas bloks | `$$ ` vai Ctrl+Shift+M |
| Iziet no bloka | Ctrl+Enter vai ↓ pēdējā rindā |
| Atkāpe sarakstā | Tab / Shift+Tab; Backspace punkta sākumā – atpakaļ uz tekstu |
| Treknraksts / slīpraksts / pasvītrots | Ctrl+B / Ctrl+I / Ctrl+U |
| Pārsvītrots | Ctrl+Shift+X |
| Kods rindā | Ctrl+E |
| Iekrāsot ar pēdējo fona krāsu | Ctrl+Shift+H |
| Teksta izmērs | Ctrl + peles ritulis, Ctrl+= / Ctrl+- , Ctrl+0 – atiestatīt |
| Kopēt teksta bloku | pele virs bloka → poga labajā malā (bloku atdala tukša rinda vai koda bloks) |
| Attēls | ielīmēt (Ctrl+V), ievilkt vai poga; izmēru maina labais apakšējais stūris; turi peli 1 s – lielais skats |

## Navigācija
| | |
|---|---|
| Jauna piezīme (sākumā) | Ctrl+N vai + augšā |
| Kartiņu skats | pogas labajā pusē vai Ctrl + peles ritulis (saraksts / mazas / vidējas / lielas) |
| Eksports | lejupielādes poga augšā vai labais klikšķis uz kartiņas/cilnes → .md / .txt (attēli mapē `<nosaukums>_attēli`) |
| Logs | velc aiz tukšas vietas augšējā joslā (arī logo), dubultklikšķis – maksimizēt |
| Meklēt | Ctrl+F (sākumā – visās piezīmēs, piezīmē – aktīvajā cilnē; Enter / Shift+Enter – nākamais/iepriekšējais) |
| Jauna cilne | Ctrl+T |
| Pārslēgt cilnes | Ctrl+Tab / Ctrl+Shift+Tab |
| Pārsaukt cilni | dubultklikšķis; vilkt – mainīt secību; vidējā poga – aizvērt |
| Uz sākumu | Alt+← |
| Saglabāt uzreiz | Ctrl+S (saglabā arī automātiski) |

Oranžā bumbiņa uz cilnes/kartiņas = izmaiņas vēl nav ierakstītas diskā (parasti < 1 s; ja paliek – saglabāšana neizdevās).

Kartiņa sākuma ekrānā iekrāsojas zaļgana un rāda “Kopēts …”, ja pēdējo 24 h laikā no tās kaut kas ir kopēts.
