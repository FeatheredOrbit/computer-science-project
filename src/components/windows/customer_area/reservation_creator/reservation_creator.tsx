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

// Since the data received from the backend is needed in more variables, it's easier to make it a type so to avoid having to repeat it multiple times.
type EventData = [number, string, string, string, string, number]; // [id, name, date, imagePath, extraInfo, cost]

// The reservation creator component of the program, it allows customers to create reservation with the details they prefer. It takes quite a lot as arguments,
// I could explain them all but I can't be bothered, just now that each input field in this window needs to be rembered for future windows, so I'm passing function
// to change the global variables.
export default function ReservationCreatorWindow({
    onNavigate, 
    setChosenEventId, 
    setPeopleCount,
    setChosenName,
    setChosenPhoneNumber,
    setChosenRequirements
}: Props) {
    // Set up states.
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

    // Resize window to meet the expectations of the window.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(900, 600));
    }

    // Asks the backend for an array of event data.
    async function getEvents() {
        const message = await invoke<EventData[]>("get_events", {});
        setEvents(message);
    }

    // Function that asks the backend for customer credentials, and automatically writes to them to each input field, avoiding empty ones.
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

    // Function called when a play/event in the window is clicked, it focuses the state on the id of the event, and opens an extra window on top to display more
    // information about the event/play.
    async function handleEventClick(eventId: number, date: string, information: string, cost: number) {
        setSelectedEventId(eventId);

        await invoke("close_extra_windows", {});

        await invoke("open_extra_information_window", {information: information, date: date, cost: cost});
    }

    // Function that handles validation of each input field, and subsequently moves to the next window.
    // An event/play must be selected, the name must be between 0 and 100 characters, 
    // the phone number must be numerics only and must be between 10 and 15 characters
    // and the people count must be higher than 0 and lower or equal to 10.
    async function continueClicked() {
        let valid = true;

        // Resets all the errors to avoid carry overs.
        setEventError("");
        setNameError("");
        setPhoneError("");
        setPeopleCountError("");

        // Event/play validation.
        if (selectedEventId === null) {
            setEventError("Please select a play");
            valid = false;
        }

        // Name validation.
        if (nameInput.trim().length === 0) {
            setNameError("Field can't be empty");
            valid = false;
        } else if (nameInput.trim().length > 100) {
            setNameError("Name must be below 100 characters");
            valid = false;
        }

        // Phone number validation.
        const digitsOnly = phoneInput.replace(/\D/g, '');
        if (!(digitsOnly.length > 0 && digitsOnly === phoneInput.replace(/[^0-9+]/g, ''))) {
            setPhoneError("Phone number must only contain digits");
            valid = false;
        }
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            setPhoneError("Phone number must be between 10 and 15 digits");
            valid = false;
        }

        // People count validation.
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

        // We make everything global so that they are available in the next windows.
        setChosenEventId(selectedEventId);
        setPeopleCount(peopleCountInput);
        setChosenName(nameInput);
        setChosenPhoneNumber(phoneInput);
        setChosenRequirements(requirementsInput);

        // Make sure to close extra windows, as the extra information window might still be active.
        await invoke("close_extra_windows", {});

        onNavigate("/commit-reservation");
    }

    // Call srartup functions.
    useEffect(function() {
        resizeWindow();
        getEvents();
    }, []);

    // Structure of the page.
    return (
        <div className="reservation-creator">
            <button 
                className="back-to-menu-button" 
                onClick={function() { (async function() { await invoke("close_extra_windows", {}); onNavigate("/customer-menu"); })(); }}
                onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate("/customer-menu") } }}>
                BACK TO MENU
            </button>

            <button 
                className="autofill-button" onClick={function() { autofill(); }}
                onKeyDown={function(e) { if (e.key === 'e') { autofill(); } }}> AUTOFILL </button>

            <button 
                onKeyDown={function(e) { if (e.key === 'Enter') { continueClicked(); } }}
                className="continue-button" onClick={function() { continueClicked(); }}> CONTINUE </button>

            <div className="select-play-label">
                <h1 style={{fontSize:"42px", textAlign:"center"}}> SELECT A PLAY </h1>
            </div>
            <div className="select-play-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {eventError} </p>
            </div>

            <div className="name-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> FULL NAME </h1>
            </div>
            <input className="name-input" type="text" placeholder="John" onChange={function(e) { setNameInput(e.target.value); setNameError(""); }} value={nameInput}/>
            <div className="name-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {nameError} </p>
            </div>

            <div className="phone-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> PHONE NUMBER </h1>
            </div>
            <input className="phone-input" type="text" placeholder="1234567890" onChange={function(e) { setPhoneInput(e.target.value); setPhoneError(""); }} value={phoneInput}/>
            <div className="phone-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {phoneError} </p>
            </div>

            <div className="requirements-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> OTHER REQUIREMENTS </h1>
            </div>
            <input className="requirements-input" type="text" placeholder="I'm in a wheelchair" onChange={function(e) { setRequirementsInput(e.target.value); }} value={requirementsInput} />

            <div className="people-count-label">
                <h1 style={{textAlign: "center", fontSize: "35px", lineHeight:"50%"}}> NUMBER OF PEOPLE </h1>
            </div>
            <input className="people-count-input" type="text" placeholder="1" value={peopleCountInput} onChange={function(e) { setPeopleCountInput(e.target.value); setPeopleCountError(""); }} />
            <div className="people-count-error">
                <p style={{textAlign: "left", color: "red", fontSize: "13px", lineHeight: "85%"}}> {peopleCountError} </p>
            </div>

            <div className="events-scroll-container">
                {
                // Essentially decides between 2 contents for the container based on whether events is null or not.
                events === null ? (
                    <div className="loading-message"> Loading events </div>
                ) : (
                    <div className="events-track">
                        { /* This function creates a callback for every element in the array, taking the data of that element as arguments.
                             As a result we are able to create as many elements as there are entries in the events array, and correctly link the data to each
                             event */ 
                        }
                        {events.map(([id, name, date, imagePath, extraInfo, cost]) => (
                            <div 
                                key={id} 
                                className="event-card"
                                onClick={() => handleEventClick(id, date, extraInfo, cost)}
                            >
                                <div className="event-image-container">
                                    <img 
                                        src={imagePath} 
                                        alt={name}
                                        className="event-image"
                                        onError={function(e) {
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