import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";

import "../../../../styles/commit-reservation.css";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
    chosenEventId: number | null
    peopleCount: string,
    name: string,
    phoneNumber: string,
    requirements: String
};

// Component that acts as confirmation for a reservation. It takes as many elements as the reservation creator, but this time it takes the globals themselves,
// as this is the page that will actually read them and write them to the database, the reservation creator was just the writer.
export default function CommitReservation({onNavigate, chosenEventId, peopleCount, name, phoneNumber, requirements}: Props) {
    // Resize the window to meet the expectations of the component.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(500, 250));
    }

    // Function called after clicking the no button, returns the user to the reservation creator window.
    function noClicked() {
        onNavigate("/reservation-creator");
    }

    // Function called after clicking the yes button, invokes a backend function that inserts the reservation and returns the user to the customer menu.
    async function yesClicked() {
        await invoke("commit_reservation", {name: name, phoneNumber: phoneNumber, requirements: requirements, eventId: chosenEventId, peopleCount: Number(peopleCount)});

        onNavigate("/customer-menu");
    }

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
    }, []);

    // Structure of the window.
    return (
        <div className="commit-reservation">
            <div className="label">
                <h1 style={{fontSize:"42px", textAlign:"center"}}> COMMIT RESERVATION? </h1>
            </div>

            <button className="no-button" onClick={noClicked}> NO </button>
            <button className="yes-button" 
                onClick={yesClicked}
                onKeyDown={function(e) { if (e.key === 'Enter') { yesClicked() } }}
            > YES </button>
        </div>
    );
}