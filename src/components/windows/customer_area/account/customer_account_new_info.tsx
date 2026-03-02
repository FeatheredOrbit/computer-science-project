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

export default function CustomerAccountNewInfo({onNavigate, customerAccountChange}: Props) {
    const [infoType, setInfoType] = useState("");
    const [infoInput, setInfoInput] = useState("");
    const [infoError, setInfoError] = useState("");

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        if (customerAccountChange === AccountChange.Requirements) {
            await appWindow.setSize(new LogicalSize(800, 600));
        } else {
            await appWindow.setSize(new LogicalSize(600, 450));
        }
    }

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
                // This should be unreachable, the only moments this is none is before a button for the first time is clicked in the window prior to this, 
                // so you can't reach this window with this staying as None.
                return;
        }

        onNavigate("/customer-account");
    }

    const getPlaceholder = function() {
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