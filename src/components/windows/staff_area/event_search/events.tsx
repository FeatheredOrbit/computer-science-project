import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/events.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

type EventData = [string, string]; // [name, dueDate]

type Props = {
    onNavigate: (input: string) => void
};

export default function Events({onNavigate}: Props) {
    const [events, setEvents] = useState<EventData[] | null>(null);
    const [filteredEvents, setFilteredEvents] = useState<EventData[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEventIndexes, setSelectedEventIndexes] = useState<Set<number>>(new Set());

    // Refs to measure label widths
    const firstLabelRef = useRef<HTMLDivElement>(null);
    const secondLabelRef = useRef<HTMLDivElement>(null);
    const [columnWidths, setColumnWidths] = useState({ first: 200, second: 150 }); // Those are defaults widths, so with no events this should be used.

    async function viewAnalyticsClicked() {
        if (selectedEventIndexes.size === 0 || !filteredEvents) return;
        await invoke("close_extra_windows", {});
        await invoke("open_analytics_window", {id: selectedEventIndexes.entries().next().value?.[0]});
    }

    async function extraInformationClicked() {
        if (selectedEventIndexes.size === 0 || !filteredEvents) return;
        await invoke("close_extra_windows", {});
        await invoke("open_extra_information_window_from_id", {id: selectedEventIndexes.entries().next().value?.[0]});
    }
 
    async function getEvents() {
        const message = await invoke<EventData[]>("get_events_minimum", {});
        setEvents(message);
        setFilteredEvents(message);
        setSelectedEventIndexes(new Set());
    }

    // Calculate optimal column widths based on content
    const calculateColumnWidths = () => {
        if (!filteredEvents || filteredEvents.length === 0) return;

        // Label widths
        const firstLabel = "EVENT NAME";
        const secondLabel = "DUE DATE";

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        context.font = '16px Arial';

        let maxFirstWidth = context.measureText(firstLabel).width + 40; // Add padding
        let maxSecondWidth = context.measureText(secondLabel).width + 40;

        // Measure all event data
        filteredEvents.forEach(event => {
            const firstWidth = context.measureText(event[0]).width + 40;
            const secondWidth = context.measureText(event[1]).width + 40;

            maxFirstWidth = Math.max(maxFirstWidth, firstWidth);
            maxSecondWidth = Math.max(maxSecondWidth, secondWidth);
        });

        // Set minimum and maximum constraints
        const minWidth = 120;
        const maxWidth = 400;

        // Calculate total available width (container width minus gaps)
        const container = document.querySelector('.events .events-container');
        if (container) {
            const containerWidth = container.clientWidth;
            const totalGapWidth = containerWidth * 0.02; // 2% gap
            const availableWidth = containerWidth - totalGapWidth - 40; // 40px for padding
            
            // If total width exceeds container, scale proportionally
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

    // Search function
    const performSearch = (query: string) => {
        if (!events) return;
        
        if (query.trim() === "") {
            setFilteredEvents(events);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = events.filter(event => {
            if (event[0].toLowerCase().includes(lowerQuery)) return true;
            if (event[1].toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        setFilteredEvents(filtered);
        setSelectedEventIndexes(new Set());
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(800, 500)); // Slightly wider
    }

    useEffect(() => {
        resizeWindow();
        getEvents();
    }, []);

    // Recalculate widths when filtered events change
    useEffect(() => {
        if (filteredEvents) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                calculateColumnWidths();
            }, 50);
        }
    }, [filteredEvents]);

    // Recalculate on window resize
    useEffect(() => {
        const handleResize = () => {
            if (filteredEvents) {
                calculateColumnWidths();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [filteredEvents]);

    const handleEventClick = (index: number) => {
        setSelectedEventIndexes(prev => {
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
        <div className="events">
            <button className="back-button" onClick={async() => {await invoke("close_extra_windows", {}); onNavigate("/staff-menu")}}>
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
                        <div className="loading-message">Loading events...</div>
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