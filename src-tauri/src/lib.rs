use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

/// Mape, kur glabājas piezīmes: %APPDATA%\lv.noteplus.app\notebooks
fn notebooks_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("notebooks");
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

/// Kopīgie iestatījumi (kategorijas u.c.): %APPDATA%\lv.noteplus.app\meta.json
fn meta_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("meta.json"))
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
        .invoke_handler(tauri::generate_handler![
            list_notebooks,
            save_notebook,
            delete_notebook,
            data_dir,
            load_meta,
            save_meta,
            export_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
