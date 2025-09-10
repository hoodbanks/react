import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const q = useQuery();
  const initialEmail = q.get("email") || localStorage.getItem("riderResetEmail") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email) return setErr("Missing email.");
    if (!code || code.length < 4) return setErr("Enter the verification code.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/riders/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword: password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Reset failed");
      } else {
        // Demo mode: verify code from localStorage
        const storedEmail = localStorage.getItem("riderResetEmail");
        const storedCode = localStorage.getItem("riderResetOTP");
        if (storedEmail !== email || storedCode !== code) {
          throw new Error("Invalid code or email.");
        }
        // clear demo state
        localStorage.removeItem("riderResetEmail");
        localStorage.removeItem("riderResetOTP");
      }

      setOk(true);
      setTimeout(() => navigate("/signin", { replace: true }), 900);
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
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-black/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <img src="/yov.png" alt="GetYovo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-[#1b5e20]">Reset Password</h1>
          </div>

          {err && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
              {err}
            </div>
          )}
          {ok && (
            <div className="mb-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
              Password updated. Redirecting to sign in…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-700">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none tracking-widest"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">New password</span>
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
                >
                  {showPw2 ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition ${
                loading ? "bg-gray-400" : "bg-[#1b5e20] hover:bg-[#2e7d32]"
              }`}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        <p className="mt-3 text-center text-xs text-white/80">
          Didn’t get a code? Check spam or request again from the Forgot page.
        </p>
      </div>
    </main>
  );
}