/* CargoHive — Admin role logic */
(function () {
  "use strict";

  window.AdminApp = {
    login(email, password) {
      if (email.toLowerCase() === CS.DEMO_ADMIN.email && password === CS.DEMO_ADMIN.password) {
        CS.setSession({
          role: "admin",
          id: CS.DEMO_ADMIN.id,
          name: CS.DEMO_ADMIN.name,
          email: CS.DEMO_ADMIN.email,
        });
        CS.toast("Admin access granted", "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 400);
        return true;
      }
      CS.toast("Invalid admin credentials. Use admin@cargohive.example / admin123", "error");
      return false;
    },

    platformStats() {
      const traders = CS.getTraders();
      const providers = CS.getProviders();
      const vehicles = CS.getVehicles();
      const bookings = CS.getBookings();
      const pending = providers.filter((p) => p.status === "Pending").length;
      const activeVehicles = vehicles.filter((v) => v.status !== "Inactive").length;
      const activeBookings = bookings.filter((b) => ["Confirmed", "In Transit"].includes(b.status)).length;
      const completed = bookings.filter((b) => b.status === "Delivered").length;
      const revenue = bookings
        .filter((b) => b.paymentStatus === "Paid")
        .reduce((s, b) => s + (b.total || 0), 0);
      return {
        traders: traders.length,
        providers: providers.length,
        pending,
        activeVehicles,
        activeBookings,
        completed,
        revenue,
      };
    },

    approveProvider(id) {
      const providers = CS.getProviders();
      const p = providers.find((x) => x.id === id);
      if (!p) return;
      p.status = "Approved";
      CS.saveProviders(providers);
      const vehicles = CS.getVehicles();
      vehicles.forEach((v) => {
        if (v.providerId === id) v.verified = true;
      });
      CS.saveVehicles(vehicles);
      const notifs = CS.getNotifications();
      notifs.provider.unshift({
        id: CS.uid("n"),
        title: "Admin approved your provider account",
        body: "Your account is verified. You can publish cargo availability.",
        time: "Just now",
        read: false,
      });
      CS.saveNotifications(notifs);
      CS.toast(p.companyName + " approved", "success");
    },

    rejectProvider(id, reason) {
      const providers = CS.getProviders();
      const p = providers.find((x) => x.id === id);
      if (!p) return;
      p.status = "Rejected";
      p.rejectReason = reason || "Incomplete documentation";
      CS.saveProviders(providers);
      CS.toast(p.companyName + " rejected", "warning");
    },

    suspendProvider(id) {
      const providers = CS.getProviders();
      const p = providers.find((x) => x.id === id);
      if (!p) return;
      p.status = "Suspended";
      CS.saveProviders(providers);
      CS.toast(p.companyName + " suspended", "warning");
    },

    suspendTrader(id) {
      const traders = CS.getTraders();
      const t = traders.find((x) => x.id === id);
      if (!t) return;
      t.status = "Suspended";
      CS.saveTraders(traders);
      CS.toast(t.businessName + " suspended", "warning");
    },

    renderApprovals(container) {
      if (!container) return;
      const pending = CS.getProviders().filter((p) => p.status === "Pending");
      if (!pending.length) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">✓</div><p>No pending provider approvals.</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Business Type</th>
                <th>City</th>
                <th>GST</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pending
                .map(
                  (p) => `
                <tr>
                  <td class="font-semibold">${p.companyName}</td>
                  <td>${p.contactPerson}<div class="text-xs text-muted">${p.email}</div></td>
                  <td>${p.businessType}</td>
                  <td>${p.city}</td>
                  <td>${p.gst || "—"}</td>
                  <td>${p.joined}</td>
                  <td>${CS.statusBadge(p.status)}</td>
                  <td>
                    <div class="flex gap-2">
                      <button type="button" class="btn btn-secondary btn-sm" data-view-provider="${p.id}">View</button>
                      <button type="button" class="btn btn-success btn-sm" data-approve="${p.id}">Approve</button>
                      <button type="button" class="btn btn-danger btn-sm" data-reject="${p.id}">Reject</button>
                    </div>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;

      container.querySelectorAll("[data-view-provider]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.showProviderModal(btn.getAttribute("data-view-provider"));
        });
      });
      container.querySelectorAll("[data-approve]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.approveProvider(btn.getAttribute("data-approve"));
          this.renderApprovals(container);
        });
      });
      container.querySelectorAll("[data-reject]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-reject");
          document.getElementById("reject-provider-id").value = id;
          CS.openModal("reject-modal");
        });
      });
    },

    showProviderModal(id) {
      const p = CS.getProviders().find((x) => x.id === id);
      if (!p) return;
      let modal = document.getElementById("provider-view-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "provider-view-modal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3 class="modal-title" id="pvm-name">Provider Details</h3>
              <button type="button" class="modal-close-btn" onclick="CS.closeModal('provider-view-modal')">&times;</button>
            </div>
            <div class="modal-body" id="pvm-body"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="CS.closeModal('provider-view-modal')">Close</button>
            </div>
          </div>`;
        document.body.appendChild(modal);
      }
      document.getElementById("pvm-name").textContent = p.companyName;
      document.getElementById("pvm-body").innerHTML = `
        <div class="grid-2 mb-4" style="gap:14px">
          <div><div class="info-label">Contact Person</div><div class="info-value">${p.contactPerson}</div></div>
          <div><div class="info-label">Email</div><div class="info-value">${p.email}</div></div>
          <div><div class="info-label">Phone</div><div class="info-value">${p.phone}</div></div>
          <div><div class="info-label">Business Type</div><div class="info-value">${p.businessType}</div></div>
          <div><div class="info-label">GST Number</div><div class="info-value">${p.gst || "—"}</div></div>
          <div><div class="info-label">Status</div><div class="info-value">${CS.statusBadge(p.status)}</div></div>
          <div><div class="info-label">City & State</div><div class="info-value">${p.city}, ${p.state}</div></div>
          <div><div class="info-label">Registered Date</div><div class="info-value">${p.joined}</div></div>
        </div>
        <div><div class="info-label">Address</div><div class="info-value text-sm mt-1">${p.address || "—"}</div></div>
      `;
      CS.openModal("provider-view-modal");
    },

    showTraderModal(id) {
      const t = CS.getTraders().find((x) => x.id === id);
      if (!t) return;
      let modal = document.getElementById("trader-view-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "trader-view-modal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3 class="modal-title" id="tvm-name">Trader Details</h3>
              <button type="button" class="modal-close-btn" onclick="CS.closeModal('trader-view-modal')">&times;</button>
            </div>
            <div class="modal-body" id="tvm-body"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="CS.closeModal('trader-view-modal')">Close</button>
            </div>
          </div>`;
        document.body.appendChild(modal);
      }
      document.getElementById("tvm-name").textContent = t.fullName;
      document.getElementById("tvm-body").innerHTML = `
        <div class="grid-2 mb-4" style="gap:14px">
          <div><div class="info-label">Business Name</div><div class="info-value">${t.businessName}</div></div>
          <div><div class="info-label">Business Type</div><div class="info-value">${t.businessType}</div></div>
          <div><div class="info-label">Email</div><div class="info-value">${t.email}</div></div>
          <div><div class="info-label">Phone</div><div class="info-value">${t.phone}</div></div>
          <div><div class="info-label">GST</div><div class="info-value">${t.gst || "—"}</div></div>
          <div><div class="info-label">City & State</div><div class="info-value">${t.city}, ${t.state}</div></div>
          <div><div class="info-label">Status</div><div class="info-value">${CS.statusBadge(t.status)}</div></div>
          <div><div class="info-label">Joined</div><div class="info-value">${t.joined}</div></div>
        </div>
        <div><div class="info-label">Address</div><div class="info-value text-sm mt-1">${t.address || "—"}</div></div>
      `;
      CS.openModal("trader-view-modal");
    },

    renderProviders(container, filter) {
      if (!container) return;
      let list = CS.getProviders();
      if (filter && filter !== "All") list = list.filter((p) => p.status === filter);
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Business Type</th>
                <th>City</th>
                <th>Vehicles</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (p) => `
                <tr>
                  <td>
                    <div class="font-semibold">${p.companyName}</div>
                    <div class="text-xs text-muted">${p.contactPerson}</div>
                  </td>
                  <td>${p.businessType}</td>
                  <td>${p.city}</td>
                  <td>${p.vehicles || 0}</td>
                  <td>${p.rating ? p.rating + " ★" : "—"}</td>
                  <td>${CS.statusBadge(p.status)}</td>
                  <td>
                    <div class="flex gap-2" style="flex-wrap:wrap">
                      <button type="button" class="btn btn-secondary btn-sm" data-view-provider="${p.id}">View</button>
                      ${p.status === "Pending" ? `<button type="button" class="btn btn-success btn-sm" data-approve="${p.id}">Approve</button>` : ""}
                      ${p.status !== "Suspended" ? `<button type="button" class="btn btn-ghost btn-sm" data-suspend="${p.id}">Suspend</button>` : ""}
                    </div>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
      container.querySelectorAll("[data-view-provider]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.showProviderModal(btn.getAttribute("data-view-provider"));
        });
      });
      container.querySelectorAll("[data-approve]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.approveProvider(btn.getAttribute("data-approve"));
          this.renderProviders(container, filter);
        });
      });
      container.querySelectorAll("[data-suspend]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.suspendProvider(btn.getAttribute("data-suspend"));
          this.renderProviders(container, filter);
        });
      });
    },

    renderTraders(container) {
      if (!container) return;
      const list = CS.getTraders();
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Trader</th>
                <th>Business</th>
                <th>City</th>
                <th>Bookings</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (t) => `
                <tr>
                  <td>
                    <div class="font-semibold">${t.fullName}</div>
                    <div class="text-xs text-muted">${t.email}</div>
                  </td>
                  <td>${t.businessName}<div class="text-xs text-muted">${t.businessType}</div></td>
                  <td>${t.city}</td>
                  <td>${t.bookings || CS.getBookings().filter((b) => b.traderId === t.id).length}</td>
                  <td>${CS.statusBadge(t.status)}</td>
                  <td>${t.joined}</td>
                  <td>
                    <div class="flex gap-2">
                      <button type="button" class="btn btn-secondary btn-sm" data-view-trader="${t.id}">View</button>
                      ${t.status !== "Suspended" ? `<button type="button" class="btn btn-ghost btn-sm" data-suspend="${t.id}">Suspend</button>` : ""}
                    </div>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
      container.querySelectorAll("[data-view-trader]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.showTraderModal(btn.getAttribute("data-view-trader"));
        });
      });
      container.querySelectorAll("[data-suspend]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.suspendTrader(btn.getAttribute("data-suspend"));
          this.renderTraders(container);
        });
      });
    },

    renderVehicles(container, filter) {
      if (!container) return;
      let list = CS.getVehicles();
      if (filter && filter !== "All") list = list.filter((v) => v.status === filter);
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Available</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (v) => `
                <tr>
                  <td class="font-semibold">${v.vehicleNumber}</td>
                  <td>${v.providerName}</td>
                  <td>${v.vehicleType}</td>
                  <td>${v.totalCbm} CBM</td>
                  <td>${v.availableCbm} CBM</td>
                  <td>${CS.formatRoute(v.route)}</td>
                  <td>${CS.statusBadge(v.status)}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
    },

    renderBookings(container, filter) {
      if (!container) return;
      let list = CS.getBookings();
      if (filter && filter !== "All") list = list.filter((b) => b.status === filter);
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Trader</th>
                <th>Provider</th>
                <th>Route</th>
                <th>CBM</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (b) => `
                <tr>
                  <td class="font-semibold">${b.id}</td>
                  <td>${b.traderName}</td>
                  <td>${b.providerName}</td>
                  <td>${CS.formatRoute(b.route)}</td>
                  <td>${b.cbm}</td>
                  <td>${CS.formatINR(b.total)}</td>
                  <td>${b.pickupDate}</td>
                  <td>${CS.statusBadge(b.status)}</td>
                  <td><a class="btn btn-ghost btn-sm" href="booking-details.html?id=${encodeURIComponent(b.id)}">View</a></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
    },

    reportData() {
      const bookings = CS.getBookings();
      const routes = {};
      bookings.forEach((b) => {
        const key = CS.formatRoute(b.route);
        routes[key] = (routes[key] || 0) + 1;
      });
      const providers = {};
      bookings.forEach((b) => {
        providers[b.providerName] = (providers[b.providerName] || 0) + 1;
      });
      const volume = bookings.reduce((s, b) => s + (b.cbm || 0), 0);
      const revenue = bookings.filter((b) => b.paymentStatus === "Paid").reduce((s, b) => s + b.total, 0);
      return {
        totalBookings: bookings.length,
        monthly: [8, 12, 15, 18, 22, 19, bookings.length],
        months: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        routes,
        providers,
        volume,
        revenue,
      };
    },

    saveSettings(data) {
      const s = CS.getSettings();
      Object.assign(s, data);
      CS.saveSettings(s);
      CS.toast("Settings saved", "success");
    },
  };
})();
