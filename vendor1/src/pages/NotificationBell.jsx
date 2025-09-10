// src/components/NotificationBell.jsx
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderNotifications } from "../lib/orderNotifications";

export default function NotificationBell() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const { newCount, markSeen } = useOrderNotifications({ audioRef });

  const goToToday = () => {
    markSeen();              // clear badge when going to the list
    navigate("/orders/today");
  };

  return (
    <button
      onClick={goToToday}
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/10"
      title={newCount > 0 ? `${newCount} new order(s)` : "No new orders"}
    >
      {/* Bell icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-white"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M14.24 17.24a2 2 0 01-1.74 1.01h0a2 2 0 01-1.74-1.01M6 8a6 6 0 1112 0c0 3 1 4 2 5H4c1-1 2-2 2-5z" />
      </svg>

      {/* Red badge */}
      {newCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {newCount}
        </span>
      )}

      {/* Preload + play ping */}
      <audio ref={audioRef} src="/notif.mp3" preload="auto" />
    </button>
  );
}
