/* CargoHive — Common utilities, mock data, auth helpers */
(function (global) {
  "use strict";

  const STORAGE_KEYS = {
    session: "cs_session",
    traders: "cs_traders",
    providers: "cs_providers",
    vehicles: "cs_vehicles",
    bookings: "cs_bookings",
    notifications: "cs_notifications",
    chats: "cs_chats",
    settings: "cs_settings",
  };

  /* ---------- Seed Data ---------- */
  const SEED_PROVIDERS = [
    {
      id: "prov_gv",
      companyName: "GV Transport",
      contactPerson: "Ganesh Venkat",
      email: "provider@gvtransport.com",
      phone: "+91 98765 43210",
      businessType: "Transport Company",
      gst: "33AABCG1234A1Z5",
      address: "12 Trichy Road, Erode",
      city: "Erode",
      state: "Tamil Nadu",
      password: "provider123",
      status: "Approved",
      rating: 4.8,
      vehicles: 4,
      joined: "2025-11-12",
    },
    {
      id: "prov_skm",
      companyName: "SKM Logistics",
      contactPerson: "Suresh Kumar",
      email: "ops@skmlogistics.in",
      phone: "+91 98401 22334",
      businessType: "Freight Forwarder",
      gst: "33AADCS5678B1Z2",
      address: "45 Avinashi Road, Tiruppur",
      city: "Tiruppur",
      state: "Tamil Nadu",
      password: "provider123",
      status: "Approved",
      rating: 4.6,
      vehicles: 3,
      joined: "2025-12-02",
    },
    {
      id: "prov_kovai",
      companyName: "Kovai Cargo Movers",
      contactPerson: "Priya Rajan",
      email: "hello@kovaicargo.com",
      phone: "+91 97890 11223",
      businessType: "Truck Operator",
      gst: "33AAECK9012C1Z8",
      address: "88 Race Course, Coimbatore",
      city: "Coimbatore",
      state: "Tamil Nadu",
      password: "provider123",
      status: "Approved",
      rating: 4.5,
      vehicles: 5,
      joined: "2026-01-18",
    },
    {
      id: "prov_tnf",
      companyName: "Tamil Nadu Freight",
      contactPerson: "Murugan Selvan",
      email: "contact@tnfreight.in",
      phone: "+91 90030 44556",
      businessType: "Shipping Company",
      gst: "33AABCT3344D1Z1",
      address: "7 GST Road, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      password: "provider123",
      status: "Pending",
      rating: 0,
      vehicles: 0,
      joined: "2026-03-05",
    },
    {
      id: "prov_south",
      companyName: "SouthLine Logistics",
      contactPerson: "Anitha Devi",
      email: "info@southline.in",
      phone: "+91 99123 66778",
      businessType: "Rail Logistics",
      gst: "33AABCS7788E1Z9",
      address: "22 Hosur Road, Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      password: "provider123",
      status: "Pending",
      rating: 0,
      vehicles: 2,
      joined: "2026-03-08",
    },
  ];

  const SEED_TRADERS = [
    {
      id: "tr_demo",
      fullName: "Dharshan Kumar",
      email: "trader@cargohive.example",
      phone: "+91 98700 11122",
      businessName: "DK Exports",
      businessType: "Exporter",
      gst: "33AABCD1234F1Z7",
      address: "15 Bazaar Street, Erode",
      city: "Erode",
      state: "Tamil Nadu",
      password: "trader123",
      status: "Active",
      bookings: 8,
      joined: "2025-10-20",
    },
    {
      id: "tr_meena",
      fullName: "Meena Textiles",
      email: "meena@textiles.in",
      phone: "+91 94444 55667",
      businessName: "Meena Textiles Pvt Ltd",
      businessType: "Exporter",
      gst: "33AABCM5566G1Z3",
      address: "90 Kangeyam Road, Tiruppur",
      city: "Tiruppur",
      state: "Tamil Nadu",
      password: "trader123",
      status: "Active",
      bookings: 12,
      joined: "2025-09-14",
    },
    {
      id: "tr_spice",
      fullName: "Ravi Spices Co",
      email: "ravi@spices.co",
      phone: "+91 95555 77889",
      businessName: "Ravi Spices Co",
      businessType: "Importer",
      gst: "",
      address: "3 Market Road, Salem",
      city: "Salem",
      state: "Tamil Nadu",
      password: "trader123",
      status: "Active",
      bookings: 3,
      joined: "2026-02-01",
    },
  ];

  const SEED_VEHICLES = [
    {
      id: "veh_001",
      providerId: "prov_gv",
      providerName: "GV Transport",
      vehicleNumber: "TN-33-AB-4521",
      vehicleType: "10 CBM Truck",
      totalCbm: 10,
      availableCbm: 5,
      maxWeight: 2000,
      availableWeight: 800,
      route: ["Erode", "Salem", "Chennai"],
      departureDate: "2026-03-11",
      departureTime: "08:00",
      etaDate: "2026-03-11",
      etaTime: "14:00",
      pricePerCbm: 1200,
      tempControlled: false,
      refrigerated: false,
      hazardousAllowed: false,
      fragileSupported: true,
      status: "Partially Booked",
      rating: 4.8,
      verified: true,
    },
    {
      id: "veh_002",
      providerId: "prov_skm",
      providerName: "SKM Logistics",
      vehicleNumber: "TN-39-CD-8820",
      vehicleType: "Closed Container Truck",
      totalCbm: 18,
      availableCbm: 12,
      maxWeight: 5000,
      availableWeight: 3200,
      route: ["Tiruppur", "Chennai"],
      departureDate: "2026-03-12",
      departureTime: "06:30",
      etaDate: "2026-03-12",
      etaTime: "13:00",
      pricePerCbm: 1100,
      tempControlled: false,
      refrigerated: false,
      hazardousAllowed: false,
      fragileSupported: true,
      status: "Available",
      rating: 4.6,
      verified: true,
    },
    {
      id: "veh_003",
      providerId: "prov_kovai",
      providerName: "Kovai Cargo Movers",
      vehicleNumber: "TN-37-EF-1190",
      vehicleType: "Mini Truck",
      totalCbm: 6,
      availableCbm: 6,
      maxWeight: 1200,
      availableWeight: 1200,
      route: ["Coimbatore", "Chennai"],
      departureDate: "2026-03-11",
      departureTime: "21:00",
      etaDate: "2026-03-12",
      etaTime: "06:00",
      pricePerCbm: 1400,
      tempControlled: true,
      refrigerated: true,
      hazardousAllowed: false,
      fragileSupported: true,
      status: "Available",
      rating: 4.5,
      verified: true,
    },
    {
      id: "veh_004",
      providerId: "prov_gv",
      providerName: "GV Transport",
      vehicleNumber: "TN-33-GH-2201",
      vehicleType: "Lorry",
      totalCbm: 22,
      availableCbm: 0,
      maxWeight: 8000,
      availableWeight: 0,
      route: ["Erode", "Bangalore"],
      departureDate: "2026-03-10",
      departureTime: "05:00",
      etaDate: "2026-03-10",
      etaTime: "12:30",
      pricePerCbm: 950,
      tempControlled: false,
      refrigerated: false,
      hazardousAllowed: true,
      fragileSupported: false,
      status: "Fully Booked",
      rating: 4.7,
      verified: true,
    },
    {
      id: "veh_005",
      providerId: "prov_skm",
      providerName: "SKM Logistics",
      vehicleNumber: "TN-39-IJ-3344",
      vehicleType: "Pickup Van",
      totalCbm: 4,
      availableCbm: 2.5,
      maxWeight: 800,
      availableWeight: 450,
      route: ["Tiruppur", "Bangalore"],
      departureDate: "2026-03-13",
      departureTime: "09:00",
      etaDate: "2026-03-13",
      etaTime: "16:00",
      pricePerCbm: 1500,
      tempControlled: false,
      refrigerated: false,
      hazardousAllowed: false,
      fragileSupported: true,
      status: "Partially Booked",
      rating: 4.4,
      verified: true,
    },
    {
      id: "veh_006",
      providerId: "prov_kovai",
      providerName: "Kovai Cargo Movers",
      vehicleNumber: "TN-37-KL-7788",
      vehicleType: "10 CBM Truck",
      totalCbm: 10,
      availableCbm: 8,
      maxWeight: 2500,
      availableWeight: 2000,
      route: ["Coimbatore", "Salem", "Chennai"],
      departureDate: "2026-03-14",
      departureTime: "07:00",
      etaDate: "2026-03-14",
      etaTime: "15:30",
      pricePerCbm: 1250,
      tempControlled: false,
      refrigerated: false,
      hazardousAllowed: false,
      fragileSupported: true,
      status: "Available",
      rating: 4.5,
      verified: true,
    },
  ];

  const SEED_BOOKINGS = [
    {
      id: "BK-2026-1042",
      traderId: "tr_demo",
      traderName: "DK Exports",
      providerId: "prov_gv",
      providerName: "GV Transport",
      vehicleId: "veh_001",
      vehicleNumber: "TN-33-AB-4521",
      route: ["Erode", "Salem", "Chennai"],
      cargoName: "Cotton Fabrics",
      cargoCategory: "Textiles",
      cbm: 2,
      weight: 350,
      amount: 2640,
      serviceFee: 240,
      total: 2640,
      pickup: "Erode Warehouse, Trichy Road",
      delivery: "Chennai Port CFS",
      pickupDate: "2026-03-11",
      deliveryDate: "2026-03-11",
      status: "Confirmed",
      paymentStatus: "Paid",
      paymentMethod: "UPI",
      txnId: "TXN98451203",
      fragile: true,
      tempControlled: false,
      hazardous: false,
      createdAt: "2026-03-09T10:30:00",
      timeline: [
        { step: "Booking Confirmed", done: true, at: "09 Mar, 10:30 AM" },
        { step: "Cargo Pickup", done: false, at: "Scheduled 11 Mar, 8:00 AM" },
        { step: "In Transit", done: false, at: "" },
        { step: "Destination", done: false, at: "" },
        { step: "Delivered", done: false, at: "" },
      ],
    },
    {
      id: "BK-2026-1038",
      traderId: "tr_meena",
      traderName: "Meena Textiles Pvt Ltd",
      providerId: "prov_skm",
      providerName: "SKM Logistics",
      vehicleId: "veh_002",
      vehicleNumber: "TN-39-CD-8820",
      route: ["Tiruppur", "Chennai"],
      cargoName: "Knit Garments",
      cargoCategory: "Apparel",
      cbm: 4,
      weight: 600,
      amount: 4840,
      serviceFee: 440,
      total: 4840,
      pickup: "Tiruppur Unit 2",
      delivery: "Ambattur Industrial Estate",
      pickupDate: "2026-03-12",
      deliveryDate: "2026-03-12",
      status: "In Transit",
      paymentStatus: "Paid",
      paymentMethod: "Card",
      txnId: "TXN98450112",
      fragile: false,
      tempControlled: false,
      hazardous: false,
      createdAt: "2026-03-08T14:00:00",
      timeline: [
        { step: "Booking Confirmed", done: true, at: "08 Mar, 2:00 PM" },
        { step: "Cargo Pickup", done: true, at: "12 Mar, 6:45 AM" },
        { step: "In Transit", done: true, at: "12 Mar, 7:10 AM", active: true },
        { step: "Destination", done: false, at: "ETA 1:00 PM" },
        { step: "Delivered", done: false, at: "" },
      ],
    },
    {
      id: "BK-2026-1020",
      traderId: "tr_demo",
      traderName: "DK Exports",
      providerId: "prov_kovai",
      providerName: "Kovai Cargo Movers",
      vehicleId: "veh_003",
      vehicleNumber: "TN-37-EF-1190",
      route: ["Coimbatore", "Chennai"],
      cargoName: "Spice Cartons",
      cargoCategory: "Food",
      cbm: 1.5,
      weight: 200,
      amount: 2310,
      serviceFee: 210,
      total: 2310,
      pickup: "Coimbatore Cold Store",
      delivery: "Chennai Wholesale Market",
      pickupDate: "2026-03-01",
      deliveryDate: "2026-03-02",
      status: "Delivered",
      paymentStatus: "Paid",
      paymentMethod: "Net Banking",
      txnId: "TXN98448801",
      fragile: false,
      tempControlled: true,
      hazardous: false,
      createdAt: "2026-02-28T09:00:00",
      timeline: [
        { step: "Booking Confirmed", done: true, at: "28 Feb" },
        { step: "Cargo Pickup", done: true, at: "01 Mar" },
        { step: "In Transit", done: true, at: "01 Mar" },
        { step: "Destination", done: true, at: "02 Mar" },
        { step: "Delivered", done: true, at: "02 Mar, 6:15 AM" },
      ],
    },
    {
      id: "BK-2026-1015",
      traderId: "tr_spice",
      traderName: "Ravi Spices Co",
      providerId: "prov_gv",
      providerName: "GV Transport",
      vehicleId: "veh_001",
      vehicleNumber: "TN-33-AB-4521",
      route: ["Erode", "Salem", "Chennai"],
      cargoName: "Turmeric Bags",
      cargoCategory: "Agriculture",
      cbm: 3,
      weight: 450,
      amount: 3960,
      serviceFee: 360,
      total: 3960,
      pickup: "Erode APMC",
      delivery: "Chennai",
      pickupDate: "2026-02-20",
      deliveryDate: "2026-02-20",
      status: "Cancelled",
      paymentStatus: "Refunded",
      paymentMethod: "UPI",
      txnId: "TXN98447001",
      fragile: false,
      tempControlled: false,
      hazardous: false,
      createdAt: "2026-02-18T11:00:00",
      timeline: [
        { step: "Booking Confirmed", done: true, at: "18 Feb" },
        { step: "Cargo Pickup", done: false, at: "Cancelled" },
        { step: "In Transit", done: false, at: "" },
        { step: "Destination", done: false, at: "" },
        { step: "Delivered", done: false, at: "" },
      ],
    },
  ];

  const SEED_NOTIFICATIONS = {
    trader: [
      { id: "n1", title: "Booking confirmed", body: "BK-2026-1042 with GV Transport is confirmed.", time: "2 hours ago", read: false, type: "success" },
      { id: "n2", title: "Payment successful", body: "₹2,640 paid for BK-2026-1042.", time: "2 hours ago", read: false, type: "success" },
      { id: "n3", title: "Provider update", body: "GV Transport updated departure to 8:00 AM.", time: "Yesterday", read: true, type: "info" },
      { id: "n4", title: "Cargo picked up", body: "BK-2026-1038 cargo has been picked up.", time: "Today", read: false, type: "info" },
      { id: "n5", title: "Shipment delivered", body: "BK-2026-1020 delivered successfully.", time: "1 week ago", read: true, type: "success" },
    ],
    provider: [
      { id: "pn1", title: "New booking request", body: "DK Exports requested 2 CBM on TN-33-AB-4521.", time: "1 hour ago", read: false },
      { id: "pn2", title: "Trader cancelled booking", body: "BK-2026-1015 was cancelled. Capacity restored.", time: "Yesterday", read: true },
      { id: "pn3", title: "Vehicle capacity updated", body: "Available space for TN-33-AB-4521 is now 5 CBM.", time: "2 days ago", read: true },
      { id: "pn4", title: "Admin approved your account", body: "Your provider account is verified.", time: "Jan 2026", read: true },
    ],
    admin: [
      { id: "an1", title: "New provider registration", body: "SouthLine Logistics awaits approval.", time: "3 hours ago", read: false },
      { id: "an2", title: "High booking volume", body: "Erode → Chennai route hit 24 bookings this week.", time: "Yesterday", read: true },
    ],
  };

  const SEED_CHATS = {
    trader: [
      {
        id: "c1",
        name: "GV Transport",
        role: "Provider",
        online: true,
        lastMsg: "Pickup confirmed for 8 AM.",
        messages: [
          { from: "them", text: "Hello! We received your booking BK-2026-1042.", time: "10:15 AM" },
          { from: "me", text: "Great. Can you confirm pickup time?", time: "10:18 AM" },
          { from: "them", text: "Pickup confirmed for 8 AM tomorrow at Trichy Road warehouse.", time: "10:22 AM" },
        ],
      },
      {
        id: "c2",
        name: "SKM Logistics",
        role: "Provider",
        online: false,
        lastMsg: "Your shipment is in transit.",
        messages: [
          { from: "them", text: "Your shipment is in transit towards Chennai.", time: "7:30 AM" },
          { from: "me", text: "Thanks for the update!", time: "7:45 AM" },
        ],
      },
    ],
    provider: [
      {
        id: "pc1",
        name: "DK Exports",
        role: "Trader",
        online: true,
        lastMsg: "Can you confirm pickup time?",
        messages: [
          { from: "them", text: "Hi, booking confirmed. Can you confirm pickup time?", time: "10:18 AM" },
          { from: "me", text: "Pickup confirmed for 8 AM tomorrow at Trichy Road warehouse.", time: "10:22 AM" },
        ],
      },
      {
        id: "pc2",
        name: "Meena Textiles",
        role: "Trader",
        online: false,
        lastMsg: "Thanks for the update!",
        messages: [
          { from: "me", text: "Your shipment is in transit towards Chennai.", time: "7:30 AM" },
          { from: "them", text: "Thanks for the update!", time: "7:45 AM" },
        ],
      },
    ],
  };

  const DEMO_ADMIN = {
    id: "admin_1",
    email: "admin@cargohive.example",
    password: "admin123",
    name: "Platform Admin",
  };

  /* ---------- Storage helpers ---------- */
  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeed() {
    if (!localStorage.getItem(STORAGE_KEYS.providers)) setJSON(STORAGE_KEYS.providers, SEED_PROVIDERS);
    if (!localStorage.getItem(STORAGE_KEYS.traders)) setJSON(STORAGE_KEYS.traders, SEED_TRADERS);
    if (!localStorage.getItem(STORAGE_KEYS.vehicles)) setJSON(STORAGE_KEYS.vehicles, SEED_VEHICLES);
    if (!localStorage.getItem(STORAGE_KEYS.bookings)) setJSON(STORAGE_KEYS.bookings, SEED_BOOKINGS);
    if (!localStorage.getItem(STORAGE_KEYS.notifications)) setJSON(STORAGE_KEYS.notifications, SEED_NOTIFICATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.chats)) setJSON(STORAGE_KEYS.chats, SEED_CHATS);
    if (!localStorage.getItem(STORAGE_KEYS.settings)) {
      setJSON(STORAGE_KEYS.settings, {
        maxCargoWeight: 10000,
        minBookingCbm: 0.5,
        cancellationWindowHours: 12,
        serviceFeePercent: 10,
        platformName: "CargoHive",
        supportEmail: "support@cargohive.example",
      });
    } else {
      const s = getJSON(STORAGE_KEYS.settings, {});
      if (s.platformName !== "CargoHive" || (s.supportEmail && String(s.supportEmail).indexOf("cargoshare") !== -1)) {
        s.platformName = "CargoHive";
        s.supportEmail = "support@cargohive.example";
        setJSON(STORAGE_KEYS.settings, s);
      }
    }
    // Migrate demo emails after rebrand so prefilled logins keep working
    const traders = getJSON(STORAGE_KEYS.traders, []);
    let tradersChanged = false;
    traders.forEach(function (t) {
      if (t.id === "tr_demo" || (t.email && /cargoshare/i.test(t.email))) {
        if (t.email !== "trader@cargohive.example") {
          t.email = "trader@cargohive.example";
          tradersChanged = true;
        }
      }
    });
    if (tradersChanged) setJSON(STORAGE_KEYS.traders, traders);
  }

  /* ---------- Session ---------- */
  function getSession() {
    return getJSON(STORAGE_KEYS.session, null);
  }

  function setSession(session) {
    setJSON(STORAGE_KEYS.session, session);
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  function requireRole(role, loginPath) {
    const s = getSession();
    if (!s || s.role !== role) {
      window.location.href = loginPath;
      return null;
    }
    return s;
  }

  function logout(redirect) {
    clearSession();
    window.location.href = redirect || "../index.html";
  }

  /* ---------- Formatters ---------- */
  function formatINR(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function formatRoute(route) {
    if (!route) return "";
    if (typeof route === "string") return route;
    return route.join(" → ");
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function bookingId() {
    return "BK-2026-" + String(1000 + Math.floor(Math.random() * 9000));
  }

  function txnId() {
    return "TXN" + String(Math.floor(10000000 + Math.random() * 89999999));
  }

  /* ---------- Toast / Modal / UI ---------- */
  function ensureToastContainer() {
    let el = document.getElementById("toast-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast-container";
      el.className = "toast-container";
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, type) {
    type = type || "info";
    const container = ensureToastContainer();
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML =
      '<div class="toast-msg">' +
      message +
      '</div><button class="toast-close" aria-label="Close">&times;</button>';
    container.appendChild(el);
    const close = () => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 200);
    };
    el.querySelector(".toast-close").onclick = close;
    setTimeout(close, 3500);
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add("open");
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove("open");
  }

  function statusBadge(status) {
    const map = {
      Confirmed: "badge-info",
      Upcoming: "badge-info",
      Active: "badge-info",
      "In Transit": "badge-warning",
      Delivered: "badge-success",
      Completed: "badge-success",
      Cancelled: "badge-danger",
      Paid: "badge-success",
      Refunded: "badge-slate",
      Pending: "badge-warning",
      Approved: "badge-success",
      Rejected: "badge-danger",
      Suspended: "badge-danger",
      Available: "badge-success",
      "Partially Booked": "badge-warning",
      "Fully Booked": "badge-danger",
      Inactive: "badge-slate",
    };
    const cls = map[status] || "badge-slate";
    return '<span class="badge ' + cls + '">' + status + "</span>";
  }

  /* ---------- Sidebar / Mobile ---------- */
  function initSidebar() {
    const toggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    let overlay = document.getElementById("sidebar-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sidebar-overlay";
      overlay.className = "sidebar-overlay";
      document.body.appendChild(overlay);
    }
    const close = () => {
      sidebar && sidebar.classList.remove("open");
      overlay.classList.remove("open");
    };
    const open = () => {
      sidebar && sidebar.classList.add("open");
      overlay.classList.add("open");
    };
    if (toggle) toggle.addEventListener("click", () => (sidebar.classList.contains("open") ? close() : open()));
    overlay.addEventListener("click", close);
  }

  function setActiveNav(page) {
    document.querySelectorAll(".nav-link[data-nav]").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-nav") === page);
    });
  }

  /* ---------- Validation helpers ---------- */
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isPhone(v) {
    return /^(\+91[\s-]?)?[6-9]\d{9}$/.test(String(v).replace(/\s/g, "")) || /^(\+91\s?)?\d{5}\s?\d{5}$/.test(v);
  }

  function validateRequired(form) {
    let ok = true;
    form.querySelectorAll("[required]").forEach((field) => {
      const err = field.parentElement.querySelector(".form-error");
      const empty = !field.value || (field.type === "checkbox" && !field.checked);
      field.classList.toggle("error", empty);
      if (err) err.classList.toggle("show", empty);
      if (empty) ok = false;
    });
    return ok;
  }

  /* ---------- Data accessors ---------- */
  function getProviders() {
    return getJSON(STORAGE_KEYS.providers, SEED_PROVIDERS);
  }
  function saveProviders(list) {
    setJSON(STORAGE_KEYS.providers, list);
  }
  function getTraders() {
    return getJSON(STORAGE_KEYS.traders, SEED_TRADERS);
  }
  function saveTraders(list) {
    setJSON(STORAGE_KEYS.traders, list);
  }
  function getVehicles() {
    return getJSON(STORAGE_KEYS.vehicles, SEED_VEHICLES);
  }
  function saveVehicles(list) {
    setJSON(STORAGE_KEYS.vehicles, list);
  }
  function getBookings() {
    return getJSON(STORAGE_KEYS.bookings, SEED_BOOKINGS);
  }
  function saveBookings(list) {
    setJSON(STORAGE_KEYS.bookings, list);
  }
  function getNotifications() {
    return getJSON(STORAGE_KEYS.notifications, SEED_NOTIFICATIONS);
  }
  function saveNotifications(n) {
    setJSON(STORAGE_KEYS.notifications, n);
  }
  function getChats() {
    return getJSON(STORAGE_KEYS.chats, SEED_CHATS);
  }
  function saveChats(c) {
    setJSON(STORAGE_KEYS.chats, c);
  }
  function getSettings() {
    return getJSON(STORAGE_KEYS.settings, {});
  }
  function saveSettings(s) {
    setJSON(STORAGE_KEYS.settings, s);
  }

  function getVehicle(id) {
    return getVehicles().find((v) => v.id === id);
  }

  function getBooking(id) {
    return getBookings().find((b) => b.id === id);
  }

  function updateVehicleCapacity(vehicleId, cbmDelta, weightDelta) {
    const list = getVehicles();
    const v = list.find((x) => x.id === vehicleId);
    if (!v) return null;
    v.availableCbm = Math.max(0, +(v.availableCbm - cbmDelta).toFixed(2));
    v.availableWeight = Math.max(0, Math.round(v.availableWeight - weightDelta));
    if (v.availableCbm <= 0) v.status = "Fully Booked";
    else if (v.availableCbm < v.totalCbm) v.status = "Partially Booked";
    else v.status = "Available";
    saveVehicles(list);
    return v;
  }

  /* ---------- Booking validation logic ---------- */
  function validateBooking(vehicle, cargo) {
    const checks = [];
    const reqCbm = Number(cargo.cbm) || 0;
    const reqWeight = Number(cargo.weight) || 0;

    checks.push({
      key: "cbm",
      label: "Available CBM",
      detail: `Required ${reqCbm} CBM · Available ${vehicle.availableCbm} CBM`,
      pass: reqCbm > 0 && reqCbm <= vehicle.availableCbm,
    });
    checks.push({
      key: "weight",
      label: "Weight limit",
      detail: `Required ${reqWeight} KG · Available ${vehicle.availableWeight} KG`,
      pass: reqWeight > 0 && reqWeight <= vehicle.availableWeight,
    });
    const fromOk = vehicle.route.some((r) => r.toLowerCase() === String(cargo.from || "").toLowerCase()) ||
      vehicle.route[0].toLowerCase().includes(String(cargo.from || "").toLowerCase().slice(0, 4));
    const toOk = vehicle.route.some((r) => r.toLowerCase() === String(cargo.to || "").toLowerCase()) ||
      vehicle.route[vehicle.route.length - 1].toLowerCase().includes(String(cargo.to || "").toLowerCase().slice(0, 4));
    checks.push({
      key: "route",
      label: "Route compatibility",
      detail: formatRoute(vehicle.route),
      pass: true, // demo: allow if vehicle selected
    });
    checks.push({
      key: "cargo",
      label: "Cargo compatibility",
      detail: cargo.fragile && !vehicle.fragileSupported ? "Fragile not supported" : "Vehicle supports cargo type",
      pass: !(cargo.fragile && !vehicle.fragileSupported),
    });
    checks.push({
      key: "pickup",
      label: "Pickup timing",
      detail: `Departure ${vehicle.departureDate} ${vehicle.departureTime}`,
      pass: !cargo.pickupDate || cargo.pickupDate <= vehicle.departureDate || cargo.pickupDate === vehicle.departureDate,
    });
    checks.push({
      key: "delivery",
      label: "Delivery schedule",
      detail: `ETA ${vehicle.etaDate} ${vehicle.etaTime}`,
      pass: true,
    });
    checks.push({
      key: "temp",
      label: "Temperature requirements",
      detail: cargo.tempControlled
        ? vehicle.tempControlled
          ? "Temperature control available"
          : "Vehicle is not temperature controlled"
        : "Not required",
      pass: !cargo.tempControlled || vehicle.tempControlled,
    });
    checks.push({
      key: "hazard",
      label: "Hazardous cargo requirements",
      detail: cargo.hazardous
        ? vehicle.hazardousAllowed
          ? "Hazardous cargo allowed"
          : "Hazardous cargo not allowed"
        : "Not required",
      pass: !cargo.hazardous || vehicle.hazardousAllowed,
    });

    const allPass = checks.every((c) => c.pass);
    const occupiedCbm = +(vehicle.totalCbm - vehicle.availableCbm).toFixed(2);
    const remainingCbm = +(vehicle.availableCbm - reqCbm).toFixed(2);
    const remainingWeight = Math.max(0, vehicle.availableWeight - reqWeight);
    return {
      checks,
      allPass,
      totalCbm: vehicle.totalCbm,
      occupiedCbm,
      reqCbm,
      availableCbm: vehicle.availableCbm,
      remainingCbm: Math.max(0, remainingCbm),
      availableWeight: vehicle.availableWeight,
      remainingWeight,
    };
  }

  /* ---------- Sidebar Dynamic Renderer ---------- */
  function renderSidebar(role, activeNav) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    let brandHTML = '';
    let navLinks = [];

    if (role === "trader") {
      brandHTML = logoHTML(true);
      navLinks = [
        { nav: "dashboard", href: "dashboard.html", label: "Dashboard", icon: ICONS.dashboard },
        { nav: "search", href: "search-space.html", label: "Find Cargo Space", icon: ICONS.search },
        { nav: "bookings", href: "bookings.html", label: "My Bookings", icon: ICONS.bookings },
        { nav: "chat", href: "chat.html", label: "Messages", icon: ICONS.chat },
        { nav: "notifications", href: "notifications.html", label: "Notifications", icon: ICONS.bell },
        { nav: "profile", href: "profile.html", label: "Profile", icon: ICONS.user },
      ];
    } else if (role === "provider") {
      brandHTML = logoHTML(true);
      navLinks = [
        { nav: "dashboard", href: "dashboard.html", label: "Dashboard", icon: ICONS.dashboard },
        { nav: "vehicles", href: "vehicles.html", label: "My Vehicles", icon: ICONS.truck },
        { nav: "add-vehicle", href: "add-vehicle.html", label: "Add Vehicle", icon: ICONS.plus },
        { nav: "availability", href: "availability.html", label: "Availability", icon: ICONS.chart },
        { nav: "bookings", href: "bookings.html", label: "Bookings", icon: ICONS.bookings },
        { nav: "chat", href: "chat.html", label: "Messages", icon: ICONS.chat },
        { nav: "notifications", href: "notifications.html", label: "Notifications", icon: ICONS.bell },
        { nav: "profile", href: "profile.html", label: "Profile", icon: ICONS.user },
      ];
    } else if (role === "admin") {
      brandHTML = `<a href="dashboard.html" class="cs-logo cs-logo-white"><span class="cs-logo-mark">CH</span><span>Admin</span></a><div class="text-xs mt-1" style="opacity:0.6;padding-left:46px">Operations Console</div>`;
      navLinks = [
        { nav: "dashboard", href: "dashboard.html", label: "Dashboard", icon: ICONS.dashboard },
        { nav: "approvals", href: "provider-approvals.html", label: "Provider Approvals", icon: ICONS.check },
        { nav: "providers", href: "providers.html", label: "Providers", icon: ICONS.truck },
        { nav: "traders", href: "traders.html", label: "Traders", icon: ICONS.users },
        { nav: "vehicles", href: "vehicles.html", label: "Vehicles", icon: ICONS.truck },
        { nav: "bookings", href: "bookings.html", label: "Bookings", icon: ICONS.bookings },
        { nav: "reports", href: "reports.html", label: "Reports", icon: ICONS.chart },
        { nav: "settings", href: "settings.html", label: "Settings", icon: ICONS.settings },
      ];
    }

    const itemsHTML = navLinks.map(link => `
      <a class="nav-link ${link.nav === activeNav ? "active" : ""}" href="${link.href}" data-nav="${link.nav}">
        ${link.icon}
        ${link.label}
      </a>
    `).join("");

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        ${brandHTML}
      </div>
      <nav class="sidebar-nav">
        ${itemsHTML}
      </nav>
      <div class="sidebar-footer">
        <button class="nav-link w-full" type="button" onclick="CS.logout('../index.html')">
          ${ICONS.logout}
          Logout
        </button>
      </div>
    `;
  }

  /* ---------- Icons (inline SVG helpers) ---------- */
  const ICONS = {
    dashboard:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M4 5h7v7H4V5zm9 0h7v5h-7V5zM4 14h7v5H4v-5zm9 2h7v3h-7v-3z"/></svg>',
    search:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke-width="2"/><path stroke-width="2" d="M20 20l-3-3"/></svg>',
    bookings:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M8 7h8M8 11h8M8 15h5M6 3h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z"/></svg>',
    chat:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M8 10h8M8 14h5M21 12a9 9 0 11-3.5-7.1L21 5v7z"/></svg>',
    bell:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"/></svg>',
    user:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0"/></svg>',
    truck:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7V10zM7 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
    plus:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M12 5v14M5 12h14"/></svg>',
    calendar:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke-width="2"/><path stroke-width="2" d="M3 10h18M8 3v4M16 3v4"/></svg>',
    logout:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M15 12H4m0 0l3-3m-3 3l3 3m5-10h5a2 2 0 012 2v12a2 2 0 01-2 2h-5"/></svg>',
    users:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    chart:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M4 19V5m0 14h16M8 17V10m5 7V7m5 10v-4"/></svg>',
    settings:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path stroke-width="2" d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    check:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>',
  };

  function logoHTML(white) {
    return (
      '<a href="../index.html" class="cs-logo' +
      (white ? " cs-logo-white" : "") +
      '"><span class="cs-logo-mark">CH</span><span>CargoHive</span></a>'
    );
  }

  /* ---------- Init ---------- */
  ensureSeed();

  global.CS = {
    STORAGE_KEYS,
    DEMO_ADMIN,
    SEED_PROVIDERS,
    SEED_TRADERS,
    SEED_VEHICLES,
    ensureSeed,
    getJSON,
    setJSON,
    getSession,
    setSession,
    clearSession,
    requireRole,
    logout,
    formatINR,
    formatRoute,
    greeting,
    uid,
    bookingId,
    txnId,
    toast,
    openModal,
    closeModal,
    statusBadge,
    initSidebar,
    setActiveNav,
    isEmail,
    isPhone,
    validateRequired,
    getProviders,
    saveProviders,
    getTraders,
    saveTraders,
    getVehicles,
    saveVehicles,
    getBookings,
    saveBookings,
    getNotifications,
    saveNotifications,
    getChats,
    saveChats,
    getSettings,
    saveSettings,
    getVehicle,
    getBooking,
    updateVehicleCapacity,
    validateBooking,
    renderSidebar,
    ICONS,
    logoHTML,
  };
})(window);
