use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

use crate::database::{customer::CustomerId, event::EventId};

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ReservationId(pub usize);

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

#[derive(Default, Serialize, Deserialize)]
pub struct ReservationTable {
    pub main: HashMap<ReservationId, ReservationData>,
    from_customer: HashMap<CustomerId, ReservationId>,
    from_created_at: HashMap<Date, ReservationId>
}
impl ReservationTable {
    pub fn add_reservation(
        &mut self, 
        creator_name: String, 
        creator_phone_number: String, 
        requirements: String,
        event_id: EventId, 
        customer_id: CustomerId, 
        people_count: u8) {
        let new_id = ReservationId(self.main.len());

        let now = OffsetDateTime::now_utc().date();

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

    pub fn remove_reservation(&mut self, reservation_id: ReservationId) {
        if let Some(data) = self.main.remove(&reservation_id) {
            self.from_customer.remove(&data.customer_id);
            self.from_created_at.remove(&data.created_at);
        }
    }
}