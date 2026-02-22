use std::{error::Error, fs::File, io::{Read, Write}, sync::{Arc, Mutex}, thread};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::database::{customer::CustomerTable, event::EventTable, reservation::ReservationTable, staff::{StaffData, StaffTable}, support_request::SupportRequestTable};

pub mod customer;
pub mod staff;
pub mod event;
pub mod reservation;
pub mod support_request;
pub mod functions;

const DATABASE_FILE_PATH: &'static str = "database/database.moonlight_db";

#[derive(Default, Serialize, Deserialize)]
pub struct Database {
    pub customer_table: CustomerTable,
    pub staff_table: StaffTable,
    pub event_table: EventTable,
    pub reservation_table: ReservationTable,
    pub support_request_table: SupportRequestTable
}
impl Database {
    /// Tries to build and return a [`Database`] structure from a possibly existing database file. 
    pub fn try_from_file(app: AppHandle) -> Self {
        // Try to access the path to the OS's APP DATA folder
        if let Ok(path) = app.path().app_data_dir() {
            let path_to_database = path.join(DATABASE_FILE_PATH);

            // Attempt at opening the database file
            if let Ok(mut file) = File::open(path_to_database) {
                // Read the file contents
                let mut bytes = Vec::new();
            
                if let Err(_) = file.read_to_end(&mut bytes) { 
                    eprintln!("Reading database file failed, fallback to empty database");
                    return Self::default();
                }

                // Attempt at deserializing the bytes back into the database
                if let Ok(database) = postcard::from_bytes::<Database>(&bytes) {
                    return database;
                }

                eprintln!("Database deserialization failed, fallback to empty database");
                return Self::default();
            }
            else {
                eprintln!("Database file not found, fallback to empty database");
            }
    }
    
    // Return default database if anything fails
    Self::default()
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