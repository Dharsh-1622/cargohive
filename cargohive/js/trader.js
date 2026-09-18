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

    calcCbm(l, w, h) {
      const cbm = (Number(l) || 0) * (Number(w) || 0) * (Number(h) || 0);
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
  };
})();
