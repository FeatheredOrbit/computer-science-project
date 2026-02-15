import React, { useState } from 'react';
import "../../styles/signup.css";
import { invoke } from '@tauri-apps/api/core';

type Props = {
    onNavigate: (input: string) => void
};

export default function SignupWindow({onNavigate}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");

    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    async function signupClicked() {
        // These regexes were grabbed off Google, ain't no way I'll write these myself.

        let valid = true;

        // Validates the email's format, writing an error if failed.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
            setEmailError("Email format invalid");
            valid = false;
        }

        // Validates the password's format, writing an error based on what went wrong.
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

        if (message.trim().length > 0) {
            setEmailError(message);
            return;
        }

        await invoke("create_signup_subwindow");
    }

    React.useEffect(function() {

        if (emailInput.trim().length > 0 && passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }

    }, [emailInput, passwordInput]);

    return (
        <div>   
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
            onChange={(e) => {
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
                onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                }}
            />
            <p 
                className="show-password-button" 
                onClick={() => setShowPassword(!showPassword)}
            > 
                👁 
            </p>
            <div className="password-error-container">
                <p className="password-error"> {passwordError} </p>
            </div>

            <button 
            className="signup-button" 
            disabled={isButtonDisabled}
            onClick={signupClicked}> SIGN UP </button>

            <img className="logo-image" src="assets/logo.png"/>

            <div className="login-redirect-container">
                <p className="login-redirect"> ALREADY HAVE AN ACCOUNT? { }
                    <span style={{textDecoration: "underline"}} onClick={function() {onNavigate("/")}}>CLICK HERE. </span> 
                </p>
            </div>
        </div>  
    );
}