use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

use crate::database::staff::StaffId;

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct EventId(usize);

#[derive(Serialize, Deserialize)]
pub struct EventData {
    name: String,
    event_date: OffsetDateTime,
    image_path: String,
    extra_information: String,
    created_by: StaffId, // Foreign key that links to the staff table
    created_at: Date,
    is_active: bool // Whether the event is still happening or not
}

#[derive(Default, Serialize, Deserialize)]
pub struct EventTable {
    main: HashMap<EventId, EventData>,
    from_event_date: HashMap<OffsetDateTime, EventId>,
    from_created_by: HashMap<StaffId, EventId>,
    from_created_at: HashMap<Date, EventId>
}