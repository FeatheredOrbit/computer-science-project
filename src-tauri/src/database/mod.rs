use std::{error::Error, fs::File, io::{Read, Write}, sync::{Arc, Mutex}, thread};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::database::{customer::CustomerTable, event::EventTable, reservation::ReservationTable, staff::StaffTable, support_request::SupportRequestTable};

pub mod customer;
pub mod staff;
pub mod event;
pub mod reservation;
pub mod support_request;
pub mod functions;

const DATABASE_FILE_PATH: &'static str = "database/database.moonlight_db";

#[derive(Default, Serialize, Deserialize)]
pub struct Database {
    customer_table: CustomerTable,
    staff_table: StaffTable,
    event_table: EventTable,
    reservation_table: ReservationTable,
    support_request_table: SupportRequestTable
}
impl Database {
    /// Tries to build and return a [`Database`] structure from a possibly existing database file. 
    pub fn try_from_file(app: AppHandle) -> Arc<Mutex<Self>> {

        // We create a dummy database, simply empty by default, wrapped in Arc to allow access from different threads,
        // and Mutex to allow safe access from multiple threads.
        let database = Arc::new(Mutex::new(Self::default()));
        let database_pass = database.clone();

        // This thread's purpose is to handle accessing database files and rebuilding the database. It uses a reference to the default database to potentially
        // rebuild it from the data in the database files, failure in doing will simply not change the default database passed to the app.
        thread::Builder::new().name("Database from file".to_string()).spawn(move || {

            // Try to access the path to the OS's APP DATA folder, as that's where the database file is stored, if any.
            if let Ok(path) = app.path().app_data_dir() {

                let path_to_database = path.join(DATABASE_FILE_PATH);

                // We lock the pass to the database to allow safe editing accross threads, this won't slow down the main thread as the user won't be able to edit
                // databases before it's finished loading.
                let mut database_pass = database_pass.lock().unwrap();

                // Attempt at opening the database file, failure in doing so will skip the step and send a warning message.
                if let Ok(mut file) = File::open(path_to_database) {

                    // We attempt at dumping the file's contents into the vector, otherwise we return a warning and skip the step.
                    let mut bytes = Vec::new();
            
                    if let Err(_) = file.read_to_end(&mut bytes) { 
                        eprintln!("Reading database file failed, fallback to empty database");
                        return; 
                    }

                    // We attempt at deserializing the bytes back into the database, failure in doing so will simply skip the step with a warning message.
                    if let Ok(dat) = postcard::from_bytes::<Database>(&bytes) {
                        *database_pass = dat;
                    }

                    eprintln!("Database deserialization failed, fallback to empty database");
                    return;
                }
                else {
                    eprintln!("Database file not found, fallback to empty databse");
                }

            }
            else { return }

        }).unwrap();

        // We return the default database immediately.
        return database;
    }

    pub fn try_to_file(&self, app: AppHandle) -> Result<(), Box<dyn Error>> {
        // We serialize the database into bytes.
       let bytes = postcard::to_allocvec(self)?;

       let path = app.path().app_data_dir()?;
       let path_to_database = path.join(DATABASE_FILE_PATH);

       let mut file = File::create(path_to_database)?;

        file.write_all(&bytes)?;

       Ok(())
    }
}