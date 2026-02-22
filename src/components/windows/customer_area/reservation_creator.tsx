import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../styles/reservation-creator.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import React from "react";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
};

type EventData = [number, string, string, string, string];

// Yeah there has been a bit of a misunderstanding with myself and I often found myself interchanging event and play. In this context they are the same thing!!!

export default function ReservationCreatorWindow({onNavigate}: Props) {
    const [events, setEvents] = React.useState<EventData[] | null>(null);
    const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null);

    const [eventError, setEventError] = React.useState("");

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(900, 600));
    }

    async function getEvents() {
        const message = await invoke<EventData[]>("get_events", {});
        setEvents(message);
    }

    async function handleEventClick(eventId: number) {
        setSelectedEventId(eventId);
        
        console.log("Event selected:", eventId);
    }

    React.useEffect(() => {
        resizeWindow();
        getEvents();
    }, []);

    return (
        <div className="reservation-creator">
            <button className="back-to-menu-button" onClick={() => onNavigate("/customer-menu")}>
                BACK TO MENU
            </button>

            <div className="select-play-label">
                <h1 style={{fontSize:"42px", textAlign:"center"}}> SELECT A PLAY </h1>
            </div>
            <div className="select-play-error">
                <p style={{fontSize:"13px"}}> {eventError} </p>
            </div>

            <div className="events-scroll-container">
                {events === null ? (
                    <div className="loading-message">Loading events...</div>
                ) : (
                    <div className="events-track">
                        {events.map(([id, name, date, imagePath, extraInfo]) => (
                            <div 
                                key={id} 
                                className="event-card"
                                onClick={() => handleEventClick(id)}
                            >
                                <div className="event-image-container">
                                    <img 
                                        src={imagePath} 
                                        alt={name}
                                        className="event-image"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "assets/placeholder.png";
                                        }}
                                    />
                                </div>
                                <div className={`event-name-box ${selectedEventId === id ? 'selected' : ''}`} >
                                    <p className="event-name">{name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}