use std::sync::{Arc, Mutex};

use tauri::State;

use crate::database::Database;

#[tauri::command]
pub fn signup_validate_details(database: State<Arc<Mutex<Database>>>, email: String, password: String) -> String {
    let database = database.lock().unwrap();

    for (_id, data) in database.customer_table.main.iter() {
        if *data.email == email {
            return "Email is already in use".to_string();
        }
    };

    // If all goes well we return an empty string. On the frontend we will check the length of the returned string to find out if it succeded.
    return "".to_string();
}