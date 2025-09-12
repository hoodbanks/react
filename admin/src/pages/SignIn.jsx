// src/pages/AdminSignIn.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // If no env var, fallback to "admin123"
  const DEV_PASS = (import.meta.env.VITE_ADMIN_DEV_PASSWORD || "admin123").trim();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (pw.trim() !== DEV_PASS) {
        throw new Error("Wrong password.");
      }
      // mark authed
      localStorage.setItem("isAdminLoggedIn", "true");
      if (email) localStorage.setItem("adminEmail", email.trim());
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(e.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow border"
      >
        <h1 className="text-xl font-semibold mb-4">Admin Sign In</h1>

        {err && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2">
            {err}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm text-gray-700">Email (any)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded bg-gray-100 px-3 py-2 outline-none"
            placeholder="you@admin.com"
            autoComplete="email"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-700">Password</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1 w-full rounded bg-gray-100 px-3 py-2 outline-none"
            placeholder="admin123"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded px-4 py-2 font-semibold text-white ${
            loading ? "bg-gray-400" : "bg-black"
          }`}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p className="text-xs text-gray-500 mt-3">
          Dev login: password is <strong>admin123</strong> unless you set
          <code className="ml-1">VITE_ADMIN_DEV_PASSWORD</code> in a `.env` file.
        </p>
      </form>
    </main>
  );
}