import { Route, Routes, BrowserRouter, useNavigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import LoginWindow from "./windows/login";
import SignupWindow from "./windows/signup/signup";
import SignupSetInfo from "./windows/signup/signup_set_info";
import CustomerAreaMenu from "./windows/customer_area/customer_area_menu";
import StaffAreaMenu from "./windows/staff_area/staff_area_menu";
import CustomerAccountWindow from "./windows/customer_area/customer_account";
import CustomerChangeAccount from "./windows/customer_area/customer-change-account";
import React from "react";
import CustomerAccountValidate from "./windows/customer_area/customer_account_validate";
import { AccountChange } from "../misc";

export default function App() {
    const navigate = useNavigate();

    // We need a way to let components "communicate". For example the account pages. In general, they allow editing of the user's info, allowing you to select
    // which one to change, but when you do that it changes to a new window, but how does said window know what happened in the one prior?
    // To allow this communication, we can set up a state in the App component. Then we can pass either the state itself or the function to change it based on
    // whether the components requires read or write, or both.
    const [customerAccountChange, setCustomerAccountChange] = React.useState(AccountChange.None);

    function onNavigate(input: string) {
        if (location.pathname === input) {
            return;
        }

        navigate(input);
    }

    return (
        <Routes>
            <Route path="/" element={<LoginWindow onNavigate={onNavigate} />} />
            <Route path="/signup" element={<SignupWindow onNavigate={onNavigate} />} />
            <Route path="/signup-set-info" element={<SignupSetInfo onNavigate={onNavigate} />} />

            <Route path="/customer-menu" element={<CustomerAreaMenu onNavigate={onNavigate} />} />

            <Route path="/customer-account" element={<CustomerAccountWindow onNavigate={onNavigate} />} />
            <Route path="/customer-account-change-info" element={<CustomerChangeAccount onNavigate={onNavigate} setCustomerAccountChange={setCustomerAccountChange} />} />
            <Route path="/customer-account-validate" element={<CustomerAccountValidate onNavigate={onNavigate} />} />

            <Route path="/staff-menu" element={<StaffAreaMenu onNavigate={onNavigate} />} />
        </Routes>
    );
}

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}