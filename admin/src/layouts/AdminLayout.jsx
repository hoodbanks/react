// src/layouts/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  const base =
    "block px-3 py-2 rounded-lg text-sm transition";
  const active = "bg-white text-emerald-700 font-semibold";
  const idle = "text-white/90 hover:bg-white/15";

  function logout() {
    localStorage.removeItem("isAdminAuthed");
    navigate("/signin", { replace: true });
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="bg-emerald-800 text-white p-4 md:min-h-screen">
        <div className="font-bold text-lg mb-4">GetYovo Admin</div>
        <nav className="space-y-1">
          <NavLink end to="/" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Dashboard</NavLink>
          <NavLink to="/riders" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Riders</NavLink>
          <NavLink to="/vendors" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Vendors</NavLink>
          <NavLink to="/orders" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Orders</NavLink>
          <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Settings</NavLink>
        </nav>
        <button
          onClick={logout}
          className="mt-6 w-full bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm"
        >
          Log out
        </button>
      </aside>

      {/* Main content */}
      <main className="p-4 md:p-6 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}