/* CargoHive — Provider role logic */
(function () {
  "use strict";

  window.ProviderApp = {
    login(email, password) {
      const providers = CS.getProviders();
      const user = providers.find(
        (p) => p.email.toLowerCase() === email.toLowerCase() && p.password === password
      );
      if (!user) {
        CS.toast("Invalid credentials. Try provider@gvtransport.com / provider123", "error");
        return false;
      }
      if (user.status === "Pending") {
        CS.toast("Account pending approval. Please wait for Admin verification before logging in.", "warning");
        return false;
      }
      if (user.status === "Rejected") {
        CS.toast("Registration rejected: " + (user.rejectReason || "Verification failed"), "error");
        return false;
      }
      if (user.status === "Suspended") {
        CS.toast("This provider account is currently suspended by Admin.", "error");
        return false;
      }
      CS.setSession({
        role: "provider",
        id: user.id,
        name: user.contactPerson,
        email: user.email,
        companyName: user.companyName,
        status: user.status,
      });
      CS.toast("Welcome, " + user.companyName, "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 500);
      return true;
    },

    signup(data) {
      if (!CS.isEmail(data.email)) {
        CS.toast("Enter a valid email", "error");
        return false;
      }
      if (data.password !== data.confirmPassword) {
        CS.toast("Passwords do not match", "error");
        return false;
      }
      if (data.password.length < 6) {
        CS.toast("Password must be at least 6 characters", "error");
        return false;
      }
      const providers = CS.getProviders();
      if (providers.some((p) => p.email.toLowerCase() === data.email.toLowerCase())) {
        CS.toast("Email already registered", "error");
        return false;
      }
      const user = {
        id: CS.uid("prov"),
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        businessType: data.businessType,
        gst: data.gst,
        address: data.address,
        city: data.city,
        state: data.state,
        password: data.password,
        status: "Pending",
        rating: 0,
        vehicles: 0,
        joined: new Date().toISOString().slice(0, 10),
      };
      providers.push(user);
      CS.saveProviders(providers);
      localStorage.setItem("cs_provider_signup_pending", "1");
      CS.toast("Registration submitted for Admin verification.", "success");
      return true;
    },

    myVehicles() {
      const s = CS.getSession();
      return CS.getVehicles().filter((v) => v.providerId === s.id);
    },

    myBookings() {
      const s = CS.getSession();
      return CS.getBookings().filter((b) => b.providerId === s.id);
    },

    addVehicle(data) {
      const s = CS.getSession();
      const provider = CS.getProviders().find((p) => p.id === s.id);
      if (provider && provider.status !== "Approved") {
        CS.toast("Your account must be approved before publishing vehicles.", "warning");
      }
      const route = [data.start, data.stop1, data.stop2, data.destination].filter(Boolean);
      const vehicle = {
        id: CS.uid("veh"),
        providerId: s.id,
        providerName: s.companyName,
        vehicleNumber: data.vehicleNumber,
        vehicleType: data.vehicleType,
        totalCbm: Number(data.totalCbm),
        availableCbm: Number(data.availableCbm),
        maxWeight: Number(data.maxWeight),
        availableWeight: Number(data.availableWeight),
        route,
        departureDate: data.departureDate,
        departureTime: data.departureTime,
        etaDate: data.etaDate,
        etaTime: data.etaTime,
        pricePerCbm: Number(data.pricePerCbm) || 1200,
        tempControlled: !!data.tempControlled,
        refrigerated: !!data.refrigerated,
        hazardousAllowed: !!data.hazardousAllowed,
        fragileSupported: !!data.fragileSupported,
        status:
          Number(data.availableCbm) <= 0
            ? "Fully Booked"
            : Number(data.availableCbm) < Number(data.totalCbm)
              ? "Partially Booked"
              : "Available",
        rating: 4.5,
        verified: provider ? provider.status === "Approved" : false,
      };
      const list = CS.getVehicles();
      list.unshift(vehicle);
      CS.saveVehicles(list);
      const providers = CS.getProviders();
      const p = providers.find((x) => x.id === s.id);
      if (p) {
        p.vehicles = (p.vehicles || 0) + 1;
        CS.saveProviders(providers);
      }
      CS.toast("Vehicle added successfully", "success");
      setTimeout(() => (window.location.href = "vehicles.html"), 600);
      return vehicle;
    },

    updateAvailability(vehicleId, availableCbm, availableWeight) {
      const list = CS.getVehicles();
      const v = list.find((x) => x.id === vehicleId);
      if (!v) return { ok: false };
      const bookings = this.myBookings().filter(
        (b) => b.vehicleId === vehicleId && ["Confirmed", "In Transit"].includes(b.status)
      );
      const bookedCbm = bookings.reduce((s, b) => s + b.cbm, 0);
      const newAvail = Number(availableCbm);
      const warning = newAvail < v.totalCbm - bookedCbm && bookedCbm > 0
        ? "Reducing capacity may affect existing bookings (" + bookedCbm + " CBM booked)."
        : null;
      if (newAvail > v.totalCbm) {
        CS.toast("Available CBM cannot exceed total capacity", "error");
        return { ok: false };
      }
      v.availableCbm = newAvail;
      v.availableWeight = Number(availableWeight);
      if (v.availableCbm <= 0) v.status = "Fully Booked";
      else if (v.availableCbm < v.totalCbm) v.status = "Partially Booked";
      else v.status = "Available";
      CS.saveVehicles(list);
      const notifs = CS.getNotifications();
      notifs.provider.unshift({
        id: CS.uid("n"),
        title: "Vehicle capacity updated",
        body: "Available space for " + v.vehicleNumber + " is now " + v.availableCbm + " CBM.",
        time: "Just now",
        read: false,
      });
      CS.saveNotifications(notifs);
      CS.toast("Availability updated", "success");
      return { ok: true, warning };
    },

    acceptBooking(id) {
      const bookings = CS.getBookings();
      const b = bookings.find((x) => x.id === id);
      if (!b) return;
      b.status = "Confirmed";
      CS.saveBookings(bookings);
      CS.toast("Booking accepted", "success");
    },

    rejectBooking(id) {
      const bookings = CS.getBookings();
      const b = bookings.find((x) => x.id === id);
      if (!b) return;
      b.status = "Cancelled";
      b.paymentStatus = "Refunded";
      CS.saveBookings(bookings);
      CS.updateVehicleCapacity(b.vehicleId, -b.cbm, -b.weight);
      CS.toast("Booking rejected", "warning");
    },

    renderVehicles(container) {
      const vehicles = this.myVehicles();
      // Demo: if provider has few vehicles, also show GV vehicles for demo account
      let list = vehicles;
      const s = CS.getSession();
      if (!list.length && s.email === "provider@gvtransport.com") {
        list = CS.getVehicles().filter((v) => v.providerId === "prov_gv");
      }
      if (!container) return;
      if (!list.length) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">🚛</div><p>No vehicles yet.</p><a class="btn btn-primary mt-4" href="add-vehicle.html">Add Vehicle</a></div>';
        return;
      }
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Available Space</th>
                <th>Available Weight</th>
                <th>Route</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (v) => `
                <tr>
                  <td class="font-semibold">${v.vehicleNumber}</td>
                  <td>${v.vehicleType}</td>
                  <td>${v.totalCbm} CBM</td>
                  <td>${v.availableCbm} CBM</td>
                  <td>${v.availableWeight} KG</td>
                  <td>${CS.formatRoute(v.route)}</td>
                  <td>${CS.statusBadge(v.status)}</td>
                  <td>
                    <div class="flex gap-2" style="flex-wrap:wrap">
                      <button type="button" class="btn btn-secondary btn-sm" data-view-vehicle="${v.id}">View</button>
                      <button type="button" class="btn btn-ghost btn-sm" data-edit-vehicle="${v.id}">Edit</button>
                      <a class="btn btn-outline btn-sm" href="availability.html?id=${v.id}">Manage Availability</a>
                    </div>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;

      container.querySelectorAll("[data-view-vehicle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const v = CS.getVehicle(btn.getAttribute("data-view-vehicle"));
          if (!v) return;
          const modal = document.getElementById("vehicle-view-modal");
          if (modal) {
            document.getElementById("vview-number").textContent = v.vehicleNumber;
            document.getElementById("vview-type").textContent = v.vehicleType;
            document.getElementById("vview-route").textContent = CS.formatRoute(v.route);
            document.getElementById("vview-capacity").textContent = `${v.availableCbm} / ${v.totalCbm} CBM`;
            document.getElementById("vview-weight").textContent = `${v.availableWeight} / ${v.maxWeight} KG`;
            document.getElementById("vview-departure").textContent = `${v.departureDate} ${v.departureTime}`;
            document.getElementById("vview-eta").textContent = `${v.etaDate} ${v.etaTime}`;
            document.getElementById("vview-price").textContent = `${CS.formatINR(v.pricePerCbm)} / CBM`;
            document.getElementById("vview-status").innerHTML = CS.statusBadge(v.status);
            CS.openModal("vehicle-view-modal");
          }
        });
      });

      container.querySelectorAll("[data-edit-vehicle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const v = CS.getVehicle(btn.getAttribute("data-edit-vehicle"));
          if (!v) return;
          const modal = document.getElementById("vehicle-edit-modal");
          if (modal) {
            document.getElementById("vedit-id").value = v.id;
            document.getElementById("vedit-number").value = v.vehicleNumber;
            document.getElementById("vedit-type").value = v.vehicleType;
            document.getElementById("vedit-price").value = v.pricePerCbm;
            document.getElementById("vedit-status").value = v.status;
            CS.openModal("vehicle-edit-modal");
          }
        });
      });
    },

    renderBookings(container) {
      let list = this.myBookings();
      const s = CS.getSession();
      if (!list.length && s.email === "provider@gvtransport.com") {
        list = CS.getBookings().filter((b) => b.providerId === "prov_gv");
      }
      if (!container) return;
      if (!list.length) {
        container.innerHTML = '<div class="empty-state"><p>No bookings yet.</p></div>';
        return;
      }
      container.innerHTML = list
        .map(
          (b) => `
        <div class="booking-card mb-4">
          <div class="flex-between mb-3">
            <div>
              <div class="font-bold text-navy">${b.id}</div>
              <div class="text-sm text-muted">${b.traderName} · ${b.cargoName}</div>
            </div>
            ${CS.statusBadge(b.status)}
          </div>
          <div class="grid-3 mb-4">
            <div><div class="info-label">CBM / Weight</div><div class="info-value">${b.cbm} CBM · ${b.weight} KG</div></div>
            <div><div class="info-label">Pickup → Delivery</div><div class="info-value text-sm">${b.pickupDate}</div></div>
            <div><div class="info-label">Amount</div><div class="info-value">${CS.formatINR(b.total)}</div></div>
          </div>
          <div class="flex gap-2" style="flex-wrap:wrap">
            <a class="btn btn-secondary btn-sm" href="booking-details.html?id=${encodeURIComponent(b.id)}">View Details</a>
            ${
              b.status === "Confirmed" || b.status === "Pending"
                ? `<button class="btn btn-success btn-sm" data-accept="${b.id}">Accept</button>
                   <button class="btn btn-danger btn-sm" data-reject="${b.id}">Reject</button>`
                : ""
            }
            <a class="btn btn-outline btn-sm" href="chat.html">Chat</a>
          </div>
        </div>`
        )
        .join("");

      container.querySelectorAll("[data-accept]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.acceptBooking(btn.getAttribute("data-accept"));
          this.renderBookings(container);
        });
      });
      container.querySelectorAll("[data-reject]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.rejectBooking(btn.getAttribute("data-reject"));
          this.renderBookings(container);
        });
      });
    },

    renderNotifications(container) {
      if (!container) return;
      const notifs = CS.getNotifications().provider || [];
      container.innerHTML = notifs
        .map(
          (n) => `
        <div class="notif-item ${n.read ? "" : "unread"}">
          <div class="notif-dot"></div>
          <div>
            <div class="font-semibold text-navy">${n.title}</div>
            <div class="text-sm text-muted mt-1">${n.body}</div>
            <div class="text-xs text-muted mt-2">${n.time}</div>
          </div>
        </div>`
        )
        .join("");
    },

    markAllRead() {
      const n = CS.getNotifications();
      (n.provider || []).forEach((x) => (x.read = true));
      CS.saveNotifications(n);
      CS.toast("All marked as read", "success");
    },

    renderChat(listEl, messagesEl, activeId) {
      const chats = CS.getChats().provider || [];
      const active = chats.find((c) => c.id === activeId) || chats[0];
      if (listEl) {
        listEl.innerHTML = chats
          .map(
            (c) => `
          <div class="chat-list-item ${active && c.id === active.id ? "active" : ""}" data-id="${c.id}">
            <div class="flex-center gap-3">
              <div class="avatar avatar-sm">${c.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div class="font-semibold text-sm">${c.name} ${c.online ? '<span class="online-dot"></span>' : ""}</div>
                <div class="text-xs text-muted">${c.lastMsg}</div>
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
            ${m.text}<div class="msg-time">${m.time}</div>
          </div>`
          )
          .join("");
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      return active;
    },

    sendChatMessage(chatId, text) {
      const chats = CS.getChats();
      const c = (chats.provider || []).find((x) => x.id === chatId);
      if (!c || !text.trim()) return;
      const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      c.messages.push({ from: "me", text: text.trim(), time });
      c.lastMsg = text.trim();
      CS.saveChats(chats);
    },

    updateProfile(data) {
      const s = CS.getSession();
      const providers = CS.getProviders();
      const p = providers.find((x) => x.id === s.id);
      if (!p) return false;
      Object.assign(p, data);
      CS.saveProviders(providers);
      s.name = p.contactPerson;
      s.companyName = p.companyName;
      CS.setSession(s);
      CS.toast("Profile updated", "success");
      return true;
    },

    capacityStats() {
      const vehicles = this.myVehicles();
      let list = vehicles;
      const s = CS.getSession();
      if (!list.length && s.email === "provider@gvtransport.com") {
        list = CS.getVehicles().filter((v) => v.providerId === "prov_gv");
      }
      const total = list.reduce((a, v) => a + v.totalCbm, 0);
      const available = list.reduce((a, v) => a + v.availableCbm, 0);
      const occupied = total - available;
      return { total, available, occupied, count: list.length, vehicles: list };
    },
  };
})();
