import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!validateEmail(email)) {
      setErr("Enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/riders/forgot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to send code");
        setOk(true);
      } else {
        // Demo mode: generate a code and store it
        const code = String(Math.floor(100000 + Math.random() * 900000));
        localStorage.setItem("riderResetEmail", email);
        localStorage.setItem("riderResetOTP", code);
        console.log("Demo OTP (not for prod):", code);
        setOk(true);
      }
    } catch (e) {
      console.error(e);
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function goToReset() {
    navigate(`/reset?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#637865] to-[#1b5e20] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-black/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <img src="/yov.png" alt="GetYovo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-[#1b5e20]">Forgot Password</h1>
          </div>

          {err && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
              {err}
            </div>
          )}

          {!ok ? (
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition ${
                  loading ? "bg-gray-400" : "bg-[#1b5e20] hover:bg-[#2e7d32]"
                }`}
              >
                {loading ? "Sending…" : "Send reset code"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                We sent a 6-digit code to <b>{email}</b>. Enter it on the next page to reset your password.
              </p>
              <button
                onClick={goToReset}
                className="w-full rounded-lg px-4 py-2 font-semibold text-white bg-[#1b5e20] hover:bg-[#2e7d32] transition"
              >
                Enter code
              </button>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-white/80">
          Need help? Contact support.
        </p>
      </div>
    </main>
  );
}