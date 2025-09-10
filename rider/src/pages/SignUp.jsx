// src/pages/SignUp.jsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // optional backend

export default function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("Bike"); // Bike | Car | Tricycle
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const usingMock = useMemo(() => !API_BASE, []);
  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const validatePhone = (v) => /^[0-9+()\-\s]{7,}$/.test(v);

  async function doDemoSignUp() {
    const riderId = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    localStorage.setItem("isRiderLoggedIn", "true");
    localStorage.setItem("riderId", riderId);
    localStorage.setItem("riderEmail", email);
    localStorage.setItem("riderName", fullName);
    localStorage.setItem("riderPhone", phone);
    localStorage.setItem("riderVehicle", vehicle);
    localStorage.setItem("riderToken", "demo-" + riderId);
    navigate("/dashboard", { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    // basic validation
    if (!fullName.trim()) return setErr("Enter your full name.");
    if (!validatePhone(phone)) return setErr("Enter a valid phone number.");
    if (!validateEmail(email)) return setErr("Enter a valid email.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    if (!agree) return setErr("You must agree to the Terms.");

    setLoading(true);
    try {
      // Try real API first (if configured)
      if (API_BASE) {
        try {
          const res = await fetch(`${API_BASE}/api/riders/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              phone,
              vehicle,
              email,
              password,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          // Persist backend response (adjust keys if your API differs)
          localStorage.setItem("isRiderLoggedIn", "true");
          localStorage.setItem("riderId", data.rider?.id || (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)));
          localStorage.setItem("riderEmail", data.rider?.email || email);
          localStorage.setItem("riderName", data.rider?.fullName || fullName);
          localStorage.setItem("riderPhone", data.rider?.phone || phone);
          localStorage.setItem("riderVehicle", data.rider?.vehicle || vehicle);
          localStorage.setItem("riderToken", data.token || "api-token");
          navigate("/dashboard", { replace: true });
          return;
        } catch (apiErr) {
          console.warn("API signup failed — falling back to demo:", apiErr);
          // fall through to demo
        }
      }

      // Fallback demo mode (no backend / API failed)
      await doDemoSignUp();
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
            <h1 className="text-xl font-bold text-[#1b5e20]">Rider Sign Up</h1>
          </div>

          {usingMock && (
            <div className="mb-3 text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg p-2">
              Demo mode (no backend). You can sign up with any details.
            </div>
          )}
          {err && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-700">Full name</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">Phone</span>
              <input
                type="tel"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                placeholder="+2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2 sm:col-span-1">
                <span className="text-sm text-gray-700">Vehicle</span>
                <select
                  className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                >
                  <option>Bike</option>
                  <option>Car</option>
                  <option>Tricycle</option>
                </select>
              </label>

              <label className="block col-span-2 sm:col-span-1">
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
            </div>

            <label className="block">
              <span className="text-sm text-gray-700">Password</span>
              <div className="mt-1 relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full rounded-lg bg-gray-100 px-3 py-2 pr-12 outline-none"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <label className="block">
              <span className="text-sm text-gray-700">Confirm password</span>
              <div className="mt-1 relative">
                <input
                  type={showPw2 ? "text" : "password"}
                  className="w-full rounded-lg bg-gray-100 px-3 py-2 pr-12 outline-none"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((s) => !s)}
                  className="absolute inset-y-0 right-2 text-sm text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPw2 ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="accent-[#1b5e20]"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              I agree to the <span className="font-medium">Terms</span>.
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition ${
                loading ? "bg-gray-400" : "bg-[#1b5e20] hover:bg-[#2e7d32]"
              }`}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-[#1b5e20] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-3 text-center text-xs text-white/80">
          Ride with GetYovo — fast, fair, and flexible.
        </p>
      </div>
    </main>
  );
}