import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/your_reservations.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";


// Since the data received from the backend is needed in more variables, it's easier to make it a type so to avoid having to repeat it multiple times.
type ReservationData = [number, string, string, number, string]; // [id, eventName, creatorName, peopleCount, dateCreated]

type Props = {
    onNavigate: (input: string) => void
    setReservationId: React.Dispatch<React.SetStateAction<number | undefined>>
};

// Same reasoning as the type shown above, it also provides autofill and just easier to keep track of.
type SortType = "event" | "creator";

// Component that allows customers to sort through all their reservation through different filters. Takes "usenavigate" to navigate to other windows, and
// "setReservationId" to allow the id of a selected reservation to exist globally.
export default function YourReservations({onNavigate, setReservationId}: Props) {
    // Set up states.
    const [reservations, setReservations] = useState<ReservationData[] | null>(null);
    const [sortType, setSortType] = useState<SortType>("event");
    const [selectedReservationIndexes, setSelectedReservationIndexes] = useState<Set<number>>(new Set());

    const [deleteDisabled, setDeleteDisabled] = useState(true);
    const [changeDisabled, setChangeDisabled] = useState(true);

    const firstLabelRef = useRef<HTMLDivElement>(null);
    const secondLabelRef = useRef<HTMLDivElement>(null);
    const thirdLabelRef = useRef<HTMLDivElement>(null);
    const [columnWidths, setColumnWidths] = useState({ first: 0, second: 0, third: 0 });

    // Function called after clicking the delete button, it essentially deletes all the reservations that the user selected.
    async function deleteClicked() {
        if (selectedReservationIndexes.size === 0) return;

        const sorted = getSortedReservations();
        // This looks a bit weird, but all it does it simply map the indexes to the actual event ids in the event data array.
        const idsToDelete = Array.from(selectedReservationIndexes)
            .map(function(i) { return sorted[i]?.[0]; })
            .filter(function(id): id is number { return typeof id === 'number'; });

        if (idsToDelete.length === 0) return;

        await invoke("delete_reservations", { ids: idsToDelete });

        // Clear selection and refresh the list.
        setSelectedReservationIndexes(new Set());
        await getReservations();
    }

    // Navigates to the change-reservation page, only works with only one reservation selected.
    async function changeClicked() {
        if (selectedReservationIndexes.size !== 1) return;

        // Extract the only selected index and translate it to a reservation id.
        const idx = selectedReservationIndexes.values().next().value as number;
        const sorted = getSortedReservations();
        const id = sorted[idx]?.[0];
        if (typeof id !== 'number') return;

        // Make the id global and navigate to the window.
        setReservationId(id);
        onNavigate("/change-reservation");
    }

    // Function that asks the backend for an array of reservation data from the backend.
    async function getReservations() {
        const message = await invoke<ReservationData[]>("get_reservations", {});
        setReservations(message);
        
        // Clear all selection as they might be invalid after update the reservations.
        setSelectedReservationIndexes(new Set());
    }

    // // Functions that returns a sorted clone of the reservations. A clone because we want to avoid mutating the original array.
    function getSortedReservations() {
        if (!reservations) return [];

        const sorted = [...reservations];
        
        // Sorts the data depending on the current filter.
        switch (sortType) {
            case "event":
                sorted.sort((a, b) => a[1].localeCompare(b[1]));
                break;
            case "creator":
                sorted.sort((a, b) => a[2].localeCompare(b[2]));
                break;
        }
        
        return sorted;
    };

    // Resize the application window to this component's preferred dimensions.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(800, 640));
    }

    // Disables/enabled buttons depending on the amount of selected reservations.
    useEffect(function() {
        // Delete button enabled if at least one is selected.
        setDeleteDisabled(selectedReservationIndexes.size === 0);

        // Change button enabled only if exactly one is selected.
        setChangeDisabled(selectedReservationIndexes.size !== 1);
    }, [selectedReservationIndexes]);

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
        getReservations();
    }, []);

    // Essentially just measures label sizes to adapt them to the content, content being the underlying reservations.
    useEffect(function() {
        if (firstLabelRef.current && secondLabelRef.current && thirdLabelRef.current) {
            setColumnWidths({
                first: firstLabelRef.current.offsetWidth,
                second: secondLabelRef.current.offsetWidth,
                third: thirdLabelRef.current.offsetWidth
            });
        }
    }, [sortType, reservations]);

    // Function that handles selecting and unselecting reservations, we update the set immutably by creating a new set from the previous one.
    function handleReservationClick(index: number) {
        setSelectedReservationIndexes(function(prev) {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                // Unselect if it was already selected.
                newSet.delete(index);
            } else {
                // Select if it wasn't already.
                newSet.add(index);
            }

            return newSet;
        });
    };

    const sortedReservations = getSortedReservations();

    // Helper function that returns the first header label depending on the current sort type.
    function getFirstLabel() {
        return sortType === "creator" ? "CREATOR NAME" : "EVENT NAME";
    };

    // Helper function that returns the second header label depending on the current sort type.
    function getSecondLabel() {
        return sortType === "creator" ? "EVENT NAME" : "CREATOR NAME";
    };

    // Structure of the page.
    return (
        <div className="your-reservations">
            <button 
                className="back-to-menu-button" 
                onClick={() => onNavigate("/customer-menu")}
                onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate("/customer-menu") } }}>
                BACK TO MENU
            </button>

            <div className="reservation-label">
                <h1 style={{fontSize:"38px"}}> YOUR RESERVATIONS </h1>
            </div>

            <div className="amount-of-selections">
                <h1 style={{textAlign:"center"}}> {selectedReservationIndexes.size} SELECTED </h1>
            </div>

            <button className="delete-button" disabled={deleteDisabled} onClick={deleteClicked}>
                DELETE SELECTED
            </button>

            <button className="change-button" disabled={changeDisabled} onClick={changeClicked}>
                CHANGE SELECTED
            </button>

            <div className="reservations-container">
                <img className="search-symbol" src="assets/mangifying_glass.png" onClick={function() {onNavigate("/reservation-search")}}/>

                <div className="reservations-header">
                    <div className="labels-container">
                        <div ref={firstLabelRef} className="header-label first-label">
                            {getFirstLabel()}
                        </div>
                        <div ref={secondLabelRef} className="header-label second-label">
                            {getSecondLabel()}
                        </div>
                        <div ref={thirdLabelRef} className="header-label third-label">
                            DATE
                        </div>
                    </div>
                    <select 
                        className="sorting-dropdown"
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value as SortType)}
                    >
                        <option value="event">Sort by Event</option>
                        <option value="creator">Sort by Creator</option>
                    </select>
                </div>

                <div className="reservations-scroll-area">
                    {reservations === null ? (
                        <div className="loading-message"> Loading reservations </div>
                    ) : (
                        <div className="reservations-list">
                            { /* This function creates a callback for every element in the array, taking the data of that element as arguments.
                                 As a result we are able to create as many elements as there are entries in the reservations array, and correctly link the data to each
                                 reservation */ }
                            {sortedReservations.map((reservation, index) => (
                                <div 
                                    key={`${reservation[0]}-${index}`}
                                    className={`reservation-card ${selectedReservationIndexes.has(index) ? 'selected' : ''}`}
                                    onClick={() => handleReservationClick(index)}
                                >
                                    <div 
                                        className="reservation-field first-field"
                                        style={{ width: columnWidths.first ? `${columnWidths.first}px` : 'auto' }}
                                    >
                                        {sortType === "creator" ? reservation[2] : reservation[1]}
                                    </div>
                                    <div 
                                        className="reservation-field second-field"
                                        style={{ width: columnWidths.second ? `${columnWidths.second}px` : 'auto' }}
                                    >
                                        {sortType === "creator" ? reservation[1] : reservation[2]}
                                    </div>
                                    <div 
                                        className="reservation-field third-field"
                                        style={{ width: columnWidths.third ? `${columnWidths.third}px` : 'auto' }}
                                    >
                                        {reservation[4]}
                                    </div>
                                    <div className="people-badge">
                                        👥 {reservation[3]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}