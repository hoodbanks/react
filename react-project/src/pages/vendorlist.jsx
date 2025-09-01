import { NavLink } from "react-router-dom";


export default function vendorlist() {
    
  return (
   

  <main>
<nav className="border-b border-gray-400 top-0 z-50 h-26 sticky bg-white">

    <div className="flex relative bottom-4 right-2 items-center justify-between p-1">
        <img src="./yov.png" alt="" className="w-20" />

        <div className="flex w-50 items-center justify-center">
            <input type="search" name="" id="" placeholder="Enter new address" className="flex items-center bg-gray-200 rounded-[5px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        <img src="./shopping-cart.png" alt="" />
    </div>
    <div className="bottom-8 relative justify-center flex">
        <input
          className="w-90 p-2 rounded-[5px] bg-gray-100"
          type="search"
          name=""
          id="searchInput"
          placeholder="Search YOVO"
        />
      </div>
</nav>

<section className="p-2 h-600">
<h4 className="font-medium text-[20px] mb-1 text-gray-600">
        Explore Categories
      </h4>
<div className="flex justify-between gap-2">
        <div
          className="justify-center rounded-[4px] p-3 bg-yellow-100 w-30 grid active:border-2 hover:border"
        >
          <img
            className="flex justify-center relative left-5"
            src="./restaurant-2-fill.png"
            alt=""
          />
          <p className="justify-center flex">Restaurant</p>
        </div>

        <div
          class="bg-pink-200 rounded-[4px] justify-center w-30 grid p-3 active:border-2 hover:border"
        >
          <img
            className="relative left-3 flex justify-center"
            src="./shopping-basket-2-line.png"
            alt=""
          />
          <p className="justify-center t flex">Shops</p>
        </div>
        <div
          className="bg-blue-300 rounded-[4px] p-3 w-30 grid active:border-2 hover:border"
        >
          <a className="cursor-pointer" href=""
            ><img
              className="justify-center flex relative left-8"
              src="./hospital-line.png"
              alt=""
            />
            <p className="justify-center flex">Pharmacy</p>
          </a>
        </div>
      </div>

      <div class="mt-5">
        <h3  class="text-[20px] font-bold">Nearby Stores</h3>
      </div>
      

      <section>
    
    <div className="w-full p-2 h-28  flex gap-3 justify-evenly bg-green-50 items-center">
        <img className="w-30 rounded-[5px]" src="./roban.jpeg" alt="" />

<div><p className="text-[20px] font-medium">Roban Stores</p>

            <p>25-45 min</p>

            <p className="">Rating</p>
          
          </div>
          <input type="button" name="" value="Check Out" id="" className=" active:bg-white p-2 bg-gray-200 rounded-[4px] " />
    </div>
</section>
</section>





  </main>
  
  );
}
