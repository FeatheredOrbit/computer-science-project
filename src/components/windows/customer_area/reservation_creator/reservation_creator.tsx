import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../../styles/reservation-creator.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
    setChosenEventId: React.Dispatch<React.SetStateAction<number | null>>
    setPeopleCount: React.Dispatch<React.SetStateAction<string>>
    setChosenName: React.Dispatch<React.SetStateAction<string>>
    setChosenPhoneNumber: React.Dispatch<React.SetStateAction<string>>
    setChosenRequirements: React.Dispatch<React.SetStateAction<string>>
};

type EventData = [number, string, string, string, string];

// Yeah there has been a bit of a misunderstanding with myself and I often found myself interchanging event and play. In this context they are the same thing!!!

export default function ReservationCreatorWindow({
    onNavigate, 
    setChosenEventId, 
    setPeopleCount,
    setChosenName,
    setChosenPhoneNumber,
    setChosenRequirements
}: Props) {
    const [events, setEvents] = useState<EventData[] | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const [eventError, setEventError] = useState("");

    const [nameInput, setNameInput] = useState("");
    const [nameError, setNameError] = useState("");

    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const [requirementsInput, setRequirementsInput] = useState("");

    const [peopleCountInput, setPeopleCountInput] = useState("1");
    const [peopleCountError, setPeopleCountError] = useState("");


    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(900, 600));
    }

    async function getEvents() {
        const message = await invoke<EventData[]>("get_events", {});
        setEvents(message);
    }

    async function autofill() {
        const message = await invoke<[string, string, string]>("autofill_customer", {});

        // As the function might return empty strings on some parameters, we avoid applying them if so, to avoid deleting what the user already typed.
        if (message[0].trim().length > 0) {
            setNameInput(message[0]);
        }
        if (message[1].trim().length > 0) {
            setPhoneInput(message[1]);
        }
        if (message[2].trim().length > 0) {
            setRequirementsInput(message[2]);
        }
    }

    async function handleEventClick(eventId: number, date: string, information: string) {
        setSelectedEventId(eventId);

        await invoke("open_extra_information_window", {information: information, date: date});
    }

    async function continueClicked() {
        let valid = true;

        // Resets all the errors to avoid carry overs.
        setEventError("");
        setNameError("");
        setPhoneError("");
        setPeopleCountError("");

        // We check if an event is selected, if not show an error.
        if (selectedEventId === null) {
            setEventError("Please select a play");
            valid = false;
        }

        // We check if the name is between 0 and 100 characters. Showing an error if either is not met.
        if (nameInput.trim().length === 0) {
            setNameError("Field can't be empty");
            valid = false;
        } else if (nameInput.trim().length > 100) {
            setNameError("Name must be below 100 characters");
            valid = false;
        }

        // We check if the phone numbers is only made of digits, if not shows an error.
        const digitsOnly = phoneInput.replace(/\D/g, '');
        if (!(digitsOnly.length > 0 && digitsOnly === phoneInput.replace(/[^0-9+]/g, ''))) {
            setPhoneError("Phone number must only contain digits");
            valid = false;
        }

        // Check if the phone number sits between 10 and 15 digits, apparently there isn't a standard length? If not shows an error.
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            setPhoneError("Phone number must be between 10 and 15 digits");
            valid = false;
        }

        // We check if people count is between 0 and 10 inclusive and not empty, showing an error if anything fails.
        const peopleCount = parseInt(peopleCountInput);
        if (peopleCountInput.trim().length === 0) {
            setPeopleCountError("Field can't be empty");
            valid = false;
        } else if (isNaN(peopleCount) || peopleCount <= 0) {
            setPeopleCountError("Must be a number greater than 0");
            valid = false;
        } else if (peopleCount > 10) {
            setPeopleCountError("Cannot exceed 10 people");
            valid = false;
        }

        if (!valid) { return; }

        // We make the event id anf people count global so that is it available in the next window.
        setChosenEventId(selectedEventId);
        setPeopleCount(peopleCountInput);
        setChosenName(nameInput);
        setChosenPhoneNumber(phoneInput);
        setChosenRequirements(requirementsInput);

        await invoke("close_extra_windows", {});

        onNavigate("/commit-reservation");
    }

    useEffect(() => {
        resizeWindow();
        getEvents();
    }, []);

    return (
        <div className="reservation-creator">
            <button className="back-to-menu-button" onClick={async() => {await invoke("close_extra_windows", {}); onNavigate("/customer-menu");}}>
                BACK TO MENU
            </button>

            <button className="autofill-button" onClick={autofill}>
                AUTOFILL
            </button>

            <button className="continue-button" onClick={continueClicked}>
                CONTINUE
            </button>

            <div className="select-play-label">
                <h1 style={{fontSize:"42px", textAlign:"center"}}> SELECT A PLAY </h1>
            </div>
            <div className="select-play-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {eventError} </p>
            </div>

            <div className="name-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> FULL NAME </h1>
            </div>
            <input className="name-input" type="text" placeholder="John" onChange={(e) => {setNameInput(e.target.value); setNameError("")}} value={nameInput}/>
            <div className="name-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {nameError} </p>
            </div>

            <div className="phone-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> PHONE NUMBER </h1>
            </div>
            <input className="phone-input" type="text" placeholder="1234567890" onChange={(e) => {setPhoneInput(e.target.value); setPhoneError("")}} value={phoneInput}/>
            <div className="phone-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {phoneError} </p>
            </div>

            <div className="requirements-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> OTHER REQUIREMENTS </h1>
            </div>
            <input className="requirements-input" type="text" placeholder="I'm in a wheelchair" onChange={(e) => {setRequirementsInput(e.target.value)}} value={requirementsInput} />

            <div className="people-count-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> NUMBER OF PEOPLE </h1>
            </div>
            <input className="people-count-input" type="text" placeholder="1" value={peopleCountInput} onChange={(e) => {setPeopleCountInput(e.target.value); setPeopleCountError("")}} />
            <div className="people-count-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {peopleCountError} </p>
            </div>

            <div className="events-scroll-container">
                {
                // Essentially decides between 2 contents for the container based on whether events is null or not.
                events === null ? (
                    // A tinyyyyyy bit of dots.
                    <div className="loading-message">Loading events ....................................................................... </div>
                ) : (
                    <div className="events-track">
                        {events.map(([id, name, date, imagePath, extraInfo]) => (
                            <div 
                                key={id} 
                                className="event-card"
                                onClick={() => handleEventClick(id, date, extraInfo)}
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