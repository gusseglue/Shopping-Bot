// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};

const SERVICE_NAME: &str = "shopping-assistant";
const API_URL: &str = "http://localhost:3001/api";

#[derive(Default)]
struct AppState {
    is_monitoring: Mutex<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: String,
    email: String,
    name: Option<String>,
    role: String,
    plan: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginResponse {
    #[serde(rename = "accessToken")]
    access_token: String,
    #[serde(rename = "refreshToken")]
    refresh_token: String,
    #[serde(rename = "expiresIn")]
    expires_in: i64,
    user: User,
}

#[derive(Debug, Serialize, Deserialize)]
struct Subscription {
    plan: String,
    status: String,
    #[serde(rename = "expiresAt")]
    expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct VerifyResponse {
    valid: bool,
    user: User,
    subscription: Subscription,
}

#[derive(Debug, Serialize, Deserialize)]
struct Watcher {
    id: String,
    name: String,
    url: String,
    status: String,
    #[serde(rename = "lastCheckAt")]
    last_check_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct WatchersResponse {
    items: Vec<Watcher>,
}

// Store token securely in OS keychain
#[tauri::command]
async fn store_token(token: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "access_token")
        .map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())?;
    Ok(())
}

// Get token from OS keychain
#[tauri::command]
async fn get_token() -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, "access_token")
        .map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Clear token from keychain
#[tauri::command]
async fn clear_token() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "access_token")
        .map_err(|e| e.to_string())?;
    match entry.delete_password() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// Login to API
#[tauri::command]
async fn login(email: String, password: String) -> Result<LoginResponse, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/auth/login", API_URL))
        .json(&serde_json::json!({
            "email": email,
            "password": password
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Login failed: {}", error_text));
    }

    response.json::<LoginResponse>().await.map_err(|e| e.to_string())
}

// Verify token with server
#[tauri::command]
async fn verify_token(token: String) -> Result<VerifyResponse, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/auth/verify", API_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err("Token verification failed".to_string());
    }

    response.json::<VerifyResponse>().await.map_err(|e| e.to_string())
}

// Get user's watchers
#[tauri::command]
async fn get_watchers() -> Result<Vec<Watcher>, String> {
    let token = get_token().await?.ok_or("No token found")?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/watchers", API_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err("Failed to fetch watchers".to_string());
    }

    let watchers_response: WatchersResponse = response.json().await.map_err(|e| e.to_string())?;
    Ok(watchers_response.items)
}

// Start monitoring
#[tauri::command]
async fn start_monitoring(state: State<'_, AppState>) -> Result<(), String> {
    let mut is_monitoring = state.is_monitoring.lock().unwrap();
    *is_monitoring = true;
    // TODO: Implement actual monitoring loop
    Ok(())
}

// Stop monitoring
#[tauri::command]
async fn stop_monitoring(state: State<'_, AppState>) -> Result<(), String> {
    let mut is_monitoring = state.is_monitoring.lock().unwrap();
    *is_monitoring = false;
    Ok(())
}

// Check if monitoring is active
#[tauri::command]
async fn is_monitoring(state: State<'_, AppState>) -> Result<bool, String> {
    let is_monitoring = state.is_monitoring.lock().unwrap();
    Ok(*is_monitoring)
}

fn main() {
    // Create system tray menu
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState::default())
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        let window = app.get_window("main").unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            store_token,
            get_token,
            clear_token,
            login,
            verify_token,
            get_watchers,
            start_monitoring,
            stop_monitoring,
            is_monitoring,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
