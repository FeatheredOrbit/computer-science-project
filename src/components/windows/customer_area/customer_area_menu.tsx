import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import "../../../styles/customer_area_menu.css";

type Props = {
    onNavigate: (input: string) => void
};

export default function CustomerAreaMenu({onNavigate}: Props) {
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 540));
    }

    useEffect(function() {
        resizeWindow();
    }, []);

    return(
        <div className="customer-area-menu">
            <img className="logo-image_menu" src="assets/logo.png" />

            <button className="back-to-login-button" onClick={() => {onNavigate("/")}}> BACK TO LOGIN </button>

            <button className="reservation-creator-button" onClick={() => {onNavigate("/reservation-creator")}}> RESERVATION CREATOR </button>
            <button className="your-reservations-button" onClick={() => {onNavigate("your-reservations")}}> YOUR RESERVATIONS </button>
            <button className="customer-account-button" onClick={() => {onNavigate("customer-account")}}> ACCOUNT </button>
        </div>
    );
}