use std::{collections::HashMap, fs::File, io::Read, path::PathBuf};
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
    pub fn try_from_file(path: PathBuf) -> Option<Self> {
        if let Ok(mut file) = File::open(path.join("customer.dat")) {

            // We attempt at dumping the file's contents into the vector, otherwise we return a warning and skip the step.
            let mut bytes = Vec::new();
            
            if let Err(_) = file.read_to_end(&mut bytes) { 
                eprintln!("Customer table not found");
                return None; 
            }

            // We attempt at deserializing the bytes back into a table, failure in doing so will simply skip the step with a warning message.
            if let Ok(table) = postcard::from_bytes::<CustomerTable>(&bytes) {
                return Some(table);
            }

            eprintln!("Customer table deserialization failed");
            return None;
        };

        return None;
    }
}