import { Route, Routes, BrowserRouter, useNavigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import Login from "./windows/login";
import Signup from "./windows/signup/signup";
import SignupSetInfo from "./windows/signup/signup_set_info";
import CustomerAreaMenu from "./windows/customer_area/customer_area_menu";
import StaffAreaMenu from "./windows/staff_area/staff_area_menu";
import CustomerAccountWindow from "./windows/customer_area/account/customer_account";
import CustomerChangeAccount from "./windows/customer_area/account/customer-change-account";
import { useState } from "react";
import CustomerAccountValidate from "./windows/customer_area/account/customer_account_validate";
import { AccountChange } from "../misc";
import CustomerAccountNewInfo from "./windows/customer_area/account/customer_account_new_info";
import ReservationCreatorWindow from "./windows/customer_area/reservation_creator/reservation_creator";
import EventInformation from "./windows/customer_area/reservation_creator/event-information";
import CommitReservation from "./windows/customer_area/reservation_creator/commit-reservation";
import YourReservations from "./windows/customer_area/reservation_search/your_reservations";
import ChangeReservation from "./windows/customer_area/reservation_search/change_reservation";
import ReservationSearch from "./windows/customer_area/reservation_search/reservation_search";
import Customers from "./windows/staff_area/customer_search/customers";
import ChangeCustomer from "./windows/staff_area/customer_search/change_customer";
import ChangeCustomerInfo from "./windows/staff_area/customer_search/change_customer_info";
import ChangeCustomerValidate from "./windows/staff_area/customer_search/change_customer_validate";
import ChangeCustomerApply from "./windows/staff_area/customer_search/change_customer_apply";
import CustomerSearch from "./windows/staff_area/customer_search/customer_search";
import CustomerReservations from "./windows/staff_area/customer_search/customer_reservations";
import ChangeCustomerReservation from "./windows/staff_area/customer_search/change_customer_reservation";
import CustomerReservationSearch from "./windows/staff_area/customer_search/customer_reservation_search";
import Events from "./windows/staff_area/event_search/events";
import Analytics from "./windows/staff_area/event_search/analytics";

// This is the main component, it handles every other component by assigning it a path and passing it parameters.
export default function App() {
    const navigate = useNavigate();

    // We need a way to let components "communicate". For example the account pages. In general, they allow editing of the user's info, allowing you to select
    // which one to change, but when you do that it changes to a new window, but how does said window know what happened in the one prior?
    // To allow this communication, we can set up a state in the App component. Then we can pass either the state itself or the function to change it based on
    // whether the components requires read or write, or both.
    const [customerAccountChange, setCustomerAccountChange] = useState(AccountChange.None);

    const [chosenEventId, setChosenEventId] = useState<number | null>(null);
    const [chosenName, setChosenName] = useState<string>("");
    const [chosenPhoneNumber, setChosenPhoneNumber] = useState<string>("");
    const [chosenRequirements, setChosenRequirements] = useState<string>("");
    const [peopleCount, setPeopleCount] = useState<string>("");

    const [customerId, setCustomerId] = useState<number | undefined>();
    const [reservationId, setReservationId] = useState<number | undefined>();

    // A function to be passed to every component to allow navigation throughout the program.
    function onNavigate(input: string) {
        if (location.pathname === input) {
            return;
        }

        navigate(input);
    }

    // Every component registered as a route in the program.
    return (
        <Routes>
            <Route path="/" element={<Login onNavigate={onNavigate} />} />
            <Route path="/signup" element={<Signup onNavigate={onNavigate} />} />
            <Route path="/signup-set-info" element={<SignupSetInfo onNavigate={onNavigate} />} />

            <Route path="/customer-menu" element={<CustomerAreaMenu onNavigate={onNavigate} />} />

            <Route path="/reservation-creator" element={<ReservationCreatorWindow 
                onNavigate={onNavigate} 
                setChosenEventId={setChosenEventId} 
                setPeopleCount={setPeopleCount}
                setChosenName={setChosenName}
                setChosenPhoneNumber={setChosenPhoneNumber}
                setChosenRequirements={setChosenRequirements}
            />} />
            <Route path="/event-information" element={<EventInformation/>} />
            <Route path="/commit-reservation" element={<CommitReservation 
                onNavigate={onNavigate} 
                chosenEventId={chosenEventId} 
                peopleCount={peopleCount}
                name={chosenName}
                phoneNumber={chosenPhoneNumber}
                requirements={chosenRequirements}
            />} />

            <Route path="/your-reservations" element={<YourReservations onNavigate={onNavigate} setReservationId={setReservationId}/>} />
            <Route path="/reservation-search" element={<ReservationSearch onNavigate={onNavigate} setReservationId={setReservationId}/>} />
            <Route path="/change-reservation" element={<ChangeReservation onNavigate={onNavigate} reservationId={reservationId}/>} />

            <Route path="/customer-account" element={<CustomerAccountWindow onNavigate={onNavigate} />} />
            <Route path="/customer-account-change-info" element={<CustomerChangeAccount onNavigate={onNavigate} setCustomerAccountChange={setCustomerAccountChange} />} />
            <Route path="/customer-account-validate" element={<CustomerAccountValidate onNavigate={onNavigate} />} />
            <Route path="/customer-account-new-info" element={<CustomerAccountNewInfo onNavigate={onNavigate} customerAccountChange={customerAccountChange}/>} />

            <Route path="/staff-menu" element={<StaffAreaMenu onNavigate={onNavigate} />} />
            <Route path="/customers" element={<Customers onNavigate={onNavigate} setCustomerId={setCustomerId} />} />
            <Route path="/customer-search" element={<CustomerSearch onNavigate={onNavigate} setCustomerId={setCustomerId} />} />
            <Route path="/customer-reservations" element={<CustomerReservations onNavigate={onNavigate} customerId={customerId} setReservationId={setReservationId} />} />
            <Route path="/customer-reservation-search" element={<CustomerReservationSearch onNavigate={onNavigate} customerId={customerId} setReservationId={setReservationId} />} />
            <Route path="/change-customer-reservation" element={<ChangeCustomerReservation onNavigate={onNavigate} reservationId={reservationId} />} />
            <Route path="/change-customer" element={<ChangeCustomer onNavigate={onNavigate} customerId={customerId} />} /> 
            <Route path="/change-customer-info" element={<ChangeCustomerInfo onNavigate={onNavigate} setCustomerAccountChange={setCustomerAccountChange} />} />
            <Route path="/change-customer-validate" element={<ChangeCustomerValidate onNavigate={onNavigate} />}/>
            <Route path="/change-customer-apply" element={<ChangeCustomerApply onNavigate={onNavigate} customerId={customerId} customerAccountChange={customerAccountChange} />} />
            <Route path="/events" element={<Events onNavigate={onNavigate} />} />
            <Route path="/analytics" element={<Analytics />} />
        </Routes>
    );
}

// This section just retreives an html element of id "root", where we then insert and start rendering our (mine) app.
const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}