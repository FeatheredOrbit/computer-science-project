import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/events.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

// Type alias for event data.
type EventData = [string, string]; // [name, dueDate]

// Props accepted by this component.
type Props = {
    onNavigate: (input: string) => void
};

// Component that allows staff to search and select events. Provides actions for analytics and extra information. Takes "onNavigate".
export default function Events({onNavigate}: Props) {
    // Set up states.
    const [events, setEvents] = useState<EventData[] | null>(null);
    const [filteredEvents, setFilteredEvents] = useState<EventData[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEventIndexes, setSelectedEventIndexes] = useState<Set<number>>(new Set());

    const firstLabelRef = useRef<HTMLDivElement>(null);
    const secondLabelRef = useRef<HTMLDivElement>(null);
    const [columnWidths, setColumnWidths] = useState({ first: 200, second: 150 });

    // Function that opens analytics for the selected event.
    async function viewAnalyticsClicked() {
        if (selectedEventIndexes.size === 0 || !filteredEvents) return;
        await invoke("close_extra_windows", {});
        await invoke("open_analytics_window", {id: selectedEventIndexes.entries().next().value?.[0]});
    }

    // Function that opens the extra information window for the selected event.
    async function extraInformationClicked() {
        if (selectedEventIndexes.size === 0 || !filteredEvents) return;
        await invoke("close_extra_windows", {});
        await invoke("open_extra_information_window_from_id", {id: selectedEventIndexes.entries().next().value?.[0]});
    }
 
    // Function that retrieves the minimal events list from the backend and initializes the filtered list.
    async function getEvents() {
        const message = await invoke<EventData[]>("get_events_minimum", {});
        setEvents(message);
        setFilteredEvents(message);
        setSelectedEventIndexes(new Set());
    }

    // Function that calculates optimal column widths based on content and container width.
    function calculateColumnWidths() {
        if (!filteredEvents || filteredEvents.length === 0) return;

        const firstLabel = "EVENT NAME";
        const secondLabel = "DUE DATE";

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        context.font = '16px Arial';

        let maxFirstWidth = context.measureText(firstLabel).width + 40;
        let maxSecondWidth = context.measureText(secondLabel).width + 40;

        filteredEvents.forEach(function(event) {
            const firstWidth = context.measureText(event[0]).width + 40;
            const secondWidth = context.measureText(event[1]).width + 40;

            maxFirstWidth = Math.max(maxFirstWidth, firstWidth);
            maxSecondWidth = Math.max(maxSecondWidth, secondWidth);
        });

        const minWidth = 120;
        const maxWidth = 400;

        const container = document.querySelector('.events .events-container');
        if (container) {
            const containerWidth = container.clientWidth;
            const totalGapWidth = containerWidth * 0.02;
            const availableWidth = containerWidth - totalGapWidth - 40;
            const totalNeededWidth = maxFirstWidth + maxSecondWidth;
            if (totalNeededWidth > availableWidth) {
                const scale = availableWidth / totalNeededWidth;
                maxFirstWidth = Math.max(maxFirstWidth * scale, minWidth);
                maxSecondWidth = Math.max(maxSecondWidth * scale, minWidth);
            }
        }

        setColumnWidths({
            first: Math.min(Math.max(maxFirstWidth, minWidth), maxWidth),
            second: Math.min(Math.max(maxSecondWidth, minWidth), maxWidth)
        });
    };

    // Function that filters events by name or due date.
    function performSearch(query: string) {
        if (!events) return;
        
        if (query.trim() === "") {
            setFilteredEvents(events);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = events.filter(function(event) {
            if (event[0].toLowerCase().includes(lowerQuery)) return true;
            if (event[1].toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        setFilteredEvents(filtered);
        setSelectedEventIndexes(new Set());
    };

    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    // Function that resizes the window for this view.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(800, 500));
    }

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
        getEvents();
    }, []);

    // Recalculate widths when filtered events change.
    useEffect(function() {
        if (filteredEvents) {
            setTimeout(function() {
                calculateColumnWidths();
            }, 50);
        }
    }, [filteredEvents]);

    // Recalculate on window resize.
    useEffect(function() {
        function handleResize() {
            if (filteredEvents) {
                calculateColumnWidths();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [filteredEvents]);

    function handleEventClick(index: number) {
        setSelectedEventIndexes(function(prev) {
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
        <div className="events">
            <button className="back-button" onKeyDown={function(e) { if (e.key === 'Escape') { (async function() { await invoke("close_extra_windows", {}); onNavigate('/staff-menu'); })(); } }} onClick={function() { (async function() { invoke("close_extra_windows", {}); onNavigate('/staff-menu'); })(); }}>
                BACK TO MENU
            </button>

            <div className="events-label">
                <h1 style={{ fontSize: "38px" }}> EVENTS </h1>
            </div>

            <div className="amount-of-selections">
                <h1 style={{ textAlign: "center" }}> {selectedEventIndexes.size} SELECTED </h1>
            </div>

            <button 
                className="view-analytics-button" 
                disabled={!(selectedEventIndexes.size !== 0)}
                onClick={viewAnalyticsClicked}
            >
                VIEW ANALYTICS
            </button>

            <button 
                className="extra-information-button" 
                disabled={!(selectedEventIndexes.size !== 0)}
                onClick={extraInformationClicked}> EXTRA INFORMATION </button>

            <div className="events-container">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by event name or due date..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <img className="search-symbol" src="assets/mangifying_glass.png" alt="Search" />
                </div>

                <div className="events-header">
                    <div className="labels-container">
                        <div 
                            ref={firstLabelRef} 
                            className="header-label first-label"
                            style={{ width: columnWidths.first }}
                        >
                            EVENT NAME
                        </div>
                        <div 
                            ref={secondLabelRef} 
                            className="header-label second-label"
                            style={{ width: columnWidths.second }}
                        >
                            DUE DATE
                        </div>
                    </div>
                </div>

                <div className="events-scroll-area">
                    {filteredEvents === null ? (
                        <div className="loading-message"> Loading events </div>
                    ) : (
                        <div className="events-list">
                            {filteredEvents.map((event, index) => (
                                <div 
                                    key={index}
                                    className={`event-card ${selectedEventIndexes.has(index) ? 'selected' : ''}`}
                                    onClick={() => handleEventClick(index)}
                                >
                                    <div 
                                        className="event-field first-field"
                                        style={{ 
                                            width: columnWidths.first,
                                            minWidth: columnWidths.first,
                                            maxWidth: columnWidths.first
                                        }}
                                    >
                                        <span className="field-content">{event[0]}</span>
                                    </div>
                                    <div 
                                        className="event-field second-field"
                                        style={{ 
                                            width: columnWidths.second,
                                            minWidth: columnWidths.second,
                                            maxWidth: columnWidths.second
                                        }}
                                    >
                                        <span className="field-content">{event[1]}</span>
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