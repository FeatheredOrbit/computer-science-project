import { useState } from 'react';
import "../../styles/signup.css";

type Props = {
    onNavigate: (input: string) => void
};

export default function SignupWindow({onNavigate}: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>   
            <div className="signup-label-container">
                <h1 className="signup-label"> SIGN IN </h1>
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
            <div className="password-error-container">
                <p className="password-error"> Bad password </p>
            </div>

            <button className="signup-button" disabled={true}> SIGN UP </button>

            <img className="logo-image" src="assets/logo.png"/>

            <div className="login-redirect-container">
                <p className="login-redirect"> ALREADY HAVE AN ACCOUNT? 
                    <span style={{textDecoration: "underline"}} onClick={function() {onNavigate("/")}}> CLICK HERE. </span> 
                </p>
            </div>
        </div>  
    );
}