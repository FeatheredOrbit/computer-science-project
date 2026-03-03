import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/reservation_search.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

// Type alias for reservation data tuples. Format is: [id, eventName, creatorName, peopleCount, dateCreated].
type ReservationData = [number, string, string, number, string];

// Props accepted by this component.
type Props = {
    onNavigate: (input: string) => void
    setReservationId: React.Dispatch<React.SetStateAction<number | undefined>>
    customerId: number | undefined
};

// Component that provides a searchable view of a customer's reservations for staff. Takes "onNavigate", "setReservationId" and "customerId".
export default function CustomerReservationSearch({onNavigate, setReservationId, customerId}: Props) {
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

    // Function that deletes the selected reservations via backend call.
    async function deleteClicked() {
        if (selectedReservationIndexes.size === 0) return;

        const idsToDelete = Array.from(selectedReservationIndexes)
            .map(i => filteredReservations ? filteredReservations[i]?.[0] : undefined)
            .filter((id): id is number => typeof id === 'number');

        if (idsToDelete.length === 0) return;

        await invoke("delete_reservations", { ids: idsToDelete });

        setSelectedReservationIndexes(new Set());
        await getReservations();
    }

    // Function that opens the reservation change view for the selected reservation.
    async function changeClicked() {
        if (selectedReservationIndexes.size !== 1) return;

        const idx = selectedReservationIndexes.values().next().value as number;
        const id = filteredReservations ? filteredReservations[idx]?.[0] : undefined;
        if (typeof id !== 'number') return;

        setReservationId(id);
        onNavigate("/change-customer-reservation");
    }

    // Function that retrieves reservations for the specified customer and initializes the filtered list.
    async function getReservations() {
        const message = await invoke<ReservationData[]>("get_reservations_specific", {id: customerId});
        setReservations(message);
        setFilteredReservations(message);
        setSelectedReservationIndexes(new Set());
    }

    // Function that filters reservations by creator name, event name or date in that order.
    function performSearch(query: string) {
        if (!reservations) return;
        
        if (query.trim() === "") {
            setFilteredReservations(reservations);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = reservations.filter(function(reservation) {
            if (reservation[2].toLowerCase().includes(lowerQuery)) return true;
            if (reservation[1].toLowerCase().includes(lowerQuery)) return true;
            if (reservation[4].toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        setFilteredReservations(filtered);
    };

    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    // Function that resizes the window for this view.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(800, 640));
    }

    useEffect(function() {
        setDeleteDisabled(selectedReservationIndexes.size === 0);
        setChangeDisabled(selectedReservationIndexes.size !== 1);
    }, [selectedReservationIndexes]);

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
        getReservations();
    }, []);

    // Measure label widths after render and when filtered results change.
    useEffect(function() {
        if (firstLabelRef.current && secondLabelRef.current && thirdLabelRef.current) {
            setColumnWidths({
                first: firstLabelRef.current.offsetWidth,
                second: secondLabelRef.current.offsetWidth,
                third: thirdLabelRef.current.offsetWidth
            });
        }
    }, [filteredReservations]);

    function handleReservationClick(index: number) {
        setSelectedReservationIndexes(function(prev) {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Structure of the page.
    return (
        <div className="customer-reservation-search">
            <button className="back-button" onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate('/customers'); } }} onClick={function() { onNavigate("/customers") }}> 
                BACK TO CUSTOMER VIEWER
            </button>

            <div className="reservation-label">
                <h1 style={{ fontSize: "38px" }}> CUSTOMER RESERVATION SEARCH </h1>
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
                                        {reservation[2]}
                                    </div>
                                    <div
                                        className="reservation-field second-field"
                                        style={{ width: columnWidths.second ? `${columnWidths.second}px` : 'auto' }}
                                    >
                                        {reservation[1]}
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