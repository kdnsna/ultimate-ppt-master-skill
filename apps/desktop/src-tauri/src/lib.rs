use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopJob {
    source: SourceInput,
    output_mode: String,
    style_preset: String,
    project_dir: Option<String>,
    provider_config: Option<serde_json::Value>,
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

fn repo_root() -> Result<PathBuf, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .parent()
        .and_then(|desktop| desktop.parent())
        .and_then(|apps| apps.parent())
        .map(PathBuf::from)
        .ok_or_else(|| "Unable to resolve repository root from Tauri manifest directory".to_string())
}

fn python_executable(root: &PathBuf) -> String {
    let bundled = root.join(".venv").join("bin").join("python");
    if bundled.exists() {
        bundled.to_string_lossy().to_string()
    } else {
        "python3".to_string()
    }
}

fn worker_path(root: &PathBuf) -> PathBuf {
    root.join("apps").join("desktop").join("worker").join("desktop_worker.py")
}

fn run_worker(args: &[&str], stdin_json: Option<String>) -> Result<serde_json::Value, String> {
    let root = repo_root()?;
    let python = python_executable(&root);
    let mut command = Command::new(python);
    command.arg(worker_path(&root));
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
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Err(if stderr.is_empty() { stdout } else { stderr });
    }

    serde_json::from_slice(&output.stdout)
        .map_err(|err| format!("Worker returned invalid JSON: {err}"))
}

#[tauri::command]
fn inspect_environment() -> Result<CommandResult, String> {
    let data = run_worker(&["inspect"], None)?;
    Ok(CommandResult { ok: true, data })
}

#[tauri::command]
fn run_desktop_job(job: DesktopJob) -> Result<CommandResult, String> {
    let payload = serde_json::to_string(&job)
        .map_err(|err| format!("Failed to encode desktop job: {err}"))?;
    let data = run_worker(&["run", "--stdin"], Some(payload))?;
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
            open_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ultimate PPT Master desktop app");
}
