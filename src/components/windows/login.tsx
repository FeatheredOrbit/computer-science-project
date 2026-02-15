import React, { useState } from 'react';
import "../../styles/login.css";

type Props = {
    onNavigate: (input: string) => void
};

export default function LoginWindow({onNavigate}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");

    React.useEffect(function() {

        if (emailInput.trim().length > 0 && passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }

    }, [emailInput, passwordInput]);

    return (
        <div>   
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
                <p className="email-error"> Bad email </p>
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
                <p className="password-error"> Bad password </p>
            </div>

            <button className="login-button" disabled={isButtonDisabled}> LOG IN </button>

            <img className="logo-image" src="assets/logo.png"/>

            <div className="signup-redirect-container">
                <p className="signup-redirect"> DON'T HAVE AN ACCOUNT? { }
                    <span style={{textDecoration: "underline"}} onClick={function() {onNavigate("/signup")}}>CLICK HERE. </span> 
                </p>
            </div>
        </div>  
    );
}