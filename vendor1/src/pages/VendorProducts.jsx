// src/pages/VendorProducts.jsx
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   CONFIG: where your API lives
   - Set VITE_API_BASE in the vendor project's .env
   - Dev fallback assumes your USER app runs at :5174
------------------------------------------------------------------- */
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5174"
    : "https://getyovonow.com");

/* ------------------------------------------------------------------
   VENDOR CONTEXT (from your login/signup localStorage)
------------------------------------------------------------------- */
const VENDOR = {
  id: localStorage.getItem("vendorId") || "vendor123",
  name: localStorage.getItem("vendorEmail") || "Demo Vendor",
  type: localStorage.getItem("vendorType") || "Restaurant", // "Restaurant" | "Shops" | "Pharmacy"
};

/* ------------------------------------------------------------------
   CATEGORY SETS BY TYPE
------------------------------------------------------------------- */
const CATEGORY_SETS = {
  Restaurant: ["Soups", "Swallow", "Rice", "Grills", "Drinks"],
  Shops: ["Pets", "Frozen", "Electronics", "Snacks"],
  Pharmacy: ["Prescription", "OTC", "Personal Care", "Vitamins", "Devices"],
};

/* ------------------------------------------------------------------
   IMAGE HELPERS: file -> compressed DataURL
------------------------------------------------------------------- */
async function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
async function compressImage(file, maxDim = 900, quality = 0.82) {
  const dataUrl = await fileToDataURL(file);
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/* ------------------------------------------------------------------
   API HELPERS
------------------------------------------------------------------- */
async function fetchMyProducts(vendorId) {
  const res = await fetch(`${API_BASE}/api/products?vendorId=${encodeURIComponent(vendorId)}`);
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.error || "Failed to load products");
  return data.products || [];
}
async function saveProductToApi(payload) {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.error || "Failed to save product");
  return data.product;
}

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");          // external URL (optional)
  const [imageDataUrl, setImageDataUrl] = useState("");  // uploaded DataURL (optional)
  const [category, setCategory] = useState(CATEGORY_SETS[VENDOR.type]?.[0] || "General");

  // add-ons
  const [addons, setAddons] = useState([]); // {id,label,price}
  const [newAddonLabel, setNewAddonLabel] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  // load vendor's products
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchMyProducts(VENDOR.id);
        if (alive) setProducts(list);
      } catch (e) {
        console.error(e);
        if (alive) alert("Could not load products.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setImageUrl("");
    setImageDataUrl("");
    setCategory(CATEGORY_SETS[VENDOR.type]?.[0] || "General");
    setAddons([]);
    setNewAddonLabel("");
    setNewAddonPrice("");
  };

  const showAddonsSection =
    VENDOR.type === "Restaurant" && (category || "").toLowerCase() !== "drinks";

  // add-on handlers
  const addAddonHandler = () => {
    const label = newAddonLabel.trim();
    const p = Number(newAddonPrice);
    if (!label) return alert("Add-on name is required");
    if (!Number.isFinite(p) || p < 0) return alert("Enter a valid add-on price (₦)");
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    setAddons((prev) => [...prev, { id, label, price: Math.round(p) }]);
    setNewAddonLabel("");
    setNewAddonPrice("");
  };
  const removeAddon = (id) => setAddons((prev) => prev.filter((a) => a.id !== id));

  // image handlers
  const onPickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    const compressed = await compressImage(f, 900, 0.82);
    setImageDataUrl(compressed);
    setImageUrl(""); // prefer uploaded image
  };
  const clearUploaded = () => setImageDataUrl("");

  const imagePreview = imageDataUrl || imageUrl;

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert("Please fill in product title and price");
      return;
    }

    const payload = {
      vendorId: String(VENDOR.id),
      title: title.trim(),
      price: Math.round(Number(price)), // ensure integer for API schema
      category,
      imageUrl: imagePreview || "", // http(s) or data URL allowed by your schema
      addons: showAddonsSection ? addons : [],
    };

    try {
      setSaving(true);
      const created = await saveProductToApi(payload);
      setProducts((prev) => [created, ...prev]); // show immediately
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to save product. Check API_BASE and CORS.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9F5] p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F3D2E]">Manage Products</h1>
        <p className="text-sm text-[#0F3D2E]/70">
          Vendor: <b>{VENDOR.name}</b> • Type: <b>{VENDOR.type}</b>
        </p>
        <p className="text-xs text-[#0F3D2E]/50 mt-1">
          API: <code>{API_BASE}/api/products</code>
        </p>
      </header>

      {/* ---------------- Add new product ---------------- */}
      <form
        onSubmit={handleAddProduct}
        className="bg-white rounded-2xl shadow p-4 space-y-4 mb-8 border border-[#0F3D2E]/10"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#0F3D2E]">Product title</label>
            <input
              type="text"
              placeholder="e.g. Jollof Rice & Chicken"
              className="w-full p-3 rounded-lg bg-gray-100 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#0F3D2E]">Price (₦)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 1800"
              className="w-full p-3 rounded-lg bg-gray-100 outline-none"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#0F3D2E]">Category</label>
            <select
              className="w-full p-3 rounded-lg bg-gray-100 outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {(CATEGORY_SETS[VENDOR.type] || [category]).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Image URL field */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#0F3D2E]">Image URL (optional)</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full p-3 rounded-lg bg-gray-100 outline-none"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) setImageDataUrl("");
              }}
            />
          </div>
        </div>

        {/* Upload image area */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[#0F3D2E]">Upload image</label>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F3D2E] text-white">
              <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <span>Choose file</span>
            </label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-24 object-cover rounded-lg border"
                />
                {imageDataUrl && (
                  <button
                    type="button"
                    onClick={clearUploaded}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-[#0F3D2E] hover:bg-gray-200"
                    title="Remove uploaded image"
                  >
                    Remove upload
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#0F3D2E]/60">
                No image selected. Upload a file or paste an image URL above.
              </p>
            )}
          </div>
          <p className="text-xs text-[#0F3D2E]/50">
            Tip: Images are compressed before saving. For large catalogs, move to Cloudinary/S3 and store only the URL.
          </p>
        </div>

        {/* Add-ons */}
        {showAddonsSection && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-[#0F3D2E] mb-2">Add-ons</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Add-on name (e.g. Extra Meat)"
                className="flex-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                value={newAddonLabel}
                onChange={(e) => setNewAddonLabel(e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Price (₦)"
                className="w-40 p-2.5 rounded-lg bg-gray-100 outline-none"
                value={newAddonPrice}
                onChange={(e) => setNewAddonPrice(e.target.value)}
              />
              <button
                type="button"
                onClick={addAddonHandler}
                className="px-4 py-2 rounded-lg bg-[#0F3D2E] text-white font-medium"
              >
                Add
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {addons.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2EF] rounded-full text-sm text-[#0F3D2E]"
                >
                  {a.label} • {formatNaira(a.price)}
                  <button
                    type="button"
                    onClick={() => removeAddon(a.id)}
                    className="ml-1 text-[#0F3D2E]/60 hover:text-red-600"
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
              {!addons.length && (
                <span className="text-sm text-[#0F3D2E]/50">No add-ons yet.</span>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className={`w-full p-3 rounded-lg text-white font-semibold transition ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#1b5e20] hover:bg-[#388e3c]"
          }`}
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>

      {/* ---------------- Product list ---------------- */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-[#0F3D2E]">Your Products</h2>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <article
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10 shadow-sm flex gap-3"
              >
                {(p.image_url || p.imageUrl) ? (
                  <img
                    src={p.image_url || p.imageUrl}
                    alt={p.title}
                    className="h-20 w-24 object-cover rounded-lg"
                  />
                ) : null}
                <div className="flex-1">
                  <div className="font-semibold text-[#0F3D2E]">{p.title}</div>
                  <div className="text-sm text-[#0F3D2E]/70">
                    {formatNaira(p.price)} • {p.category}
                  </div>
                  {!!(p.addons?.length) && (
                    <div className="mt-1 text-xs text-[#0F3D2E]/60">
                      Add-ons:{" "}
                      {p.addons
                        .map((a) => `${a.label}${a.price ? ` (${formatNaira(a.price)})` : ""}`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
