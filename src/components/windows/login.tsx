import { useState } from 'react';
import "../../styles/login.css";

export default function LoginWindow() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>   
            <div className="login-label-container">
                <h1 className="login-label"> LOG IN </h1>
            </div>

            <div className="email-label-container">
                <h1 className="email-label"> EMAIL </h1>
            </div>
            <input className="email-input" type="text" placeholder="person@gmail.com" />
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
            />
            <p 
                className="show-password-button" 
                onClick={() => setShowPassword(!showPassword)}
            > 
                👁 
            </p>
        </div>  
    );
}