// src/main.jsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import Active from "./pages/Active.jsx";
import Earnings from "./pages/Earnings.jsx";
import Settings from "./pages/Settings.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import PendingApproval from "./pages/PendingApproval.jsx";

/* ---------------- Auth / Approval Guards ---------------- */
function RequireRiderApproved({ children }) {
  const authed = localStorage.getItem("isRiderLoggedIn") === "true";
  const status = localStorage.getItem("riderStatus") || "pending";
  if (!authed) return <Navigate to="/signin" replace />;
  if (status !== "approved") return <Navigate to="/pending" replace />;
  return children;
}

function RequireRiderGuest({ children }) {
  const authed = localStorage.getItem("isRiderLoggedIn") === "true";
  const status = localStorage.getItem("riderStatus") || "pending";
  if (authed && status !== "approved") return <Navigate to="/pending" replace />;
  return authed ? <Navigate to="/dashboard" replace /> : children;
}

/* ---------------- Router ---------------- */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rider auth flow */}
        <Route path="/" element={<RequireRiderGuest><SignIn /></RequireRiderGuest>} />
        <Route path="/signin" element={<RequireRiderGuest><SignIn /></RequireRiderGuest>} />
        <Route path="/signup" element={<RequireRiderGuest><SignUp /></RequireRiderGuest>} />
        <Route path="/pending" element={<PendingApproval />} />

        {/* Rider protected pages */}
        <Route path="/dashboard" element={<RequireRiderApproved><Dashboard /></RequireRiderApproved>} />
        <Route path="/jobs" element={<RequireRiderApproved><Jobs /></RequireRiderApproved>} />
        <Route path="/active" element={<RequireRiderApproved><Active /></RequireRiderApproved>} />
        <Route path="/earnings" element={<RequireRiderApproved><Earnings /></RequireRiderApproved>} />
        <Route path="/settings" element={<RequireRiderApproved><Settings /></RequireRiderApproved>} />

        {/* Other */}
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);