import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import "../../../styles/signup-set-info.css";
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalSize } from '@tauri-apps/api/dpi';

type Props = {
    onNavigate: (input: string) => void
};

export default function SignupSetInfo({onNavigate}: Props) {
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [nameInput, setNameInput] = useState("");
    const [nameError, setNameError] = useState("");

    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const [requirementsInput, setRequirementsInput] = useState("");

    async function saveClicked() {
        let valid = true;

        // Checks if the full name sits below 100, if not shows an error.
        if (nameInput.trim().length > 100) {
            setNameError("Name must be below 100 characters");
            valid = false;
        }

        // Checks if the field is empty, if so shows an error.
        if (nameInput.trim().length === 0) {
            setNameError("Field can't be empty");
            valid = false;
        }

        // We check if the phone numbers is only made of digits, if not shows an error.
        const digitsOnly = phoneInput.replace(/\D/g, '');
        if (!(digitsOnly.length > 0 && digitsOnly === phoneInput.replace(/[^0-9+]/g, ''))) {
            setPhoneError("Phone number must only contain digits");
            valid = false;
        }

        // Check if the phone number sits between 10 and 15 digits, apparently there isn't a standard length? If not shows an error.
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            setPhoneError("Phone number must be between 10 and 15 digits");
            valid = false;
        }

        if (!valid) { return; }

        await invoke("signup_add_extra", {name: nameInput, phoneNumber: phoneInput, otherRequirements: requirementsInput});

        onNavigate("/customer-menu");
    }

    async function changeWindowSize() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 900));
    }

    React.useEffect(function() {
        changeWindowSize();
    }, []);

    React.useEffect(function() {
        if (nameInput.trim().length > 0 && phoneInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [nameInput, phoneInput]);

    return (
        <div>   
            <div className="name-label-container">
                <h1 className="name-label"> FULL NAME </h1>
            </div>
            <input 
            className="name-input" 
            type="text" 
            placeholder="John" 
            onChange={(e) => {
                setNameInput(e.target.value);
                setNameError("");
            }}
            />
            <div className="name-error-container">
                <p className="name-error"> {nameError} </p>
            </div>

            <div className="phone-label-container">
                <h1 className="phone-label"> PHONE NUMBER </h1>
            </div>
            <input 
            className="phone-input" 
            type="text" 
            placeholder="123-456-7890"
            onChange={(e) => {
                setPhoneInput(e.target.value);
                setPhoneError("");
            }}
            />
            <div className="phone-error-container">
                <p className="phone-error"> {phoneError} </p>
            </div>

            <div className="requirements-label-container">
                <h1 className="requirements-label"> OTHER REQUIREMENTS </h1>
            </div>
            <input 
            className="requirements-input" 
            type="text" 
            placeholder="I'm in a wheelchair" 
            onChange={(e) => {
                setRequirementsInput(e.target.value);
            }}
            />

            <button 
            className="skip-button" 
            onClick={() => {onNavigate("/customer-menu")}}> SKIP </button>

            <button 
            className="save-button" 
            disabled={isButtonDisabled}
            onClick={saveClicked}> SAVE </button>
        </div>  
    );
}