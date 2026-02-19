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
) -> (String, String, String) {
    let database = database.lock().unwrap();
    let email = email.to_lowercase();
    
    // We set up some generic errors, to avoid having to rewrite them constantly.
    let email_error = String::from("Invalid email or password");
    let password_error = String::from("Invalid email or password");
    let login_type = String::new(); // Empty by default
    
    // We check both customer and staff table for an available id.
    let customer_id = database.customer_table.from_email.get(&email).copied();
    let staff_id = database.staff_table.from_email.get(&email).copied();
    
    // We determine which type of user logged in by checking each scenario.
    let user_type = match (customer_id, staff_id) {
        (Some(id), _) => Some((LoggedUser::Customer(id), "customer")),
        (_, Some(id)) => Some((LoggedUser::Staff(id), "staff")),
        (None, None) => None,
    };
    
    if let Some((user_type, type_str)) = user_type {
        // We verify the password.
        let password_valid = match user_type {
            LoggedUser::Customer(id) => {
                database.customer_table.verify_password(id, password)
                    .unwrap_or(false) 
            }
            LoggedUser::Staff(id) => {
                database.staff_table.verify_password(id, password)
                    .unwrap_or(false)
            }
            LoggedUser::None => unreachable!(), // This should never run
        };
        
        if password_valid {
            // Yippie login successfull.
            let mut session = session.lock().unwrap();
            session.change(user_type);
            return (
                String::new(),    
                String::new(),      
                type_str.to_string()
            );
        }
    }
    
    // If this is reached, it means something failed, so we simply return the errors.
    (email_error, password_error, login_type)
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
    // email lookup table there's any linked customer id or staff id.
    if let Some(_) = database.customer_table.from_email.get(&email) {
        return "Email is already in use".to_string();
    }
    if let Some(_) = database.staff_table.from_email.get(&email) {
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