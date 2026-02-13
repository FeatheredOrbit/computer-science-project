use std::collections::HashMap;
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