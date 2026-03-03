import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/customer_reservations.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

// Type alias for reservation dat. Format is
type ReservationData = [number, string, string, number, string]; // [id, eventName, creatorName, peopleCount, dateCreated]

// Props accepted by this component.
type Props = {
    onNavigate: (input: string) => void
    setReservationId: React.Dispatch<React.SetStateAction<number | undefined>>
    customerId: number | undefined
};

type SortType = "event" | "creator";

// Component where staff can view and manage reservations for a specific customer. Takes "onNavigate", "setReservationId" and "customerId".
export default function CustomerReservations({onNavigate, setReservationId, customerId}: Props) {
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

    // Function that deletes selected reservations via backend call.
    async function deleteClicked() {
        if (selectedReservationIndexes.size === 0) return;

        const sorted = getSortedReservations();
        const idsToDelete = Array.from(selectedReservationIndexes)
            .map(i => sorted[i]?.[0])
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
        const sorted = getSortedReservations();
        const id = sorted[idx]?.[0];
        if (typeof id !== 'number') return;

        setReservationId(id);
        onNavigate("/change-customer-reservation");
    }

    // Function that retrieves reservations for the specified customer from the backend.
    async function getReservations() {
        const message = await invoke<ReservationData[]>("get_reservations_specific", {id: customerId});
        setReservations(message);
        setSelectedReservationIndexes(new Set());
    }

    // Function that returns a sorted array of reservations based on the current sort type.
    function getSortedReservations() {
        if (!reservations) return [];

        const sorted = [...reservations];
        
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

    // Measure label widths after render and when sort type or reservations change.
    useEffect(function() {
        if (firstLabelRef.current && secondLabelRef.current && thirdLabelRef.current) {
            setColumnWidths({
                first: firstLabelRef.current.offsetWidth,
                second: secondLabelRef.current.offsetWidth,
                third: thirdLabelRef.current.offsetWidth
            });
        }
    }, [sortType, reservations]);

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

    const sortedReservations = getSortedReservations();

    // Helper that returns the first column label based on sort type.
    function getFirstLabel() {
        return sortType === "creator" ? "CREATOR NAME" : "EVENT NAME";
    };

    // Helper that returns the second column label based on sort type.
    function getSecondLabel() {
        return sortType === "creator" ? "EVENT NAME" : "CREATOR NAME";
    };

    // Structure of the page.
    return (
        <div className="customer-reservations">
            <button className="back-button" onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate('/customers'); } }} onClick={function() { onNavigate("/customers") }}> 
                BACK TO CUSTOMER VIEWER
            </button>

            <div className="reservation-label">
                <h1 style={{fontSize:"38px"}}> CUSTOMER RESERVATIONS </h1>
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
                <img className="search-symbol" src="assets/mangifying_glass.png" onClick={function() { onNavigate("/reservation-search")}}/>

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