import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ConfirmationProvider } from "./context/ConfirmationContext.jsx";
import { FiscalYearProvider } from "./context/FiscalYearContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FiscalYearProvider>
      <NotificationProvider>
        <ConfirmationProvider>
          <App />
        </ConfirmationProvider>
      </NotificationProvider>
    </FiscalYearProvider>
  </StrictMode>
);
