import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useEffect } from "react";
import "../../../../styles/customer_account_new_info.css";
import { invoke } from "@tauri-apps/api/core";
import { AccountChange } from "../../../../misc";

type Props = {
    onNavigate: (input: string) => void,
    customerAccountChange: AccountChange
};

// Component that allows customer to change something about their account. Takes "onNavigate" to move to other windows, and "customerAccountChange" to know what
// to change.
export default function CustomerAccountNewInfo({onNavigate, customerAccountChange}: Props) {
    // Set up states.
    const [infoType, setInfoType] = useState("");
    const [infoInput, setInfoInput] = useState("");
    const [infoError, setInfoError] = useState("");

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Resize window to meet component expectations. The window is larger when changing requirements as more might be needed to be wrote down.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        if (customerAccountChange === AccountChange.Requirements) {
            await appWindow.setSize(new LogicalSize(800, 600));
        } else {
            await appWindow.setSize(new LogicalSize(600, 450));
        }
    }

    // Call startup functions and set up the correct label based on the value of "customerAccountChange".
    useEffect(function() {
        resizeWindow();

        switch(customerAccountChange) {
            case AccountChange.Name:
                setInfoType("NAME");
                break;
            case AccountChange.Email:
                setInfoType("EMAIL");
                break;
            case AccountChange.Password:
                setInfoType("PASSWORD");
                break;
            case AccountChange.Phone:
                setInfoType("PHONE NUMBER");
                break;
            case AccountChange.Requirements:
                setInfoType("REQUIREMENTS");
                break;
            case AccountChange.None:
                setInfoType("");
                break;
        }
    }, []);

    // Enables/disables button based on whether or not there's input in the input field. 
    useEffect(function() {
        if (infoInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [infoInput]);

    // Function that applies the correct validation on the data based on what's getting changed, and subsequently calls the correct backend function to update it.
    // Mane length must be higher than 0 and lower or equal to 100.
    // Email must follow email format.
    // Password must be at least 8 characters long, have upper and lower case letters, numbers and special characters.
    // Phone number must be only numerics and must be between 10 and 15 characters in length.
    // Requirements has no needed validation.
    async function validateInfo() {
        let valid = true;

        // Reset error.
        setInfoError("");

        // Use correct validation.
        switch(customerAccountChange) {
            case AccountChange.Name:
                if (infoInput.trim().length === 0) {
                    setInfoError("Field can't be empty");
                    valid = false;
                } else if (infoInput.trim().length > 100) {
                    setInfoError("Name must be below 100 characters");
                    valid = false;
                }
                break;

            case AccountChange.Email:
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoInput)) {
                    setInfoError("Email format invalid");
                    valid = false;
                }
                break;

            case AccountChange.Password:
                if (infoInput.length < 8) {
                    setInfoError("Password must be at least 8 characters long.");
                    valid = false;
                } else if (!/[A-Z]/.test(infoInput)) {
                    setInfoError("Password must contain at least one uppercase letter.");
                    valid = false;
                } else if (!/[a-z]/.test(infoInput)) {
                    setInfoError("Password must contain at least one lowercase letter.");
                    valid = false;
                } else if (!/\d/.test(infoInput)) {
                    setInfoError("Password must contain at least one digit.");
                    valid = false;
                } else if (!/[!@#$%^&*]/.test(infoInput)) {
                    setInfoError("Password must contain at least one special character.");
                    valid = false;
                }
                break;

            case AccountChange.Phone:
                const digitsOnly = infoInput.replace(/\D/g, '');
                if (!(digitsOnly.length > 0 && digitsOnly === infoInput.replace(/[^0-9+]/g, ''))) {
                    setInfoError("Phone number must only contain digits");
                    valid = false;
                } else if (digitsOnly.length < 10 || digitsOnly.length > 15) {
                    setInfoError("Phone number must be between 10 and 15 digits");
                    valid = false;
                }
                break;

            case AccountChange.Requirements:
                if (infoInput.trim().length > 500) {
                    setInfoError("Requirements must be below 500 characters");
                    valid = false;
                }
                break;
        }

        if (!valid) { return; }

        // Call correct backend function.
        switch (customerAccountChange) {
            case AccountChange.Name:
                await invoke("change_name", {name: infoInput});
                break;

            case AccountChange.Email:
                const message = await invoke<string>("change_email", {email: infoInput});

                if (message.trim().length > 0) {
                    setInfoError(message);
                    return;
                }

                break;

            case AccountChange.Password:
                await invoke("change_password", {password: infoInput});
                break;

            case AccountChange.Phone:
                await invoke("change_phone_number", {phoneNumber: infoInput});
                break;

            case AccountChange.Requirements:
                await invoke("change_requirements", {requirements: infoInput});
                break;

            case AccountChange.None:
                // This should be unreachable by normal usage.
                return;
        }

        onNavigate("/customer-account");
    }

    // Function that simply sets up the placeholder text of the input field based on what's getting changed.
    function getPlaceholder() {
        switch(customerAccountChange) {
            case AccountChange.Name: return "John";
            case AccountChange.Email: return "person@gmail.com";
            case AccountChange.Password: return "b@:ybz3VD#@:PyBJe";
            case AccountChange.Phone: return "123-456-7890";
            case AccountChange.Requirements: return "I'm in a wheelchair";
            default: return "";
        }
    };

    return (
        <div className={`customer-account-new-info ${customerAccountChange === AccountChange.Requirements ? 'requirements-mode' : ''}`}>
            <div className="insert-info-label">
                <h1 style={{fontSize: "50px"}}> INSERT NEW {infoType} </h1>
            </div>
            <input 
                className={`insert-info-input ${customerAccountChange === AccountChange.Requirements ? 'large-input' : ''}`}
                type={customerAccountChange === AccountChange.Password ? (showPassword ? "text" : "password") : "text"}
                placeholder={getPlaceholder()}
                onChange={function(e) {
                    setInfoInput(e.target.value);
                    setInfoError("");
                }} 
            />
            {customerAccountChange === AccountChange.Password && (
                <p 
                    className="show-password-button" 
                    onClick={() => setShowPassword(!showPassword)}
                > 
                    👁 
                </p>
            )}
            <div className="info-error">
                <p> {infoError} </p>
            </div>

            <button 
                className={`confirm-button ${customerAccountChange === AccountChange.Requirements ? 'large-input' : ''}`} 
                disabled={isButtonDisabled}
                onClick={validateInfo}
                onKeyDown={function(e) { if (e.key === 'Enter' && !isButtonDisabled) { validateInfo() } }}
            > 
                CONFIRM 
            </button>
        </div>
    );
}