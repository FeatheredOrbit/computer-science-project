use tauri::Manager;
use crate::database::Database;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {

            // Tauri has this nice function where it can keep structures alive for the duration of the app in the form of states.
            // I'm taking advantage of that by creating the database structure and letting Tauri manage it for me.
            if let Some(database) = Database::try_from_file(&app.handle()) {
                app.manage(database);
            }
            else { app.manage(Database::default()); }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
