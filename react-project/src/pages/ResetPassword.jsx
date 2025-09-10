// src/pages/ResetPassword.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function normalizePhone(input) {
  const digits = String(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+234" + digits.slice(1); // example for NG
  if (digits.startsWith("234")) return "+" + digits;
  return digits;
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState(() => sessionStorage.getItem("fp_phone") || "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // Switch UI: request (send OTP) or setpw (after VerifyOTP)
  const verified = sessionStorage.getItem("fp_verified") === "1";
  const mode = useMemo(() => (verified ? "setpw" : "request"), [verified]);

  // If verified but phone missing (hard refresh), reset the flow
  useEffect(() => {
    if (verified && !sessionStorage.getItem("fp_phone")) {
      sessionStorage.removeItem("fp_verified");
    }
  }, [verified]);

  const sendOtp = (e) => {
    e.preventDefault();
    const phoneE164 = normalizePhone(phone);
    if (!phoneE164 || phoneE164.length < 8) {
      alert("Enter a valid phone number");
      return;
    }

    // Demo OTP flow
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 5 * 60 * 1000;

    sessionStorage.setItem("fp_phone", phoneE164);
    sessionStorage.setItem("fp_code", otp);
    sessionStorage.setItem("fp_expires", String(expires));
    sessionStorage.setItem("fp_attempts", "5");
    sessionStorage.removeItem("fp_verified");

    console.log("DEBUG OTP:", otp);
    alert(`Demo OTP (remove in production): ${otp}`);

    navigate("/verify-otp", { replace: true });
  };

  const handleSetPassword = (e) => {
    e.preventDefault();
    if (pw.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (pw !== pw2) {
      alert("Passwords do not match.");
      return;
    }

    const doneFor = sessionStorage.getItem("fp_phone");
    // TODO: call backend to set new password for `doneFor`
    console.log("✅ Password reset for:", doneFor);

    // cleanup
    sessionStorage.removeItem("fp_phone");
    sessionStorage.removeItem("fp_code");
    sessionStorage.removeItem("fp_expires");
    sessionStorage.removeItem("fp_attempts");
    sessionStorage.removeItem("fp_verified");
    sessionStorage.setItem("fp_success", "1");

    navigate("/signin", { replace: true });
  };

  const masked = phone ? phone.replace(/.(?=.{4})/g, "•") : "";

  return (
    <main className="min-h-screen grid place-items-center bg-[#637865]">
      <div className="w-80 bg-white rounded-2xl p-6 shadow">
        <img src="/yov.png" alt="GetYovo" className="w-24 mx-auto mb-4" />

        {mode === "request" ? (
          <>
            <h1 className="text-xl font-bold text-[#1b5e20] text-center mb-1">Reset Password</h1>
            <p className="text-center text-sm text-gray-600 mb-4">
              Enter the phone number linked to your account.
            </p>

            <form onSubmit={sendOtp} className="space-y-3">
              <input
                className="w-full p-3 rounded-lg bg-gray-100 outline-none"
                inputMode="tel"
                type="tel"
                placeholder="Phone number (e.g. 0803..., +234...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                type="submit"
                className="w-full p-3 rounded-xl bg-[#1b5e20] text-white font-semibold hover:bg-[#388e3c] duration-200"
              >
                Send OTP
              </button>
            </form>

            <p className="text-center text-sm mt-3 text-gray-600">
              Remembered?{" "}
              <Link to="/signin" className="text-[#1b5e20] font-semibold">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[#1b5e20] text-center mb-1">Set New Password</h1>
            <p className="text-center text-sm text-gray-600 mb-4">
              Phone verified for <span className="font-semibold">{masked}</span>
            </p>

            <form onSubmit={handleSetPassword} className="space-y-3">
              <input
                className="w-full p-3 rounded-lg bg-gray-100 outline-none"
                type="password"
                placeholder="New password (min 6 chars)"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
              />
              <input
                className="w-full p-3 rounded-lg bg-gray-100 outline-none"
                type="password"
                placeholder="Confirm new password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
              <button
                type="submit"
                className="w-full p-3 rounded-xl bg-[#1b5e20] text-white font-semibold hover:bg-[#388e3c] duration-200"
              >
                Save new password
              </button>
            </form>

            <p className="text-center text-sm mt-3 text-gray-600">
              Not you?{" "}
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem("fp_verified");
                  navigate("/reset-password", { replace: true });
                }}
                className="text-[#1b5e20] font-semibold hover:underline"
              >
                Change number
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
