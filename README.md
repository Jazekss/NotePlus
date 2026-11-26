# Note+

A small, fast, offline notebook for keeping project notes on Windows — a mix of **Notepad++** (line numbers, plain-text feel) and a **card dashboard** that shows all your projects at a glance.

Built with [Tauri 2](https://tauri.app) (Rust) and plain HTML/CSS/JS: ~6 MB executable, no account, no cloud, no telemetry.

> **Languages:** English, Latvian and Russian (detected from the system language, switchable with the language button in the title bar). Latvian docs: [README.lv.md](README.lv.md)

<!-- TODO: add screenshots to docs/ and embed them here -->

## Features

**Home screen**
- Each project/note is a card: logo, title in the card's accent color, tab count, creation time and a short preview of the last active tab
- **Categories** (e.g. Work / Personal) shown as labelled divider lines; drag a card to move it between categories
- Four views like Windows folders: list, small, medium, large cards (buttons or **Ctrl + mouse wheel**)
- Search across all notes, sort by last change / title / creation date
- A green copy icon shows when something was last copied from a note (hover for the time)
- Orange dot = changes not yet written to disk

**Editor**
- Tabs per note (rename by double-click, drag to reorder)
- Line numbers and current-line highlight, Notepad++ style
- **Ctrl+B / I / U**, strikethrough, text color, highlight color, headings
- Markdown-like shortcuts at the start of a line: `- ` bullets, `1. ` numbered, `a. ` lettered, `[] ` checklist, ` ``` ` code block, `$$ ` command block
- Code and command blocks in monospace font with a **copy button**
- Every text block (separated by an empty line or a code block) gets a copy button on hover
- **Copied text stays marked** with a faint green background (hover shows when) and the tab gets a copy icon, so you don't copy the same thing twice
- Images: paste, drop or insert; resize by dragging the corner; hover for 1 s to open a large preview
- Find in tab (Ctrl+F), zoom text (Ctrl + mouse wheel, Ctrl+0 to reset), light/dark theme
- Autosave (no "Save" needed); deleted notes go to a `_trash` folder
- **Export** a whole note or a single tab to **Markdown (.md)** or **plain text (.txt)** — images are saved to a `<name>_images` folder next to the file (folder name follows the UI language)

**Window**
- Frameless window with its own title bar: drag anywhere empty, double-click to maximize

## Data location

The installer puts the app in `C:\Program Files\JKapps\Note+` (it asks for admin rights once).

`%LOCALAPPDATA%\JKapps\Note+\notebooks\<id>.json` — one JSON file per note.
`%LOCALAPPDATA%\JKapps\Note+\meta.json` — categories and UI settings (theme, view, language, zoom).

### Backups

Note+ keeps automatic backups in **`Documents\Note+\backups`**, outside the app data folder. They survive an uninstall, even with *"Delete the application data"* ticked.

- A backup is written on start, every 20 minutes and on close, but only when something changed.
- Empty states are never backed up, and the last 30 backups are kept.
- The **Backups** button on the home screen backs up now, opens the folder or restores a backup. Your current notes are backed up before a restore.
- If the app starts with no notes but a backup exists, it offers to restore it.

## Download

Get the Windows installer from [Releases](../../releases). The build is not code-signed, so Windows SmartScreen may show an "unknown publisher" warning (More info → Run anyway).

## Build from source

Requirements: [Node.js](https://nodejs.org) LTS, [pnpm](https://pnpm.io), [Rust](https://rustup.rs) (stable, MSVC) and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for Windows.

```powershell
pnpm install
pnpm dev      # run in development mode
pnpm build    # release .exe + NSIS installer in src-tauri/target/release
```

The UI lives in `src/` (no bundler): `app.js` (screens, tabs, toolbar, export), `editor.js` (editor), `export.js` (HTML → Markdown/text), `storage.js` (persistence). The Rust side (`src-tauri/src/lib.rs`) only reads/writes files and shows the save dialog.

You can also open `src/index.html` through any static web server to try the UI in a browser — data is then kept in `localStorage`.

## Releasing

Push a tag like `v0.2.0` — the GitHub Actions workflow builds the Windows installer and attaches it to a draft release.

## Ideas / roadmap

- Tags/folders and pinned notes
- Sync through a user-chosen folder (OneDrive, Dropbox…)
- Links between notes
- Import from `.txt` / `.md`
- Global hotkey for a quick note
- Theme and color customization

Contributions and ideas are welcome — open an issue.

## License

[MIT](LICENSE)
