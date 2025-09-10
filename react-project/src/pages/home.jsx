import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#637865] to-[#1b5e20]">
      {/* Hero header */}
      <div className="relative">
        <div
          className="h-60 sm:h-72 bg-amber-300 rounded-b-[48px] shadow-lg"
          style={{ animation: "heroDrop 550ms cubic-bezier(.22,.9,.22,1) both" }}
        />
        {/* Bigger floating logo card */}
        <div className="absolute inset-x-0 -bottom-16 flex justify-center">
          <div
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 grid place-items-center"
            style={{
              animation:
                "rise 600ms ease-out 200ms both, float 4.5s ease-in-out 900ms infinite",
            }}
          >
            <img
              src="/yov.png"
              alt="GetYovo"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <section className="flex-1 px-5 pt-24 sm:pt-28 pb-12 flex flex-col items-center">
        <h1
          className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight text-center"
          style={{ animation: "rise 600ms ease-out 250ms both" }}
        >
          Welcome to GetYovo
        </h1>
        <p
          className="text-white/85 text-center max-w-sm mt-2"
          style={{ animation: "rise 600ms ease-out 350ms both" }}
        >
          Food, groceries & pharmacy from nearby vendors — delivered fast.
        </p>

        {/* Feature blips (staggered) */}
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm w-full">
          {["Nearby vendors", "Secure payments", "Real-time tracking"].map(
            (t, i) => (
              <div
                key={t}
                className="rounded-xl bg-white/10 backdrop-blur-sm text-white/90 text-xs p-3 text-center ring-1 ring-white/10"
                style={{ animation: `rise 600ms ease-out ${450 + i * 100}ms both` }}
              >
                {t}
              </div>
            )
          )}
        </div>

        {/* CTA card */}
        <div
          className="mt-8 w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl ring-1 ring-black/5"
          style={{ animation: "rise 650ms ease-out 650ms both" }}
        >
          <div className="space-y-3">
            <Link
              to="/signin"
              className="block w-full text-center p-3 rounded-xl font-semibold text-white bg-[#1b5e20] hover:bg-[#388e3c] transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="block w-full text-center p-3 rounded-xl font-semibold text-[#1b5e20] bg-amber-300 hover:bg-[#ffa000] transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>

          <p className="text-[11px] text-center text-gray-500 mt-4">
            By continuing, you agree to our{" "}
            <span className="text-[#1b5e20] font-medium">Terms</span>.
          </p>
        </div>
      </section>

      {/* Minimal keyframes (no extra libs) */}
      <style>{`
        @keyframes rise {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroDrop {
          0% { transform: translateY(-24px); }
          100% { transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </main>
  );
}
