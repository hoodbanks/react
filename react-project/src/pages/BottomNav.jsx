// src/pages/BottomNav.jsx
import { NavLink } from "react-router-dom";
import { HomeIcon, MagnifyingGlassIcon, ShoppingCartIcon, UserIcon } from "@heroicons/react/24/outline";

export default function BottomNav() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const homeTarget = isLoggedIn ? "/vendorlist" : "/";

  const navItems = [
    { name: "Home",   to: homeTarget, icon: HomeIcon, exact: homeTarget === "/" },
    { name: "Search", to: "/search",  icon: MagnifyingGlassIcon },
    { name: "Cart",   to: "/cart",    icon: ShoppingCartIcon },
    { name: "Profile",to: "/profile", icon: UserIcon },
  ];

  return (
    <nav className="fixed z-50 bottom-0 left-0 w-full bg-white border-t shadow-inner h-14 border-gray-200 p-2 flex justify-around items-center">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-12 rounded-full transition-all duration-200 ${
                isActive ? "text-green-600" : "text-gray-500 hover:bg-gray-100"
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
