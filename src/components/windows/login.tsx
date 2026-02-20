import React, { useState } from 'react';
import "../../styles/login.css";
import { LogicalSize } from '@tauri-apps/api/window';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';

type Props = {
    onNavigate: (input: string) => void
};

export default function LoginWindow({onNavigate}: Props) {
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    async function handleMount() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 640));

        await invoke("sign_out", {});
    }

    async function loginClicked() {
        const message = await invoke<[string, string, string]>("login_validate_details", {email: emailInput, password: passwordInput});

        // If the messages are empty, then the function succeded.
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

    React.useEffect(function() {
        handleMount();
    }, []);

    React.useEffect(function() {

        if (emailInput.trim().length > 0 && passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }

    }, [emailInput, passwordInput]);

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
            onChange={(e) => {setEmailInput(e.target.value)}} 
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
                onChange={(e) => {setPasswordInput(e.target.value)}}
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

            <button className="login-button" disabled={isButtonDisabled} onClick={loginClicked}> LOG IN </button>

            <img className="logo-image" src="assets/logo.png"/>

            <div className="signup-redirect-container">
                <p className="signup-redirect"> DON'T HAVE AN ACCOUNT? { }
                    <span style={{textDecoration: "underline"}} onClick={function() {onNavigate("/signup")}}>CLICK HERE. </span> 
                </p>
            </div>
        </div>  
    );
}