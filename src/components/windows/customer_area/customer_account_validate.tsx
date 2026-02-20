import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import React from "react";
import "../../../styles/customer_account_validate.css";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
};

export default function CustomerAccountValidate({onNavigate}: Props) {
    const [passwordInput, setPasswordInput] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");

    const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);

    const [showPassword, setShowPassword] = React.useState(true);

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(600, 400));
    }

    React.useEffect(function() {
        resizeWindow();
    }, []);

    React.useEffect(function() {
        if (passwordInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [passwordInput]);

    async function validatePassword() {
        let result = await invoke<boolean>("account_validate_password", {password: passwordInput});

        if (!result) {
            setPasswordError("Password doesn;t match");
        }

        console.log("Hello boisssss!!! ............ And you girls too I guess ... ");
        onNavigate("/customer-menu/account/new-info");
    }

    return (
        <div className="customer-account-validate">
            <div className="insert-password-label">
                <h1 style={{fontSize: "50px"}}> INSERT PASSWORD </h1>
            </div>
            <input 
            className="insert-password-input" 
            type={showPassword ? "text" : "password"} 
            placeholder="841234u2343bvdfjniudcru"
            onChange={(e) => {setPasswordInput(e.target.value)}} 
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

            <button className="validate-password-confirm-button" disabled={isButtonDisabled} onClick={validatePassword}> CONFIRM </button>
        </div>
    );
}