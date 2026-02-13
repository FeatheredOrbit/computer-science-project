use std::collections::HashMap;
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