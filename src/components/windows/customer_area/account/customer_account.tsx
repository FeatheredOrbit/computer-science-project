import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../../styles/customer-account.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
};

export default function CustomerAccountWindow({onNavigate}: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [requirements, setRequirements] = useState("");

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(1000, 600));
    }

    async function getCustomerInfo() {
        let info = await invoke<[string, string, string, string]>("account_get_info", {});

        setName(info[0]);
        setEmail(info[1]);
        setPhoneNumber(info[2]);
        setRequirements(info[3]);
    }

    useEffect(function() {
        resizeWindow();
        getCustomerInfo();
    }, []);

    return (
        <div className="customer-account">
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

            <button className="change-info-button-customer-account" onClick={() => {onNavigate("/customer-account-change-info")}}> CHANGE ACCOUNT INFO </button>
        </div>
    );
}