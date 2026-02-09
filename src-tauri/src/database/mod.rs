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
    /// Tries to build and return a [`Database`] structure from a possibly existing .dat file. 
    pub fn try_from_file(app: &AppHandle) -> Option<Database> {
        let path_to_database = app.path().app_data_dir().expect("Failed to find app data directory").join("moonlight_theatre_database");

        None
    }
}