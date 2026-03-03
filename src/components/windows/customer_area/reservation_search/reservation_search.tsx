import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/reservation_search.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

// Since the data received from the backend is needed in more variables, it's easier to make it a type so to avoid having to repeat it multiple times.
type ReservationData = [number, string, string, number, string]; // [id, eventName, creatorName, peopleCount, dateCreated]

type Props = {
    onNavigate: (input: string) => void
    setReservationId: React.Dispatch<React.SetStateAction<number | undefined>>
};

// Component that allows customers to search for specific reservartions reservation. Takes "usenavigate" to navigate to other windows, and
// "setReservationId" to allow the id of a selected reservation to exist globally.
export default function ReservationSearch({onNavigate, setReservationId}: Props) {
    // Set up states.
    const [reservations, setReservations] = useState<ReservationData[] | null>(null);
    const [filteredReservations, setFilteredReservations] = useState<ReservationData[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    
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

        // This looks a bit weird, but all it does it simply map the indexes to the actual event ids in the event data array.
        const idsToDelete = Array.from(selectedReservationIndexes)
            .map(i => filteredReservations ? filteredReservations[i]?.[0] : undefined)
            .filter((id): id is number => typeof id === 'number');

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
        const id = filteredReservations ? filteredReservations[idx]?.[0] : undefined;
        if (typeof id !== 'number') return;

        // Make the id global and navigate to the window.
        setReservationId(id);
        onNavigate("/change-reservation");
    }

    // Function that asks the backend for an array of reservation data from the backend.
    async function getReservations() {
        const message = await invoke<ReservationData[]>("get_reservations", {});
        setReservations(message);
        setFilteredReservations(message);
        
        // Clear all selection as they might be invalid after update the reservations.
        setSelectedReservationIndexes(new Set());
    }

    // Function that performs a search and filters reservations based on the search input (query).
    function performSearch(query: string) {
        if (!reservations) return;
        
        // If there's nothing in the search input then simply show every reservation.
        if (query.trim() === "") {
            setFilteredReservations(reservations);
            return;
        }

        // For every reservation include only reservation which's name, event name or date include the search query.
        const lowerQuery = query.toLowerCase();
        const filtered = reservations.filter(function(reservation) {
            if (reservation[2].toLowerCase().includes(lowerQuery)) return true;
            if (reservation[1].toLowerCase().includes(lowerQuery)) return true;
            if (reservation[4].toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        // Set the new filtered reservation.
        setFilteredReservations(filtered);
    };

    // Function that handles changes in input by calling all the appropriate functions.
    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
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
    }, [filteredReservations]);

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

    // Structure of the page.
    return (
        <div className="reservation-search">
            <button 
                className="back-button" 
                onClick={() => onNavigate("/your-reservations")}
                onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate("/your-reservations") } }}>
                BACK TO RESERVATION VIEWER
            </button>

            <div className="reservation-label">
                <h1 style={{ fontSize: "38px" }}> RESERVATION SEARCH </h1>
            </div>

            <div className="amount-of-selections">
                <h1 style={{ textAlign: "center" }}> {selectedReservationIndexes.size} SELECTED </h1>
            </div>

            <button className="delete-button" disabled={deleteDisabled} onClick={deleteClicked}>
                DELETE SELECTED
            </button>

            <button className="change-button" disabled={changeDisabled} onClick={changeClicked}>
                CHANGE SELECTED
            </button>

            <div className="reservations-container">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by creator, event, or date..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <img className="search-symbol" src="assets/mangifying_glass.png" alt="Search"/>
                </div>

                {/* Always show these three labels */}
                <div className="reservations-header">
                    <div className="labels-container">
                        <div ref={firstLabelRef} className="header-label first-label">
                            CREATOR NAME
                        </div>
                        <div ref={secondLabelRef} className="header-label second-label">
                            EVENT NAME
                        </div>
                        <div ref={thirdLabelRef} className="header-label third-label">
                            DATE
                        </div>
                    </div>
                </div>

                <div className="reservations-scroll-area">
                    {filteredReservations === null ? (
                        <div className="loading-message"> Loading reservations </div>
                    ) : (
                        <div className="reservations-list">
                            { /* This function creates a callback for every element in the array, taking the data of that element as arguments.
                                 As a result we are able to create as many elements as there are entries in the reservations array, and correctly link the data to each
                                 reservation */ }
                            {filteredReservations.map((reservation, idx) => (
                                <div
                                    key={`${reservation[0]}-${idx}`}
                                    className={`reservation-card ${selectedReservationIndexes.has(idx) ? 'selected' : ''}`}
                                    onClick={() => handleReservationClick(idx)}
                                >
                                    <div
                                        className="reservation-field first-field"
                                        style={{ width: columnWidths.first ? `${columnWidths.first}px` : 'auto' }}
                                    >
                                        {reservation[2]} {/* Creator name */}
                                    </div>
                                    <div
                                        className="reservation-field second-field"
                                        style={{ width: columnWidths.second ? `${columnWidths.second}px` : 'auto' }}
                                    >
                                        {reservation[1]} {/* Event name */}
                                    </div>
                                    <div
                                        className="reservation-field third-field"
                                        style={{ width: columnWidths.third ? `${columnWidths.third}px` : 'auto' }}
                                    >
                                        {reservation[4]} {/* Date */}
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