import { useState, useEffect } from 'react';
import "../../styles/login.css";
import { LogicalSize } from '@tauri-apps/api/dpi';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';

type Props = {
    onNavigate: (input: string) => void
};

// The login component of the program, allows users with an existing account to login using their credentials. Takes "onNavigate" to move to other components.
export default function Login({onNavigate}: Props) {
    // Set up states.
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Function that handles resizing the window to the proper dimensions required by this components. Also forces a signout.
    async function handleMount() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 640));

        await invoke("sign_out", {});
    }

    // Function that handles validation of email and password and subsequently login and navigation.  
    async function loginClicked() {
        const message = await invoke<[string, string, string]>("login_validate_details", {email: emailInput, password: passwordInput});

        // Navigates to the customer or staff area depending on the received message from the backend.
        if (message[0].trim().length === 0 && message[1].trim().length === 0) {
            if (message[2] === "customer") {
                onNavigate("/customer-menu");
            }
            else if (message[2] === "staff") {
                onNavigate("/staff-menu");
            }
        }

        setEmailError(message[0]);
        setPasswordError(message[1]);
    }

    // Call startup functions.
    useEffect(function() {
        handleMount();
    }, []);

    // Disables/enables the login button depending on the length of the input fields.
    useEffect(function() {

        if (emailInput.trim().length > 0 && passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }

    }, [emailInput, passwordInput]);

    // Structure of the page, nothing interesting.
    return (
        <div className="login-window">   
            <div className="login-label-container">
                <h1 className="login-label"> LOG IN </h1>
            </div>

            <div className="email-label-container">
                <h1 className="email-label"> EMAIL </h1>
            </div>
            <input 
            className="email-input" 
            type="email" 
            placeholder="person@gmail.com"
                onChange={function(e) { setEmailInput(e.target.value); }} 
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
                onChange={function(e) { setPasswordInput(e.target.value); }}
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
                className="login-button" 
                disabled={isButtonDisabled} 
                onKeyDown={function(e) { if (e.key === 'Enter' && !isButtonDisabled) { loginClicked(); } }}
                onClick={loginClicked}> LOG IN </button>

            <img className="logo-image" src="assets/logo.png"/>

            <div className="signup-redirect-container">
                <p className="signup-redirect"> DON'T HAVE AN ACCOUNT? { }
                    <span style={{textDecoration: "underline"}} onClick={function() {onNavigate("/signup")}}>CLICK HERE. </span> 
                </p>
            </div>
        </div>  
    );
}