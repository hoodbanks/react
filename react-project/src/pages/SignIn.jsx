import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function normalizePhone(input) {
  const digits = String(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+234" + digits.slice(1); // NG example
  if (digits.startsWith("234")) return "+" + digits;
  return digits; // fallback
}

export default function SignIn() {
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();

  // Show message if coming from successful OTP verification
  useEffect(() => {
    if (sessionStorage.getItem("fp_success") === "1") {
      setInfo("Phone verified. You can now sign in.");
      sessionStorage.removeItem("fp_success");
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const phoneE164 = normalizePhone(phone);
    if (!phoneE164 || phoneE164.length < 8) {
      alert("Enter a valid phone number");
      return;
    }
    // TODO: validate with your backend
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("phone", phoneE164);
    navigate("/vendorlist", { replace: true });
  };

  return (
    <main className="min-h-screen grid place-items-center bg-[#637865]">
      <div className="w-80 bg-white rounded-2xl p-6 shadow">
        <img src="/yov.png" alt="GetYovo" className="w-20 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[#1b5e20] text-center mb-3">Sign In</h1>

        {info && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full p-3 rounded-lg bg-gray-100 outline-none"
            inputMode="tel"
            type="tel"
            placeholder="Phone number (e.g. 0803..., +234...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-lg bg-gray-100 outline-none"
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            type="submit"
            className="w-full p-3 rounded-xl bg-[#1b5e20] text-white font-semibold hover:bg-[#388e3c] duration-200"
          >
            Continue
          </button>
        </form>

        <p className="text-center text-sm mt-3 text-gray-600">
          No account?{" "}
          <Link to="/signup" className="text-[#1b5e20] font-semibold">
            Sign up
          </Link>
        </p>

        <p className="text-center text-sm mt-2">
          <Link to="/reset-password" className="text-[#ff0000] font-semibold hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
}
