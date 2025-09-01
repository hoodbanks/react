import { useNavigate } from "react-router-dom";
export default function SignIn() {
    
  return (
   

    <main className="mt-26 ">
        
        <div>
            <h3 className="flex text-3xl font-bold justify-center">
             Sign In
            </h3>
             <p className="justify-center  text-gray-800 flex">
          Hi welcom back, you've been missed
          </p>
             <div className="p-3 grid gap-6">
             <div className="grid">
             <label htmlFor="" className="text-gray-800">Phone Number</label>
               <input className="p-2 border rounded-[8px] " type="number" name="number" id=""  placeholder="Your Phone number"/>

        </div>

        <div className="grid">
            <label htmlFor="">Password</label>
<input type="password" name="" id="" className="border p-2 rounded-[8px]" placeholder="**********"/>
        </div>

        <div
            className="flex justify-end underline text-green-900 hover:text-red-800"
          >
            Forgot Password ?
          </div>

          <div
            className="flex justify-center p-3 rounded-2xl bg-green-600 active:bg-amber-200 hover:bg-black duration-700 ease-in-out"
          >
            <button className="rounded-2xl text-white font-bold w-14 ">
                Sign In
              </button>
            
          </div>
        </div>

        </div>
 
    </main>
  
   
  );
}
