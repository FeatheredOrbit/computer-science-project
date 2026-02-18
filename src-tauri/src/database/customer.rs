use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::Date;
use argon2::{
    Argon2, password_hash::{
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng
    }
};
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct CustomerId(usize);

#[derive(Serialize, Deserialize)]
pub struct CustomerData {
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub phone_number: String,
    pub other_requirements: String,
    pub created_at: Date
}

#[derive(Default, Serialize, Deserialize)]
pub struct CustomerTable {
    pub main: HashMap<CustomerId, CustomerData>,
    pub from_name: HashMap<String, CustomerId>,
    pub from_email: HashMap<String, CustomerId>
}

impl CustomerTable {
    /// Function used to create a basic customer entry in the customer table. Only needs email and password.
    pub fn create_customer_base(&mut self, email: String, password: String) -> Result<CustomerId, argon2::password_hash::Error> {
        // To create an id to associate with the new customer, we take the length of the hashmap (we start from 0).
        let new_id = CustomerId(self.main.len());
        
        // Hash the password using Argon2
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();
        
        // Get current date for created_at
        let today = OffsetDateTime::now_utc().date();
        
        // Create the customer data
        let customer_data = CustomerData {
            name: String::new(),
            email: email.clone(),
            password_hash,
            phone_number: String::new(),
            other_requirements: String::new(),
            created_at: today
        };
        
        // Insert into the main hashmap
        self.main.insert(new_id, customer_data);
        
        // Update the lookup indices
        self.from_email.insert(email, new_id);
        
        Ok(new_id)
    }

    /// Function used to update extra information about the customer
    pub fn fill_in_customer(
        &mut self, 
        customer_id: CustomerId, 
        full_name: String, 
        phone_number: String, 
        other_requirements: String
    ) -> Result<(), String> {

        // Check if customer exists, again here we unwrap it, this is theoretically called AFTER the customer gets inserted into the database, so it should be
        // there when this runs. Fingers crossed of course.
        let customer = self.main.get_mut(&customer_id).ok_or_else(|| {
            format!("Customer with ID {:?} not found", customer_id)
        })?;
        
        // Handle name updates with lookup index
        let old_name = std::mem::take(&mut customer.name);
        
        // We insert the name in the database, if one was provided
        if !full_name.is_empty() {
            // Update the name in the customer data
            customer.name = full_name.clone();
            
            // Add to name lookup
            self.from_name.insert(full_name, customer_id);
        }
        
        // We insert the phone number in the database, if one was provided
        if !phone_number.is_empty() {    
            // Update the phone number in the customer data
            customer.phone_number = phone_number.clone();
        }
        
        // We insert the requiremenrs in the database, if any were provided
        if !other_requirements.is_empty() {
            customer.other_requirements = other_requirements;
        }
        
        Ok(())
    }
    
    /// Function used to verify a password against a hashed password of a customer.
    pub fn verify_password(&self, customer_id: CustomerId, password: &str) -> Result<bool, argon2::password_hash::Error> {
        if let Some(customer) = self.main.get(&customer_id) {

            let parsed_hash = PasswordHash::new(&customer.password_hash)?;
            let argon2 = Argon2::default();

            Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())

        } else {
            Ok(false)
        }
    }
}
