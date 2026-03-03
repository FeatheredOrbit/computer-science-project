import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import "../../../styles/customer_area_menu.css";

type Props = {
    onNavigate: (input: string) => void
};

// The customer menu of the program, acts as a hub to every other window available to a customer. Takes "onNavigate" to move to other components.
export default function CustomerAreaMenu({onNavigate}: Props) {
    // Resize the window to meet the expection of the component.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 540));
    }

    // call startup functions.
    useEffect(function() {
        resizeWindow();
    }, []);

    // Structure of the page, nothing interesting.
    return(
        <div className="customer-area-menu">
            <img className="logo-image_menu" src="assets/logo.png" />

            <button 
            className="back-to-login-button" 
            onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate("/"); } }}
            onClick={function() {onNavigate("/");}}> BACK TO LOGIN </button>

            <button className="reservation-creator-button" onClick={function() {onNavigate("/reservation-creator");}}> RESERVATION CREATOR </button>
            <button className="your-reservations-button" onClick={function() {onNavigate("your-reservations");}}> YOUR RESERVATIONS </button>
            <button className="customer-account-button" onClick={function() {onNavigate("customer-account");}}> ACCOUNT </button>
        </div>
    );
}