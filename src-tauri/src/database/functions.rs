use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Manager, State};

use crate::{LoggedUser, database::Database};

#[tauri::command]
pub fn signup_validate_details(
    app: AppHandle,
    database: State<Arc<Mutex<Database>>>, 
    email: String, 
    password: String
) -> String {
    let mut database = database.lock().unwrap();

    for (_id, data) in database.customer_table.main.iter() {
        if *data.email == email {
            return "Email is already in use".to_string();
        }
    };

    // We cross our fingers and unwrap the result, as the only case this can fail is if the underlying argon hashing fails, and I won't have control over that.
    let user_id = database.customer_table.create_customer_base(email, password).unwrap();

    // We insert the logged user into the app as a state, this way it is available throughout the rest of its lifetime.
    app.manage(LoggedUser::Customer(user_id));

    // If all goes well we return an empty string. On the frontend we will check the length of the returned string to find out if it succeded.
    return "".to_string();
}

#[tauri::command]
pub fn signup_add_extra(
    logged_user: State<LoggedUser>,
    database: State<Arc<Mutex<Database>>>,
    name: String,
    phone_number: String,
    other_requirements: String
) {
    if let LoggedUser::Customer(id) = *logged_user {

        let mut database = database.lock().unwrap();

        // We unwrap the result, this should be fine as this is only reached if theres a stored user, if it still causes a crash, then thats out of my control.
        database.customer_table.fill_in_customer(id, name, phone_number, other_requirements).unwrap();

    }
}