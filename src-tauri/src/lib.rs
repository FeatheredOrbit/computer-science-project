use tauri::{Manager, WindowEvent};
use crate::database::Database;

mod database;
mod windows;

use database::functions::signup_validate_details;
use windows::create_signup_subwindow;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {

            let app_handle = app.handle().clone();

            // Tauri has this nice function where it can keep structures alive for the duration of the app in the form of states.
            // I'm taking advantage of that by creating the database structure and letting Tauri manage it for me.
            app.manage(Database::try_from_file(app_handle.clone()));

            // As this program takes use of multiple windows, we need a way to exit the program when the main window closes.
            // Tauri exits the program when all the windows have been closed, or when manually exited, this means that if the main window is closed,
            // any other open window will keep the program running. 
            // To fix this we insert a callback into the main window's event handler, this callback will automatically iterate through existing windows
            // and close them, together with the main one, on any CloseRequested call.
            let main_window = app.get_webview_window("main").unwrap();

            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api: _, .. } = event {
                    for (label, window) in app_handle.webview_windows().iter_mut() {
                        // We avoid closing the main window, as it's going to close automatically.
                        if *label == "main".to_string() { continue; }

                        // We close the windows.
                        window.close().unwrap();
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_signup_subwindow,
            signup_validate_details
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
