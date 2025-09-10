// src/pages/VerifyOTP.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const phone = sessionStorage.getItem("fp_phone");
  const expires = Number(sessionStorage.getItem("fp_expires") || 0);
  const attempts = Number(sessionStorage.getItem("fp_attempts") || 0);

  useEffect(() => {
    if (!phone) navigate("/reset-password", { replace: true });
  }, [phone, navigate]);

  const handleVerify = (e) => {
    e.preventDefault();
    const real = sessionStorage.getItem("fp_code") || "";

    if (Date.now() > expires) {
      alert("OTP expired. Please resend.");
      return;
    }
    if (attempts <= 0) {
      alert("Too many attempts. Please resend a new OTP.");
      return;
    }

    if (code.trim() === real) {
      sessionStorage.setItem("fp_verified", "1");
      navigate("/reset-password", { replace: true });
    } else {
      const left = attempts - 1;
      sessionStorage.setItem("fp_attempts", String(left));
      alert(`Incorrect code. Attempts left: ${left}`);
    }
  };

  const handleResend = () => {
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const newExpires = Date.now() + 5 * 60 * 1000;
    sessionStorage.setItem("fp_code", newCode);
    sessionStorage.setItem("fp_expires", String(newExpires));
    sessionStorage.setItem("fp_attempts", "5");

    console.log("📨 OTP re-sent to", phone, "→", newCode);
    alert(`Demo OTP (remove in prod): ${newCode}`);
  };

  const masked = phone ? phone.replace(/.(?=.{4})/g, "•") : "";

  return (
    <main className="min-h-screen grid place-items-center bg-[#637865]">
      <div className="w-[22rem] max-w-[90vw] bg-white rounded-2xl p-6 shadow-xl">
        <img src="/yov.png" alt="GetYovo" className="w-20 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-[#1b5e20] text-center">Verify code</h1>
        <p className="text-center text-sm text-gray-500 mb-4">We sent an OTP to {masked}</p>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm text-gray-700" htmlFor="otp">6-digit code</label>
            <input
              id="otp"
              maxLength={6}
              className="w-full p-3 tracking-widest text-center rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
              type="text"
              inputMode="numeric"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full p-3 rounded-xl font-semibold text-white bg-[#1b5e20] hover:bg-[#388e3c] transition"
          >
            Verify
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="w-full p-3 rounded-xl font-semibold bg-gray-100 text-[#1b5e20] hover:bg-gray-200 transition"
          >
            Resend code
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          Wrong number?{" "}
          <Link to="/reset-password" className="text-[#1b5e20] font-semibold hover:underline">
            Change phone
          </Link>
        </p>
      </div>
    </main>
  );
}
