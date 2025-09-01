import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUP";

function App() {
  return (
    <div className="">
      {/* Navbar */}
      <nav className="flex gap-6 mb-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-blue-600 font-bold underline" : "text-blue-500"
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "text-green-600 font-bold underline" : "text-green-500"
          }
        >
          About
        </NavLink>

        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? "text-purple-600 font-bold underline" : "text-purple-500"
          }
        >
          Contact
        </NavLink>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp/>} />
         <Route path="/vendorlist" element={<Vendorlist/>} />
      </Routes>
    </div>
  );
}

export default App;
