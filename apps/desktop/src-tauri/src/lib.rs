use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopJob {
    source: SourceInput,
    output_mode: String,
    style_preset: String,
    project_dir: Option<String>,
    provider_config: Option<serde_json::Value>,
    deck_session: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Serialize)]
struct SourceInput {
    kind: String,
    value: String,
    name: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CommandResult {
    ok: bool,
    data: serde_json::Value,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PreserveEditStep {
    slide: u32,
    replacements: std::collections::HashMap<String, String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PreserveEditRequest {
    source_path: String,
    output_path: Option<String>,
    edits: Vec<PreserveEditStep>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct InspectPptxRequest {
    source_path: String,
}

fn source_repo_root() -> Option<PathBuf> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let root = manifest_dir
        .parent()
        .and_then(|desktop| desktop.parent())
        .and_then(|apps| apps.parent())
        .map(PathBuf::from)?;
    if root
        .join("apps")
        .join("desktop")
        .join("worker")
        .join("desktop_worker.py")
        .exists()
    {
        Some(root)
    } else {
        None
    }
}

fn repo_root(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(value) = std::env::var("UPM_REPO_ROOT") {
        let root = PathBuf::from(value);
        if root.exists() {
            return Ok(root);
        }
    }
    if let Some(root) = source_repo_root() {
        return Ok(root);
    }
    let root = app
        .path()
        .app_data_dir()
        .map_err(|err| format!("Unable to resolve app data directory: {err}"))?;
    std::fs::create_dir_all(&root)
        .map_err(|err| format!("Unable to create app data directory: {err}"))?;
    Ok(root)
}

fn python_executable(root: &Path) -> String {
    let unix_venv = root.join(".venv").join("bin").join("python");
    let windows_venv = root.join(".venv").join("Scripts").join("python.exe");
    if unix_venv.exists() {
        unix_venv.to_string_lossy().to_string()
    } else if windows_venv.exists() {
        windows_venv.to_string_lossy().to_string()
    } else {
        "python3".to_string()
    }
}

fn resource_path(app: &AppHandle, value: &str) -> Option<PathBuf> {
    app.path()
        .resolve(value, BaseDirectory::Resource)
        .ok()
        .filter(|path| path.exists())
}

fn worker_path(app: &AppHandle, root: &Path) -> Result<PathBuf, String> {
    if let Ok(value) = std::env::var("UPM_WORKER_PATH") {
        let path = PathBuf::from(value);
        if path.exists() {
            return Ok(path);
        }
    }
    let source_worker = root
        .join("apps")
        .join("desktop")
        .join("worker")
        .join("desktop_worker.py");
    if source_worker.exists() {
        return Ok(source_worker);
    }
    for resource in ["desktop_worker.py", "resources/desktop_worker.py"] {
        if let Some(path) = resource_path(app, resource) {
            return Ok(path);
        }
    }
    Err("Unable to locate desktop worker. Reinstall the app or run npm run setup from the source checkout.".to_string())
}

/// Strip Python traceback noise so the UI shows the actual error, not the stack.
fn friendly_worker_error(stderr: &str, stdout: &str) -> String {
    let raw = if stderr.trim().is_empty() {
        stdout
    } else {
        stderr
    };
    let lines: Vec<&str> = raw
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    if lines.is_empty() {
        return raw.trim().to_string();
    }
    if lines
        .iter()
        .any(|l| l.contains("Traceback (most recent call last):"))
    {
        return (*lines.last().unwrap_or(&"")).to_string();
    }
    raw.trim().to_string()
}

fn run_worker(
    app: &AppHandle,
    args: &[&str],
    stdin_json: Option<String>,
) -> Result<serde_json::Value, String> {
    let root = repo_root(app)?;
    let python = python_executable(&root);
    let mut command = Command::new(python);
    command.arg(worker_path(app, &root)?);
    command.args(args);
    command.arg("--repo-root");
    command.arg(root.to_string_lossy().to_string());
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());
    if stdin_json.is_some() {
        command.stdin(Stdio::piped());
    }

    let mut child = command
        .spawn()
        .map_err(|err| format!("Failed to start desktop worker: {err}"))?;

    if let Some(payload) = stdin_json {
        if let Some(mut stdin) = child.stdin.take() {
            stdin
                .write_all(payload.as_bytes())
                .map_err(|err| format!("Failed to write worker input: {err}"))?;
        }
    }

    let output = child
        .wait_with_output()
        .map_err(|err| format!("Failed to read worker output: {err}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(friendly_worker_error(&stderr, &stdout));
    }

    serde_json::from_slice(&output.stdout)
        .map_err(|err| format!("Worker returned invalid JSON: {err}"))
}

#[tauri::command]
fn inspect_environment(app: AppHandle) -> Result<CommandResult, String> {
    let data = run_worker(&app, &["inspect"], None)?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn run_desktop_job(app: AppHandle, job: DesktopJob) -> Result<CommandResult, String> {
    let payload = serde_json::to_string(&job)
        .map_err(|err| format!("Failed to encode desktop job: {err}"))?;
    let data = run_worker(&app, &["run", "--stdin"], Some(payload))?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn list_recent_projects(
    app: AppHandle,
    project_dir: Option<String>,
) -> Result<CommandResult, String> {
    let mut args = vec!["list-projects"];
    let mut owned: Vec<String> = Vec::new();
    if let Some(dir) = project_dir {
        owned.push("--project-dir".to_string());
        owned.push(dir);
    }
    let extra: Vec<&str> = owned.iter().map(String::as_str).collect();
    args.extend(extra);
    let data = run_worker(&app, &args, None)?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn recommend_job_settings(app: AppHandle, source: SourceInput) -> Result<CommandResult, String> {
    let payload = serde_json::to_string(&serde_json::json!({ "source": source }))
        .map_err(|err| format!("Failed to encode recommendation source: {err}"))?;
    let data = run_worker(&app, &["recommend", "--stdin"], Some(payload))?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn preserve_edit_pptx(
    app: AppHandle,
    request: PreserveEditRequest,
) -> Result<CommandResult, String> {
    let payload = serde_json::to_string(&request)
        .map_err(|err| format!("Failed to encode preserve-edit request: {err}"))?;
    let data = run_worker(&app, &["preserve-edit", "--stdin"], Some(payload))?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn inspect_pptx(app: AppHandle, request: InspectPptxRequest) -> Result<CommandResult, String> {
    let payload = serde_json::to_string(&request)
        .map_err(|err| format!("Failed to encode inspect-pptx request: {err}"))?;
    let data = run_worker(&app, &["inspect-pptx", "--stdin"], Some(payload))?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("cmd");
        cmd.arg("/C").arg("start");
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");

    command
        .arg(path)
        .spawn()
        .map_err(|err| format!("Failed to open path: {err}"))?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            inspect_environment,
            run_desktop_job,
            list_recent_projects,
            recommend_job_settings,
            preserve_edit_pptx,
            inspect_pptx,
            open_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ultimate PPT Master desktop app");
}

#[cfg(test)]
mod tests {
    use super::DesktopJob;
    use super::InspectPptxRequest;
    use super::PreserveEditRequest;
    use serde_json::json;

    #[test]
    fn desktop_job_round_trips_deck_session_as_camel_case() {
        let payload = json!({
            "source": {
                "kind": "markdown",
                "value": "# Demo",
                "name": "demo.md"
            },
            "outputMode": "pptx",
            "stylePreset": "business",
            "projectDir": "/tmp/projects",
            "providerConfig": {"modelProvider": "auto"},
            "deckSession": {
                "schemaVersion": "deck-session-v6",
                "phase": "outline",
                "slides": [
                    {"slideId": "P01", "title": "Cover"},
                    {"slideId": "P02", "title": "Context"},
                    {"slideId": "P03", "title": "Evidence"},
                    {"slideId": "P04", "title": "Action"}
                ]
            }
        });

        let job: DesktopJob = serde_json::from_value(payload.clone()).expect("deserialize job");
        let encoded = serde_json::to_value(job).expect("serialize job");

        assert_eq!(encoded["deckSession"], payload["deckSession"]);
        assert!(encoded.get("deck_session").is_none());
    }

    #[test]
    fn preserve_edit_request_serializes_camel_case() {
        let payload = json!({
            "sourcePath": "/tmp/deck.pptx",
            "outputPath": "/tmp/repaired.pptx",
            "edits": [
                {"slide": 2, "replacements": {"旧结论": "新结论"}}
            ]
        });
        let request: PreserveEditRequest =
            serde_json::from_value(payload.clone()).expect("deserialize request");
        let encoded = serde_json::to_value(request).expect("serialize request");
        assert_eq!(encoded["sourcePath"], payload["sourcePath"]);
        assert_eq!(encoded["outputPath"], payload["outputPath"]);
        assert_eq!(encoded["edits"][0]["slide"], 2);
        assert_eq!(encoded["edits"][0]["replacements"]["旧结论"], "新结论");
        assert!(encoded.get("source_path").is_none());
    }

    #[test]
    fn inspect_pptx_request_serializes_camel_case() {
        let payload = json!({ "sourcePath": "/tmp/deck.pptx" });
        let request: InspectPptxRequest =
            serde_json::from_value(payload.clone()).expect("deserialize request");
        let encoded = serde_json::to_value(request).expect("serialize request");
        assert_eq!(encoded["sourcePath"], payload["sourcePath"]);
        assert!(encoded.get("source_path").is_none());
    }
}
