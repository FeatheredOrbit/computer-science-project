import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/customer_reservations.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

type ReservationData = [number, string, string, number, string]; // [id, eventName, creatorName, peopleCount, dateCreated]

type Props = {
    onNavigate: (input: string) => void
    setReservationId: React.Dispatch<React.SetStateAction<number | undefined>>
    customerId: number | undefined
};

type SortType = "event" | "creator";

export default function CustomerReservations({onNavigate, setReservationId, customerId}: Props) {
    const [reservations, setReservations] = useState<ReservationData[] | null>(null);
    const [sortType, setSortType] = useState<SortType>("event");
    const [selectedReservationIndexes, setSelectedReservationIndexes] = useState<Set<number>>(new Set());

    const [deleteDisabled, setDeleteDisabled] = useState(true);
    const [changeDisabled, setChangeDisabled] = useState(true);

    const firstLabelRef = useRef<HTMLDivElement>(null);
    const secondLabelRef = useRef<HTMLDivElement>(null);
    const thirdLabelRef = useRef<HTMLDivElement>(null);
    const [columnWidths, setColumnWidths] = useState({ first: 0, second: 0, third: 0 });

    async function deleteClicked() {
        if (selectedReservationIndexes.size === 0) return;

        const sorted = getSortedReservations();
        const idsToDelete = Array.from(selectedReservationIndexes)
            .map(i => sorted[i]?.[0])
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
        const sorted = getSortedReservations();
        const id = sorted[idx]?.[0];
        if (typeof id !== 'number') return;

        setReservationId(id);
        onNavigate("/change-customer-reservation");
    }

    async function getReservations() {
        const message = await invoke<ReservationData[]>("get_reservations_specific", {id: customerId});
        setReservations(message);
        
        // Clear index-based selections after refresh
        setSelectedReservationIndexes(new Set());
    }

    // Sort reservations based on current sort type
    const getSortedReservations = () => {
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

    // Measure label widths after render and when sort type changes
    useEffect(() => {
        if (firstLabelRef.current && secondLabelRef.current && thirdLabelRef.current) {
            setColumnWidths({
                first: firstLabelRef.current.offsetWidth,
                second: secondLabelRef.current.offsetWidth,
                third: thirdLabelRef.current.offsetWidth
            });
        }
    }, [sortType, reservations]);

    const handleReservationClick = (index: number) => {
        setSelectedReservationIndexes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index); // Unselect if already selected
            } else {
                newSet.add(index); // Select if not selected
            }
            return newSet;
        });
    };

    const sortedReservations = getSortedReservations();

    // Get label texts based on sort type
    const getFirstLabel = () => {
        return sortType === "creator" ? "CREATOR NAME" : "EVENT NAME";
    };

    const getSecondLabel = () => {
        return sortType === "creator" ? "EVENT NAME" : "CREATOR NAME";
    };

    return (
        <div className="customer-reservations">
            <button className="back-button" onClick={() => onNavigate("/customers")}>
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
                <img className="search-symbol" src="assets/mangifying_glass.png" onClick={() => {onNavigate("/reservation-search")}}/>

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
                        <div className="loading-message">Loading reservations...</div>
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