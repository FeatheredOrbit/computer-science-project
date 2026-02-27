import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/reservation_search.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

type ReservationData = [number, string, string, number, string]; // [id, eventName, creatorName, peopleCount, dateCreated]

type Props = {
    onNavigate: (input: string) => void
    setReservationId: React.Dispatch<React.SetStateAction<number | undefined>>
};

export default function ReservationSearch({onNavigate, setReservationId}: Props) {
    const [reservations, setReservations] = useState<ReservationData[] | null>(null);
    const [filteredReservations, setFilteredReservations] = useState<ReservationData[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    // Track selections by list index to avoid duplicate-ID issues from the backend
    const [selectedReservationIndexes, setSelectedReservationIndexes] = useState<Set<number>>(new Set());

    const [deleteDisabled, setDeleteDisabled] = useState(true);
    const [changeDisabled, setChangeDisabled] = useState(true);

    // Refs to measure label widths
    const firstLabelRef = useRef<HTMLDivElement>(null);
    const secondLabelRef = useRef<HTMLDivElement>(null);
    const thirdLabelRef = useRef<HTMLDivElement>(null);
    const [columnWidths, setColumnWidths] = useState({ first: 0, second: 0, third: 0 });

    async function deleteClicked() {
        if (selectedReservationIndexes.size === 0) return;

        // Map selected indexes back to their actual reservation ids
        const idsToDelete = Array.from(selectedReservationIndexes)
            .map(i => filteredReservations ? filteredReservations[i]?.[0] : undefined)
            .filter((id): id is number => typeof id === 'number');

        if (idsToDelete.length === 0) return;

        await invoke("delete_reservations", { ids: idsToDelete });

        // Clear selection and refresh the list
        setSelectedReservationIndexes(new Set());
        await getReservations(); // Refresh the list
    }

    async function changeClicked() {
        if (selectedReservationIndexes.size !== 1) return;

        const idx = selectedReservationIndexes.values().next().value as number;
        const id = filteredReservations ? filteredReservations[idx]?.[0] : undefined;
        if (typeof id !== 'number') return;

        setReservationId(id);
        onNavigate("/change-reservation");
    }

    async function getReservations() {
        const message = await invoke<ReservationData[]>("get_reservations", {});
        setReservations(message);
        setFilteredReservations(message);
        
        // Clear index-based selections after refresh
        setSelectedReservationIndexes(new Set());
    }

    // Search function
    const performSearch = (query: string) => {
        if (!reservations) return;
        
        if (query.trim() === "") {
            setFilteredReservations(reservations);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = reservations.filter(reservation => {
            // Search in creator name first
            if (reservation[2].toLowerCase().includes(lowerQuery)) return true;
            // Then search in event name
            if (reservation[1].toLowerCase().includes(lowerQuery)) return true;
            // Then search in date
            if (reservation[4].toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        setFilteredReservations(filtered);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(800, 640));
    }

    useEffect(() => {
        // Delete button enabled if at least one is selected
        setDeleteDisabled(selectedReservationIndexes.size === 0);

        // Change button enabled only if exactly one is selected
        setChangeDisabled(selectedReservationIndexes.size !== 1);
    }, [selectedReservationIndexes]);

    useEffect(() => {
        resizeWindow();
        getReservations();
    }, []);

    // Measure label widths after render
    useEffect(() => {
        if (firstLabelRef.current && secondLabelRef.current && thirdLabelRef.current) {
            setColumnWidths({
                first: firstLabelRef.current.offsetWidth,
                second: secondLabelRef.current.offsetWidth,
                third: thirdLabelRef.current.offsetWidth
            });
        }
    }, [filteredReservations]); // Re-measure when filtered results change

    const handleReservationClick = (index: number) => {
        setSelectedReservationIndexes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <div className="reservation-search">
            <button className="back-button" onClick={() => onNavigate("/your-reservations")}>
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
                        <div className="loading-message">Loading reservations...</div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="no-reservations-message">No reservations found</div>
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