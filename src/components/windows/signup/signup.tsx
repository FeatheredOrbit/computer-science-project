import { useState, useEffect } from 'react';
import "../../../styles/signup.css";
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalSize } from '@tauri-apps/api/dpi';

type Props = {
    onNavigate: (input: string) => void
};

// The signup component of the program, allows users to create a new account. Takes "onNavigate" to move to other components.
export default function Signup({onNavigate}: Props) {
    // Set up states.
    const [showPassword, setShowPassword] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");

    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Function that handles resizing the window to the proper dimensions required by this components. Also forces a signout.
    async function handleMount() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 640));

        await invoke("sign_out", {});
    }

    // Call startup functions.
    useEffect(function() {
        handleMount();
    }, []);

    // Disables/enables the signup button depending on the length of the input fields.
    useEffect(function() {

        if (emailInput.trim().length > 0 && passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }

    }, [emailInput, passwordInput]);

    // Function that handles validation of email and password and subsequently signup and navigation.  
    // It checks email format, then password length and complexity, then passes them to the backend for further validation and insertion in the database.
    async function signupClicked() {
        // If the regexes look blatantly copied off Google, that's because they are, can you even tell what's going on?
        let valid = true;

        // Email validation.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
            setEmailError("Email format invalid");
            valid = false;
        }

        // Password validation.
        if (passwordInput.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            valid = false;
        }
        if (!/[A-Z]/.test(passwordInput)) {
            setPasswordError("Password must contain at least one uppercase letter.");
            valid = false;
        }
        if (!/[a-z]/.test(passwordInput)) {
            setPasswordError("Password must contain at least one lowercase letter.");
            valid = false;
        }
        if (!/\d/.test(passwordInput)) {
            setPasswordError("Password must contain at least one digit.");
            valid = false;
        }
        if (!/[!@#$%^&*]/.test(passwordInput)) {
            setPasswordError("Password must contain at least one special character.");
            valid = false;
        }

        if (!valid) { return; }

        const message: string = await invoke("signup_validate_details", {email: emailInput, password: passwordInput});

        // Depending on the received message the outcome is between an error or success.
        if (message.trim().length > 0) {
            setEmailError(message);
            return;
        }

        onNavigate("/signup-set-info");
    }

    // Structure of the page, nothing interesting.
    return (
        <div className="signup-window">   
            <div className="signup-label-container">
                <h1 className="signup-label"> SIGN IN </h1>
            </div>

            <div className="email-label-container">
                <h1 className="email-label"> EMAIL </h1>
            </div>
            <input 
            className="email-input" 
            type="email" 
            placeholder="person@gmail.com" 
            onChange={function(e) {
                setEmailInput(e.target.value);
                setEmailError("");
            }}
            />
            <div className="email-error-container">
                <p className="email-error"> {emailError} </p>
            </div>

            <div className="password-label-container">
                <h1 className="password-label"> PASSWORD </h1>
            </div>
            <input 
                className="password-input" 
                type={showPassword ? "text" : "password"}
                placeholder="b@:ybz3VD#@:PyBJe" 
                onChange={function(e) {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                }}
            />
            <p 
                className="show-password-button" 
                onClick={function() { setShowPassword(!showPassword); }}
            > 
                👁 
            </p>
            <div className="password-error-container">
                <p className="password-error"> {passwordError} </p>
            </div>

            <button 
            className="signup-button" 
            disabled={isButtonDisabled}
            onKeyDown={function(e) { if (e.key === 'Enter' && !isButtonDisabled) { signupClicked(); } }}
            onClick={function() { signupClicked(); }}> SIGN UP </button>

            <img className="logo-image" src="assets/logo.png"/>

            <div className="login-redirect-container">
                <p className="login-redirect"> ALREADY HAVE AN ACCOUNT? { }
                    <span style={{textDecoration: "underline"}} onClick={function() {onNavigate("/")}}>CLICK HERE. </span> 
                </p>
            </div>
        </div>  
    );
}