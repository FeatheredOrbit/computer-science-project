use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

use crate::database::{customer::CustomerId, event::EventId};

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ReservationId(usize);

#[derive(Serialize, Deserialize)]
pub struct ReservationData {
    pub customer_id: CustomerId, // Foreign key linking to a customer
    pub event_id: EventId, // Foreign key linking to a event
    pub people_count: u8,

    created_at: Date
}

#[derive(Default, Serialize, Deserialize)]
pub struct ReservationTable {
    pub main: HashMap<ReservationId, ReservationData>,
    from_customer: HashMap<CustomerId, ReservationId>,
    from_created_at: HashMap<Date, ReservationId>
}
impl ReservationTable {
    pub fn add_event(&mut self, event_id: EventId, customer_id: CustomerId, people_count: u8) {
        let new_id = ReservationId(self.main.len());

        let now = OffsetDateTime::now_utc().date();

        self.main.insert(new_id, ReservationData {
            customer_id: customer_id.clone(),
            event_id,
            people_count,
            created_at: now.clone()
        });

        self.from_customer.insert(customer_id, new_id);
        self.from_created_at.insert(now, new_id);
    }
}