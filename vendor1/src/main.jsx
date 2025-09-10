// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import VendorLogin from "./pages/VendorLogin.jsx";
import VendorSignup from "./pages/VendorSignup.jsx";
import VendorDashboard from "./pages/VendorDashboard.jsx";
import VendorProducts from "./pages/VendorProducts.jsx";
import VendorOrders from "./pages/VendorOrders.jsx";
import VendorTodayOrders from "./pages/VendorTodayOrders.jsx";
import VendorOrderDetail from "./pages/VendorOrderDetail.jsx";
import VendorSettings from "./pages/VendorSettings.jsx";

function RequireAuth({ children }) {
  const authed = localStorage.getItem("vendorLoggedIn") === "true";
  return authed ? children : <Navigate to="/login" replace />;
}
function RequireGuest({ children }) {
  const authed = localStorage.getItem("vendorLoggedIn") === "true";
  return authed ? <Navigate to="/dashboard" replace /> : children;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Root router for subdomain */}
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/login" element={<RequireGuest><VendorLogin /></RequireGuest>} />
        <Route path="/signup" element={<RequireGuest><VendorSignup /></RequireGuest>} />

        <Route path="/dashboard" element={<RequireAuth><VendorDashboard /></RequireAuth>} />
        <Route path="/products" element={<RequireAuth><VendorProducts /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><VendorOrders /></RequireAuth>} />
        <Route path="/orders/today" element={<RequireAuth><VendorTodayOrders /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><VendorOrderDetail /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><VendorSettings /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
