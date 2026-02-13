import { Route, Routes, BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import LoginWindow from "./windows/login";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginWindow />} />
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