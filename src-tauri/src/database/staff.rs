use std::{collections::HashMap, fs::File, io::Read, path::PathBuf};
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
impl StaffTable {
    /// Tries to build and return a [`StaffTable`] from the given path.
    pub fn try_from_file(path: PathBuf) -> Option<Self> {
        if let Ok(mut file) = File::open(path.join("staff.dat")) {

            // We attempt at dumping the file's contents into the vector, otherwise we return a warning and skip the step.
            let mut bytes = Vec::new();
            
            if let Err(_) = file.read_to_end(&mut bytes) { 
                eprintln!("Staff table not found");
                return None; 
            }

            // We attempt at deserializing the bytes back into a table, failure in doing so will simply skip the step with a warning message.
            if let Ok(table) = postcard::from_bytes::<StaffTable>(&bytes) {
                return Some(table);
            }

            eprintln!("Staff table deserialization failed");
            return None;
        };

        return None;
    }
}