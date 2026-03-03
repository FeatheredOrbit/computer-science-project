import "../../../../styles/analytics.css";
import { useSearchParams } from "react-router-dom";

// Analytics view for staff showing simple metrics. Reads encoded values from the URL to display metrics.
export default function Analytics() {
    // Extract metrics encoded into the URL search parameters.
    const [searchParams] = useSearchParams();
    const reservationAmount = searchParams.get("reservation-amount");
    const expectedRevenue = searchParams.get("expected-revenue");

    // Structure of the page.
    return (
        <div className="analytics">
            <div className="reservation-amount">
                <p> Amount of reservations: {reservationAmount} </p>
            </div>

            <div className="expected-revenue">
                <p> Expected revenue: £{expectedRevenue} </p>
            </div>
        </div>
    );
}