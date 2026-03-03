import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useEffect } from "react";
import "../../../../styles/change_customer_validate.css";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
};

// Component that validates the staff member's password before applying customer changes. Takes "onNavigate".
export default function ChangeCustomerValidate({onNavigate}: Props) {
    // Set up states for password input and validation message.
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [showPassword, setShowPassword] = useState(false);

    // Function that resizes the window for this view.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(600, 400));
    }

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
    }, []);

    useEffect(function() {
        if (passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [passwordInput]);

    // Function that validates the entered password with the backend and navigates to the apply page.
    async function validatePassword() {
        let result = await invoke<boolean>("account_validate_password", {password: passwordInput});

        if (!result) {
            setPasswordError("Password doesn't match");
        }

        onNavigate("/change-customer-apply");
    }

    // Structure of the page.
    return (
        <div className="change-customer-validate">
            <div className="insert-password-label">
                <h1 style={{fontSize: "50px"}}> INSERT PASSWORD </h1>
            </div>
            <input 
            className="insert-password-input" 
            type={showPassword ? "text" : "password"} 
            placeholder="841234u2343bvdfjniudcru"
            onChange={function(e) {setPasswordInput(e.target.value); setPasswordError("")}} 
            />
            <p 
                className="show-validate-password-button" 
                onClick={function() { setShowPassword(!showPassword); }}
            > 
                👁 
            </p>
            <div className="insert-password-error">
                <p> {passwordError} </p>
            </div>

            <button className="validate-password-confirm-button" disabled={isButtonDisabled} onKeyDown={function(e) { if (e.key === 'Enter' && !isButtonDisabled) { validatePassword(); } }} onClick={function() { validatePassword(); }}> CONFIRM </button>
        </div>
    );
}