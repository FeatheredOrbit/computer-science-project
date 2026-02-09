use std::{collections::HashMap, path::PathBuf};
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct CustomerId(usize);

#[derive(Serialize, Deserialize)]
pub struct CustomerData {
    name: String,
    email: String,
    password_hash: String,
    password_salt: String,
    phone_number: String,
    other_requirements: String,
    failed_login_attempts: u8,
    lock_until: OffsetDateTime,
    created_at: Date
}

#[derive(Default, Serialize, Deserialize)]
pub struct CustomerTable {
    main: HashMap<CustomerId, CustomerData>,
    from_name: HashMap<String, CustomerId>,
    from_email: HashMap<String, CustomerId>
}
impl CustomerTable {
    /// Tries to build and return a [`CustomerTable`] from the given path.
    pub fn try_from_file(path: PathBuf) {
        
    }
}