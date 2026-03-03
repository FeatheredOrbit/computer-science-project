import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../../styles/change_reservation.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
    reservationId: number | undefined
};

// Component that allows customers to change a selected reservation. Takes "onNavigate" to move to other windows, and "reservationId" to know what reservation to
// update.
export default function ChangeReservation({onNavigate, reservationId}: Props) {
    // Set up states.
    const [nameInput, setNameInput] = useState("");
    const [nameError, setNameError] = useState("");

    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const [requirementsInput, setRequirementsInput] = useState("");

    const [peopleCountInput, setPeopleCountInput] = useState("1");
    const [peopleCountError, setPeopleCountError] = useState("");

    // Resize window to meet component expectations.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(900, 600));
    }

    // Function that gets the info of the selected reservations and applies them to each field.
    async function getReservationInfo() {
        const message = await invoke<[string, string, string, number]>("get_reservation_info", {id: reservationId});

        setNameInput(message[0]);
        setPhoneInput(message[1]);
        setRequirementsInput(message[2]);
        setPeopleCountInput(message[3].toLocaleString());
    }

    // Function that validates each field before updating the reservation.
    // Name must be between 0 and characters blabla.
    // Phone number must be only numerics and be between 10 and 15 characters in length blablabla.
    // People count must be higher than 0 and lower or equal to 10. 
    async function updateClicked() {
        let valid = true;

        // Resets all the errors to avoid carry overs.
        setNameError("");
        setPhoneError("");
        setPeopleCountError("");

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

        await invoke("update_reservation", {id: reservationId, name: nameInput, phone: phoneInput, requirements: requirementsInput, peopleCount: Number(peopleCountInput)});

        onNavigate("/your-reservations");
    }

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
        getReservationInfo();
    }, []);

    // Structure of the page.
    return (
        <div className="change-reservation">
            <button 
                className="back-button" 
                onClick={function() {onNavigate("/your-reservations");}}
                onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate("/your-reservations") } }}>
                BACK TO RESERVATION VIEWER
            </button>

            <button 
                className="update-button" 
                onClick={updateClicked}
                onKeyDown={function(e) { if (e.key === 'Enter') { updateClicked() } }}>
                UPDATE
            </button>

            <div className="change-reservation-label">
                <h1 style={{fontSize:"62px", textAlign:"center"}}> CHANGE RESERVATION </h1>
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
        </div>
    );
}