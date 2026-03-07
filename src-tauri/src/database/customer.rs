use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use time::Date;
use argon2::{
    Argon2, password_hash::{
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng
    }
};
use time::OffsetDateTime;

// Represents an id valid only in customer tables.
#[derive(Debug, Serialize, Deserialize, Clone, Copy, Hash, PartialEq, Eq)]
pub struct CustomerId(pub usize);

// Represents data about a customer.
#[derive(Serialize, Deserialize)]
pub struct CustomerData {
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub phone_number: String,
    pub other_requirements: String,
    pub created_at: Date
}

//Holds data about all existing customers.
#[derive(Default, Serialize, Deserialize)]
pub struct CustomerTable {
    pub main: HashMap<CustomerId, CustomerData>,
    pub from_name: HashMap<String, CustomerId>,
    pub from_email: HashMap<String, CustomerId>
}

impl CustomerTable {
    /// Function used to create a basic customer entry in the customer table. Only needs email and password.
    pub fn create_customer_base(&mut self, email: String, password: String) -> Result<CustomerId, argon2::password_hash::Error> {
        // To create an id to associate with the new customer, we take the length of the hashmap, as we start indexing from 0.
        let new_id = CustomerId(self.main.len());
        
        // Hash the password using Argon2.
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();
        
        // Get the current date.
        let today = OffsetDateTime::now_utc().date();
        
        // Create the customer data.
        let customer_data = CustomerData {
            name: String::new(),
            email: email.clone(),
            password_hash,
            phone_number: String::new(),
            other_requirements: String::new(),
            created_at: today
        };
        
        // Insert into the main hashmap.
        self.main.insert(new_id, customer_data);
        
        // Update the email lookup table.
        self.from_email.insert(email, new_id);
        
        Ok(new_id)
    }

    /// Function used to update extra information about the customer.
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
        
        // We insert the name in the database, if one was provided.
        if !full_name.is_empty() {
            // Update the name in the customer data.
            customer.name = full_name.clone();
            
            // Add to name lookup table.
            self.from_name.insert(full_name, customer_id);
        }
        
        // We insert the phone number in the database, if one was provided.
        if !phone_number.is_empty() {    
            // Update the phone number in the customer data.
            customer.phone_number = phone_number.clone();
        }
        
        // We insert the requiremenrs in the database, if any were provided.
        if !other_requirements.is_empty() {
            customer.other_requirements = other_requirements;
        }
        
        Ok(())
    }
    
    /// Function used to verify a password against a hashed password of a customer.
    pub fn verify_password(&self, customer_id: CustomerId, password: String) -> Result<bool, argon2::password_hash::Error> {
        if let Some(customer) = self.main.get(&customer_id) {

            let parsed_hash = PasswordHash::new(&customer.password_hash)?;
            let argon2 = Argon2::default();

            Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())

        } else {
            Ok(false)
        }
    }

    /// Function that genereates a hash and a salt from a password.
    pub fn new_password(&mut self, customer_id: CustomerId, password: String) {
        // Hash the password using Argon2.
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let password_hash = argon2.hash_password(password.as_bytes(), &salt).unwrap().to_string();

        self.main.get_mut(&customer_id).unwrap().password_hash = password_hash;
    }

    /// Function that safely removes a customer and updates lookups.
    /// It returns the removed id, as it needed to also remove linked reservations.
    pub fn remove_customer(&mut self, customer_id: CustomerId) -> Option<(CustomerId, CustomerId)> {
        let prev_len = self.main.len();
        if prev_len == 0 {
            return None;
        }

        if let Some(removed) = self.main.remove(&customer_id) {

            self.from_email.remove(&removed.email);
            self.from_name.remove(&removed.name);

            let last_index = prev_len - 1;
            if customer_id.0 != last_index {

                let last_id = CustomerId(last_index);

                if let Some(last_data) = self.main.remove(&last_id) {

                    let email = last_data.email.clone();
                    let name = last_data.name.clone();

                    self.main.insert(customer_id, last_data);
                    self.from_email.insert(email, customer_id);
                    self.from_name.insert(name, customer_id);

                    return Some((last_id, customer_id));
                }
            }
        }

        return None;
    }

    /// Set the customer's name and update the name lookup table.
    pub fn set_name(&mut self, customer_id: CustomerId, new_name: String) {
        let data = self.main.get_mut(&customer_id).unwrap();

        let old_name = data.name.clone();

        data.name = new_name.clone();

        self.from_name.remove(&old_name);
        self.from_name.insert(new_name, customer_id);
    }

    /// Set the customer's email and update the email lookup table.
    pub fn set_email(&mut self, customer_id: CustomerId, new_email: String) {
        let data = self.main.get_mut(&customer_id).unwrap();

        let old_email = data.email.clone();

        data.email = new_email.clone();

        self.from_email.remove(&old_email);
        self.from_email.insert(new_email, customer_id);
    }

    /// Set the customer's phone number.
    pub fn set_phone_number(&mut self, customer_id: CustomerId, phone_number: String) {
        let data = self.main.get_mut(&customer_id).unwrap();
        data.phone_number = phone_number;
    }

    /// Set the customer's other requirements.
    pub fn set_requirements(&mut self, customer_id: CustomerId, requirements: String) {
        let data = self.main.get_mut(&customer_id).unwrap();
        data.other_requirements = requirements;
    }
}
