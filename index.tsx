import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/RevivedApp";
const root = document.getElementById("root");
if (!root) throw new Error("StockCommand root element missing");
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
