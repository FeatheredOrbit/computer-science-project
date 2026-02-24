import "../../../../styles/event-information.css";
import { useSearchParams } from "react-router-dom";


export default function EventInformation() {
    // We get the information that was encoded into the url.
    const [searchParams] = useSearchParams();
    const eventDate = searchParams.get("date");
    const eventInformation = searchParams.get("info");


    return (
        <div className="event-information">
            <div className="information">
                <p> {eventInformation} </p>
            </div>

            <div className="date">
                <p> Date: {eventDate} </p>
            </div>
        </div>
    );
}