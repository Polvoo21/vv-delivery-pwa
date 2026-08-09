import React from "react";
import { createRoot } from "react-dom/client";
import "./design-system.css";
import "./app-shell.css";
import "./site-showcase.css";
import App from "./App";
import { initMetrikaTracking } from "./utils/analytics";

initMetrikaTracking();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      })
      .catch(() => undefined);
  });
}
