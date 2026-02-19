import { Route, Routes, BrowserRouter, useNavigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import LoginWindow from "./windows/login";
import SignupWindow from "./windows/signup/signup";
import SignupSetInfo from "./windows/signup/signup_set_info";
import CustomerAreaMenu from "./windows/customer_area/customer_area_menu";
import StaffAreaMenu from "./windows/staff_area/staff_area_menu";
import CustomerAccountWindow from "./windows/customer_area/customer_account";

export default function App() {
    const navigate = useNavigate();

    function onNavigate(input: string) {
        if (location.pathname === input) {
            return;
        }

        navigate(input);
    }

    return (
        <Routes>
            <Route path="/a" element={<LoginWindow onNavigate={onNavigate} />} />
            <Route path="/signup" element={<SignupWindow onNavigate={onNavigate} />} />
            <Route path="/signup-set-info" element={<SignupSetInfo onNavigate={onNavigate} />} />

            <Route path="/customer-menu" element={<CustomerAreaMenu onNavigate={onNavigate} />} />

            <Route path="/" element={<CustomerAccountWindow onNavigate={onNavigate} />} />

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