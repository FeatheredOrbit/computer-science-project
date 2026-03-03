import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../../styles/change_customer_info.css";
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

// Component that presents different account change options for a customer. Takes "onNavigate" and "setCustomerAccountChange" to control navigation and the selected change type.
export default function ChangeCustomerInfo({onNavigate, setCustomerAccountChange}: Props) {
    // Function that resizes the window for this view.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(500, 700));
    }

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
    }, []);

    // Handler for when one of the change buttons is clicked. Sets the requested change and navigates to validation.
    async function buttonClicked(arg: ButtonType) {
        switch (arg) {
            case ButtonType.Name:
                setCustomerAccountChange(AccountChange.Name);
                onNavigate("/change-customer-validate");
                return;

            case ButtonType.Email:
                setCustomerAccountChange(AccountChange.Email);
                onNavigate("/change-customer-validate");
                return;

            case ButtonType.Password:
                setCustomerAccountChange(AccountChange.Password);
                onNavigate("/change-customer-validate");
                return;

            case ButtonType.Phone:
                setCustomerAccountChange(AccountChange.Phone);
                onNavigate("/change-customer-validate");
                return;

            case ButtonType.Requirements:
                setCustomerAccountChange(AccountChange.Requirements);
                onNavigate("/change-customer-validate");
        } 
    }

    // Structure of the page.
    return (
        <div className="customer-change-info">
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

            <button className="back-to-account-button" onClick={function() {onNavigate("/change-customer")}}>
                BACK TO CUSTOMER ACCOUNT
            </button>
        </div>
    );
}