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

export default function CommitReservation({onNavigate, chosenEventId, peopleCount, name, phoneNumber, requirements}: Props) {
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(500, 250));
    }

    function noClicked() {
        onNavigate("/reservation-creator");
    }

    async function yesClicked() {
        await invoke("commit_reservation", {name: name, phoneNumber: phoneNumber, requirements: requirements, eventId: chosenEventId, peopleCount: Number(peopleCount)});

        onNavigate("/customer-menu");
    }

    useEffect(function() {
        resizeWindow();
    }, []);

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