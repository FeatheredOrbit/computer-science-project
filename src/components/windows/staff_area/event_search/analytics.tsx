import "../../../../styles/analytics.css";
import { useSearchParams } from "react-router-dom";


export default function Analytics() {
    // We get the information that was encoded into the url.
    const [searchParams] = useSearchParams();
    const reservationAmount = searchParams.get("reservation-amount");
    const expectedRevenue = searchParams.get("expected-revenue");


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