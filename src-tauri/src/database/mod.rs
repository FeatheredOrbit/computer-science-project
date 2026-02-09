use std::{sync::{Arc, Mutex}, thread};

use tauri::{AppHandle, Manager};

use crate::database::{customer::CustomerTable, event::EventTable, reservation::ReservationTable, staff::StaffTable, support_request::SupportRequestTable};

pub mod customer;
pub mod staff;
pub mod event;
pub mod reservation;
pub mod support_request;

#[derive(Default)]
pub struct Database {
    customer_table: CustomerTable,
    staff_table: StaffTable,
    event_table: EventTable,
    reservation_table: ReservationTable,
    support_request_table: SupportRequestTable
}
impl Database {
    /// Tries to build and return a [`Database`] structure from a possibly existing database folder. 
    pub fn try_from_file(app: &AppHandle) -> Arc<Mutex<Database>> {

        // We create a dummy database, simply empty by default, wrapped in Arc to allow access from different threads,
        // and Mutex to allow safe access from multiple threads.
        let database = Arc::new(Mutex::new(Self::default()));
        let database_pass = database.clone();

        // This thread's purpose is to handle accessing database files and rebuilding the database. It uses a reference to the default database to potentially
        // rebuild it from the data in the database files, failure in doing will simply not change the default database passed to the app.
        thread::Builder::new().name("Database from file".to_string()).spawn(move || {



        }).unwrap();

        // We return the default database immediately.
        return database;
    }
}