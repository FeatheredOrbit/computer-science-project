use std::sync::{Arc, Mutex};

use tauri::{EventId, State};

use crate::{LoggedUser, Session, database::{self, Database}};

#[tauri::command]
pub fn sign_out(session: State<Mutex<Session>>) {
    let mut session = session.lock().unwrap();

    session.change(LoggedUser::None);
}

#[tauri::command]
pub fn login_validate_details(
    database: State<Mutex<Database>>, 
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
    database: State<Mutex<Database>>, 
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
    database: State<Mutex<Database>>,
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

#[tauri::command]
pub fn account_get_info(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>
) -> (String, String, String, String) {
    let session = session.lock().unwrap();
    
    match session.state {
        LoggedUser::Customer(id) => {
            let database = database.lock().unwrap();

            // If the id is present its safe to assume the data is too, so we unwrap.
            let data = database.customer_table.main.get(&id).unwrap();

            return (
                data.name.clone(),
                data.email.clone(),
                data.phone_number.clone(),
                data.other_requirements.clone()
            );
        },
        LoggedUser::Staff(id) => {
            let database = database.lock().unwrap();

            // If the id is present its safe to assume the data is too, so we unwrap.
            let data = database.staff_table.main.get(&id).unwrap();

            return (
                data.name.clone(),
                data.email.clone(),
                data.phone_number.clone(),
                String::from("")
            );
        },
        LoggedUser::None => {
            return (
                String::from("No logged user"),
                String::from("No logged user"),
                String::from("No logged user"),
                String::from("No logged user")
            );
        }
    };
}

#[tauri::command]
pub fn account_validate_password(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>,
    password: String
) -> bool {
    let session = session.lock().unwrap();

    match session.state {
        LoggedUser::Customer(id) => {
            let database = database.lock().unwrap();

            // Again, blabla we unwrap because the only thing capable of failing in here is the argon hash blablabla. 
            return database.customer_table.verify_password(id, password).unwrap();
        }

        LoggedUser::Staff(id) => {
            let database = database.lock().unwrap();

            // Again, blabla we unwrap because the only thing capable of failing in here is the argon hash blablabla. 
            return database.staff_table.verify_password(id, password).unwrap();
        }

        LoggedUser::None => {
            // As you can't skip signup or login pages straight to here, and they force a spawn of a LoggedUser, this is ...
            unreachable!();
        }
    };
}

#[tauri::command]
pub fn change_name(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>,
    name: String
) {
    let session = session.lock().unwrap();

    match session.state {
        LoggedUser::Customer(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            let data = database.customer_table.main.get_mut(&id).unwrap();

            let old_name = data.name.clone();

            data.name = name.clone();

            // We need to update the look up table with the new name.
            database.customer_table.from_name.remove(&old_name);
            database.customer_table.from_name.insert(name.clone(), id);
        }
        LoggedUser::Staff(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            let data = database.staff_table.main.get_mut(&id).unwrap();

            data.name = name;
        }
        LoggedUser::None => {unreachable!()}
    }
}

#[tauri::command]
pub fn change_email(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>,
    email: String
) -> String {
    let session = session.lock().unwrap();

    let mut database = database.lock().unwrap();

    if let Some(_) = database.customer_table.from_email.get(&email) {
        return "Email already in use".to_string();
    }
    if let Some(_) = database.staff_table.from_email.get(&email) {
        return "Email already in use".to_string();
    }

    match session.state {
        LoggedUser::Customer(id) => {
            let data = database.customer_table.main.get_mut(&id).unwrap();

            // ✅ FIXED: Use email, not name
            let old_email = data.email.clone();

            data.email = email.clone();

            database.customer_table.from_email.remove(&old_email);
            database.customer_table.from_email.insert(email.clone(), id);

            return "".to_string();
        }
        LoggedUser::Staff(id) => {
            let data = database.staff_table.main.get_mut(&id).unwrap();

            // ✅ FIXED: Use email, not name
            let old_email = data.email.clone();

            data.email = email.clone();

            database.staff_table.from_email.remove(&old_email);
            database.staff_table.from_email.insert(email.clone(), id);

            return "".to_string();
        }
        LoggedUser::None => {unreachable!()}
    };
}

#[tauri::command]
pub fn change_password(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>,
    password: String
) {
    let session = session.lock().unwrap();

    match session.state {
        LoggedUser::Customer(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            database.customer_table.new_password(id, password);
        }
        LoggedUser::Staff(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            database.staff_table.new_password(id, password);
        }
        LoggedUser::None => {unreachable!()}
    }
}

#[tauri::command]
pub fn change_phone_number(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>,
    phone_number: String
) {
    let session = session.lock().unwrap();

    match session.state {
        LoggedUser::Customer(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            let data = database.customer_table.main.get_mut(&id).unwrap();

            data.phone_number = phone_number;
        }
        LoggedUser::Staff(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            let data = database.staff_table.main.get_mut(&id).unwrap();

            data.phone_number = phone_number;
        }
        LoggedUser::None => {unreachable!()}
    }
}

#[tauri::command]
pub fn change_requirements(
    session: State<Mutex<Session>>,
    database: State<Mutex<Database>>,
    requirements: String
) {
    let session = session.lock().unwrap();

    match session.state {
        LoggedUser::Customer(id) => {
            let mut database = database.lock().unwrap();

            // We safely assume there's data at that id.
            let data = database.customer_table.main.get_mut(&id).unwrap();

            data.other_requirements = requirements;
        }
        LoggedUser::Staff(id) => {unreachable!()}
        LoggedUser::None => {unreachable!()}
    }
}

#[tauri::command]
pub fn get_events(database: State<Mutex<Database>>) -> Vec<(u32, String, String, String, String)> {
    let database = database.lock().unwrap();

    let mut events: Vec<(u32, String, String, String, String)> = vec![];

    // We iterate through ever event in the event table to insert in the vector above, pretty useless as there's a single hardcoded event, but it's at least
    // supposed to allow for multiple existing events, and I perhaps might add more, who knows (I won't).
    for (id, event) in database.event_table.main.clone().into_iter() {
        events.push((
            id.0 as u32,
            event.name,
            event.event_date.to_string(),
            event.image_path,
            event.extra_information
        ));
    }

    return events;
}