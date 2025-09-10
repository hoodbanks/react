// src/pages/Profile.jsx
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import BottomNav from "../pages/BottomNav.jsx";

const COMPLETED_KEY = "completedOrders";

// 👉 Update these to your real contacts
const SUPPORT_PHONE = "+2348012345678";
const SUPPORT_EMAIL = "support@getyovo.com";
const WHATSAPP_NUMBER = "+2348012345678";

export default function Profile() {
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);

  const userName  = localStorage.getItem("userName")  || "GetYovo User";
  const userPhone = localStorage.getItem("userPhone") || "—";

  const completedCount = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]") || []).length;
    } catch {
      return 0;
    }
  }, []);

  const logout = () => {
    localStorage.setItem("isLoggedIn", "false");
    navigate("/signin", { replace: true });
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      alert(text); // fallback
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9F5] pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-sm mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0F3D2E]">Profile</h1>
          <button
            onClick={logout}
            className="text-sm font-semibold text-white bg-[#0F3D2E] px-3 py-2 rounded-lg"
          >
            Log out
          </button>
        </div>
      </header>

      {/* User summary */}
      <section className="max-w-screen-sm mx-auto p-4">
        <div className="bg-white rounded-2xl border border-[#0F3D2E]/12 p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center font-bold">
            {userName.slice(0,1).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#0F3D2E]">{userName}</div>
            <div className="text-sm text-[#0F3D2E]/70">{userPhone}</div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-screen-sm mx-auto px-4 space-y-3">
        {/* Completed Orders */}
        <NavLink
          to="/completed-orders"
          className="block bg-white rounded-2xl border border-[#0F3D2E]/12 p-4 hover:bg-[#F8FAF9] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#0F3D2E]">Completed Orders</div>
              <div className="text-sm text-[#0F3D2E]/70">{completedCount} total</div>
            </div>
            <span className="text-[#0F3D2E]/60 text-xl">›</span>
          </div>
        </NavLink>

        {/* Contact Us (accessible, no nested interactive inside a button) */}
        <div className="bg-white rounded-2xl border border-[#0F3D2E]/12 p-4">
          {/* Toggle header row */}
          <button
            type="button"
            onClick={() => setShowContact((s) => !s)}
            aria-expanded={showContact}
            aria-controls="contact-panel"
            className="w-full flex items-center justify-between hover:bg-[#F8FAF9] rounded-xl px-2 py-2 transition"
          >
            <div className="text-left">
              <div className="font-semibold text-[#0F3D2E]">Contact Us</div>
              <div className="text-sm text-[#0F3D2E]/70">We’re here to help</div>
            </div>
            <span
              className={`text-[#0F3D2E]/60 text-xl transition-transform ${showContact ? "rotate-90" : ""}`}
              aria-hidden="true"
            >
              ›
            </span>
          </button>

          {/* Collapsible content */}
          {showContact && (
            <div
              id="contact-panel"
              className="mt-4 pt-4 border-t border-[#0F3D2E]/10 space-y-3"
            >
              {/* Phone */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#0F3D2E]/60">Phone</div>
                  <a href={`tel:${SUPPORT_PHONE}`} className="font-medium text-[#0F3D2E]">
                    {SUPPORT_PHONE}
                  </a>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${SUPPORT_PHONE}`}
                    className="px-3 py-1.5 rounded-lg bg-[#0F3D2E] text-white text-sm"
                  >
                    Call
                  </a>
                  <button
                    onClick={() => copy(SUPPORT_PHONE)}
                    className="px-3 py-1.5 rounded-lg border border-[#0F3D2E]/20 text-[#0F3D2E] text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#0F3D2E]/60">WhatsApp</div>
                  <div className="font-medium text-[#0F3D2E]">{WHATSAPP_NUMBER}</div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-sm"
                  >
                    Chat
                  </a>
                  <button
                    onClick={() => copy(WHATSAPP_NUMBER)}
                    className="px-3 py-1.5 rounded-lg border border-[#0F3D2E]/20 text-[#0F3D2E] text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#0F3D2E]/60">Email</div>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-[#0F3D2E]">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Request&body=Hi%20GetYovo%20Support,%0A%0A`}
                    className="px-3 py-1.5 rounded-lg bg-[#0F3D2E] text-white text-sm"
                  >
                    Email
                  </a>
                  <button
                    onClick={() => copy(SUPPORT_EMAIL)}
                    className="px-3 py-1.5 rounded-lg border border-[#0F3D2E]/20 text-[#0F3D2E] text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#0F3D2E]/60">Hours: 8:00–20:00 (Mon–Sat)</div>
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}