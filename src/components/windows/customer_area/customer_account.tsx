import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../styles/customer-account.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import React from "react";

type Props = {
    onNavigate: (input: string) => void
};

export default function CustomerAccountWindow({onNavigate}: Props) {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [phoneNumber, setPhoneNumber] = React.useState("");
    const [requirements, setRequirements] = React.useState("");

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(1000, 600));
    }

    React.useEffect(function() {
        resizeWindow();
    }, []);

    return (
        <div>
            <div className="account-label">
                <h1 style={{fontSize: "28px"}}> YOUR ACCOUNT </h1>
            </div>

            <div className="name-label">
                <h1 style={{fontSize: "20px"}}> FULL NAME </h1>
            </div>
            <div className="name-text">
                <p> {name} </p>
            </div>

            <div className="email-label">
                <h1 style={{fontSize: "20px"}}> EMAIL </h1>
            </div>
            <div className="email-text">
                <p> {email} </p>
            </div>

            <div className="phone-label">
                <h1 style={{fontSize: "20px"}}> PHONE NUMBER </h1>
            </div>
            <div className="phone-text">
                <p> {phoneNumber} </p>
            </div>

            <div className="requirements-label">
                <h1 style={{fontSize: "20px"}}> OTHER REQUIREMENTS </h1>
            </div>
            <div className="requirements-text">
                <p> {requirements} </p>
            </div>

            <button className="back-to-menu-button-customer-account" onClick={() => {onNavigate("/customer-menu")}}> BACK TO MENU </button>

            <button className="change-info-button-customer-account" onClick={() => {onNavigate("/customer-menu")}}> CHANGE ACCOUNT INFO </button>
        </div>
    );
}