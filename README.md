# Note+

A small, fast, offline notebook for keeping project notes on Windows — a mix of **Notepad++** (line numbers, plain-text feel) and a **card dashboard** that shows all your projects at a glance.

Built with [Tauri 2](https://tauri.app) (Rust) and plain HTML/CSS/JS: ~6 MB executable, no account, no cloud, no telemetry.

> **Language:** the interface is currently in Latvian. English UI / language switching is planned. Latvian docs: [README.lv.md](README.lv.md)

<!-- TODO: add screenshots to docs/ and embed them here -->

## Features

**Home screen**
- Each project/note is a card: logo, title, color, short preview of its text, tab count, last change
- Four views like Windows folders: list, small, medium, large cards (buttons or **Ctrl + mouse wheel**)
- Search across all notes, sort by last change / title / creation date
- Cards tint green and show "Copied …" when you copied something from them in the last 24 h
- Orange dot = changes not yet written to disk

**Editor**
- Tabs per note (rename by double-click, drag to reorder)
- Line numbers and current-line highlight, Notepad++ style
- **Ctrl+B / I / U**, strikethrough, text color, highlight color, headings
- Markdown-like shortcuts at the start of a line: `- ` bullets, `1. ` numbered, `a. ` lettered, `[] ` checklist, ` ``` ` code block, `$$ ` command block
- Code and command blocks in monospace font with a **copy button**
- Every text block (separated by an empty line or a code block) gets a copy button on hover
- Images: paste, drop or insert; resize by dragging the corner; hover for 1 s to open a large preview
- Find in tab (Ctrl+F), zoom text (Ctrl + mouse wheel, Ctrl+0 to reset), light/dark theme
- Autosave (no "Save" needed); deleted notes go to a `_trash` folder
- **Export** a whole note or a single tab to **Markdown (.md)** or **plain text (.txt)** — images are saved to a `<name>_attēli` folder next to the file

**Window**
- Frameless window with its own title bar: drag anywhere empty, double-click to maximize

## Data location

`%APPDATA%\lv.noteplus.app\notebooks\<id>.json` — one JSON file per note.

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

- English UI and language switching
- Tags/folders and pinned notes
- Sync through a user-chosen folder (OneDrive, Dropbox…)
- Links between notes
- Import from `.txt` / `.md`
- Global hotkey for a quick note
- Theme and color customization

Contributions and ideas are welcome — open an issue.

## License

[MIT](LICENSE)
