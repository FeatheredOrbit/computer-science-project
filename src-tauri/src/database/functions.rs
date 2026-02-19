use std::sync::{Arc, Mutex};

use tauri::State;

use crate::{LoggedUser, Session, database::Database};

#[tauri::command]
pub fn sign_out(session: State<Mutex<Session>>) {
    let mut session = session.lock().unwrap();

    session.change(LoggedUser::None);
}

#[tauri::command]
pub fn login_validate_details(
    database: State<Arc<Mutex<Database>>>, 
    session: State<Mutex<Session>>,
    email: String, 
    password: String
) -> (String, String) {
    let database = database.lock().unwrap();

    let email = email.to_lowercase();

    // We check if there's no associated customer under that email, returning error messages if so.
    if let None = database.customer_table.from_email.get(&email) {
        return (
            String::from("No account associated with this email"),
            String::from("Incorrect password")
        );
    };

    // If the previous check succeded, then we can safely unwrap the the result.
    let id = database.customer_table.from_email.get(&email).unwrap();

    // We check if the given email compares to the stored one, we unwrap the result, as the only thing capable of failing in the function is the argon hash,
    // which is out of my control.
    let password_success = database.customer_table.verify_password(*id, password).unwrap();

    // If the password doesn't match, return an error.
    if !password_success {
        return (
            String::from(""),
            String::from("Incorrect password")
        );
    };

    // If the previous check succeded, it's safe to assume the login was successfull, so we insert the logged user and we return an empty result.
    let mut session = session.lock().unwrap();

    session.change(LoggedUser::Customer(*id));

    return (
        String::from(""),
        String::from("")
    );
    
}

#[tauri::command]
pub fn signup_validate_details(
    session: State<Mutex<Session>>,
    database: State<Arc<Mutex<Database>>>, 
    email: String, 
    password: String
) -> String {
    let mut database = database.lock().unwrap();

    let email = email.to_lowercase();

    // We need to check if the email is already in use, we wan't to avoid accounts sharing an email for obvious reasons. To do so we check if in the
    // email lookup table there's any linked customer id.
    if let Some(_) = database.customer_table.from_email.get(&email) {
        return "Email is already in use".to_string();
    }

    // We cross our fingers and unwrap the result, as the only case this can fail is if the underlying argon hashing fails, and I won't have control over that.
    let user_id = database.customer_table.create_customer_base(email, password).unwrap();

    // We insert the logged user into the app as a state, this way it is available throughout the rest of its lifetime.
    let mut session = session.lock().unwrap();
    session.change(LoggedUser::Customer(user_id));

    // If all goes well we return an empty string. On the frontend we will check the length of the returned string to find out if it succeded.
    return "".to_string();
}

#[tauri::command]
pub fn signup_add_extra(
    session: State<Mutex<Session>>,
    database: State<Arc<Mutex<Database>>>,
    name: String,
    phone_number: String,
    other_requirements: String
) {
    let session = session.lock().unwrap();

    if let LoggedUser::Customer(id) = session.state {

        let mut database = database.lock().unwrap();

        // We unwrap the result, this should be fine as this is only reached if theres a stored user, if it still causes a crash, then thats out of my control.
        database.customer_table.fill_in_customer(id, name, phone_number, other_requirements).unwrap();

    }
}