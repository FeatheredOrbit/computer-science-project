import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import "../../../styles/staff_area_menu.css";

type Props = {
    onNavigate: (input: string) => void
};

export default function StaffAreaMenu({onNavigate}: Props) {
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(new LogicalSize(800, 540));
    }

    useEffect(function() {
        resizeWindow();
    }, []);

    return(
        <div>
            <img className="logo-image_menu" src="assets/logo.png" />

            <button className="back-to-login-button" onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate('/'); } }} onClick={function() {onNavigate("/")}}> BACK TO LOGIN </button>

            <button className="search-customer-button" onClick={function() {onNavigate("/customers");}}> SEARCH CUSTOMER </button>
            <button className="search-event-button" onClick={function() {onNavigate("/events");}}> SEARCH EVENT </button>
        </div>
    );
}