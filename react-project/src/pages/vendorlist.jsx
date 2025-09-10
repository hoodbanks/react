// src/pages/VendorList.jsx
import { useState, useRef, useEffect } from "react";
import BottomNav from "../pages/BottomNav.jsx";
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

/* Optional API base (same pattern you used elsewhere)
   - Same-origin API: leave VITE_API_BASE empty (default "")
   - Separate domain (e.g. vendor subdomain): set VITE_API_BASE=https://vendor.getyovonow.com in .env  */
const API_BASE = import.meta.env.VITE_API_BASE || "";

/* Helpers */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function getDeliveryTime(lat1, lng1, lat2, lng2) {
  const distanceKm = getDistanceKm(lat1, lng1, lat2, lng2);
  const timeMinutes = Math.ceil((distanceKm / 30) * 60);
  const minTime = Math.max(timeMinutes - 5, 1);
  const maxTime = timeMinutes + 5;
  return `${minTime}-${maxTime} min`;
}

/* Tiny stars (unchanged) */
function Stars({ value = 4.5, outOf = 5 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = outOf - full - (half ? 1 : 0);
  return (
    <div className="flex text-[#0F3D2E]">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9 4.7 23.2l1.4-8.2L.1 9.2l8.2-1.2L12 .6z" />
        </svg>
      ))}
      {half && (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9 4.7 23.2l1.4-8.2L.1 9.2l8.2-1.2L12 .6z" />
          <path d="M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9 4.7 23.2l1.4-8.2L.1 9.2l8.2-1.2L12 .6z" fill="none" stroke="currentColor"/>
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} viewBox="0 0 24 24" className="h-4 w-4 opacity-25" fill="currentColor">
          <path d="M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9 4.7 23.2l1.4-8.2L.1 9.2l8.2-1.2L12 .6z" />
        </svg>
      ))}
    </div>
  );
}

/* Time helpers */
function hmToMins(hhmm = "00:00") {
  const [h, m] = (hhmm || "00:00").split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}
function computeOpenNow(openingTime, closingTime) {
  if (!openingTime || !closingTime) return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const o = hmToMins(openingTime);
  const c = hmToMins(closingTime);
  // Handle normal and overnight ranges
  if (o <= c) return nowM >= o && nowM < c;
  return nowM >= o || nowM < c;
}

export default function VendorList() {
  const navigate = useNavigate();

  // You can keep hours empty here; if your API returns hours they’ll override.
  const [vendors] = useState([
    { id: 1, name: "Roban Mart",  category: "Shops",      image: "/roban.jpeg",     deliveryTime: "25-45 min", rating: 4.5, lat: 6.2239, lng: 7.1185, openingTime: "08:00", closingTime: "21:00" },
    { id: 2, name: "FreshMart",   category: "Shops",      image: "/freshmart.jpeg",  deliveryTime: "20-35 min", rating: 4.2, lat: 6.2242, lng: 7.1190, openingTime: "09:00", closingTime: "20:00" },
    { id: 3, name: "PharmaPlus",  category: "Pharmacy",   image: "/pharmaplus.jpeg", deliveryTime: "15-30 min", rating: 4.8, lat: 6.2234, lng: 7.1175, openingTime: "08:30", closingTime: "19:30" },
    { id: 4, name: "Candles",     category: "Restaurant", image: "/candles.jpeg",    deliveryTime: "15-30 min", rating: 4.8, lat: 6.2234, lng: 7.1175, openingTime: "10:00", closingTime: "22:00" },
  ]);

  // hoursMap: { [vendorId]: { openingTime, closingTime } }
  const [hoursMap, setHoursMap] = useState({});

  const [search, setSearch] = useState(() => localStorage.getItem("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem("category") || "All");
  const [address, setAddress] = useState(() => localStorage.getItem("address") || "");
  const [userLocation, setUserLocation] = useState(() => {
    const loc = localStorage.getItem("userLocation");
    return loc ? JSON.parse(loc) : null;
  });

  useEffect(() => localStorage.setItem("search", search), [search]);
  useEffect(() => localStorage.setItem("category", selectedCategory), [selectedCategory]);
  useEffect(() => localStorage.setItem("address", address), [address]);
  useEffect(() => localStorage.setItem("userLocation", JSON.stringify(userLocation)), [userLocation]);

  const searchBoxRef = useRef(null);
  const libraries = ["places"];

  const handlePlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces?.() || [];
    if (places.length > 0) {
      const place = places[0];
      setAddress(place.formatted_address);
      setUserLocation({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported by your browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results[0]) setAddress(results[0].formatted_address);
        });
      },
      (err) => console.error("Error fetching location", err)
    );
  };

  /* 🔌 OPTIONAL: Fetch hours from your API if available */
  useEffect(() => {
    let alive = true;
    async function fetchHoursFor(id) {
      try {
        if (!API_BASE) return null;
        const res = await fetch(`${API_BASE}/api/vendor-settings?vendorId=${id}`);
        if (!res.ok) return null;
        const data = await res.json().catch(() => ({}));
        const s = data?.settings || data;
        if (s?.openingTime && s?.closingTime) {
          return { openingTime: s.openingTime, closingTime: s.closingTime };
        }
      } catch {
        // ignore
      }
      return null;
    }
    (async () => {
      const entries = await Promise.all(
        vendors.map(async (v) => {
          const fromApi = await fetchHoursFor(v.id);
          if (fromApi) return [String(v.id), fromApi];
          if (v.openingTime && v.closingTime) {
            return [String(v.id), { openingTime: v.openingTime, closingTime: v.closingTime }];
          }
          return null;
        })
      );
      const map = {};
      entries.forEach((e) => {
        if (e) map[e[0]] = e[1];
      });
      if (alive) setHoursMap(map);
    })();
    return () => { alive = false; };
  }, [vendors]);

  // Filtering (same)
  let filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
    if (search) return matchesSearch;
    return selectedCategory === "All" ? true : v.category === selectedCategory;
  });

  const MAX_DISTANCE_KM = 50;
  if (userLocation) {
    filteredVendors = filteredVendors
      .filter((v) => getDistanceKm(v.lat, v.lng, userLocation.lat, userLocation.lng) <= MAX_DISTANCE_KM)
      .sort(
        (a, b) =>
          getDistanceKm(a.lat, a.lng, userLocation.lat, userLocation.lng) -
          getDistanceKm(b.lat, b.lng, userLocation.lat, userLocation.lng)
      );
  }

  return (
    <main className="pb-20 bg-[#F7F9F5]">
      {/* HEADER */}
      <nav className="border-b border-gray-200 top-0 z-50 sticky bg-white">
        <div className="h-16 flex items-center justify-evenly px-2">
          <img src="/yov.png" alt="GetYovo" className="w-20" />
          <LoadScript googleMapsApiKey="AIzaSyDpTvt828_Ph_6xtI6dNzL6uMagjhFdbUY" libraries={libraries}>
            <div className="relative flex items-center w-60">
              <StandaloneSearchBox onLoad={(ref) => (searchBoxRef.current = ref)} onPlacesChanged={handlePlacesChanged}>
                <input
                  type="text"
                  placeholder="Enter new address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-100 rounded-[8px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </StandaloneSearchBox>
              <button onClick={handleUseCurrentLocation} className="absolute right-2 text-gray-600 hover:text-emerald-600" type="button">
                📍
              </button>
            </div>
          </LoadScript>
          <img src="/shopping-cart.png" alt="Cart" />
        </div>

        {/* SEARCH */}
        <div className="px-3 pb-2">
          <input
            className="w-full p-2 rounded-[8px] bg-gray-100"
            type="search"
            placeholder="Search vendors or items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* CATEGORIES */}
        <div className="px-3 pb-3 animate-rise">
          <div className="flex gap-2 justify-evenly overflow-x-auto flex-nowrap no-scrollbar snap-x snap-mandatory py-1 -mx-1 px-1">
            {["All", "Restaurant", "Shops", "Pharmacy"].map((c, i) => {
              const active = selectedCategory === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  style={{ animationDelay: `${70 * i}ms` }}
                  className={[
                    "flex-none inline-flex items-center px-4 py-2 rounded-full text-sm transition snap-start animate-rise",
                    active ? "bg-[#0F3D2E] text-white"
                           : "bg-[#EEF2EF] text-[#0F3D2E] hover:bg-[#E6EBE8]"
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="p-3">
        <h3 className="text-[20px] font-bold text-[#0F3D2E] mb-2">Nearby vendors</h3>

        <div className="space-y-3">
          {filteredVendors.map((vendor, i) => {
            const eta = userLocation
              ? getDeliveryTime(vendor.lat, vendor.lng, userLocation.lat, userLocation.lng)
              : vendor.deliveryTime;

            // Merge hours: prefer fetched, else vendor defaults
            const hv = hoursMap[String(vendor.id)] || {};
            const openingTime = hv.openingTime || vendor.openingTime;
            const closingTime = hv.closingTime || vendor.closingTime;
            const hasHours = Boolean(openingTime && closingTime);
            const openNow = hasHours ? computeOpenNow(openingTime, closingTime) : null;

            return (
              <div
                key={vendor.id}
                style={{ animationDelay: `${60 * i}ms` }}
                className="animate-rise-slow w-full min-h-[7rem] p-3 flex flex-wrap items-center justify-between gap-3 bg-white
                           border border-[#0F3D2E]/10 rounded-2xl overflow-hidden will-change-transform will-change-opacity"
              >
                <img
                  loading="lazy"
                  className="h-24 w-32 object-cover rounded-xl flex-shrink-0"
                  src={vendor.image}
                  alt={vendor.name}
                />

                {/* vertical stack: name → ETA → hours → rating */}
                <div className="flex-1 basis-0">
                  <div className="flex flex-col space-y-1">
                    {/* Store name */}
                    <p className="text-[17px] font-semibold text-[#0F3D2E] leading-snug break-words">
                      {vendor.name}
                    </p>

                    {/* Arrival time / ETA */}
                    <p className="text-sm text-[#0F3D2E]/70">{eta}</p>

                    {/* Opening–Closing + status */}
                    {hasHours && (
                      <p className="text-sm text-[#0F3D2E]/70">
                        {openingTime}–{closingTime} •{" "}
                        <span className={openNow ? "text-emerald-600" : "text-gray-500"}>
                          {openNow ? "Open now" : "Closed"}
                        </span>
                      </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Stars value={vendor.rating} />
                      <span className="text-sm text-[#0F3D2E]/70">{vendor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(`/vendor/${vendor.id}`, {
                      state: { vendorName: vendor.name, vendorCategory: vendor.category },
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-sm font-medium
                             hover:opacity-90 active:scale-[0.98] transition transform
                             flex-shrink-0 w-full sm:w-auto text-center"
                >
                  Open store
                </button>
              </div>
            );
          })}
          {filteredVendors.length === 0 && <p className="text-center mt-6 text-gray-500">None nearby.</p>}
        </div>
      </section>

      <BottomNav />

      {/* hidden scrollbar + animations */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes rise {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes riseSlow {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-rise { animation: rise .50s ease-out both; }
        .animate-rise-slow { animation: riseSlow .65s ease-out both; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </main>
  );
}