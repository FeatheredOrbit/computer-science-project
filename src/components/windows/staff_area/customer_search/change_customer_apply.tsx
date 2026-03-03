import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useEffect } from "react";
import "../../../../styles/change-customer-apply.css";
import { invoke } from "@tauri-apps/api/core";
import { AccountChange } from "../../../../misc";

type Props = {
    onNavigate: (input: string) => void,
    customerAccountChange: AccountChange
    customerId: number | undefined
};

// Component that accepts new customer information input and applies changes. Takes "onNavigate", "customerAccountChange" and "customerId".
export default function ChangeCustomerApply({onNavigate, customerAccountChange, customerId}: Props) {
    // Set up states for the input and validation.
    const [infoType, setInfoType] = useState("");
    const [infoInput, setInfoInput] = useState("");
    const [infoError, setInfoError] = useState("");

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Function that resizes the window depending on the selected change type.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        if (customerAccountChange === AccountChange.Requirements) {
            await appWindow.setSize(new LogicalSize(800, 600));
        } else {
            await appWindow.setSize(new LogicalSize(600, 450));
        }
    }

    // Call startup functions and set the displayed info type.
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

    useEffect(function() {
        if (infoInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [infoInput]);

    // Function that validates the input and sends the change to the backend when valid.
    async function validateInfo() {
        let valid = true;

        setInfoError("");

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

        switch (customerAccountChange) {
            case AccountChange.Name:
                await invoke("change_name_specific", {name: infoInput, id: customerId});
                break;

            case AccountChange.Email:
                const message = await invoke<string>("change_email_specific", {email: infoInput, id: customerId});

                if (message.trim().length > 0) {
                    setInfoError(message);
                    return;
                }

                break;

            case AccountChange.Password:
                await invoke("change_password_specific", {password: infoInput, id: customerId});
                break;

            case AccountChange.Phone:
                await invoke("change_phone_number_specific", {phone_number: infoInput, id: customerId});
                break;

            case AccountChange.Requirements:
                await invoke("change_requirements_specific", {requirements: infoInput, id: customerId});
                break;

            case AccountChange.None:
                return;
        }

        onNavigate("/change-customer");
    }

    // Helper that returns an appropriate placeholder for the current change type.
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

    // Structure of the page.
    return (
        <div className={`change-customer-apply ${customerAccountChange === AccountChange.Requirements ? 'requirements-mode' : ''}`}>
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
                    onClick={function() { setShowPassword(!showPassword); }}
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
                onKeyDown={function(e) { if (e.key === 'Enter' && !isButtonDisabled) { validateInfo(); } }}
                onClick={function() { validateInfo(); }}
            > 
                CONFIRM 
            </button>
        </div>
    );
}