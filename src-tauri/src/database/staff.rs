use std::collections::HashMap;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::{SaltString, rand_core::OsRng}};
use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};

#[derive(Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct StaffId(usize);

#[derive(Serialize, Deserialize)]
pub struct StaffData {
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub phone_number: String,
    pub created_at: Date
}

#[derive(Serialize, Deserialize)]
pub struct StaffTable {
    pub main: HashMap<StaffId, StaffData>,
    pub from_email: HashMap<String, StaffId>
}
impl Default for StaffTable {
    fn default() -> Self {
        let name = "Emily Jones".to_string();
        let email = "emilyjones@gmail.com".to_string();
        let password = "admin123ABCabc@@@".to_string();
        let phone_number = "1234567890".to_string();
        let created_at = OffsetDateTime::now_utc().date();

        // Hash the password using Argon2
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let password_hash = argon2.hash_password(password.as_bytes(), &salt).unwrap().to_string();

        let data = StaffData {
            name,
            email: email.clone(),
            password_hash,
            phone_number,
            created_at
        };

        let mut hashmap_main = HashMap::new();
        let mut hashmap_email = HashMap::new();

        hashmap_main.insert(StaffId(0), data);
        hashmap_email.insert(email, StaffId(0));

        return StaffTable { main: hashmap_main, from_email: hashmap_email };
    }
}
impl StaffTable {
    /// Function used to verify a password against a hashed password of a customer.
    pub fn verify_password(&self, staff_id: StaffId, password: String) -> Result<bool, argon2::password_hash::Error> {
        if let Some(staff) = self.main.get(&staff_id) {

            let parsed_hash = PasswordHash::new(&staff.password_hash)?;
            let argon2 = Argon2::default();

            Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())

        } else {
            Ok(false)
        }
    }
}