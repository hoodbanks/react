// src/main.jsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminSignIn from "./pages/AdminSignIn.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Orders from "./pages/Orders.jsx";
import Riders from "./pages/Riders.jsx";
import Vendors from "./pages/Vendors.jsx";
import Payments from "./pages/Payments.jsx"; // <-- added

function RequireAdmin({ children }) {
  const ok = localStorage.getItem("isAdminLoggedIn") === "true";
  return ok ? children : <Navigate to="/signin" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/signin" element={<AdminSignIn />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAdmin>
              <Orders />
            </RequireAdmin>
          }
        />
        <Route
          path="/riders"
          element={
            <RequireAdmin>
              <Riders />
            </RequireAdmin>
          }
        />
        <Route
          path="/vendors"
          element={
            <RequireAdmin>
              <Vendors />
            </RequireAdmin>
          }
        />
        <Route
          path="/payments"               // <-- added
          element={
            <RequireAdmin>
              <Payments />
            </RequireAdmin>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);