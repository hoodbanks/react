import { NavLink } from "react-router-dom";



export default function SignUp() {
  return (
<main className="p-3 mt-18 flex flex-col justify-evenly gap-3">
    <h3
        className="justify-center text-[#ffa000] flex items-center font-medium text-4xl"
      >
        Create Account
      </h3>
 <p className="justify-center flex text-gray-700 items-center">
        Kindly fill your information below
      </p>
<div className="grid gap-3">
        <div class="grid">
          <label class="text-gray-700 font-medium" for="name">Name</label>
          <input
            className="border p-2 rounded-[8px]"
            type="text"
            name=""
            id=""
            placeholder="Kindly enter your full name"
          />
        </div>

        <div className="grid">
          <label class="text-gray-700 font-medium" for="">Phone Number</label>
          <input
            className="border p-2 rounded-[8px]"
            type="number"
            name=""
            id="number"
            placeholder="Kindly enter your phone number"
          />
        </div>



        <div className="grid">
          <label class="text-gray-700 font-medium" for="">Password</label>
          <input
            className="border p-2 rounded-[8px]"
            type="password"
            name=""
            id="password"
            placeholder="**********"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          className="w-4 h-4 text-green-900 border-gray-600 rounded focus:ring-green-600"
          type="checkbox"
          name=""
          id=""
        />
        Agree with
        <a className="text-green-600 hover:underline" href=""> Terms & Condition</a>
      </div>
      <div
        className=" justify-center flex  bg-green-600 active:bg-amber-300 hover:bg-black ease-in-out duration-700 text-white p-3 rounded-2xl"
      >
          <NavLink
          to="/vendorlist"> <button className="w-90 ">Sign Up</button>  </NavLink> 
      </div>

</main>
  );
}
