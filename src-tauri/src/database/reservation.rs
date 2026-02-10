use std::{collections::HashMap, fs::File, io::Read, path::PathBuf};
use serde::{Deserialize, Serialize};
use time::Date;

use crate::database::{customer::CustomerId, event::EventId};

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ReservationId(usize);

#[derive(Serialize, Deserialize)]
pub struct ReservationData {
    customer_id: CustomerId, // Foreign key linking to a customer
    event_id: EventId, // Foreign key linking to a event
    people_count: u8,

    seating_layout: Vec<usize>, // We hold a vector of indices, each pointing to a selected seat in the reservation
    created_at: Date
}

#[derive(Default, Serialize, Deserialize)]
pub struct ReservationTable {
    main: HashMap<ReservationId, ReservationData>,
    from_customer: HashMap<CustomerId, ReservationId>,
    from_created_at: HashMap<Date, ReservationId>
}
impl ReservationTable {
    /// Tries to build and return a [`ReservationTable`] from the given path.
    pub fn try_from_file(path: PathBuf) -> Option<Self> {
        if let Ok(mut file) = File::open(path.join("reservation.dat")) {

            // We attempt at dumping the file's contents into the vector, otherwise we return a warning and skip the step.
            let mut bytes = Vec::new();
            
            if let Err(_) = file.read_to_end(&mut bytes) { 
                eprintln!("Reservation table not found");
                return None; 
            }

            // We attempt at deserializing the bytes back into a table, failure in doing so will simply skip the step with a warning message.
            if let Ok(table) = postcard::from_bytes::<ReservationTable>(&bytes) {
                return Some(table);
            }

            eprintln!("Reservation table deserialization failed");
            return None;
        };

        return None;
    }
}