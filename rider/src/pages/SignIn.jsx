// src/pages/SignIn.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // optional backend
const MAGIC_PASS = import.meta.env.VITE_DEV_MAGIC_PASSWORD || "RideNow!2025"; // ← temp dev password

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!validateEmail(email)) return setErr("Enter a valid email.");
    if (!password) return setErr("Password is required.");

    setLoading(true);
    try {
      // ✅ DEV BYPASS: magic password unlocks dashboard without backend
      if (password === MAGIC_PASS) {
        localStorage.setItem("isRiderLoggedIn", "true");
        localStorage.setItem("riderEmail", email.trim());
        localStorage.setItem("riderId", crypto.randomUUID());
        localStorage.setItem("riderStatus", "approved"); // if you use pending-approval flow
        navigate("/dashboard", { replace: true });
        return;
      }

      // 👉 Real API (if configured)
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/riders/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Sign in failed");

        localStorage.setItem("isRiderLoggedIn", "true");
        localStorage.setItem("riderEmail", data.rider?.email || email);
        localStorage.setItem("riderId", data.rider?.id || crypto.randomUUID());
        localStorage.setItem("riderStatus", data.rider?.status || "approved");
        navigate("/dashboard", { replace: true });
        return;
      }

      // 🧪 Demo fallback when no API is set and no magic password used
      localStorage.setItem("isRiderLoggedIn", "true");
      localStorage.setItem("riderEmail", email);
      localStorage.setItem("riderId", crypto.randomUUID());
      localStorage.setItem("riderStatus", "approved");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error(e);
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#637865] to-[#1b5e20] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-black/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <img src="/yov.png" alt="GetYovo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-[#1b5e20]">Rider Sign In</h1>
          </div>

          {err && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-700">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">Password</span>
              <div className="mt-1 relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full rounded-lg bg-gray-100 px-3 py-2 pr-10 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-2 text-sm text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="accent-[#1b5e20]" /> Remember me
              </label>
              <Link to="/forgot" className="text-sm text-[#1b5e20] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition ${
                loading ? "bg-gray-400" : "bg-[#1b5e20] hover:bg-[#2e7d32]"
              }`}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* Small dev hint (optional; remove for production) */}
            <p className="text-xs text-gray-500 mt-2">
              Dev access: use password <span className="font-semibold">RideNow!2025</span> to enter without the API.
            </p>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            New rider?{" "}
            <Link to="/signup" className="text-[#1b5e20] font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-3 text-center text-xs text-white/80">
          By signing in you agree to our <span className="font-medium">Terms</span>.
        </p>
      </div>
    </main>
  );
}