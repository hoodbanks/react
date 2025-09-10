// src/pages/PendingApproval.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function PendingApproval() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");

  async function refreshStatus() {
    const riderId = localStorage.getItem("riderId");
    if (!riderId) {
      setMsg("No rider ID found. Please sign in again.");
      return;
    }

    // If you don't have a backend yet, just bail out gracefully
    if (!API_BASE) {
      setMsg("Waiting for admin approval…");
      return;
    }

    setChecking(true);
    setMsg("");
    try {
      // Example endpoint — adjust to your backend when ready
      const res = await fetch(
        `${API_BASE}/api/riders/status?id=${encodeURIComponent(riderId)}`
      );
      const data = await res.json().catch(() => ({}));
      const status = data?.status || data?.rider?.status || "pending";

      localStorage.setItem("riderStatus", status);

      if (status === "approved") {
        localStorage.setItem("isRiderLoggedIn", "true");
        navigate("/dashboard", { replace: true });
      } else if (status === "rejected" || status === "suspended") {
        setMsg("Your account is not approved. Please contact support.");
      } else {
        setMsg("Still pending. We’ll unlock your dashboard once approved.");
      }
    } catch (e) {
      setMsg("Couldn’t check status right now.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    // light polling while on this screen
    const t = setInterval(refreshStatus, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#637865] to-[#1b5e20] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 text-center">
          <img src="/yov.png" alt="GetYovo" className="h-12 w-12 mx-auto" />
          <h1 className="mt-3 text-xl font-bold text-[#1b5e20]">Account Pending Approval</h1>
          <p className="mt-2 text-sm text-gray-600">
            Thanks for signing up. Your profile is under review. We’ll unlock your dashboard once approved.
          </p>

          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}

          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={refreshStatus}
              disabled={checking}
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                checking ? "bg-gray-400" : "bg-[#1b5e20] hover:bg-[#2e7d32]"
              }`}
            >
              {checking ? "Checking…" : "Refresh Status"}
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/signin", { replace: true });
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}