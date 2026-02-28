import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "../../../../styles/change_customer_reservation.css";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type Props = {
    onNavigate: (input: string) => void
    reservationId: number | undefined
};

// Yeah there has been a bit of a misunderstanding with myself and I often found myself interchanging event and play. In this context they are the same thing!!!

export default function ChangeCustomerReservation({onNavigate, reservationId}: Props) {
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

    async function getReservationInfo() {
        const message = await invoke<[string, string, string, number]>("get_reservation_info", {id: reservationId});

        setNameInput(message[0]);
        setPhoneInput(message[1]);
        setRequirementsInput(message[2]);
        setPeopleCountInput(message[3].toLocaleString());
    }

    async function updateClicked() {
        let valid = true;

        // Resets all the errors to avoid carry overs.
        setNameError("");
        setPhoneError("");
        setPeopleCountError("");

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

        await invoke("update_reservation", {id: reservationId, name: nameInput, phone: phoneInput, requirements: requirementsInput, peopleCount: Number(peopleCountInput)});

        onNavigate("/customer-reservations");
    }

    useEffect(() => {
        resizeWindow();
        getReservationInfo();
    }, []);

    return (
        <div className="change-customer-reservation">
            <button className="back-button" onClick={() => {onNavigate("/customer-reservations");}}>
                BACK TO CUSTOMER RESERVATION VIEWER
            </button>

            <button className="update-button" onClick={updateClicked}>
                UPDATE
            </button>

            <div className="change-reservation-label">
                <h1 style={{fontSize:"62px", textAlign:"center"}}> CHANGE RESERVATION </h1>
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
        </div>
    );
}