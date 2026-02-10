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
    pub fn try_from_file(app: AppHandle) -> Arc<Mutex<Self>> {

        // We create a dummy database, simply empty by default, wrapped in Arc to allow access from different threads,
        // and Mutex to allow safe access from multiple threads.
        let database = Arc::new(Mutex::new(Self::default()));
        let database_pass = database.clone();

        // This thread's purpose is to handle accessing database files and rebuilding the database. It uses a reference to the default database to potentially
        // rebuild it from the data in the database files, failure in doing will simply not change the default database passed to the app.
        thread::Builder::new().name("Database from file".to_string()).spawn(move || {

            // Try to access the path to the OS's APP DATA folder, as that's where the database is stored, if any.
            if let Ok(path) = app.path().app_data_dir() {

                let path_to_database = path.join("database");

                // We lock the pass to the database to allow safe editing accross threads, this won't slow down the main thread as the user won't be able to edit
                // databases before it's finished loading.
                let mut database_pass = database_pass.lock().unwrap();

                // We try and reassign tables into the database.
                if let Some(customer_table) = CustomerTable::try_from_file(path_to_database.clone()) {
                    database_pass.customer_table = customer_table;
                }
                if let Some(staff_table) = StaffTable::try_from_file(path_to_database.clone()) {
                    database_pass.staff_table = staff_table;
                }
                if let Some(event_table) = EventTable::try_from_file(path_to_database.clone()) {
                    database_pass.event_table = event_table;
                }
                if let Some(reservation_table) = ReservationTable::try_from_file(path_to_database.clone()) {
                    database_pass.reservation_table = reservation_table;
                }
                if let Some(support_request_table) = SupportRequestTable::try_from_file(path_to_database.clone()) {
                    database_pass.support_request_table = support_request_table;
                }

            }
            else { return }

        }).unwrap();

        // We return the default database immediately.
        return database;
    }
}