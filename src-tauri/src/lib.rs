use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

/// Visu programmas dati: %LOCALAPPDATA%\JKapps\Note+
fn data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .local_data_dir()
        .map_err(|e| e.to_string())?
        .join("JKapps")
        .join("Note+");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Mape, kur glabājas piezīmes: %LOCALAPPDATA%\JKapps\Note+\notebooks
fn notebooks_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = data_root(app)?.join("notebooks");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn safe_id(id: &str) -> Result<&str, String> {
    if !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        Ok(id)
    } else {
        Err("Nederīgs ID".into())
    }
}

#[tauri::command]
fn list_notebooks(app: AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let dir = notebooks_dir(&app)?;
    let mut out = Vec::new();
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Ok(text) = fs::read_to_string(&path) {
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                    out.push(v);
                }
            }
        }
    }
    Ok(out)
}

#[tauri::command]
fn save_notebook(app: AppHandle, id: String, data: String) -> Result<(), String> {
    let id = safe_id(&id)?;
    let dir = notebooks_dir(&app)?;
    let tmp = dir.join(format!("{id}.json.tmp"));
    let target = dir.join(format!("{id}.json"));
    // Vispirms pagaidu fails, tad pārsaukšana – lai fails nesabojājas, ja programma aizveras rakstot.
    fs::write(&tmp, data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &target).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_notebook(app: AppHandle, id: String) -> Result<(), String> {
    let id = safe_id(&id)?;
    let dir = notebooks_dir(&app)?;
    let trash = dir.join("_trash");
    fs::create_dir_all(&trash).map_err(|e| e.to_string())?;
    let src = dir.join(format!("{id}.json"));
    if src.exists() {
        // Neizdzēšam pavisam – pārvietojam uz _trash
        fs::rename(&src, trash.join(format!("{id}.json"))).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn data_dir(app: AppHandle) -> Result<String, String> {
    Ok(notebooks_dir(&app)?.to_string_lossy().to_string())
}

/// Kopīgie iestatījumi (kategorijas, saskarne): %LOCALAPPDATA%\JKapps\Note+\meta.json
fn meta_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("meta.json"))
}

fn copy_dir(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for e in fs::read_dir(src)? {
        let p = e?.path();
        let t = dst.join(p.file_name().unwrap());
        if p.is_dir() {
            copy_dir(&p, &t)?;
        } else {
            fs::copy(&p, &t)?;
        }
    }
    Ok(())
}

fn has_json(d: &PathBuf) -> bool {
    fs::read_dir(d)
        .map(|rd| {
            rd.filter_map(|e| e.ok())
                .any(|e| e.path().extension().and_then(|x| x.to_str()) == Some("json"))
        })
        .unwrap_or(false)
}

/// Vienreizēja pārnešana no vecās vietas (%APPDATA%\lv.noteplus.app) uz JKapps.
/// Kopē (nevis pārvieto) un tikai tad, ja jaunajā vietā vēl nav nevienas piezīmes.
fn migrate_old_data(app: &AppHandle) {
    let Ok(old) = app.path().app_data_dir() else { return };
    let Ok(root) = data_root(app) else { return };
    let old_nb = old.join("notebooks");
    let new_nb = root.join("notebooks");
    if !has_json(&old_nb) || has_json(&new_nb) {
        return;
    }
    if copy_dir(&old_nb, &new_nb).is_ok() {
        let om = old.join("meta.json");
        if om.exists() && !root.join("meta.json").exists() {
            let _ = fs::copy(om, root.join("meta.json"));
        }
        let _ = fs::write(
            old.join("PARNESTS_UZ_JKapps.txt"),
            format!("Dati nokopēti uz {}\r\n", root.to_string_lossy()),
        );
    }
}

#[tauri::command]
fn load_meta(app: AppHandle) -> Result<Option<String>, String> {
    let p = meta_path(&app)?;
    if !p.exists() {
        return Ok(None);
    }
    fs::read_to_string(p).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_meta(app: AppHandle, data: String) -> Result<(), String> {
    let p = meta_path(&app)?;
    let tmp = p.with_extension("json.tmp");
    fs::write(&tmp, data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &p).map_err(|e| e.to_string())
}

/* ================= rezerves kopijas =================
 * Glabājas ārpus programmas datu mapes (Dokumenti\Note+\backups), lai tās
 * neizdzēstu atinstalētājs ar "Delete the application data". */
const BACKUP_PREFIX: &str = "Note+_backup_";
const BACKUP_KEEP: usize = 30;

fn backups_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .document_dir()
        .or_else(|_| app.path().home_dir())
        .map_err(|e| e.to_string())?;
    let dir = base.join("Note+").join("backups");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn clean_stamp(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-' || *c == '_')
        .take(60)
        .collect()
}

/// Pašreizējais stāvoklis: (piezīmes, meta). Piezīmes sakārtotas pēc faila nosaukuma.
fn current_state(app: &AppHandle) -> Result<(Vec<serde_json::Value>, serde_json::Value), String> {
    let dir = notebooks_dir(app)?;
    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("json"))
        .collect();
    files.sort();
    let notebooks = files
        .iter()
        .filter_map(|p| fs::read_to_string(p).ok())
        .filter_map(|t| serde_json::from_str::<serde_json::Value>(&t).ok())
        .collect();
    let meta = fs::read_to_string(meta_path(app)?)
        .ok()
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    Ok((notebooks, meta))
}

fn hash_of(notebooks: &[serde_json::Value], meta: &serde_json::Value) -> String {
    use std::hash::{Hash, Hasher};
    let mut h = std::collections::hash_map::DefaultHasher::new();
    serde_json::to_string(notebooks).unwrap_or_default().hash(&mut h);
    serde_json::to_string(meta).unwrap_or_default().hash(&mut h);
    format!("{:016x}", h.finish())
}

/// Rezerves kopiju faili, jaunākie pirmie.
fn backup_files(dir: &PathBuf) -> Vec<PathBuf> {
    let mut v: Vec<PathBuf> = fs::read_dir(dir)
        .map(|rd| {
            rd.filter_map(|e| e.ok().map(|e| e.path()))
                .filter(|p| {
                    p.is_file()
                        && p.extension().and_then(|e| e.to_str()) == Some("json")
                        && p.file_name().and_then(|n| n.to_str()).map_or(false, |n| n.starts_with(BACKUP_PREFIX))
                })
                .collect()
        })
        .unwrap_or_default();
    v.sort();
    v.reverse();
    v
}

fn write_backup(app: &AppHandle, stamp: &str, force: bool) -> Result<Option<String>, String> {
    let (notebooks, meta) = current_state(app)?;
    // Tukšu stāvokli nekad nesaglabājam – tas nedrīkst izstumt labas kopijas.
    if notebooks.is_empty() {
        return Ok(None);
    }
    let hash = hash_of(&notebooks, &meta);
    let dir = backups_dir(app)?;
    let existing = backup_files(&dir);
    if !force {
        if let Some(last) = existing.first() {
            let same = fs::read_to_string(last)
                .ok()
                .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok())
                .and_then(|v| v.get("hash").and_then(|h| h.as_str()).map(|h| h == hash))
                .unwrap_or(false);
            if same {
                return Ok(None);
            }
        }
    }
    let stamp = clean_stamp(stamp);
    let mut name = format!("{BACKUP_PREFIX}{stamp}.json");
    let mut n = 2;
    while dir.join(&name).exists() {
        name = format!("{BACKUP_PREFIX}{stamp}_{n}.json");
        n += 1;
    }
    let body = serde_json::json!({
        "app": "Note+",
        "format": 1,
        "version": env!("CARGO_PKG_VERSION"),
        "stamp": stamp,
        "count": notebooks.len(),
        "hash": hash,
        "meta": meta,
        "notebooks": notebooks,
    });
    let target = dir.join(&name);
    let tmp = dir.join(format!("{name}.tmp"));
    fs::write(&tmp, serde_json::to_string(&body).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &target).map_err(|e| e.to_string())?;
    // Vecākās kopijas (tikai mūsu pašu faili) nodzēšam
    for old in backup_files(&dir).into_iter().skip(BACKUP_KEEP) {
        let _ = fs::remove_file(old);
    }
    Ok(Some(name))
}

#[tauri::command]
fn backup_now(app: AppHandle, stamp: String, force: bool) -> Result<Option<String>, String> {
    write_backup(&app, &stamp, force)
}

#[derive(serde::Serialize)]
struct BackupInfo {
    name: String,
    stamp: String,
    count: u64,
    size: u64,
}

#[tauri::command]
fn list_backups(app: AppHandle) -> Result<Vec<BackupInfo>, String> {
    let dir = backups_dir(&app)?;
    let mut out = Vec::new();
    for p in backup_files(&dir) {
        let name = p.file_name().unwrap().to_string_lossy().to_string();
        let size = fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
        let v = fs::read_to_string(&p)
            .ok()
            .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok());
        let Some(v) = v else { continue };
        out.push(BackupInfo {
            stamp: v.get("stamp").and_then(|s| s.as_str()).unwrap_or("").to_string(),
            count: v.get("count").and_then(|c| c.as_u64()).unwrap_or(0),
            name,
            size,
        });
    }
    Ok(out)
}

#[tauri::command]
fn restore_backup(app: AppHandle, name: String, stamp: String) -> Result<usize, String> {
    if name.contains(['/', '\\']) || !name.starts_with(BACKUP_PREFIX) || !name.ends_with(".json") {
        return Err("Nederīgs kopijas nosaukums".into());
    }
    let dir = backups_dir(&app)?;
    let text = fs::read_to_string(dir.join(&name)).map_err(|e| e.to_string())?;
    let v: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    let notebooks = v.get("notebooks").and_then(|n| n.as_array()).ok_or("Kopijā nav piezīmju")?;

    // 1) Pašreizējo stāvokli vispirms saglabājam kā kopiju (ja tas nav tukšs)
    write_backup(&app, &format!("{}_pirms-atjaunosanas", clean_stamp(&stamp)), true)?;

    // 2) Esošos failus pārvietojam uz _trash\restore_<laiks>
    let nb_dir = notebooks_dir(&app)?;
    let parked = nb_dir.join("_trash").join(format!("restore_{}", clean_stamp(&stamp)));
    for entry in fs::read_dir(&nb_dir).map_err(|e| e.to_string())? {
        let p = entry.map_err(|e| e.to_string())?.path();
        if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("json") {
            fs::create_dir_all(&parked).map_err(|e| e.to_string())?;
            fs::rename(&p, parked.join(p.file_name().unwrap())).map_err(|e| e.to_string())?;
        }
    }

    // 3) Ierakstām piezīmes un meta no kopijas
    let mut n = 0;
    for nb in notebooks {
        let Some(id) = nb.get("id").and_then(|i| i.as_str()) else { continue };
        let Ok(id) = safe_id(id) else { continue };
        fs::write(nb_dir.join(format!("{id}.json")), serde_json::to_string(nb).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
        n += 1;
    }
    if let Some(meta) = v.get("meta") {
        fs::write(meta_path(&app)?, serde_json::to_string(meta).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
    }
    Ok(n)
}

#[tauri::command]
fn open_backups_dir(app: AppHandle) -> Result<String, String> {
    let dir = backups_dir(&app)?;
    let _ = std::process::Command::new("explorer").arg(&dir).spawn();
    Ok(dir.to_string_lossy().to_string())
}

#[derive(Deserialize)]
struct ExportImage {
    name: String,
    data: String,
}

/// Saglabāšanas dialogs + fails; attēli tiek ierakstīti mapē "<faila nosaukums>_attēli" blakus.
#[tauri::command]
async fn export_note(
    app: AppHandle,
    default_name: String,
    ext: String,
    content: String,
    images: Vec<ExportImage>,
    label: String,
    img_suffix: String,
) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter(&label, &[ext.as_str()])
        .blocking_save_file();
    let Some(fp) = picked else { return Ok(None) };
    let path = fp.into_path().map_err(|e| e.to_string())?;
    let stem = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "export".into());
    let suffix: String = img_suffix
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .collect();
    let dir_name = format!("{stem}_{suffix}");
    let content = content.replace("{{IMGDIR}}", &dir_name);
    if !images.is_empty() {
        let dir = path.parent().ok_or("Nederīgs ceļš")?.join(&dir_name);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        for img in images {
            let name: String = img
                .name
                .chars()
                .filter(|c| c.is_ascii_alphanumeric() || *c == '.' || *c == '_' || *c == '-')
                .collect();
            let bytes = STANDARD.decode(img.data.as_bytes()).map_err(|e| e.to_string())?;
            fs::write(dir.join(name), bytes).map_err(|e| e.to_string())?;
        }
    }
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(Some(path.to_string_lossy().to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            migrate_old_data(&handle);
            // Logu veidojam šeit, lai arī WebView dati glabātos JKapps mapē
            let webview_dir = data_root(&handle)?.join("WebView");
            tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
                .title("Note+")
                .inner_size(1280.0, 820.0)
                .min_inner_size(640.0, 480.0)
                .decorations(false)
                .shadow(true)
                .disable_drag_drop_handler()
                .data_directory(webview_dir)
                .center()
                .build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_notebooks,
            save_notebook,
            delete_notebook,
            data_dir,
            load_meta,
            save_meta,
            export_note,
            backup_now,
            list_backups,
            restore_backup,
            open_backups_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
