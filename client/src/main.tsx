import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling for development
if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
