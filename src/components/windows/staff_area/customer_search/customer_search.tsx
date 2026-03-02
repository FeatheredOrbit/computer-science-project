import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/customer_search.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

type CustomerData = [number, string, string, string]; // [id, name, email, date joined]

type Props = {
    onNavigate: (input: string) => void
    setCustomerId: React.Dispatch<React.SetStateAction<number | undefined>>
};

export default function CustomerSearch({onNavigate, setCustomerId}: Props) {
    const [customers, setCustomers] = useState<CustomerData[] | null>(null);
    const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomerIndexes, setSelectedCustomerIndexes] = useState<Set<number>>(new Set());

    const [deleteDisabled, setDeleteDisabled] = useState(true);
    const [changeDisabled, setChangeDisabled] = useState(true);

    const [columnWidths, setColumnWidths] = useState({ first: 150, second: 150, third: 120 });

    const contentRef = useRef<HTMLDivElement>(null);

    async function deleteClicked() {
        if (selectedCustomerIndexes.size === 0) return;

        const sorted = getSortedCustomers();
        const idsToDelete = Array.from(selectedCustomerIndexes)
            .map(i => sorted[i]?.[0])
            .filter((id): id is number => typeof id === 'number');

        if (idsToDelete.length === 0) return;

        await invoke("delete_customers", { ids: idsToDelete });

        setSelectedCustomerIndexes(new Set());
        await getCustomers();
    }

    async function changeClicked() {
        if (selectedCustomerIndexes.size !== 1) return;

        const idx = selectedCustomerIndexes.values().next().value as number;
        const sorted = getSortedCustomers();
        const id = sorted[idx]?.[0];
        if (typeof id !== 'number') return;

        setCustomerId(id);
        onNavigate("/change-customer");
    }

    async function getCustomers() {
        const message = await invoke<CustomerData[]>("get_customers", {});
        setCustomers(message);
        setFilteredCustomers(message);
        setSelectedCustomerIndexes(new Set());
    }

    // Search function - searches in order: name, email, date
    const performSearch = function(query: string) {
        if (!customers) return;
        
        if (query.trim() === "") {
            setFilteredCustomers(customers);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = customers.filter(function(customer) {
            // Search in name first
            if (customer[1].toLowerCase().includes(lowerQuery)) return true;
            // Then search in email
            if (customer[2].toLowerCase().includes(lowerQuery)) return true;
            // Then search in date
            if (customer[3].toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        setFilteredCustomers(filtered);
    };

    const handleSearchChange = function(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    // Sort customers - always sort by name for consistent display
    const getSortedCustomers = function() {
        if (!filteredCustomers) return [];

        const sorted = [...filteredCustomers];
        sorted.sort((a, b) => a[1].localeCompare(b[1])); // Always sort by name
        
        return sorted;
    };

    // Calculate optimal column widths based on content
    const calculateColumnWidths = function() {
        if (!filteredCustomers || filteredCustomers.length === 0) return;

        // Label widths
        const firstLabel = "NAME";
        const secondLabel = "EMAIL";
        const thirdLabel = "DATE JOINED";

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        context.font = '16px Arial';

        let maxFirstWidth = context.measureText(firstLabel).width + 30;
        let maxSecondWidth = context.measureText(secondLabel).width + 30;
        let maxThirdWidth = context.measureText(thirdLabel).width + 30;

        // Measure all customer data
        filteredCustomers.forEach(function(customer) {
            const firstWidth = context.measureText(customer[1]).width + 30; // name
            const secondWidth = context.measureText(customer[2]).width + 30; // email
            const thirdWidth = context.measureText(customer[3]).width + 30; // date

            maxFirstWidth = Math.max(maxFirstWidth, firstWidth);
            maxSecondWidth = Math.max(maxSecondWidth, secondWidth);
            maxThirdWidth = Math.max(maxThirdWidth, thirdWidth);
        });

        const minWidth = 100;
        const maxWidth = 350; // Slightly wider for emails

        setColumnWidths({
            first: Math.min(Math.max(maxFirstWidth, minWidth), maxWidth),
            second: Math.min(Math.max(maxSecondWidth, minWidth), maxWidth),
            third: Math.min(Math.max(maxThirdWidth, minWidth), maxWidth)
        });
    };

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(950, 640)); // Even wider for emails
    }

    useEffect(function() {
        setDeleteDisabled(selectedCustomerIndexes.size === 0);
        setChangeDisabled(selectedCustomerIndexes.size !== 1);
    }, [selectedCustomerIndexes]);

    useEffect(function() {
        resizeWindow();
        getCustomers();
    }, []);

    // Recalculate widths when filtered customers change
    useEffect(function() {
        if (filteredCustomers) {
            calculateColumnWidths();
        }
    }, [filteredCustomers]);

    const handleCustomerClick = function(index: number) {
        setSelectedCustomerIndexes(function(prev) {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const sortedCustomers = getSortedCustomers();

    return (
        <div className="customer-search">
            <button className="back-button" onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate('/customers'); } }} onClick={function() { onNavigate("/customers"); }}> 
                BACK TO CUSTOMER VIEWER
            </button>

            <div className="customer-label">
                <h1 style={{ fontSize: "38px" }}> CUSTOMER SEARCH </h1>
            </div>

            <div className="amount-of-selections">
                <h1 style={{ textAlign: "center" }}> {selectedCustomerIndexes.size} SELECTED </h1>
            </div>

            <button className="delete-button" disabled={deleteDisabled} onClick={deleteClicked}>
                DELETE SELECTED
            </button>

            <button className="change-button" disabled={changeDisabled} onClick={changeClicked}>
                CHANGE SELECTED
            </button>

            <div className="customers-container">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, or date..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <img className="search-symbol" src="assets/mangifying_glass.png" alt="Search" />
                </div>

                <div className="customers-header">
                    <div className="labels-container">
                        <div 
                            className="header-label first-label"
                            style={{ width: columnWidths.first }}
                        >
                            NAME
                        </div>
                        <div 
                            className="header-label second-label"
                            style={{ width: columnWidths.second }}
                        >
                            EMAIL
                        </div>
                        <div 
                            className="header-label third-label"
                            style={{ width: columnWidths.third }}
                        >
                            DATE JOINED
                        </div>
                    </div>
                </div>

                <div className="customers-scroll-area">
                    {customers === null ? (
                        <div className="loading-message">Loading customers...</div>
                    ) : sortedCustomers.length === 0 ? (
                        <div className="no-customers-message">No customers found</div>
                    ) : (
                        <div className="customers-list" ref={contentRef}>
                            {sortedCustomers.map((customer, index) => (
                                <div 
                                    key={`${customer[0]}-${index}`}
                                    className={`customer-card ${selectedCustomerIndexes.has(index) ? 'selected' : ''}`}
                                    onClick={() => handleCustomerClick(index)}
                                >
                                    <div 
                                        className="customer-field first-field"
                                        style={{ width: columnWidths.first }}
                                    >
                                        {customer[1]} {/* Name */}
                                    </div>
                                    <div 
                                        className="customer-field second-field"
                                        style={{ width: columnWidths.second }}
                                    >
                                        {customer[2]} {/* Email */}
                                    </div>
                                    <div 
                                        className="customer-field third-field"
                                        style={{ width: columnWidths.third }}
                                    >
                                        {customer[3]} {/* Date joined */}
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