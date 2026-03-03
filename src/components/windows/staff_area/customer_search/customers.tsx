import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/customers.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

// Type alias for customer data.s
type CustomerData = [number, string, string, string]; // [id, name, email, date joined]

// Props accepted by this component.
type Props = {
    onNavigate: (input: string) => void
    setCustomerId: React.Dispatch<React.SetStateAction<number | undefined>>
};

type SortType = "name" | "email";

// Component where staff can view and manage existing customers. Takes "onNavigate" and "setCustomerId" to navigate and select a customer id.
export default function Customers({onNavigate, setCustomerId}: Props) {
    // Set up states.
    const [customers, setCustomers] = useState<CustomerData[] | null>(null);
    const [sortType, setSortType] = useState<SortType>("name");
    const [selectedCustomerIndexes, setSelectedCustomerIndexes] = useState<Set<number>>(new Set());

    const [deleteDisabled, setDeleteDisabled] = useState(true);
    const [changeDisabled, setChangeDisabled] = useState(true);
    const [viewReservationsDisabled, setViewReservationsDisabled] =useState(true);

    const [columnWidths, setColumnWidths] = useState({ first: 150, second: 150, third: 120 });

    const contentRef = useRef<HTMLDivElement>(null);

    // Function that deletes the selected customers via backend call.
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

    // Function that opens the change-customer view for the selected customer.
    async function changeClicked() {
        if (selectedCustomerIndexes.size !== 1) return;

        const idx = selectedCustomerIndexes.values().next().value as number;
        const sorted = getSortedCustomers();
        const id = sorted[idx]?.[0];
        if (typeof id !== 'number') return;

        setCustomerId(id);
        onNavigate("/change-customer");
    }

    // Function that opens the reservations view for the selected customer.
    async function viewReservationsClicked() {
        if (selectedCustomerIndexes.size !== 1) return;

        const idx = selectedCustomerIndexes.values().next().value as number;
        const sorted = getSortedCustomers();
        const id = sorted[idx]?.[0];
        if (typeof id !== 'number') return;

        setCustomerId(id);
        onNavigate("/customer-reservations");
    }

    // Function that retrieves customers from the backend and resets selection.
    async function getCustomers() {
        const message = await invoke<CustomerData[]>("get_customers", {});
        setCustomers(message);
        setSelectedCustomerIndexes(new Set());
    }

    // Function that returns a sorted array of customers based on the current sort type.
    function getSortedCustomers() {
        if (!customers) return [];

        const sorted = [...customers];
        
        switch (sortType) {
            case "name":
                sorted.sort(function(a, b) { return a[1].localeCompare(b[1]); });
                break;
            case "email":
                sorted.sort(function(a, b) { return a[2].localeCompare(b[2]); });
                break;
        }
        
        return sorted;
    };

    // Function that calculates optimal column widths based on content and labels.
    function calculateColumnWidths() {
        if (!customers || customers.length === 0) return;

        const firstLabel = sortType === "name" ? "NAME" : "EMAIL";
        const secondLabel = sortType === "email" ? "NAME" : "EMAIL";
        const thirdLabel = "DATE JOINED";

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        context.font = '16px Arial';

        let maxFirstWidth = context.measureText(firstLabel).width + 30;
        let maxSecondWidth = context.measureText(secondLabel).width + 30;
        let maxThirdWidth = context.measureText(thirdLabel).width + 30;

        customers.forEach(function(customer) {
            const firstContent = sortType === "name" ? customer[1] : customer[2];
            const secondContent = sortType === "email" ? customer[1] : customer[2];
            const thirdContent = customer[3];

            const firstWidth = context.measureText(firstContent).width + 30;
            const secondWidth = context.measureText(secondContent).width + 30;
            const thirdWidth = context.measureText(thirdContent).width + 30;

            maxFirstWidth = Math.max(maxFirstWidth, firstWidth);
            maxSecondWidth = Math.max(maxSecondWidth, secondWidth);
            maxThirdWidth = Math.max(maxThirdWidth, thirdWidth);
        });

        const minWidth = 100;
        const maxWidth = 300;

        setColumnWidths({
            first: Math.min(Math.max(maxFirstWidth, minWidth), maxWidth),
            second: Math.min(Math.max(maxSecondWidth, minWidth), maxWidth),
            third: Math.min(Math.max(maxThirdWidth, minWidth), maxWidth)
        });
    };

    // Function that resizes the window to the customers view dimensions.
    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(900, 640));
    }

    useEffect(function() {
        setDeleteDisabled(selectedCustomerIndexes.size === 0);
        setChangeDisabled(selectedCustomerIndexes.size !== 1);
        setViewReservationsDisabled(selectedCustomerIndexes.size !== 1);
    }, [selectedCustomerIndexes]);

    // Call startup functions.
    useEffect(function() {
        resizeWindow();
        getCustomers();
    }, []);

    // Recalculate widths when customers or sort type changes.
    useEffect(function() {
        if (customers) {
            calculateColumnWidths();
        }
    }, [customers, sortType]);

    function handleCustomerClick(index: number) {
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

    // Helper that returns the first column label based on sort type.
    function getFirstLabel() {
        return sortType === "name" ? "NAME" : "EMAIL";
    };

    // Helper that returns the second column label based on sort type.
    function getSecondLabel() {
        return sortType === "email" ? "NAME" : "EMAIL";
    };

    // Structure of the page.
    return (
        <div className="customers">
            <button className="back-to-menu-button" onKeyDown={function(e) { if (e.key === 'Escape') { onNavigate('/staff-menu'); } }} onClick={function() { onNavigate("/staff-menu") }}>
                BACK TO MENU
            </button>

            <div className="customer-label">
                <h1 style={{ fontSize: "38px" }}> CUSTOMERS </h1>
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

            <button className="reservations-button" disabled={viewReservationsDisabled} onClick={viewReservationsClicked}>
                VIEW RESERVATIONS
            </button>

            <div className="customers-container">
                <img className="search-symbol" src="assets/mangifying_glass.png" onClick={function() {onNavigate("/customer-search")}}/>

                <div className="customers-header">
                    <div className="labels-container">
                        <div 
                            className="header-label first-label"
                            style={{ width: columnWidths.first }}
                        >
                            {getFirstLabel()}
                        </div>
                        <div 
                            className="header-label second-label"
                            style={{ width: columnWidths.second }}
                        >
                            {getSecondLabel()}
                        </div>
                        <div 
                            className="header-label third-label"
                            style={{ width: columnWidths.third }}
                        >
                            DATE JOINED
                        </div>
                    </div>
                    <select 
                        className="sorting-dropdown"
                        value={sortType}
                        onChange={function(e) { setSortType(e.target.value as SortType); }}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="email">Sort by Email</option>
                    </select>
                </div>

                <div className="customers-scroll-area">
                    {customers === null ? (
                        <div className="loading-message"> Loading customers </div>
                    ) : (
                        <div className="customers-list" ref={contentRef}>
                                    {sortedCustomers.map(function(customer, index) {
                                        return (
                                        <div 
                                            key={`${customer[0]}-${index}`}
                                            className={`customer-card ${selectedCustomerIndexes.has(index) ? 'selected' : ''}`}
                                            onClick={function() { handleCustomerClick(index); }}
                                        >
                                            <div 
                                                className="customer-field first-field"
                                                style={{ width: columnWidths.first }}
                                            >
                                                {sortType === "name" ? customer[1] : customer[2]}
                                            </div>
                                            <div 
                                                className="customer-field second-field"
                                                style={{ width: columnWidths.second }}
                                            >
                                                {sortType === "email" ? customer[1] : customer[2]}
                                            </div>
                                            <div 
                                                className="customer-field third-field"
                                                style={{ width: columnWidths.third }}
                                            >
                                                {customer[3]}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                    )}
                </div>
            </div>
        </div>
    );
}