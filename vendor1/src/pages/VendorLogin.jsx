import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function VendorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !pw) {
      alert("Please fill in all fields");
      return;
    }

    // TODO: replace with real backend check
    if (email === "demo@vendor.com" && pw === "password123") {
      localStorage.setItem("vendorLoggedIn", "true");
      localStorage.setItem("vendorEmail", email);
      navigate("/dashboard", { replace: true });
    } else {
      alert("Invalid login details");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gray-100">
      <div className="w-96 bg-white rounded-2xl p-6 shadow">
        <img src="/yov.png" alt="GetYovo Vendor" className="w-20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#1b5e20] text-center mb-4">
          Vendor Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-gray-100 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-gray-100 outline-none"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          <button
            type="submit"
            className="w-full p-3 rounded-lg bg-[#1b5e20] text-white font-semibold hover:bg-[#388e3c] transition"
          >
            Continue
          </button>
        </form>

        <p className="text-center text-sm mt-3 text-gray-600">
          No account?{" "}
          <Link to="/signup" className="text-[#1b5e20] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
