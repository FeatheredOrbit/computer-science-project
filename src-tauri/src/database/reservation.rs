use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

use crate::database::{customer::CustomerId, event::EventId};

// Represents an id valid only in reservation tables.
#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ReservationId(pub usize);

// Represents data about a single reservation.
#[derive(Serialize, Deserialize)]
pub struct ReservationData {
    pub creator_name: String,
    pub creator_phone_number: String,
    pub requirements: String,
    pub people_count: u8,

    pub customer_id: CustomerId, // Foreign key linking to a customer
    pub event_id: EventId, // Foreign key linking to a event

    created_at: Date
}

// Stores data of every existing reservation.
#[derive(Default, Serialize, Deserialize)]
pub struct ReservationTable {
    pub main: HashMap<ReservationId, ReservationData>,
    pub from_customer: HashMap<CustomerId, ReservationId>,
    from_created_at: HashMap<Date, ReservationId>
}
impl ReservationTable {
    /// Function that adds a new reservation to the table.
    pub fn add_reservation(
        &mut self, 
        creator_name: String, 
        creator_phone_number: String, 
        requirements: String,
        event_id: EventId, 
        customer_id: CustomerId, 
        people_count: u8
    ) {
            
        // Create an id.
        let new_id = ReservationId(self.main.len());

        let now = OffsetDateTime::now_utc().date();

        // Insert and update lookups.
        self.main.insert(new_id, ReservationData {
            creator_name,
            creator_phone_number,
            requirements,
            customer_id: customer_id.clone(),
            event_id,
            people_count,
            created_at: now.clone()
        });

        self.from_customer.insert(customer_id, new_id);
        self.from_created_at.insert(now, new_id);
    }

    /// Function used to safely remove a reservation using an id, and reorders the existing ids.
    pub fn remove_reservation(&mut self, reservation_id: ReservationId) {
        // Remember current length before attempting removal.
        let prev_len = self.main.len();
        if prev_len == 0 {
            return;
        }

        // Remove the requested reservation and its lookup entries, if it exists.
        if let Some(removed) = self.main.remove(&reservation_id) {
            self.from_customer.remove(&removed.customer_id);
            self.from_created_at.remove(&removed.created_at);

            // If the removed id was not the last index, move the last entry into the freed slot so IDs remain contiguous (0..len-1). 
            // This prevents subsequent adds that use "main.len()" from creating duplicate ids.
            let last_index = prev_len - 1;
            if reservation_id.0 != last_index {

                let last_id = ReservationId(last_index);

                if let Some(last_data) = self.main.remove(&last_id) {
                    let cust_id = last_data.customer_id.clone();
                    let created_at = last_data.created_at.clone();

                    // Insert the moved data into the freed slot and update lookups.
                    self.main.insert(reservation_id, last_data);
                    self.from_customer.insert(cust_id, reservation_id);
                    self.from_created_at.insert(created_at, reservation_id);
                }
            }
        }
    }
}