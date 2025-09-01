// src/pages/Home.jsx
import { NavLink, Outlet } from "react-router-dom";
export default function Home() {
  return (
   
      <main className="grid justify-evenly bg-[#637865]">
        <div className="flex justify-center bg-amber-300 rounded-b-[60px] h-125">
<img src="./yov.png" loading="" alt="" />
        </div>
<div className="grid mt-5 gap-6 text-2xl  font-bold text-white justify-center p-3"> 

<NavLink to="/SignIn">

<button className="bg-[#1b5e20] hover:bg-[#388e3c] duration-700 ease-in-out p-3 w-50 rounded-[20px]">Sign In
    </button></NavLink>

    <NavLink to="SignUp">
<button className="bg-amber-300 hover:bg-[#ffa000] duration-700 ease-in-out p-3 w-50 rounded-[20px] text-[#1b5e20]">Sign Up</button>
</NavLink>
</div>


    </main>
   
  
  
  );
}
