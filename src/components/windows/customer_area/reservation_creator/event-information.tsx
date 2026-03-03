import "../../../../styles/event-information.css";
import { useSearchParams } from "react-router-dom";

// Component used to show information about an event/play, its only purpose really.
export default function EventInformation() {
    // We get the information that was encoded into the url.
    const [searchParams] = useSearchParams();
    const eventDate = searchParams.get("date");
    const eventInformation = searchParams.get("info");
    const eventCost = searchParams.get("cost");

    // Structure of the window.
    return (
        <div className="event-information">
            <div className="information">
                <p> {eventInformation} </p>
            </div>

            <div className="cost">
                <p> Cost: £{eventCost} </p>
            </div>

            <div className="date">
                <p> Date: {eventDate} </p>
            </div>
        </div>
    );
}