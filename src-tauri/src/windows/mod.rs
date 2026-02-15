use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub fn create_signup_subwindow(app: AppHandle) {
    // We avoid creating the window if it already exists.
    if let Some(_) = app.webview_windows().get("signup_subwindow") {
        return;
    }

    WebviewWindowBuilder::new(&app, "signup_subwindow", WebviewUrl::App("/signup".into()))
    .resizable(false)
    .closable(false)
    .inner_size(800.0, 640.0)
    .build()
    .unwrap();
}