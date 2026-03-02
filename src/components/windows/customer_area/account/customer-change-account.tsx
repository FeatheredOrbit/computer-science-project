import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../../styles/customer-change-account.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import React, { useEffect } from "react";
import { AccountChange } from "../../../../misc";

type Props = {
    onNavigate: (input: string) => void,
    setCustomerAccountChange: React.Dispatch<React.SetStateAction<AccountChange>>
};

enum ButtonType {
    Name,
    Email,
    Password,
    Phone,
    Requirements
}

export default function CustomerChangeAccount({onNavigate, setCustomerAccountChange}: Props) {
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(500, 700));
    }

    useEffect(function() {
        resizeWindow();
    }, []);

    async function buttonClicked(arg: ButtonType) {
        switch (arg) {
            case ButtonType.Name:
                setCustomerAccountChange(AccountChange.Name);
                onNavigate("/customer-account-validate");
                return;

            case ButtonType.Email:
                setCustomerAccountChange(AccountChange.Email);
                onNavigate("/customer-account-validate");
                return;

            case ButtonType.Password:
                setCustomerAccountChange(AccountChange.Password);
                onNavigate("/customer-account-validate");
                return;

            case ButtonType.Phone:
                setCustomerAccountChange(AccountChange.Phone);
                onNavigate("/customer-account-validate");
                return;

            case ButtonType.Requirements:
                setCustomerAccountChange(AccountChange.Requirements);
                onNavigate("/customer-account-validate");
        } 
    }

    return (
        <div className="customer-change-account">
            <button className="settings-button username-button" onClick={function() {buttonClicked(ButtonType.Name)}}>
                CHANGE USERNAME
            </button>
            
            <button className="settings-button email-button" onClick={function() {buttonClicked(ButtonType.Email)}}>
                CHANGE EMAIL ADDRESS
            </button>
            
            <button className="settings-button password-button" onClick={function() {buttonClicked(ButtonType.Password)}}>
                CHANGE PASSWORD
            </button>
            
            <button className="settings-button phone-button" onClick={function() {buttonClicked(ButtonType.Phone)}}>
                CHANGE PHONE NUMBER
            </button>
            
            <button className="settings-button requirements-button" onClick={function() {buttonClicked(ButtonType.Requirements)}}>
                CHANGE REQUIREMENTS
            </button>

            <button 
            className="back-to-account-button" 
            onClick={function() {onNavigate("/customer-account")}}
            onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate("/customer-account"); } }}>
                BACK TO ACCOUNT
            </button>
        </div>
    );
}