use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct StaffId(usize);

#[derive(Serialize, Deserialize)]
pub struct StaffData {
    name: String,
    email: String,
    password_hash: String,
    password_salt: String,
    phone_number: String,
    failed_login_attempts: u8,
    lock_until: OffsetDateTime,
    created_at: Date
}

#[derive(Default, Serialize, Deserialize)]
pub struct StaffTable {
    main: HashMap<StaffId, StaffData> // Staff members don't need special sorting so can be referenced solely through ID.
}