import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function normalizePhone(input) {
  const digits = String(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+234" + digits.slice(1); // tweak if not NG
  if (digits.startsWith("234")) return "+" + digits;
  return digits;
}

export default function ForgotPassword() {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handleSend = (e) => {
    e.preventDefault();
    const phoneE164 = normalizePhone(phone);
    if (!phoneE164 || phoneE164.length < 8) {
      alert("Enter a valid phone number");
      return;
    }

    // Generate 6-digit OTP, 5 min expiry, 5 attempts
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const attempts = 5;

    sessionStorage.setItem("fp_phone", phoneE164);
    sessionStorage.setItem("fp_code", code);
    sessionStorage.setItem("fp_expires", String(expiresAt));
    sessionStorage.setItem("fp_attempts", String(attempts));

    // Mock “send SMS”
    console.log("📨 OTP sent to", phoneE164, "→", code);
    alert(`Demo OTP (remove in prod): ${code}`);

    navigate("/verify-otp", { replace: true });
  };

  return (
    <main className="min-h-screen grid place-items-center bg-[#637865]">
      <div className="w-[22rem] max-w-[90vw] bg-white rounded-2xl p-6 shadow-xl">
        <img src="/yov.png" alt="GetYovo" className="w-20 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-[#1b5e20] text-center">Forgot password</h1>
        <p className="text-center text-sm text-gray-500 mb-4">Enter your phone to receive an OTP</p>

        <form onSubmit={handleSend} className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm text-gray-700" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              className="w-full p-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
              type="tel"
              inputMode="tel"
              placeholder="e.g. 0803..., +234..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <button
            type="submit"
            className="w-full p-3 rounded-xl font-semibold text-white bg-[#1b5e20] hover:bg-[#388e3c] transition"
          >
            Send OTP
          </button>
        </form>

        <p className="text-right flex justify-center text-sm">
  <Link to="/reset-password" className="text-[#ff0000] font-semibold hover:underline">
    Forgot password?
  </Link>
</p>

      </div>
    </main>
  );
}
