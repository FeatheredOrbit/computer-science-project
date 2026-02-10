use std::{collections::HashMap, fs::File, io::Read, path::PathBuf};
use serde::{Deserialize, Serialize};
use time::Date;

use crate::database::customer::CustomerId;

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct SupportRequestId(usize);

#[derive(Serialize, Deserialize)]
pub struct SupportRequestData {
    customer_id: CustomerId, // Foreign key linking to a customer
    issue_type: String, // [REMINDER] Change this to an enum
    description: String,
    created_at: Date
}

#[derive(Default, Serialize, Deserialize)]
pub struct SupportRequestTable {
    main: HashMap<SupportRequestId, SupportRequestData>
}
impl SupportRequestTable {
    /// Tries to build and return a [`SupportRequestTable`] from the given path.
    pub fn try_from_file(path: PathBuf) -> Option<Self> {
        if let Ok(mut file) = File::open(path.join("support_request.dat")) {

            // We attempt at dumping the file's contents into the vector, otherwise we return a warning and skip the step.
            let mut bytes = Vec::new();
            
            if let Err(_) = file.read_to_end(&mut bytes) { 
                eprintln!("Support request table not found");
                return None; 
            }

            // We attempt at deserializing the bytes back into a table, failure in doing so will simply skip the step with a warning message.
            if let Ok(table) = postcard::from_bytes::<SupportRequestTable>(&bytes) {
                return Some(table);
            }

            eprintln!("Support request table deserialization failed");
            return None;
        };

        return None;
    }
}