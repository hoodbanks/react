// src/pages/VendorSignup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function VendorSignup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [type, setType] = useState("Restaurant"); // default type

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !pw) {
      alert("Please fill in all fields");
      return;
    }

    // Save vendor info
    localStorage.setItem("vendorLoggedIn", "true");
    localStorage.setItem("vendorEmail", email);
    localStorage.setItem("vendorType", type);

    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gray-100">
      <div className="w-96 bg-white rounded-2xl p-6 shadow">
        <img src="/yov.png" alt="GetYovo Vendor" className="w-20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#1b5e20] text-center mb-4">
          Vendor Signup
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

          {/* Vendor type dropdown */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-100 outline-none"
          >
            <option value="Restaurant">Restaurant</option>
            <option value="Shop">Shop</option>
            <option value="Pharmacy">Pharmacy</option>
          </select>

          <button
            type="submit"
            className="w-full p-3 rounded-lg bg-[#1b5e20] text-white font-semibold hover:bg-[#388e3c] transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm mt-3 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1b5e20] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
