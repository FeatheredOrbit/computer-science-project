import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useEffect } from "react";
import "../../../../styles/customer_account_validate.css";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
};

// Component that acts as a validation step for customers before they change something about their account. Takes "onNavigate" to move to other windows.
export default function CustomerAccountValidate({onNavigate}: Props) {
    // Set up states.
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [showPassword, setShowPassword] = useState(false);

    // Resize window to meet component expectations.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(600, 400));
    }

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
    }, []);

    // Enabled/disabled button based on whether or not there is input in the field.
    useEffect(function() {
        if (passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [passwordInput]);

    // Function that invokes a backend function which essentially compares the inputted password with the user's actual password.
    async function validatePassword() {
        let result = await invoke<boolean>("account_validate_password", {password: passwordInput});

        if (!result) {
            setPasswordError("Password doesn't match");
            return;
        }

        // Error or continue based on result.

        onNavigate("/customer-account-new-info");
    }

    // Structure of the page.
    return (
        <div className="customer-account-validate">
            <div className="insert-password-label">
                <h1 style={{fontSize: "50px"}}> INSERT PASSWORD </h1>
            </div>
            <input 
            className="insert-password-input" 
            type={showPassword ? "text" : "password"} 
            placeholder="841234u2343bvdfjniudcru"
            onChange={function(e) {setPasswordInput(e.target.value); setPasswordError("");}} 
            />
            <p 
                className="show-validate-password-button" 
                onClick={() => setShowPassword(!showPassword)}
            > 
                👁 
            </p>
            <div className="insert-password-error">
                <p> {passwordError} </p>
            </div>

            <button className="validate-password-confirm-button" 
            disabled={isButtonDisabled} 
            onKeyDown={function(e) { if (e.key === 'Enter' && !isButtonDisabled) { validatePassword() } }}
            onClick={validatePassword}> CONFIRM </button>
        </div>
    );
}