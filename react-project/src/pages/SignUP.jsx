import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function normalizePhone(input) {
  const digits = String(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+234" + digits.slice(1); // tweak if not NG
  if (digits.startsWith("234")) return "+" + digits;
  return digits;
}

export default function SignUp() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  const validName = name.trim().length >= 2;
  const validPhone = normalizePhone(phone).length >= 8;
  const validPw = pw.length >= 6;
  const canSubmit = validName && validPhone && validPw && agree;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const phoneE164 = normalizePhone(phone);
    // TODO: send to your backend to create the account
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("phone", phoneE164);
    localStorage.setItem("name", name.trim());

    navigate("/vendorlist", { replace: true });
  };

  return (
    <main className="min-h-screen grid place-items-center bg-[#637865]">
      <div className="w-[22rem] max-w-[90vw] bg-white rounded-2xl p-6 shadow-xl">
        <img src="/yov.png" alt="GetYovo" className="w-20 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-[#1b5e20] text-center">Create account</h1>
        <p className="text-center text-sm text-gray-500 mb-4">Kindly fill your information below</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm text-gray-700" htmlFor="name">Full name</label>
            <input
              id="name"
              className="w-full p-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
              type="text"
              placeholder="e.g. Adaeze N."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {!validName && name.length > 0 && (
              <span className="text-xs text-red-600">Please enter your name</span>
            )}
          </div>

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
            {!validPhone && phone.length > 0 && (
              <span className="text-xs text-red-600">Enter a valid phone number</span>
            )}
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-700" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                className="w-full p-3 pr-12 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
                type={showPw ? "text" : "password"}
                placeholder="********"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            {!validPw && pw.length > 0 && (
              <span className="text-xs text-red-600">At least 6 characters.</span>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              className="w-4 h-4 text-green-900 border-gray-600 rounded focus:ring-green-600"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-gray-700">
              I agree to the{" "}
              <Link to="/terms" className="text-[#1b5e20] font-semibold hover:underline">
                Terms & Condition
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full p-3 rounded-xl font-semibold text-white transition
                        ${canSubmit ? "bg-[#1b5e20] hover:bg-[#388e3c]" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?.{" "}
          <Link to="/signin" className="text-[#1b5e20] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
