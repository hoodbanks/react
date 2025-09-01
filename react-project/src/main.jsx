import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import SignIn from './pages/SignIn.jsx'
import Home from './pages/home.jsx'
import SignUp from "./pages/SignUP.jsx";
import Vendorlist from "./pages/vendorlist.jsx";

import "./index.css"; // Tailwind styles

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
           <Route path="/vendorlist" element={<Vendorlist />} />
        <Route path="/signup" element={<SignUp/>} />
      
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
