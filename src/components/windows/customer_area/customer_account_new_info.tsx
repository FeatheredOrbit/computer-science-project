import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import React from "react";
import "../../../styles/customer_account_new_info.css";
import { invoke } from "@tauri-apps/api/core";
import { AccountChange } from "../../../misc";

type Props = {
    onNavigate: (input: string) => void,
    customerAccountChange: AccountChange,
    setCustomerAccountChange: React.Dispatch<React.SetStateAction<AccountChange>>
};

export default function CustomerAccountNewInfo({onNavigate, customerAccountChange, setCustomerAccountChange}: Props) {
    const [infoType, setInfoType] = React.useState("");
    const [infoInput, setInfoInput] = React.useState("");
    const [infoError, setInfoError] = React.useState("");

    const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);

    const [showPassword, setShowPassword] = React.useState(true);

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(600, 400));
    }

    React.useEffect(function() {
        resizeWindow();

        switch(customerAccountChange) {
            case AccountChange.Name:
                setInfoType("NAME");
                return;

            case AccountChange.Email:
                setInfoType("EMAIL");
                return;

            case AccountChange.Password:
                setInfoType("PASSWORD");
                return;

            case AccountChange.Phone:
                setInfoType("PHONE NUMBER");
                return;

            case AccountChange.Requirements:
                setInfoType("REQUIREMENTS");
                return;

            case AccountChange.None:
                setInfoType("NULL");
                return;
        }
    }, []);

    async function validateInfo() {
        onNavigate("/customer-account");
    }

    React.useEffect(function() {
        if (infoInput.trim().length > 0) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [infoInput]);

    return (
        <div className="customer-account-new-info">
            <div className="insert-info-label">
                <h1 style={{fontSize: "50px"}}> INSERT NEW {infoType} </h1>
            </div>
            <input 
            className="insert-info-input" 
            type={showPassword ? "text" : "password"} 
            placeholder="841234u2343bvdfjniudcru"
            onChange={(e) => {setInfoInput(e.target.value)}} 
            />
            <p 
                className="show-password-button" 
                onClick={() => setShowPassword(!showPassword)}
            > 
                👁 
            </p>
            <div className="info-error">
                <p> {infoError} </p>
            </div>

            <button className="confirm-button" disabled={isButtonDisabled} onClick={validateInfo}> CONFIRM </button>
        </div>
    );
}