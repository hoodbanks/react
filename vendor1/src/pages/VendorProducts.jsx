// src/pages/VendorProducts.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------
   VENDOR CONTEXT
------------------------------------------------------------------- */
const VENDOR = {
  id: localStorage.getItem("vendorId") || "vendor123",
  name: localStorage.getItem("vendorEmail") || "Demo Vendor",
  type: localStorage.getItem("vendorType") || "Restaurant", // "Restaurant" | "Shops" | "Pharmacy"
};

/* ------------------------------------------------------------------
   CATEGORY SETS (base)
------------------------------------------------------------------- */
const CATEGORY_SETS = {
  Restaurant: ["Soups", "Swallow", "Rice", "Grills", "Drinks"],
  Shops: ["Pets", "Frozen", "Electronics", "Snacks"],
  Pharmacy: ["Prescription", "OTC", "Personal Care", "Vitamins", "Devices"],
};

/* ------------------------------------------------------------------
   LOCALSTORAGE KEYS
------------------------------------------------------------------- */
const PRODUCTS_KEY = (vendorId) => `vendor_products_${vendorId}`;
const CUSTOM_CATS_KEY = (vendorId, type) =>
  `vendor_custom_categories_${vendorId}_${type}`;
const CAT_TAB_KEY = (vendorId) => `vendor_products_catTab_${vendorId}`;
const VIEW_KEY = (vendorId) => `vendor_products_view_${vendorId}`; // "Products" | "Manage"

/* ------------------------------------------------------------------
   UTILS
------------------------------------------------------------------- */
const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const genId =
  () =>
    window.crypto?.randomUUID?.() ||
    String(Date.now()) + Math.random().toString(36).slice(2, 8);

/* ------------------------------------------------------------------
   IMAGE HELPERS
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
   LOCAL STORAGE CRUD
------------------------------------------------------------------- */
function lsGetProducts(vendorId) {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY(vendorId)) || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function lsSetProducts(vendorId, list) {
  localStorage.setItem(PRODUCTS_KEY(vendorId), JSON.stringify(list));
}
function createProductLS(vendorId, payload) {
  const id = genId();
  const createdAt = new Date().toISOString();
  const p = { id, createdAt, vendorId, ...payload };
  const list = lsGetProducts(vendorId);
  list.unshift(p);
  lsSetProducts(vendorId, list);
  return p;
}
function updateProductLS(vendorId, id, patch) {
  const list = lsGetProducts(vendorId);
  const next = list.map((p) => (p.id === id ? { ...p, ...patch } : p));
  lsSetProducts(vendorId, next);
  return next;
}

/* ------------------------------------------------------------------
   SEED DEMO PRODUCTS
------------------------------------------------------------------- */
function buildSeedProducts(type) {
  const now = Date.now();
  const mk = (minsAgo, data) => ({
    id: String(now - minsAgo * 60000),
    createdAt: new Date(now - minsAgo * 60000).toISOString(),
    vendorId: VENDOR.id,
    inStock: data.inStock ?? true,
    addons: data.addons || [],
    ...data,
  });

  if (type === "Pharmacy") {
    return [
      mk(3, { title: "Paracetamol 500mg", price: 300, category: "OTC", images: [], coverId: null }),
      mk(6, { title: "Vitamin C 1000mg", price: 900, discountPrice: 750, category: "Vitamins", images: [], coverId: null }),
      mk(9, { title: "Blood Pressure Monitor", price: 21500, category: "Devices" }),
      mk(12, { title: "Cough Syrup 100ml", price: 1500, category: "OTC" }),
      mk(15, { title: "Insulin (Pen)", price: 6800, category: "Prescription" }),
      mk(20, { title: "Hand Sanitizer 250ml", price: 1200, category: "Personal Care" }),
      mk(25, { title: "Thermometer (Digital)", price: 3500, category: "Devices", discountPrice: 3000 }),
      mk(30, { title: "Multivitamin (30 tabs)", price: 3200, category: "Vitamins", inStock: false }),
      mk(40, { title: "Antacid Tablets", price: 900, category: "OTC" }),
      mk(55, { title: "Compression Socks", price: 4500, category: "Personal Care" }),
    ];
  }

  if (type === "Shops") {
    return [
      mk(3, { title: "Dog Food 1kg", price: 3200, category: "Pets" }),
      mk(7, { title: "USB-C Fast Charger", price: 4500, category: "Electronics" }),
      mk(10, { title: "Frozen Chicken (1kg)", price: 3800, category: "Frozen" }),
      mk(14, { title: "Chocolate Cookies", price: 1200, discountPrice: 1000, category: "Snacks", images: [], coverId: null }),
      mk(18, { title: "Cat Litter 5kg", price: 5200, category: "Pets" }),
      mk(22, { title: "Powerbank 20,000mAh", price: 18500, category: "Electronics" }),
      mk(27, { title: "Ice Cream 500ml", price: 1900, category: "Frozen", inStock: false }),
      mk(35, { title: "Earbuds (BT)", price: 9800, category: "Electronics" }),
      mk(48, { title: "Plantain Chips (Pack)", price: 800, category: "Snacks" }),
      mk(60, { title: "Pet Shampoo 250ml", price: 2200, category: "Pets" }),
    ];
  }

  // Restaurant (default)
  return [
    mk(2, { title: "Jollof Rice & Chicken", price: 1800, category: "Rice", images: [], coverId: null }),
    mk(5, { title: "Fried Rice & Turkey", price: 3200, discountPrice: 2800, category: "Rice" }),
    mk(9, { title: "Grilled Catfish", price: 4500, category: "Grills" }),
    mk(12, { title: "Egusi Soup", price: 2300, category: "Soups" }),
    mk(15, { title: "Pounded Yam", price: 500, category: "Swallow" }),
    mk(17, { title: "Malt 33cl", price: 800, category: "Drinks" }),
    mk(19, { title: "Water 75cl", price: 300, category: "Drinks" }),
    mk(25, { title: "Pepper Soup (Goat)", price: 2200, category: "Soups", inStock: false }),
    mk(32, { title: "Chicken Shawarma", price: 2500, category: "Grills" }),
    mk(45, { title: "Breakfast Combo", price: 2400, category: "Breakfast" }),
  ];
}
function ensureSeededProducts() {
  const existing = lsGetProducts(VENDOR.id);
  if (existing.length > 0) return existing;
  const seed = buildSeedProducts(VENDOR.type);
  lsSetProducts(VENDOR.id, seed);
  return seed;
}

/* ---------------- helper: group products by category ---------------- */
function groupByCategory(allCategories, products) {
  const map = {};
  for (const c of allCategories) map[c] = [];
  for (const p of products) {
    const c = p.category || "General";
    if (!map[c]) map[c] = [];
    map[c].push(p);
  }
  for (const c of Object.keys(map)) {
    map[c].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return map;
}

/* ==================================================================
   COMPONENT
=================================================================== */
export default function VendorProducts() {
  const BASE_CATS = CATEGORY_SETS[VENDOR.type] || [];

  const [products, setProducts] = useState(() => lsGetProducts(VENDOR.id));
  const [saving, setSaving] = useState(false);

  // seed once on first mount if empty
  useEffect(() => {
    if (!products.length) {
      const seeded = ensureSeededProducts();
      setProducts(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // dynamic categories from LS
  const [customCats, setCustomCats] = useState(() => {
    try {
      const raw =
        localStorage.getItem(CUSTOM_CATS_KEY(VENDOR.id, VENDOR.type)) || "[]";
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });

  // categories detected from products
  const autoCatsFromProducts = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );

  const allCategories = useMemo(
    () => Array.from(new Set([...BASE_CATS, ...customCats, ...autoCatsFromProducts])),
    [BASE_CATS, customCats, autoCatsFromProducts]
  );

  // View mode (Products | Manage)
  const [view, setView] = useState(
    () => localStorage.getItem(VIEW_KEY(VENDOR.id)) || "Products"
  );
  useEffect(() => {
    localStorage.setItem(VIEW_KEY(VENDOR.id), view);
  }, [view]);

  // TOP NAV TAB (only used in Products view)
  const [catTab, setCatTab] = useState(
    () => localStorage.getItem(CAT_TAB_KEY(VENDOR.id)) || "All"
  );
  useEffect(() => {
    localStorage.setItem(CAT_TAB_KEY(VENDOR.id), catTab);
  }, [catTab]);

  const navCategories = useMemo(() => ["All", ...allCategories], [allCategories]);

  const categoryCounts = useMemo(() => {
    const m = {};
    for (const p of products) {
      const c = p.category || "General";
      m[c] = (m[c] || 0) + 1;
    }
    return m;
  }, [products]);

  /* ------------------------ MANAGE FORM STATE ------------------------ */
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [category, setCategory] = useState(allCategories[0] || "General");

  // NEW: description (optional)
  const [description, setDescription] = useState("");

  // multi images for Manage form
  const [images, setImages] = useState([]); // [{id,url}]
  const [coverId, setCoverId] = useState(null); // selected cover id

  // add-ons (for Restaurant)
  const [addons, setAddons] = useState([]); // {id,label,price}
  const [newAddonLabel, setNewAddonLabel] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  // add-category input (used in Manage & Products > All)
  const [newCat, setNewCat] = useState("");

  // keep select current if list changes
  useEffect(() => {
    if (!allCategories.includes(category)) {
      setCategory(allCategories[0] || "General");
    }
  }, [allCategories, category]);

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setDiscountPrice("");
    setInStock(true);
    setCategory(allCategories[0] || "General");
    setDescription("");
    setImages([]);
    setCoverId(null);
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
    const id = genId();
    setAddons((prev) => [...prev, { id, label, price: Math.round(p) }]);
    setNewAddonLabel("");
    setNewAddonPrice("");
  };
  const removeAddon = (id) => setAddons((prev) => prev.filter((a) => a.id !== id));

  // ---------- MULTI IMAGE HANDLERS (MANAGE) ----------
  const addImageURL = (url) => {
    const u = (url || "").trim();
    if (!u) return;
    const id = genId();
    setImages((prev) => {
      const next = [...prev, { id, url: u }];
      if (!coverId) setCoverId(id);
      return next;
    });
  };
  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const compressed = await Promise.all(
      files.map((f) => compressImage(f, 1000, 0.82))
    );
    setImages((prev) => {
      let next = [...prev];
      compressed.forEach((dataUrl) => {
        next.push({ id: genId(), url: dataUrl });
      });
      if (!coverId && next.length) setCoverId(next[0].id);
      return next;
    });
    e.target.value = "";
  };
  const removeImage = (id) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (coverId === id) setCoverId(next[0]?.id || null);
      return next;
    });
  };
  const setAsCover = (id) => setCoverId(id);

  // ---- SAFE refs for "Add URL" buttons (fixes crash)
  const manageUrlRef = useRef(null);
  const quickUrlRef = useRef(null);
  const editUrlRef = useRef(null);

  const validDiscount =
    discountPrice === "" ||
    (Number(discountPrice) >= 0 && Number(discountPrice) < Number(price || 0));

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert("Please fill in product title and price");
      return;
    }
    if (!validDiscount) {
      alert("Discounted price must be less than the main price.");
      return;
    }

    // finalize images with cover
    const imgs = images.map((img) => ({ ...img, isCover: img.id === coverId }));
    const coverUrl = imgs.find((i) => i.id === coverId)?.url || imgs[0]?.url || "";

    const payload = {
      title: title.trim(),
      price: Math.round(Number(price)),
      discountPrice: discountPrice !== "" ? Math.round(Number(discountPrice)) : undefined,
      inStock: Boolean(inStock),
      category,
      description: description.trim() || undefined,
      images: imgs,
      coverId: coverId || imgs[0]?.id || null,
      coverImageUrl: coverUrl,
      imageUrl: coverUrl,
      addons: showAddonsSection ? addons : [],
    };

    try {
      setSaving(true);
      const created = createProductLS(VENDOR.id, payload);
      setProducts((prev) => [created, ...prev]);
      resetForm();
      if (view === "Products" && category) setCatTab(category);
    } finally {
      setSaving(false);
    }
  };

  // toggle stock on card
  const toggleStock = (p) => {
    const nextInStock = !(p.inStock ?? p.in_stock ?? p.available ?? true);
    const next = updateProductLS(VENDOR.id, p.id, {
      inStock: nextInStock,
      in_stock: nextInStock,
      available: nextInStock,
    });
    setProducts(next);
  };

  // ----- Quick Add modal (multi images + cover) -----
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickCat, setQuickCat] = useState("");
  const [qTitle, setQTitle] = useState("");
  const [qPrice, setQPrice] = useState("");
  const [qDiscount, setQDiscount] = useState("");
  const [qInStock, setQInStock] = useState(true);
  const [qImages, setQImages] = useState([]); // [{id,url}]
  const [qCoverId, setQCoverId] = useState(null);
  // NEW: quick description
  const [qDescription, setQDescription] = useState("");

  const openQuickAdd = (cat) => {
    setQuickCat(cat);
    setQTitle("");
    setQPrice("");
    setQDiscount("");
    setQInStock(true);
    setQImages([]);
    setQCoverId(null);
    setQDescription("");
    if (quickUrlRef.current) quickUrlRef.current.value = "";
    setQuickOpen(true);
  };
  const closeQuickAdd = () => setQuickOpen(false);

  const qAddImageURL = () => {
    const u = quickUrlRef.current?.value?.trim() || "";
    if (!u) return;
    const id = genId();
    setQImages((prev) => {
      const next = [...prev, { id, url: u }];
      if (!qCoverId) setQCoverId(id);
      return next;
    });
    if (quickUrlRef.current) quickUrlRef.current.value = "";
  };
  const qPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const compressed = await Promise.all(
      files.map((f) => compressImage(f, 1000, 0.82))
    );
    setQImages((prev) => {
      let next = [...prev];
      compressed.forEach((dataUrl) => next.push({ id: genId(), url: dataUrl }));
      if (!qCoverId && next.length) setQCoverId(next[0].id);
      return next;
    });
    e.target.value = "";
  };
  const qRemoveImage = (id) => {
    setQImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (qCoverId === id) setQCoverId(next[0]?.id || null);
      return next;
    });
  };
  const qSetAsCover = (id) => setQCoverId(id);

  const submitQuickAdd = (e) => {
    e?.preventDefault?.();
    if (!qTitle.trim() || !qPrice) {
      alert("Please enter product title and price.");
      return;
    }
    if (qDiscount !== "" && !(Number(qDiscount) < Number(qPrice))) {
      alert("Discount must be less than the main price.");
      return;
    }
    const imgs = qImages.map((img) => ({ ...img, isCover: img.id === qCoverId }));
    const coverUrl = imgs.find((i) => i.id === qCoverId)?.url || imgs[0]?.url || "";

    const created = createProductLS(VENDOR.id, {
      title: qTitle.trim(),
      price: Math.round(Number(qPrice)),
      discountPrice: qDiscount !== "" ? Math.round(Number(qDiscount)) : undefined,
      inStock: Boolean(qInStock),
      category: quickCat || "General",
      description: qDescription.trim() || undefined,
      images: imgs,
      coverId: qCoverId || imgs[0]?.id || null,
      coverImageUrl: coverUrl,
      imageUrl: coverUrl,
      addons: [],
    });
    setProducts((prev) => [created, ...prev]);
    setCatTab(quickCat || "All");
    setQuickOpen(false);
  };

  // ----------------- Products view helpers -----------------
  const productCoverUrl = (p) => {
    const fromImages =
      (Array.isArray(p.images) &&
        (p.images.find((i) => i.id === p.coverId || i.isCover)?.url ||
          p.images[0]?.url)) ||
      "";
    return p.coverImageUrl || fromImages || p.image_url || p.imageUrl || "";
  };

  // ====================== EDIT PRODUCT MODAL ======================
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [eTitle, setETitle] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eDiscount, setEDiscount] = useState("");
  const [eInStock, setEInStock] = useState(true);
  const [eCategory, setECategory] = useState("");
  const [eImages, setEImages] = useState([]); // [{id,url,isCover?}]
  const [eCoverId, setECoverId] = useState(null);
  // NEW: edit description
  const [eDescription, setEDescription] = useState("");

  // NEW: Edit add-ons state
  const [eAddons, setEAddons] = useState([]); // [{id,label,price}]
  const [eNewAddonLabel, setENewAddonLabel] = useState("");
  const [eNewAddonPrice, setENewAddonPrice] = useState("");

  const eShowAddonsSection =
    VENDOR.type === "Restaurant" && (eCategory || "").toLowerCase() !== "drinks";

  const openEdit = (p) => {
    setEditId(p.id);
    setETitle(p.title || "");
    setEPrice(String(p.price ?? ""));
    setEDiscount(p.discountPrice != null ? String(p.discountPrice) : "");
    setEInStock((p.inStock ?? p.in_stock ?? p.available ?? true) === true);
    setECategory(p.category || allCategories[0] || "General");
    setEDescription(p.description || "");

    // prepare images
    let imgs = [];
    if (Array.isArray(p.images) && p.images.length) {
      imgs = p.images.map((img) => ({
        id: img.id || genId(),
        url: img.url,
        isCover: img.isCover || (img.id && img.id === p.coverId) || false,
      }));
    } else {
      const cover = productCoverUrl(p);
      if (cover) {
        const id = genId();
        imgs = [{ id, url: cover, isCover: true }];
      }
    }
    const coverId = imgs.find((i) => i.isCover)?.id || imgs[0]?.id || null;
    setEImages(imgs);
    setECoverId(coverId);

    // preload existing add-ons
    setEAddons(
      Array.isArray(p.addons)
        ? p.addons.map((a) => ({
            id: a.id || genId(),
            label: a.label,
            price: Number(a.price) || 0,
          }))
        : []
    );

    if (editUrlRef.current) editUrlRef.current.value = "";
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const ePickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const compressed = await Promise.all(
      files.map((f) => compressImage(f, 1000, 0.82))
    );
    setEImages((prev) => {
      let next = [...prev];
      compressed.forEach((dataUrl) => next.push({ id: genId(), url: dataUrl }));
      if (!eCoverId && next.length) setECoverId(next[0].id);
      return next;
    });
    e.target.value = "";
  };
  const eAddImageURL = () => {
    const u = editUrlRef.current?.value?.trim() || "";
    if (!u) return;
    const id = genId();
    setEImages((prev) => {
      const next = [...prev, { id, url: u }];
      if (!eCoverId) setECoverId(id);
      return next;
    });
    if (editUrlRef.current) editUrlRef.current.value = "";
  };
  const eRemoveImage = (id) => {
    setEImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (eCoverId === id) setECoverId(next[0]?.id || null);
      return next;
    });
  };
  const eSetAsCover = (id) => setECoverId(id);

  // edit add-on handlers
  const eAddAddonHandler = () => {
    const label = eNewAddonLabel.trim();
    const p = Number(eNewAddonPrice);
    if (!label) return alert("Add-on name is required");
    if (!Number.isFinite(p) || p < 0) return alert("Enter a valid add-on price (₦)");
    setEAddons((prev) => [
      ...prev,
      { id: genId(), label, price: Math.round(p) },
    ]);
    setENewAddonLabel("");
    setENewAddonPrice("");
  };
  const eRemoveAddon = (id) =>
    setEAddons((prev) => prev.filter((a) => a.id !== id));

  const submitEdit = (e) => {
    e?.preventDefault?.();
    if (!eTitle.trim() || !ePrice) {
      alert("Please enter product title and price.");
      return;
    }
    if (eDiscount !== "" && !(Number(eDiscount) < Number(ePrice))) {
      alert("Discount must be less than the main price.");
      return;
    }

    const imgs = eImages.map((img) => ({ ...img, isCover: img.id === eCoverId }));
    const coverUrl = imgs.find((i) => i.id === eCoverId)?.url || imgs[0]?.url || "";

    const patch = {
      title: eTitle.trim(),
      price: Math.round(Number(ePrice)),
      discountPrice:
        eDiscount !== "" ? Math.round(Number(eDiscount)) : undefined,
      inStock: Boolean(eInStock),
      category: eCategory || "General",
      description: eDescription.trim() || undefined,
      images: imgs,
      coverId: eCoverId || imgs[0]?.id || null,
      coverImageUrl: coverUrl,
      imageUrl: coverUrl,
      addons: eShowAddonsSection ? eAddons : [],
    };

    const next = updateProductLS(VENDOR.id, editId, patch);
    setProducts(next);
    setEditOpen(false);
  };

  // ---------------------------------------------------------------

  const renderProductCard = (p) => {
    const price = Number(p.price) || 0;
    const sale = p.discountPrice ?? p.sale_price ?? p.salePrice ?? null;
    const hasSale = sale && Number(sale) > 0 && Number(sale) < price;
    const inStockFlag = (p.inStock ?? p.in_stock ?? p.available ?? true) === true;
    const cover = productCoverUrl(p);
    const photoCount = Array.isArray(p.images) ? p.images.length : cover ? 1 : 0;

    return (
      <article
        key={p.id}
        className={`bg-white rounded-2xl p-4 border border-[#0F3D2E]/10 shadow-sm flex gap-3 items-start ${
          inStockFlag ? "" : "opacity-70"
        }`}
      >
        {cover ? (
          <div className="relative">
            <img
              src={cover}
              alt={p.title}
              className="h-20 w-24 object-cover rounded-lg"
            />
            {photoCount > 1 && (
              <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                {photoCount} photos
              </span>
            )}
          </div>
        ) : (
          <div className="h-20 w-24 rounded-lg bg-gray-100 grid place-items-center text-xs text-gray-500">
            No image
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-[#0F3D2E] truncate">{p.title}</div>
            {!inStockFlag && (
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Out of stock
              </span>
            )}
          </div>

          <div className="text-sm text-[#0F3D2E]/70 flex items-center gap-2">
            <span className="truncate">{p.category || "General"}</span>
            <span>•</span>
            {hasSale ? (
              <>
                <span className="line-through">{formatNaira(price)}</span>
                <span className="font-semibold text-[#1b5e20]">
                  {formatNaira(sale)}
                </span>
                <span className="text-xs text-[#0F3D2E]/60">
                  ({Math.round(((price - sale) / price) * 100)}% off)
                </span>
              </>
            ) : (
              <span className="font-semibold text-[#0F3D2E]">
                {formatNaira(price)}
              </span>
            )}
          </div>

          {/* NEW: Description preview (optional, 2 lines) */}
          {p.description && (
            <div
              className="text-xs text-[#0F3D2E]/70 mt-1"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={p.description}
            >
              {p.description}
            </div>
          )}

          {!!p.addons?.length && (
            <div className="mt-1 text-xs text-[#0F3D2E]/60 truncate">
              Add-ons:{" "}
              {p.addons
                .map(
                  (a) =>
                    `${a.label}${a.price ? ` (${formatNaira(a.price)})` : ""}`
                )
                .join(", ")}
            </div>
          )}
        </div>

        {/* Actions: stock + edit */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-[#0F3D2E]">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={inStockFlag}
              onChange={() => toggleStock(p)}
            />
            <span>{inStockFlag ? "In stock" : "Out of stock"}</span>
          </label>

          <button
            type="button"
            onClick={() => openEdit(p)}
            className="px-3 py-1.5 rounded-lg border border-[#1b5e20] text-[#1b5e20] hover:bg-[#1b5e20] hover:text-white text-sm font-semibold"
            title="Edit product"
          >
            Edit
          </button>
        </div>
      </article>
    );
  };

  const byCat = useMemo(
    () => groupByCategory(allCategories, products),
    [allCategories, products]
  );

  /* ---------------------- ADD CATEGORY ---------------------- */
  function addCategory() {
    const name = (newCat || "").trim();
    if (!name || name.toLowerCase() === "all") return;

    // prevent duplicates (case-insensitive)
    const exists = (c) => c.toLowerCase() === name.toLowerCase();
    if ([...customCats].some(exists)) {
      setNewCat("");
      setCatTab(name);
      return;
    }

    const next = [...customCats, name];
    setCustomCats(next);
    localStorage.setItem(
      CUSTOM_CATS_KEY(VENDOR.id, VENDOR.type),
      JSON.stringify(next)
    );
    setNewCat("");
    setCatTab(name);
  }

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      {/* Page header */}
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0F3D2E]">Products</h1>
            <p className="text-sm text-[#0F3D2E]/70">
              Vendor: <b>{VENDOR.name}</b> • Type: <b>{VENDOR.type}</b>
            </p>
            <p className="text-xs text-[#0F3D2E]/50 mt-1">
              <b>Mode:</b> Local Storage (data is saved on this device)
            </p>
          </div>

          {/* View toggle */}
          <div className="bg-[#EEF2EF] rounded-xl p-1 inline-flex">
            {["Products", "Manage"].map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    active ? "bg-[#1b5e20] text-white" : "text-[#0F3D2E]"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP CATEGORY NAV — (Products view) */}
      {view === "Products" && (
        <div className="sticky top-0 z-20 bg-[#F7F9F5] border-y border-[#0F3D2E]/10">
          <div className="px-6 py-3 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {["All", ...allCategories].map((c) => {
                const active = catTab === c;
                const count =
                  c === "All"
                    ? products.length
                    : products.filter((p) => (p.category || "General") === c)
                        .length || 0;
                return (
                  <button
                    key={c}
                    onClick={() => setCatTab(c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
                      active
                        ? "bg-[#1b5e20] text-white"
                        : "bg-[#EEF2EF] text-[#0F3D2E]"
                    }`}
                    title={`${c} (${count})`}
                  >
                    {c} <span className="opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE VIEW: Add Product Form */}
      {view === "Manage" && (
        <form
          onSubmit={handleAddProduct}
          className="bg-white rounded-2xl shadow p-4 space-y-4 m-6 border border-[#0F3D2E]/10"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-[#0F3D2E]">
                Product title
              </label>
              <input
                type="text"
                placeholder="e.g. Jollof Rice & Chicken"
                className="w-full p-3 rounded-lg bg-gray-100 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium text-[#0F3D2E]">
                Price (₦)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1800"
                className="w-full p-3 rounded-lg bg-gray-100 outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Discounted price */}
            <div className="grid gap-1">
              <label className="text-sm font-medium text-[#0F3D2E]">
                Discounted price (optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Less than main price"
                className={`w-full p-3 rounded-lg outline-none ${
                  discountPrice === "" ||
                  Number(discountPrice) < Number(price || 0)
                    ? "bg-gray-100"
                    : "bg-red-50"
                }`}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
              />
              {discountPrice !== "" &&
                !(Number(discountPrice) < Number(price || 0)) && (
                  <span className="text-xs text-red-600">
                    Must be less than the main price.
                  </span>
                )}
            </div>

            {/* Category */}
            <div className="grid gap-1">
              <label className="text-sm font-medium text-[#0F3D2E]">
                Category
              </label>
              <select
                className="w-full p-3 rounded-lg bg-gray-100 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {(allCategories.length ? allCategories : ["General"]).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* NEW: Description (optional, full width) */}
            <div className="grid gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-[#0F3D2E]">
                Description (optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Spicy jollof with juicy grilled chicken, served with coleslaw."
                className="w-full p-3 rounded-lg bg-gray-100 outline-none resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* MULTI-IMAGE: Upload & URLs */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[#0F3D2E]">Images</label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F3D2E] text-white">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onPickFiles}
                />
                <span>Upload images</span>
              </label>
              <div className="flex-1 flex gap-2">
                <input
                  ref={manageUrlRef}
                  type="url"
                  placeholder="Paste image URL and click Add"
                  className="w-full p-2.5 rounded-lg bg-gray-100 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (manageUrlRef.current) {
                        addImageURL(manageUrlRef.current.value);
                        manageUrlRef.current.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manageUrlRef.current) {
                      addImageURL(manageUrlRef.current.value);
                      manageUrlRef.current.value = "";
                    }
                  }}
                  className="px-3 rounded-lg bg-[#1b5e20] text-white"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Thumbnails + choose cover */}
            {images.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative border rounded-lg overflow-hidden"
                  >
                    <img src={img.url} alt="img" className="h-28 w-full object-cover" />
                    <div className="absolute top-1 left-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setAsCover(img.id)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          coverId === img.id
                            ? "bg-[#1b5e20] text-white"
                            : "bg-white/90 text-[#0F3D2E]"
                        }`}
                        title="Set as cover"
                      >
                        {coverId === img.id ? "Cover" : "Make cover"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded px-2 text-xs"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#0F3D2E]/60">No images yet.</p>
            )}
          </div>

          {/* Add-ons */}
          {showAddonsSection && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-[#0F3D2E] mb-2">
                Add-ons
              </label>
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

          {/* Stock on create */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="inStock"
              type="checkbox"
              className="h-4 w-4"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            <label htmlFor="inStock" className="text-sm text-[#0F3D2E]">
              In stock
            </label>
          </div>

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
      )}

      {/* PRODUCTS VIEW */}
      {view === "Products" && (
        <>
          {/* ADD CATEGORY BOX — show first on All tab */}
          {catTab === "All" && (
            <section className="px-6 pt-4 pb-6">
              <div className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0F3D2E]">
                  Add category
                </h3>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCategory();
                      }
                    }}
                    placeholder="e.g. Breakfast"
                    className="flex-1 h-10 px-3 rounded-lg bg-gray-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    disabled={!newCat.trim() || newCat.trim().toLowerCase() === "all"}
                    className={`h-10 px-4 rounded-lg text-sm font-semibold ${
                      !newCat.trim() || newCat.trim().toLowerCase() === "all"
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#1b5e20] text-white hover:opacity-90"
                    }`}
                    title="Add new category"
                  >
                    Add
                  </button>
                </div>

                {!!customCats.length && (
                  <>
                    <div className="mt-3 text-xs text-[#0F3D2E]/60">
                      Your custom categories:
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customCats.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2EF] rounded-full text-xs text-[#0F3D2E]"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => {
                              const next = customCats.filter((x) => x !== c);
                              setCustomCats(next);
                              localStorage.setItem(
                                CUSTOM_CATS_KEY(VENDOR.id, VENDOR.type),
                                JSON.stringify(next)
                              );
                              if (catTab === c) setCatTab("All");
                            }}
                            className="ml-1 text-[#0F3D2E]/60 hover:text-red-600"
                            title="Remove category"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Category sections */}
          <section className="px-6 pb-10 space-y-8">
            {(catTab === "All" ? allCategories : [catTab]).map((cat) => {
              const list = byCat[cat] || [];
              return (
                <div key={cat}>
                  {/* Category header with INSIDE add button */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-[#0F3D2E]">{cat}</h2>
                    <button
                      type="button"
                      onClick={() => openQuickAdd(cat)}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#1b5e20] text-[#1b5e20] hover:bg-[#1b5e20] hover:text-white transition text-sm font-semibold"
                      title={`Add product to ${cat}`}
                    >
                      <span className="text-base leading-none">＋</span>
                      <span>Add</span>
                    </button>
                  </div>

                  {list.length === 0 ? (
                    <p className="text-gray-500">No products in this category yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {list.map((p) => renderProductCard(p))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}

      {/* QUICK ADD MODAL */}
      {quickOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeQuickAdd}
            aria-hidden="true"
          />
          <div className="absolute inset-0 grid place-items-center p-4">
            <form
              onSubmit={submitQuickAdd}
              className="w-full max-w-md bg-white rounded-2xl p-4 shadow-xl border border-[#0F3D2E]/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#0F3D2E]">
                  Add product to <span className="text-[#1b5e20]">{quickCat}</span>
                </h3>
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  className="text-[#0F3D2E]/60 hover:text-[#0F3D2E]"
                  aria-label="Close"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[#0F3D2E]">Product title</label>
                  <input
                    className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    placeholder="e.g. Jollof Rice"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-[#0F3D2E]">Price (₦)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      value={qPrice}
                      onChange={(e) => setQPrice(e.target.value)}
                      placeholder="1800"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#0F3D2E]">
                      Discount (₦, optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      value={qDiscount}
                      onChange={(e) => setQDiscount(e.target.value)}
                      placeholder="1500"
                    />
                  </div>
                </div>

                {/* NEW: Quick description */}
                <div>
                  <label className="text-sm text-[#0F3D2E]">
                    Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none resize-y"
                    value={qDescription}
                    onChange={(e) => setQDescription(e.target.value)}
                    placeholder="Short details customers should see"
                  />
                </div>

                {/* Quick Add images */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[#0F3D2E]">
                    Images
                  </label>
                  <div className="flex items-start gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F3D2E] text-white">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={qPickFiles}
                      />
                      Upload
                    </label>
                    <input
                      ref={quickUrlRef}
                      type="url"
                      className="flex-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      placeholder="Paste image URL and press Add"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          qAddImageURL();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={qAddImageURL}
                      className="px-3 rounded-lg bg-[#1b5e20] text-white"
                    >
                      Add
                    </button>
                  </div>

                  {qImages.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {qImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative border rounded-lg overflow-hidden"
                        >
                          <img
                            src={img.url}
                            alt="img"
                            className="h-24 w-full object-cover"
                          />
                          <div className="absolute top-1 left-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => qSetAsCover(img.id)}
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                qCoverId === img.id
                                  ? "bg-[#1b5e20] text-white"
                                  : "bg-white/90 text-[#0F3D2E]"
                              }`}
                              title="Set as cover"
                            >
                              {qCoverId === img.id ? "Cover" : "Make cover"}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => qRemoveImage(img.id)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded px-2 text-xs"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0F3D2E]/60">No images yet.</p>
                  )}
                </div>

                <div className="pt-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <div />
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={qInStock}
                      onChange={(e) => setQInStock(e.target.checked)}
                    />
                    <span className="text-sm text-[#0F3D2E]">In stock</span>
                  </label>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-lg bg-[#1b5e20] text-white font-semibold hover:opacity-90"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={closeQuickAdd}
                    className="h-10 px-4 rounded-lg bg-gray-100 text-[#0F3D2E]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} aria-hidden="true" />
          <div className="absolute inset-0 grid place-items-center p-4">
            <form
              onSubmit={submitEdit}
              className="w-full max-w-md bg-white rounded-2xl p-4 shadow-xl border border-[#0F3D2E]/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#0F3D2E]">
                  Edit product
                </h3>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="text-[#0F3D2E]/60 hover:text-[#0F3D2E]"
                  aria-label="Close"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[#0F3D2E]">Product title</label>
                  <input
                    className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                    value={eTitle}
                    onChange={(e) => setETitle(e.target.value)}
                    placeholder="Title"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-[#0F3D2E]">Price (₦)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      value={ePrice}
                      onChange={(e) => setEPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#0F3D2E]">
                      Discount (₦, optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      value={eDiscount}
                      onChange={(e) => setEDiscount(e.target.value)}
                    />
                  </div>
                </div>

                {/* NEW: Edit description */}
                <div>
                  <label className="text-sm text-[#0F3D2E]">
                    Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none resize-y"
                    value={eDescription}
                    onChange={(e) => setEDescription(e.target.value)}
                    placeholder="Short details customers should see"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-[#0F3D2E]">Category</label>
                    <select
                      className="w-full mt-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      value={eCategory}
                      onChange={(e) => setECategory(e.target.value)}
                    >
                      {(allCategories.length ? allCategories : ["General"]).map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <label className="inline-flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={eInStock}
                      onChange={(e) => setEInStock(e.target.checked)}
                    />
                    <span className="text-sm text-[#0F3D2E]">In stock</span>
                  </label>
                </div>

                {/* Edit Add-ons */}
                {eShowAddonsSection && (
                  <div className="mt-1">
                    <label className="block text-sm font-medium text-[#0F3D2E] mb-2">
                      Add-ons
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Add-on name (e.g. Extra Meat)"
                        className="flex-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                        value={eNewAddonLabel}
                        onChange={(ev) => setENewAddonLabel(ev.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Price (₦)"
                        className="w-40 p-2.5 rounded-lg bg-gray-100 outline-none"
                        value={eNewAddonPrice}
                        onChange={(ev) => setENewAddonPrice(ev.target.value)}
                      />
                      <button
                        type="button"
                        onClick={eAddAddonHandler}
                        className="px-4 py-2 rounded-lg bg-[#0F3D2E] text-white font-medium"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {eAddons.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2EF] rounded-full text-sm text-[#0F3D2E]"
                        >
                          {a.label} • {formatNaira(a.price)}
                          <button
                            type="button"
                            onClick={() => eRemoveAddon(a.id)}
                            className="ml-1 text-[#0F3D2E]/60 hover:text-red-600"
                            title="Remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {!eAddons.length && (
                        <span className="text-sm text-[#0F3D2E]/50">
                          No add-ons yet.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit images */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[#0F3D2E]">
                    Images
                  </label>
                  <div className="flex items-start gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F3D2E] text-white">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={ePickFiles}
                      />
                      Upload
                    </label>
                    <input
                      ref={editUrlRef}
                      type="url"
                      className="flex-1 p-2.5 rounded-lg bg-gray-100 outline-none"
                      placeholder="Paste image URL and press Add"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          eAddImageURL();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={eAddImageURL}
                      className="px-3 rounded-lg bg-[#1b5e20] text-white"
                    >
                      Add
                    </button>
                  </div>

                  {eImages.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {eImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative border rounded-lg overflow-hidden"
                        >
                          <img
                            src={img.url}
                            alt="img"
                            className="h-24 w-full object-cover"
                          />
                          <div className="absolute top-1 left-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => eSetAsCover(img.id)}
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                eCoverId === img.id
                                  ? "bg-[#1b5e20] text-white"
                                  : "bg-white/90 text-[#0F3D2E]"
                              }`}
                              title="Set as cover"
                            >
                              {eCoverId === img.id ? "Cover" : "Make cover"}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => eRemoveImage(img.id)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded px-2 text-xs"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0F3D2E]/60">No images yet.</p>
                  )}
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-lg bg-[#1b5e20] text-white font-semibold hover:opacity-90"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="h-10 px-4 rounded-lg bg-gray-100 text-[#0F3D2E]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}