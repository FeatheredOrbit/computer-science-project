import React, { useState, useEffect, useRef } from "react";
import "../../../../styles/customers.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

type CustomerData = [number, string, string, string]; // [id, name, email, date joined]

type Props = {
    onNavigate: (input: string) => void
    setCustomerId: React.Dispatch<React.SetStateAction<number | undefined>>
};

type SortType = "name" | "email";

export default function Customers({onNavigate, setCustomerId}: Props) {
    const [customers, setCustomers] = useState<CustomerData[] | null>(null);
    const [sortType, setSortType] = useState<SortType>("name");
    const [selectedCustomerIndexes, setSelectedCustomerIndexes] = useState<Set<number>>(new Set());

    const [deleteDisabled, setDeleteDisabled] = useState(true);
    const [changeDisabled, setChangeDisabled] = useState(true);

    const [columnWidths, setColumnWidths] = useState({ first: 150, second: 150, third: 120 }); // Default min widths

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
        setSelectedCustomerIndexes(new Set());
    }

    // Sort customers based on current sort type
    const getSortedCustomers = () => {
        if (!customers) return [];

        const sorted = [...customers];
        
        switch (sortType) {
            case "name":
                sorted.sort((a, b) => a[1].localeCompare(b[1]));
                break;
            case "email":
                sorted.sort((a, b) => a[2].localeCompare(b[2]));
                break;
        }
        
        return sorted;
    };

    // Calculate optimal column widths based on content
    const calculateColumnWidths = () => {
        if (!customers || customers.length === 0) return;

        // Start with label widths
        const firstLabel = sortType === "name" ? "NAME" : "EMAIL";
        const secondLabel = sortType === "email" ? "NAME" : "EMAIL";
        const thirdLabel = "DATE JOINED";

        // Measure label widths using a temporary canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        context.font = '16px Arial'; // Match your font

        let maxFirstWidth = context.measureText(firstLabel).width + 30; // Add padding
        let maxSecondWidth = context.measureText(secondLabel).width + 30;
        let maxThirdWidth = context.measureText(thirdLabel).width + 30;

        // Measure all customer data
        customers.forEach(customer => {
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

        // Set minimum and maximum constraints
        const minWidth = 100;
        const maxWidth = 300; // Prevent ridiculously wide columns

        setColumnWidths({
            first: Math.min(Math.max(maxFirstWidth, minWidth), maxWidth),
            second: Math.min(Math.max(maxSecondWidth, minWidth), maxWidth),
            third: Math.min(Math.max(maxThirdWidth, minWidth), maxWidth)
        });
    };

    async function resizeWindow() {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(new LogicalSize(900, 640)); // Slightly wider to accommodate emails
    }

    useEffect(() => {
        setDeleteDisabled(selectedCustomerIndexes.size === 0);
        setChangeDisabled(selectedCustomerIndexes.size !== 1);
    }, [selectedCustomerIndexes]);

    useEffect(() => {
        resizeWindow();
        getCustomers();
    }, []);

    // Recalculate widths when customers or sort type changes
    useEffect(() => {
        if (customers) {
            calculateColumnWidths();
        }
    }, [customers, sortType]);

    const handleCustomerClick = (index: number) => {
        setSelectedCustomerIndexes(prev => {
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

    // Get label texts based on sort type
    const getFirstLabel = () => {
        return sortType === "name" ? "NAME" : "EMAIL";
    };

    const getSecondLabel = () => {
        return sortType === "email" ? "NAME" : "EMAIL";
    };

    return (
        <div className="customers">
            <button className="back-to-menu-button" onClick={() => onNavigate("/staff-menu")}>
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

            <div className="customers-container">
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
                        onChange={(e) => setSortType(e.target.value as SortType)}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="email">Sort by Email</option>
                    </select>
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}