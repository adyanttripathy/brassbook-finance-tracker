import React from "react";
import { createRoot } from "react-dom/client";
import BrassBook from "./BrassBook.jsx";
import "./storage-shim.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrassBook />
  </React.StrictMode>
);
