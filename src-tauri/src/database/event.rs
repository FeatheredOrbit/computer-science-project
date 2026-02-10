use std::{collections::HashMap, fs::File, io::Read, path::PathBuf};
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
impl EventTable {
    /// Tries to build and return a [`EventTable`] from the given path.
    pub fn try_from_file(path: PathBuf) -> Option<Self> {
        if let Ok(mut file) = File::open(path.join("event.dat")) {

            // We attempt at dumping the file's contents into the vector, otherwise we return a warning and skip the step.
            let mut bytes = Vec::new();
            
            if let Err(_) = file.read_to_end(&mut bytes) { 
                eprintln!("Event table not found");
                return None; 
            }

            // We attempt at deserializing the bytes back into a table, failure in doing so will simply skip the step with a warning message.
            if let Ok(table) = postcard::from_bytes::<EventTable>(&bytes) {
                return Some(table);
            }

            eprintln!("Event table deserialization failed");
            return None;
        };

        return None;
    }
}