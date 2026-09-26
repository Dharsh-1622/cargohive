/* CargoHive — Trader role logic */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function draftKey(k) {
    return "cs_trader_draft_" + k;
  }

  window.TraderApp = {
    login(email, password, remember) {
      const traders = CS.getTraders();
      const user = traders.find(
        (t) => t.email.toLowerCase() === email.toLowerCase() && t.password === password
      );
      if (!user) {
        CS.toast("Invalid email or password. Try trader@cargohive.example / trader123", "error");
        return false;
      }
      CS.setSession({
        role: "trader",
        id: user.id,
        name: user.fullName,
        email: user.email,
        businessName: user.businessName,
        remember: !!remember,
      });
      CS.toast("Welcome back, " + user.fullName.split(" ")[0] + "!", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 500);
      return true;
    },

    signup(data) {
      if (!CS.isEmail(data.email)) {
        CS.toast("Enter a valid email address", "error");
        return false;
      }
      if (data.password.length < 6) {
        CS.toast("Password must be at least 6 characters", "error");
        return false;
      }
      if (data.password !== data.confirmPassword) {
        CS.toast("Passwords do not match", "error");
        return false;
      }
      const traders = CS.getTraders();
      if (traders.some((t) => t.email.toLowerCase() === data.email.toLowerCase())) {
        CS.toast("An account with this email already exists", "error");
        return false;
      }
      const user = {
        id: CS.uid("tr"),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        businessName: data.businessName,
        businessType: data.businessType,
        gst: data.gst || "",
        address: data.address,
        city: data.city,
        state: data.state,
        password: data.password,
        status: "Active",
        bookings: 0,
        joined: new Date().toISOString().slice(0, 10),
      };
      traders.push(user);
      CS.saveTraders(traders);
      CS.setSession({
        role: "trader",
        id: user.id,
        name: user.fullName,
        email: user.email,
        businessName: user.businessName,
      });
      CS.toast("Account created successfully!", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 600);
      return true;
    },

    renderAvailableSpaces(container, limit) {
      if (!container) return;
      let vehicles = CS.getVehicles().filter(
        (v) => v.verified && v.status !== "Fully Booked" && v.status !== "Inactive" && v.availableCbm > 0
      );
      if (limit) vehicles = vehicles.slice(0, limit);
      if (!vehicles.length) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No cargo space available right now.</p></div>';
        return;
      }
      container.innerHTML = vehicles.map((v) => this.vehicleCardHTML(v)).join("");
    },

    vehicleCardHTML(v) {
      const occupied = v.totalCbm - v.availableCbm;
      const pct = Math.round((occupied / v.totalCbm) * 100);
      return `
        <div class="vehicle-card">
          <div class="flex-between mb-3">
            <div>
              <div class="flex-center gap-2">
                <strong class="text-navy">${v.providerName}</strong>
                ${v.verified ? '<span class="badge badge-verified">Verified ✓</span>' : ""}
              </div>
              <div class="text-sm text-muted mt-1">${v.vehicleType} · ${v.vehicleNumber}</div>
            </div>
            <div class="text-right">
              <div class="price-tag">${CS.formatINR(v.pricePerCbm)}</div>
              <div class="text-xs text-muted">/ CBM</div>
            </div>
          </div>
          <div class="route-line mb-3">
            ${v.route
              .map(
                (r, i) =>
                  `<span class="route-dot"></span><span>${r}</span>${
                    i < v.route.length - 1 ? '<span class="route-arrow">→</span>' : ""
                  }`
              )
              .join("")}
          </div>
          <div class="grid-3 mb-3" style="gap:12px">
            <div><div class="info-label">Available</div><div class="info-value">${v.availableCbm} CBM</div></div>
            <div><div class="info-label">Weight</div><div class="info-value">${v.availableWeight} KG</div></div>
            <div><div class="info-label">Rating</div><div class="info-value stars">${v.rating} ★</div></div>
          </div>
          <div class="capacity-bar mb-2"><div class="capacity-filled" style="width:${pct}%"></div></div>
          <div class="flex-between text-xs text-muted mb-4">
            <span>Occupied ${occupied} CBM</span>
            <span>Dep ${v.departureDate} ${v.departureTime} · ETA ${v.etaTime}</span>
          </div>
          <div class="flex gap-2">
            <a class="btn btn-secondary btn-sm" href="vehicle-details.html?id=${v.id}">View Details</a>
            <a class="btn btn-primary btn-sm" href="cargo-details.html?vehicle=${v.id}">Book Space</a>
          </div>
        </div>`;
    },

    searchVehicles(filters) {
      return CS.getVehicles().filter((v) => {
        if (!v.verified || v.status === "Inactive") return false;
        if (filters.from) {
          const f = filters.from.toLowerCase();
          if (!v.route.some((r) => r.toLowerCase().includes(f))) return false;
        }
        if (filters.to) {
          const t = filters.to.toLowerCase();
          if (!v.route.some((r) => r.toLowerCase().includes(t))) return false;
        }
        if (filters.cbm && v.availableCbm < Number(filters.cbm)) return false;
        if (filters.weight && v.availableWeight < Number(filters.weight)) return false;
        if (filters.minWeight && v.availableWeight < Number(filters.minWeight)) return false;
        if (filters.vehicleType && filters.vehicleType !== "All" && v.vehicleType !== filters.vehicleType)
          return false;
        if (filters.verifiedOnly && !v.verified) return false;
        if (filters.temp && !v.tempControlled) return false;
        if (filters.fragile && !v.fragileSupported) return false;
        if (filters.maxPrice && v.pricePerCbm > Number(filters.maxPrice)) return false;
        if (filters.departureTime && filters.departureTime !== "All") {
          const hour = parseInt(v.departureTime, 10);
          if (filters.departureTime === "Morning" && (hour < 5 || hour >= 12)) return false;
          if (filters.departureTime === "Afternoon" && (hour < 12 || hour >= 17)) return false;
          if (filters.departureTime === "Evening" && (hour < 17 || hour >= 21)) return false;
          if (filters.departureTime === "Night" && (hour < 21 && hour >= 5)) return false;
        }
        return true;
      });
    },

    saveCargoDraft(data) {
      localStorage.setItem(draftKey("cargo"), JSON.stringify(data));
    },
    getCargoDraft() {
      try {
        return JSON.parse(localStorage.getItem(draftKey("cargo")) || "null");
      } catch {
        return null;
      }
    },
    savePendingBooking(data) {
      localStorage.setItem(draftKey("pending"), JSON.stringify(data));
    },
    getPendingBooking() {
      try {
        return JSON.parse(localStorage.getItem(draftKey("pending")) || "null");
      } catch {
        return null;
      }
    },
    clearPendingBooking() {
      localStorage.removeItem(draftKey("pending"));
      localStorage.removeItem(draftKey("cargo"));
    },

    calcCbm(l, w, h, qty) {
      const q = Number(qty) > 0 ? Number(qty) : 1;
      const cbm = (Number(l) || 0) * (Number(w) || 0) * (Number(h) || 0) * q;
      return Math.round(cbm * 1000) / 1000;
    },

    createBookingFromPending() {
      const pending = this.getPendingBooking();
      const session = CS.getSession();
      if (!pending || !session) return null;
      const vehicle = CS.getVehicle(pending.vehicleId);
      if (!vehicle) return null;

      const settings = CS.getSettings();
      const base = pending.cbm * vehicle.pricePerCbm;
      const fee = Math.round(base * ((settings.serviceFeePercent || 10) / 100));
      const total = base + fee;

      const booking = {
        id: CS.bookingId(),
        traderId: session.id,
        traderName: session.businessName || session.name,
        providerId: vehicle.providerId,
        providerName: vehicle.providerName,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        route: vehicle.route,
        cargoName: pending.cargoName,
        cargoCategory: pending.cargoCategory,
        cbm: pending.cbm,
        weight: pending.weight,
        amount: base,
        serviceFee: fee,
        total: total,
        pickup: pending.pickup,
        delivery: pending.delivery,
        pickupDate: pending.pickupDate,
        deliveryDate: pending.deliveryDate || vehicle.etaDate,
        status: "Confirmed",
        paymentStatus: "Paid",
        paymentMethod: pending.paymentMethod || "UPI",
        txnId: CS.txnId(),
        fragile: !!pending.fragile,
        tempControlled: !!pending.tempControlled,
        hazardous: !!pending.hazardous,
        createdAt: new Date().toISOString(),
        timeline: [
          { step: "Booking Confirmed", done: true, at: new Date().toLocaleString("en-IN") },
          { step: "Cargo Pickup", done: false, at: "Scheduled " + pending.pickupDate },
          { step: "In Transit", done: false, at: "" },
          { step: "Destination", done: false, at: "" },
          { step: "Delivered", done: false, at: "" },
        ],
      };

      const bookings = CS.getBookings();
      bookings.unshift(booking);
      CS.saveBookings(bookings);
      CS.updateVehicleCapacity(vehicle.id, pending.cbm, pending.weight);

      const notifs = CS.getNotifications();
      notifs.trader.unshift({
        id: CS.uid("n"),
        title: "Booking confirmed",
        body: booking.id + " with " + vehicle.providerName + " is confirmed.",
        time: "Just now",
        read: false,
        type: "success",
      });
      notifs.provider.unshift({
        id: CS.uid("n"),
        title: "New booking request",
        body: session.businessName + " booked " + pending.cbm + " CBM on " + vehicle.vehicleNumber,
        time: "Just now",
        read: false,
      });
      CS.saveNotifications(notifs);

      localStorage.setItem(draftKey("lastBooking"), JSON.stringify(booking));
      this.clearPendingBooking();
      return booking;
    },

    createBookingFromPendingWithPayment(paymentInfo) {
      paymentInfo = paymentInfo || {};
      const pending = this.getPendingBooking();
      const session = CS.getSession();
      if (!pending || !session) return null;
      const vehicle = CS.getVehicle(pending.vehicleId);
      if (!vehicle) return null;

      const settings = CS.getSettings();
      const base = pending.cbm * vehicle.pricePerCbm;
      const fee = Math.round(base * ((settings.serviceFeePercent || 10) / 100));
      const total = paymentInfo.totalAmount !== undefined ? paymentInfo.totalAmount : (base + fee);
      const advance = paymentInfo.advanceAmount !== undefined ? paymentInfo.advanceAmount : Math.round(total * 0.5);
      const remaining = paymentInfo.remainingAmount !== undefined ? paymentInfo.remainingAmount : (total - advance);

      const booking = {
        id: pending.bookingPreviewId || CS.bookingId(),
        traderId: session.id,
        traderName: session.businessName || session.name,
        providerId: vehicle.providerId,
        providerName: vehicle.providerName,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        route: vehicle.route,
        cargoName: pending.cargoName,
        cargoCategory: pending.cargoCategory,
        cbm: pending.cbm,
        weight: pending.weight,
        amount: base,
        serviceFee: fee,
        total: total,
        advanceAmount: advance,
        remainingAmount: remaining,
        amountPaid: advance,
        pickup: pending.pickup,
        delivery: pending.delivery,
        pickupDate: pending.pickupDate,
        deliveryDate: pending.deliveryDate || vehicle.etaDate,
        status: paymentInfo.status || "Confirmed",
        paymentStatus: paymentInfo.paymentStatus || "Advance Paid",
        paymentMethod: paymentInfo.paymentMethod || "Razorpay",
        txnId: paymentInfo.txnId || CS.txnId(),
        fragile: !!pending.fragile,
        tempControlled: !!pending.tempControlled,
        hazardous: !!pending.hazardous,
        createdAt: new Date().toISOString(),
        timeline: [
          { step: "Booking Confirmed", done: true, at: new Date().toLocaleString("en-IN") },
          { step: "Advance Paid (50%)", done: true, at: new Date().toLocaleString("en-IN") },
          { step: "Cargo Pickup", done: false, at: "Scheduled " + pending.pickupDate },
          { step: "In Transit", done: false, at: "" },
          { step: "Destination", done: false, at: "" },
          { step: "Delivered", done: false, at: "" },
        ],
      };

      const bookings = CS.getBookings();
      bookings.unshift(booking);
      CS.saveBookings(bookings);
      CS.updateVehicleCapacity(vehicle.id, pending.cbm, pending.weight);

      const notifs = CS.getNotifications();
      notifs.trader.unshift({
        id: CS.uid("n"),
        title: "Advance payment received",
        body: booking.id + " advance of ₹" + advance.toLocaleString("en-IN") + " paid via " + booking.paymentMethod + ". Booking confirmed!",
        time: "Just now",
        read: false,
        type: "success",
      });
      notifs.provider.unshift({
        id: CS.uid("n"),
        title: "New booking confirmed (Advance Paid)",
        body: session.businessName + " booked " + pending.cbm + " CBM on " + vehicle.vehicleNumber + ". Advance payment received.",
        time: "Just now",
        read: false,
      });
      CS.saveNotifications(notifs);

      localStorage.setItem(draftKey("lastBooking"), JSON.stringify(booking));
      this.clearPendingBooking();
      return booking;
    },

    getLastBooking() {
      try {
        return JSON.parse(localStorage.getItem(draftKey("lastBooking")) || "null");
      } catch {
        return null;
      }
    },

    renderBookings(container, filter) {
      const session = CS.getSession();
      if (!container || !session) return;
      let list = CS.getBookings().filter((b) => b.traderId === session.id);
      // also show demo bookings for demo trader if empty mix
      if (!list.length && session.email === "trader@cargohive.example") {
        list = CS.getBookings().filter((b) => b.traderId === "tr_demo");
      }
      if (filter && filter !== "All") {
        const map = {
          Upcoming: ["Confirmed"],
          Active: ["In Transit", "Confirmed"],
          Completed: ["Delivered"],
          Cancelled: ["Cancelled"],
        };
        const statuses = map[filter] || [filter];
        list = list.filter((b) => statuses.includes(b.status));
      }
      if (!list.length) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No bookings in this category.</p><a class="btn btn-primary mt-4" href="search-space.html">Find Cargo Space</a></div>';
        return;
      }
      container.innerHTML = list
        .map(
          (b) => `
        <div class="booking-card mb-4">
          <div class="flex-between mb-3">
            <div>
              <div class="font-bold text-navy">${b.id}</div>
              <div class="text-sm text-muted">${b.providerName} · ${b.cargoName}</div>
            </div>
            ${CS.statusBadge(b.status)}
          </div>
          <div class="route-line mb-3 text-sm">${CS.formatRoute(b.route)}</div>
          <div class="grid-3 mb-4">
            <div><div class="info-label">CBM</div><div class="info-value">${b.cbm}</div></div>
            <div><div class="info-label">Amount</div><div class="info-value">${CS.formatINR(b.total)}</div></div>
            <div><div class="info-label">Date</div><div class="info-value">${b.pickupDate}</div></div>
          </div>
          <div class="flex gap-2">
            <a class="btn btn-secondary btn-sm" href="booking-details.html?id=${encodeURIComponent(b.id)}">View Details</a>
            <a class="btn btn-outline btn-sm" href="chat.html">Chat</a>
          </div>
        </div>`
        )
        .join("");
    },

    renderNotifications(container) {
      if (!container) return;
      const notifs = CS.getNotifications().trader || [];
      if (!notifs.length) {
        container.innerHTML = '<div class="empty-state"><p>No notifications</p></div>';
        return;
      }
      container.innerHTML = notifs
        .map(
          (n) => `
        <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}">
          <div class="notif-dot"></div>
          <div style="flex:1">
            <div class="font-semibold text-navy">${n.title}</div>
            <div class="text-sm text-muted mt-1">${n.body}</div>
            <div class="text-xs text-muted mt-2">${n.time}</div>
          </div>
        </div>`
        )
        .join("");
    },

    markAllNotificationsRead() {
      const n = CS.getNotifications();
      (n.trader || []).forEach((x) => (x.read = true));
      CS.saveNotifications(n);
      CS.toast("All notifications marked as read", "success");
    },

    renderChat(listEl, messagesEl, activeId) {
      const chats = CS.getChats().trader || [];
      const active = chats.find((c) => c.id === activeId) || chats[0];
      if (listEl) {
        listEl.innerHTML = chats
          .map(
            (c) => `
          <div class="chat-list-item ${active && c.id === active.id ? "active" : ""}" data-id="${c.id}">
            <div class="flex-center gap-3">
              <div class="avatar avatar-sm">${c.name.slice(0, 2).toUpperCase()}</div>
              <div style="min-width:0">
                <div class="font-semibold text-sm">${c.name} ${c.online ? '<span class="online-dot"></span>' : ""}</div>
                <div class="text-xs text-muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.lastMsg}</div>
              </div>
            </div>
          </div>`
          )
          .join("");
      }
      if (messagesEl && active) {
        messagesEl.innerHTML = active.messages
          .map(
            (m) => `
          <div class="msg ${m.from === "me" ? "msg-out" : "msg-in"}">
            ${m.text}
            <div class="msg-time">${m.time}</div>
          </div>`
          )
          .join("");
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      return active;
    },

    sendChatMessage(chatId, text) {
      const chats = CS.getChats();
      const c = (chats.trader || []).find((x) => x.id === chatId);
      if (!c || !text.trim()) return;
      const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      c.messages.push({ from: "me", text: text.trim(), time });
      c.lastMsg = text.trim();
      CS.saveChats(chats);
      setTimeout(() => {
        const chats2 = CS.getChats();
        const c2 = (chats2.trader || []).find((x) => x.id === chatId);
        if (c2) {
          c2.messages.push({
            from: "them",
            text: "Thanks for your message. We'll get back shortly.",
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          });
          CS.saveChats(chats2);
          document.dispatchEvent(new CustomEvent("cs-chat-update"));
        }
      }, 900);
    },

    cancelBooking(id) {
      const bookings = CS.getBookings();
      const b = bookings.find((x) => x.id === id);
      if (!b) return;
      if (b.status === "Delivered" || b.status === "Cancelled") {
        CS.toast("This booking cannot be cancelled", "warning");
        return;
      }
      b.status = "Cancelled";
      b.paymentStatus = "Refunded";
      CS.saveBookings(bookings);
      CS.updateVehicleCapacity(b.vehicleId, -b.cbm, -b.weight);
      CS.toast("Booking cancelled. Capacity restored to provider.", "success");
    },

    updateProfile(data) {
      const session = CS.getSession();
      const traders = CS.getTraders();
      const t = traders.find((x) => x.id === session.id);
      if (!t) return false;
      Object.assign(t, data);
      CS.saveTraders(traders);
      session.name = t.fullName;
      session.businessName = t.businessName;
      CS.setSession(session);
      CS.toast("Profile updated", "success");
      return true;
    },

    changePassword(current, next, confirm) {
      const session = CS.getSession();
      const traders = CS.getTraders();
      const t = traders.find((x) => x.id === session.id);
      if (!t) return false;
      if (t.password !== current) {
        CS.toast("Current password is incorrect", "error");
        return false;
      }
      if (next.length < 6) {
        CS.toast("New password must be at least 6 characters", "error");
        return false;
      }
      if (next !== confirm) {
        CS.toast("Passwords do not match", "error");
        return false;
      }
      t.password = next;
      CS.saveTraders(traders);
      CS.toast("Password changed successfully", "success");
      return true;
    },

    /* ==================================================
       DASHBOARD ENHANCEMENT: TRADER MARKETPLACE LOGIC
       ================================================== */
    dashboardData: {
      stats: {
        activeShipments: {
          value: 2,
          label: "Active Shipments",
          meta: "Currently in transit",
          change: "1 delivery expected tomorrow",
        },
        pendingBookings: {
          value: 1,
          label: "Pending Bookings",
          meta: "Awaiting provider confirmation",
          change: "Submitted 3 hrs ago",
        },
        completedShipments: {
          value: 8,
          label: "Completed Shipments",
          meta: "Successfully delivered",
          change: "100% on-time delivery",
        },
        totalSpaceBooked: {
          value: "24 CBM",
          label: "Total Space Booked",
          meta: "Across recent shipments",
          change: "Saved ~₹18,400 via shared loads",
        },
      },

      recommendedSpaces: [
        {
          id: "veh_001",
          providerName: "GV Transport",
          verified: true,
          vehicleType: "Closed Container Truck",
          vehicleNumber: "TN-33-AB-4521",
          route: ["Erode", "Salem", "Chennai"],
          totalCbm: 10,
          availableCbm: 5,
          availableWeight: 800,
          pickupTime: "Today, 4:00 PM",
          etaDelivery: "Tomorrow, 10:00 AM",
          pricePerCbm: 850,
          status: "Available",
          rating: 4.8,
          matchScore: 92,
          matchReasons: [
            "Route matches corridor (Erode → Salem → Chennai)",
            "5 CBM free space matches partial load requirements",
            "Pickup time compatible with today's dispatch",
            "Textiles & fragile goods supported",
          ],
        },
        {
          id: "veh_kongu",
          providerName: "Kongu Logistics",
          verified: true,
          vehicleType: "Lorry",
          vehicleNumber: "TN-39-KG-5544",
          route: ["Tiruppur", "Coimbatore", "Chennai"],
          totalCbm: 14,
          availableCbm: 7,
          availableWeight: 2200,
          pickupTime: "Tomorrow, 8:00 AM",
          etaDelivery: "Tomorrow, 6:00 PM",
          pricePerCbm: 780,
          status: "Available",
          rating: 4.7,
          matchScore: 88,
          matchReasons: [
            "Direct corridor from Tiruppur textile cluster",
            "7 CBM available shared capacity",
            "Early morning pickup schedule verified",
            "Flexible loading window supported",
          ],
        },
        {
          id: "veh_002",
          providerName: "SKM Logistics",
          verified: true,
          vehicleType: "Closed Container Truck",
          vehicleNumber: "TN-39-CD-8820",
          route: ["Tiruppur", "Chennai"],
          totalCbm: 18,
          availableCbm: 12,
          availableWeight: 3200,
          pickupTime: "22 Sep, 6:30 AM",
          etaDelivery: "22 Sep, 1:00 PM",
          pricePerCbm: 1100,
          status: "Available",
          rating: 4.6,
          matchScore: 96,
          matchReasons: [
            "Express corridor direct to Chennai Port",
            "Large available shared capacity (12 CBM)",
            "Top-rated verified provider (4.6 ★)",
            "Container seal security guaranteed",
          ],
        },
        {
          id: "veh_006",
          providerName: "Kovai Cargo Movers",
          verified: true,
          vehicleType: "10 CBM Truck",
          vehicleNumber: "TN-37-KL-7788",
          route: ["Coimbatore", "Salem", "Chennai"],
          totalCbm: 10,
          availableCbm: 8,
          availableWeight: 2000,
          pickupTime: "23 Sep, 7:00 AM",
          etaDelivery: "23 Sep, 3:30 PM",
          pricePerCbm: 1250,
          status: "Available",
          rating: 4.5,
          matchScore: 84,
          matchReasons: [
            "Coimbatore industrial corridor match",
            "8 CBM available volume",
            "Fragile cargo supported",
            "Direct delivery to Ambattur / Port",
          ],
        },
      ],

      bookings: [
        {
          id: "CH-1001",
          route: "Tiruppur → Chennai",
          cbm: 2,
          pickupDate: "20 Sep 2026",
          amount: 1700,
          status: "Confirmed",
          cargoName: "Textile Products",
          providerName: "GV Transport",
        },
        {
          id: "CH-1002",
          route: "Erode → Bangalore",
          cbm: 3,
          pickupDate: "22 Sep 2026",
          amount: 2550,
          status: "Pending",
          cargoName: "Yarn Spools",
          providerName: "SKM Logistics",
        },
        {
          id: "CH-0998",
          route: "Coimbatore → Chennai",
          cbm: 4,
          pickupDate: "15 Sep 2026",
          amount: 3200,
          status: "Delivered",
          cargoName: "Engineering Components",
          providerName: "Kovai Cargo Movers",
        },
      ],

      activeShipment: {
        id: "CH-1001",
        route: "Tiruppur → Chennai",
        origin: "Tiruppur Textile Hub, Unit 4",
        destination: "Chennai Port CFS, Gate 2",
        cargoName: "Textile Products",
        cbm: 2,
        weight: 350,
        currentStatus: "In Transit",
        estimatedDelivery: "21 Sep 2026, 11:00 AM",
        providerName: "GV Transport",
        vehicleNumber: "TN-33-AB-4521",
        timeline: [
          { step: "Booking Confirmed", done: true, at: "18 Sep, 10:30 AM" },
          { step: "Pickup Scheduled", done: true, at: "19 Sep, 02:00 PM" },
          { step: "Picked Up", done: true, at: "20 Sep, 08:15 AM" },
          { step: "In Transit", done: true, active: true, at: "Departed Salem Hub · Highway ETA 21 Sep" },
          { step: "Delivered", done: false, active: false, at: "Estimated 21 Sep, 11:00 AM" },
        ],
      },

      insights: [
        {
          title: "Space Utilization",
          desc: "Your recent bookings used 24 CBM of shared capacity.",
          badge: "Smart Volume",
          icon: "📦",
        },
        {
          title: "Route Insight",
          desc: "Most of your recent shipments are on the Tiruppur → Chennai route.",
          badge: "Top Corridor",
          icon: "🛣️",
        },
        {
          title: "Booking Insight",
          desc: "2 of your recent bookings were completed using shared cargo space.",
          badge: "Cost Saver",
          icon: "💰",
        },
        {
          title: "Upcoming Action",
          desc: "Your next shipment pickup is scheduled tomorrow.",
          badge: "Action Required",
          icon: "⏰",
        },
      ],

      availableCapacity: {
        todayAvailable: "48 CBM",
        vehiclesCount: 12,
        roadTransport: "38 CBM",
        containerSpace: "10 CBM",
        roadPct: 79,
        containerPct: 21,
      },

      notifications: [
        {
          icon: "✓",
          title: "Booking CH-1001 confirmed by provider",
          time: "2 hours ago",
          type: "success",
        },
        {
          icon: "💳",
          title: "Payment received for booking CH-0998",
          time: "Yesterday",
          type: "info",
        },
        {
          icon: "🚚",
          title: "Pickup scheduled for CH-1001",
          time: "Yesterday",
          type: "info",
        },
        {
          icon: "📦",
          title: "Shipment CH-0998 marked as delivered",
          time: "3 days ago",
          type: "success",
        },
      ],

      paymentSummary: {
        pending: "₹2,550",
        paidThisMonth: "₹8,450",
        totalSpend: "₹21,700",
      },

      messages: [
        {
          name: "GV Transport",
          text: "Your pickup has been scheduled for 4:00 PM.",
          time: "10 min ago",
          unread: true,
        },
        {
          name: "Kongu Logistics",
          text: "Please confirm cargo loading details.",
          time: "1 hour ago",
          unread: false,
        },
      ],
    },

    getDashboardData() {
      // Allow dynamic overlay from localStorage if user saved custom data
      try {
        const custom = localStorage.getItem("cargoHiveDashboardData");
        if (custom) {
          return Object.assign({}, this.dashboardData, JSON.parse(custom));
        }
      } catch (e) {}
      return this.dashboardData;
    },

    initDashboard() {
      const session = CS.getSession() || { name: "Demo Trader", businessName: "DK Exports" };
      const data = this.getDashboardData();

      // 1. Header greeting, date & trader company
      const greetingEl = document.getElementById("greeting-headline");
      if (greetingEl) {
        greetingEl.textContent = `${CS.greeting()}, ${session.name ? session.name.split(" ")[0] : "Trader"} 👋`;
      }
      const companyEl = document.getElementById("trader-company-name");
      if (companyEl) {
        companyEl.textContent = session.businessName || session.name || "DK Exports";
      }
      const topbarNameEl = document.getElementById("topbar-name");
      if (topbarNameEl) {
        topbarNameEl.textContent = session.businessName || session.name || "Trader";
      }
      const dateEl = document.getElementById("current-date");
      if (dateEl) {
        const now = new Date();
        const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
        dateEl.textContent = now.toLocaleDateString("en-IN", options);
      }

      // 2. Statistics Cards
      const stats = data.stats;
      const statActive = document.getElementById("stat-active");
      if (statActive) statActive.textContent = stats.activeShipments.value;
      const statPending = document.getElementById("stat-pending");
      if (statPending) statPending.textContent = stats.pendingBookings.value;
      const statCompleted = document.getElementById("stat-completed");
      if (statCompleted) statCompleted.textContent = stats.completedShipments.value;
      const statSpace = document.getElementById("stat-space");
      if (statSpace) statSpace.textContent = stats.totalSpaceBooked.value;

      // 3. Search Widget Setup
      const searchForm = document.getElementById("dashboard-search-form");
      if (searchForm) {
        // Set default min date to today
        const dateInput = document.getElementById("dash-search-date");
        if (dateInput) {
          const todayIso = new Date().toISOString().split("T")[0];
          dateInput.min = todayIso;
        }

        searchForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const from = (document.getElementById("dash-search-from")?.value || "").trim();
          const to = (document.getElementById("dash-search-to")?.value || "").trim();
          const pickupDate = document.getElementById("dash-search-date")?.value || "";
          const cbm = (document.getElementById("dash-search-cbm")?.value || "").trim();
          const weight = (document.getElementById("dash-search-weight")?.value || "").trim();
          const cargoType = document.getElementById("dash-search-type")?.value || "";

          if (!from || !to || !cbm) {
            CS.toast("Please fill in From, To, and Required CBM", "warning");
            if (!from) document.getElementById("dash-search-from")?.focus();
            else if (!to) document.getElementById("dash-search-to")?.focus();
            else if (!cbm) document.getElementById("dash-search-cbm")?.focus();
            return;
          }

          const searchCriteria = { from, to, pickupDate, cbm, weight, cargoType };
          localStorage.setItem("cargoHiveSearch", JSON.stringify(searchCriteria));
          CS.toast("Searching available shared capacity...", "info");

          const query = new URLSearchParams({
            from,
            to,
            cbm,
            ...(pickupDate ? { pickupDate } : {}),
            ...(weight ? { weight } : {}),
            ...(cargoType ? { cargoType } : {}),
          }).toString();

          setTimeout(() => {
            window.location.href = `search-space.html?${query}`;
          }, 350);
        });
      }

      // 4. Active Shipment Rendering
      const activeShipment = data.activeShipment;
      const activeContainer = document.getElementById("active-shipment-container");
      if (activeContainer && activeShipment) {
        activeContainer.innerHTML = `
          <div class="card p-5 border-l-4 border-l-blue-600 bg-gradient-to-r from-white via-white to-blue-50/40">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  🚚
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-navy text-base">${activeShipment.id}</span>
                    <span class="badge badge-warning flex items-center gap-1">
                      <span class="pulse-indicator"></span>
                      ${activeShipment.currentStatus}
                    </span>
                  </div>
                  <div class="text-xs text-muted">Carrier: ${activeShipment.providerName} (${activeShipment.vehicleNumber})</div>
                </div>
              </div>
              <a href="booking-details.html?id=${encodeURIComponent(activeShipment.id)}" class="btn btn-outline btn-sm">
                View Shipment Details →
              </a>
            </div>

            <!-- Route & Specs summary -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 mb-5">
              <div>
                <div class="text-xs text-muted font-medium">Route Corridor</div>
                <div class="font-semibold text-navy text-sm mt-0.5">${activeShipment.route}</div>
              </div>
              <div>
                <div class="text-xs text-muted font-medium">Cargo & Space</div>
                <div class="font-semibold text-navy text-sm mt-0.5">${activeShipment.cargoName} (${activeShipment.cbm} CBM)</div>
              </div>
              <div>
                <div class="text-xs text-muted font-medium">Origin Hub</div>
                <div class="font-semibold text-navy text-sm mt-0.5 truncate" title="${activeShipment.origin}">${activeShipment.origin}</div>
              </div>
              <div>
                <div class="text-xs text-muted font-medium">Est. Delivery</div>
                <div class="font-semibold text-emerald-700 text-sm mt-0.5">${activeShipment.estimatedDelivery}</div>
              </div>
            </div>

            <!-- Visual 5-Stage Shipment Timeline -->
            <div class="mt-2">
              <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Shipment Progress Timeline</div>
              <div class="timeline-horizontal">
                ${activeShipment.timeline.map((t, idx) => `
                  <div class="timeline-step ${t.done ? "done" : ""} ${t.active ? "active" : ""}">
                    <div class="timeline-node">
                      ${t.done && !t.active ? "✓" : idx + 1}
                    </div>
                    <div class="font-semibold text-xs text-navy mt-1">${t.step}</div>
                    <div class="text-[11px] text-muted leading-tight mt-0.5">${t.at}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        `;
      }

      // 5. Recommended Cargo Space Rendering
      const recContainer = document.getElementById("recommended-spaces-container");
      if (recContainer && data.recommendedSpaces) {
        recContainer.innerHTML = data.recommendedSpaces.map((v) => {
          const occupied = v.totalCbm - v.availableCbm;
          const pct = Math.round((occupied / v.totalCbm) * 100);
          const matchClass = v.matchScore >= 90 ? "high" : "medium";

          return `
            <div class="vehicle-card flex flex-col justify-between">
              <div>
                <!-- Header with Match Indicator -->
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <strong class="text-navy font-bold text-base">${v.providerName}</strong>
                      ${v.verified ? '<span class="badge badge-verified">Verified ✓</span>' : ""}
                    </div>
                    <div class="text-xs text-muted mt-0.5">${v.vehicleType} · ${v.vehicleNumber}</div>
                  </div>
                  <div class="text-right">
                    <span class="match-badge ${matchClass}" title="Smart Compatibility Score">
                      ★ ${v.matchScore}% Match
                    </span>
                  </div>
                </div>

                <!-- Route -->
                <div class="route-line mb-3 text-sm">
                  ${v.route.map((r, i) => `
                    <span class="route-dot"></span><span>${r}</span>
                    ${i < v.route.length - 1 ? '<span class="route-arrow">→</span>' : ""}
                  `).join("")}
                </div>

                <!-- Match Reason List -->
                <div class="mb-3.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                  <div class="font-semibold flex items-center gap-1 mb-1 text-emerald-800">
                    <span>⚡ Why this is a top match:</span>
                  </div>
                  <ul class="list-disc list-inside space-y-0.5 text-[11px] text-emerald-700/90 pl-1">
                    ${v.matchReasons.map(r => `<li>${r}</li>`).join("")}
                  </ul>
                </div>

                <!-- Capacity & Price stats -->
                <div class="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 mb-3 text-center">
                  <div>
                    <div class="info-label text-[11px]">Available Space</div>
                    <div class="font-bold text-emerald-600 text-sm mt-0.5">${v.availableCbm} CBM</div>
                  </div>
                  <div>
                    <div class="info-label text-[11px]">Total Capacity</div>
                    <div class="font-bold text-navy text-sm mt-0.5">${v.totalCbm} CBM</div>
                  </div>
                  <div>
                    <div class="info-label text-[11px]">Rate / CBM</div>
                    <div class="font-bold text-blue-700 text-sm mt-0.5">${CS.formatINR(v.pricePerCbm)}</div>
                  </div>
                </div>

                <!-- Progress capacity bar -->
                <div class="capacity-bar mb-1.5"><div class="capacity-filled" style="width:${pct}%"></div></div>
                <div class="flex justify-between text-[11px] text-muted mb-3">
                  <span>${occupied} CBM Booked (${pct}%)</span>
                  <span>Dep: ${v.pickupTime}</span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2 pt-2 border-t border-slate-100">
                <a class="btn btn-secondary btn-sm flex-1 text-center" href="vehicle-details.html?id=${v.id}">View Space</a>
                <a class="btn btn-primary btn-sm flex-1 text-center" href="cargo-details.html?vehicle=${v.id}">Book Space</a>
              </div>
            </div>
          `;
        }).join("");
      }

      // 6. Recent Bookings Rendering (Table + Mobile Cards)
      const bookingsTable = document.getElementById("recent-bookings-tbody");
      const bookingsMobile = document.getElementById("recent-bookings-mobile");
      if (bookingsTable && data.bookings) {
        bookingsTable.innerHTML = data.bookings.map((b) => `
          <tr>
            <td class="font-bold text-navy whitespace-nowrap">${b.id}</td>
            <td class="font-medium text-slate-800 whitespace-nowrap">${b.route}</td>
            <td class="whitespace-nowrap"><span class="font-semibold text-blue-700">${b.cbm} CBM</span></td>
            <td class="text-slate-600 whitespace-nowrap">${b.pickupDate}</td>
            <td class="font-semibold text-navy whitespace-nowrap">${CS.formatINR(b.amount)}</td>
            <td class="whitespace-nowrap">${CS.statusBadge(b.status)}</td>
            <td class="whitespace-nowrap">
              <a href="booking-details.html?id=${encodeURIComponent(b.id)}" class="btn btn-secondary btn-sm">
                View
              </a>
            </td>
          </tr>
        `).join("");
      }
      if (bookingsMobile && data.bookings) {
        bookingsMobile.innerHTML = data.bookings.map((b) => `
          <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm mb-3">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-navy">${b.id}</span>
              ${CS.statusBadge(b.status)}
            </div>
            <div class="text-sm font-semibold text-slate-800 mb-1">${b.route}</div>
            <div class="flex justify-between text-xs text-muted mb-3">
              <span>Space: <strong>${b.cbm} CBM</strong></span>
              <span>Pickup: ${b.pickupDate}</span>
              <span class="font-bold text-navy">${CS.formatINR(b.amount)}</span>
            </div>
            <a href="booking-details.html?id=${encodeURIComponent(b.id)}" class="btn btn-secondary btn-sm btn-block text-center">
              View Booking Details
            </a>
          </div>
        `).join("");
      }

      // 7. Available Space Breakdown
      const cap = data.availableCapacity;
      const todayAvailEl = document.getElementById("cap-today-available");
      if (todayAvailEl) todayAvailEl.textContent = cap.todayAvailable;
      const vehiclesCountEl = document.getElementById("cap-vehicles-count");
      if (vehiclesCountEl) vehiclesCountEl.textContent = `${cap.vehiclesCount} matching vehicles`;
      const roadCbmEl = document.getElementById("cap-road-cbm");
      if (roadCbmEl) roadCbmEl.textContent = cap.roadTransport;
      const containerCbmEl = document.getElementById("cap-container-cbm");
      if (containerCbmEl) containerCbmEl.textContent = cap.containerSpace;

      // 8. CargoHive Platform Insights
      const insightsContainer = document.getElementById("insights-container");
      if (insightsContainer && data.insights) {
        insightsContainer.innerHTML = data.insights.map((item) => `
          <div class="insight-card">
            <div class="insight-icon">${item.icon}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-semibold text-navy text-xs">${item.title}</span>
                <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  ${item.badge}
                </span>
              </div>
              <p class="text-xs text-slate-600 m-0 leading-relaxed">${item.desc}</p>
            </div>
          </div>
        `).join("");
      }

      // 9. Recent Notifications Preview
      const notifsContainer = document.getElementById("recent-notifications-container");
      if (notifsContainer && data.notifications) {
        notifsContainer.innerHTML = data.notifications.map((n) => `
          <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
              ${n.icon}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-navy leading-snug">${n.title}</div>
              <div class="text-[11px] text-muted mt-0.5">${n.time}</div>
            </div>
          </div>
        `).join("");
      }

      // 10. Payment Summary
      const pay = data.paymentSummary;
      const payPending = document.getElementById("pay-pending");
      if (payPending) payPending.textContent = pay.pending;
      const payMonth = document.getElementById("pay-month");
      if (payMonth) payMonth.textContent = pay.paidThisMonth;
      const payTotal = document.getElementById("pay-total");
      if (payTotal) payTotal.textContent = pay.totalSpend;

      // 11. Recent Messages Preview
      const messagesContainer = document.getElementById("recent-messages-container");
      if (messagesContainer && data.messages) {
        messagesContainer.innerHTML = data.messages.map((m) => `
          <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              ${m.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-navy">${m.name}</span>
                <span class="text-[10px] text-muted">${m.time}</span>
              </div>
              <div class="text-xs text-slate-600 truncate mt-0.5">"${m.text}"</div>
            </div>
          </div>
        `).join("");
      }

      // 12. Modal CBM Calculator Setup
      this.initCbmCalculator();
    },

    initCbmCalculator() {
      const calcModal = document.getElementById("cbm-calc-modal");
      if (!calcModal) return;

      const lenInput = document.getElementById("calc-length");
      const widthInput = document.getElementById("calc-width");
      const heightInput = document.getElementById("calc-height");
      const qtyInput = document.getElementById("calc-qty");
      const resultEl = document.getElementById("calc-result-cbm");

      function updateCalc() {
        const l = parseFloat(lenInput?.value) || 0;
        const w = parseFloat(widthInput?.value) || 0;
        const h = parseFloat(heightInput?.value) || 0;
        const q = parseInt(qtyInput?.value) || 1;
        const total = TraderApp.calcCbm(l, w, h, q);
        if (resultEl) resultEl.textContent = total;
      }

      [lenInput, widthInput, heightInput, qtyInput].forEach((inp) => {
        inp?.addEventListener("input", updateCalc);
      });

      // Presets
      document.querySelectorAll(".calc-preset-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const l = btn.getAttribute("data-l");
          const w = btn.getAttribute("data-w");
          const h = btn.getAttribute("data-h");
          const q = btn.getAttribute("data-q") || "1";
          if (lenInput) lenInput.value = l;
          if (widthInput) widthInput.value = w;
          if (heightInput) heightInput.value = h;
          if (qtyInput) qtyInput.value = q;
          updateCalc();
        });
      });

      // Apply to search button
      const applyBtn = document.getElementById("calc-apply-btn");
      if (applyBtn) {
        applyBtn.addEventListener("click", () => {
          const total = parseFloat(resultEl?.textContent) || 0;
          if (total > 0) {
            const searchCbmInput = document.getElementById("dash-search-cbm");
            if (searchCbmInput) {
              searchCbmInput.value = total;
              searchCbmInput.focus();
            }
            CS.closeModal("cbm-calc-modal");
            CS.toast(`Applied ${total} CBM to your search criteria!`, "success");
            // Smoothly scroll to search form
            document.getElementById("dashboard-search-form")?.scrollIntoView({ behavior: "smooth" });
          } else {
            CS.toast("Please enter positive dimensions to calculate CBM", "warning");
          }
        });
      }
    },
  };
})();
