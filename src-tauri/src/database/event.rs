use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime, PrimitiveDateTime, Time};

// Represents an id valid only in event tables.
#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct EventId(pub usize);

// Represents data about an event.
#[derive(Serialize, Deserialize, Clone)]
pub struct EventData {
    pub name: String,
    pub event_date: OffsetDateTime,
    pub image_path: String,
    pub extra_information: String,
    pub cost: u16
}

// Stores data about all existing events.
#[derive(Serialize, Deserialize)]
pub struct EventTable {
    pub main: HashMap<EventId, EventData>,
    pub from_event_date: HashMap<OffsetDateTime, EventId>
}
impl Default for EventTable {
    fn default() -> Self {
        let date = Date::from_calendar_date(2024, 3.try_into().unwrap(), 26).unwrap();
        let time = Time::from_hms(12, 0, 0).unwrap();
        
        let london_time = PrimitiveDateTime::new(date, time).assume_utc();
        
        let event_id = EventId(0);
        
        let event_data = EventData {
            name: String::from("WICKED"),
            event_date: london_time,
            image_path: String::from("assets/events/wicked.png"),
            extra_information: String::from("She is green and she is wicked or something like that i dont know"),
            cost: 5 // Pounds
        };
        
        let mut main = HashMap::new();
        main.insert(event_id, event_data);
        
        let mut from_event_date = HashMap::new();
        from_event_date.insert(london_time, event_id);
        
        Self {
            main,
            from_event_date
        }
    }
}