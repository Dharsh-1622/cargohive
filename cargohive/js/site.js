/* CargoHive — Public site helpers (navbar, footer, reveals, demos) */
(function (global) {
  "use strict";

  const LOGO_SVG =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M12 3l7 4v5.2c0 3.4-2.4 6.5-7 8.8-4.6-2.3-7-5.4-7-8.8V7l7-4z" stroke="white" stroke-width="1.6" fill="rgba(255,255,255,0.12)"/>' +
    '<path d="M8.5 12.5h7M12 9v7" stroke="white" stroke-width="1.6" stroke-linecap="round"/>' +
    '<rect x="9.2" y="10.2" width="5.6" height="4.6" rx="0.8" stroke="white" stroke-width="1.2" fill="none"/>' +
    "</svg>";

  function logoHTML(href, white) {
    return (
      '<a href="' +
      href +
      '" class="cs-logo' +
      (white ? " cs-logo-white" : "") +
      '"><span class="ch-logo-mark">' +
      LOGO_SVG +
      "</span><span>CargoHive</span></a>"
    );
  }

  function getBase() {
    const path = window.location.pathname.replace(/\\/g, "/");
    if (path.includes("/trader/") || path.includes("/provider/") || path.includes("/admin/")) return "../";
    return "";
  }

  function renderNavbar(active) {
    const base = getBase();
    const root = base || "./";
    return `
<nav class="public-nav" id="public-nav">
  <div class="public-nav-inner">
    ${logoHTML(root + "index.html", true)}
    <div class="nav-menu">
      <a href="${root}index.html" data-nav="home" class="${active === "home" ? "active" : ""}">Home</a>
      <a href="${root}about.html" data-nav="about" class="${active === "about" ? "active" : ""}">About</a>
      <a href="${root}how-it-works.html" data-nav="how" class="${active === "how" ? "active" : ""}">How It Works</a>
      <a href="${root}index.html#features" data-nav="features" class="${active === "features" ? "active" : ""}">Features</a>
      <a href="${root}contact.html" data-nav="contact" class="${active === "contact" ? "active" : ""}">Contact</a>
      <a href="${root}trader/login.html" data-nav="find">Find Space</a>
    </div>
    <div class="nav-actions">
      <a href="${root}trader/login.html" class="btn-nav-ghost desktop-only">Login</a>
      <a href="${root}trader/signup.html" class="btn btn-primary btn-sm desktop-only">Get Started</a>
      <button class="menu-burger" id="menu-burger" aria-label="Open menu" type="button">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
<div class="mobile-drawer" id="mobile-drawer">
  <a href="${root}index.html">Home</a>
  <a href="${root}about.html">About</a>
  <a href="${root}how-it-works.html">How It Works</a>
  <a href="${root}index.html#features">Features</a>
  <a href="${root}contact.html">Contact</a>
  <a href="${root}trader/login.html">Find Space</a>
  <div class="drawer-actions">
    <a href="${root}trader/login.html" class="btn btn-secondary btn-block">Login</a>
    <a href="${root}trader/signup.html" class="btn btn-primary btn-block">Get Started</a>
    <a href="${root}provider/login.html" class="btn btn-ghost btn-block">Provider Login</a>
    <a href="${root}admin/login.html" class="btn btn-ghost btn-block">Admin Login</a>
  </div>
</div>`;
  }

  function renderFooter() {
    const base = getBase();
    const root = base || "./";
    return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        ${logoHTML(root + "index.html", true)}
        <p>A digital platform for discovering, matching and booking shared cargo capacity between traders and logistics providers.</p>
      </div>
      <div class="footer-col">
        <h4>Platform</h4>
        <a href="${root}index.html">Home</a>
        <a href="${root}about.html">About</a>
        <a href="${root}how-it-works.html">How It Works</a>
        <a href="${root}index.html#features">Features</a>
        <a href="${root}trader/login.html">Find Cargo Space</a>
      </div>
      <div class="footer-col">
        <h4>For Business</h4>
        <a href="${root}trader/login.html">For Traders</a>
        <a href="${root}provider/login.html">For Logistics Providers</a>
        <a href="${root}provider/signup.html">Provider Registration</a>
        <a href="${root}admin/login.html">Admin Portal</a>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <a href="${root}contact.html">Contact</a>
        <a href="${root}contact.html">Help Center</a>
        <a href="${root}how-it-works.html">FAQs</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="${root}contact.html">Privacy Policy</a>
        <a href="${root}contact.html">Terms of Service</a>
        <a href="${root}contact.html">Booking Policy</a>
        <h4 style="margin-top:20px">Contact</h4>
        <a href="mailto:support@cargohive.example">support@cargohive.example</a>
        <span style="display:block;font-size:0.875rem;padding:5px 0;opacity:0.7">+91 XXXXX XXXXX</span>
        <span style="display:block;font-size:0.875rem;padding:5px 0;opacity:0.7">Tamil Nadu, India</span>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 CargoHive. All rights reserved. · Demo MVP</div>
      <div class="social-links">
        <a href="#" aria-label="LinkedIn">in</a>
        <a href="#" aria-label="Instagram">ig</a>
        <a href="#" aria-label="GitHub">gh</a>
      </div>
    </div>
  </div>
</footer>`;
  }

  function initPublicShell(active) {
    const navMount = document.getElementById("site-nav");
    const footerMount = document.getElementById("site-footer");
    if (navMount) navMount.innerHTML = renderNavbar(active || "home");
    if (footerMount) footerMount.innerHTML = renderFooter();

    const nav = document.getElementById("public-nav");
    const burger = document.getElementById("menu-burger");
    const drawer = document.getElementById("mobile-drawer");

    function onScroll() {
      if (!nav) return;
      nav.classList.toggle("scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && drawer) {
      burger.addEventListener("click", () => {
        burger.classList.toggle("open");
        drawer.classList.toggle("open");
      });
      drawer.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          burger.classList.remove("open");
          drawer.classList.remove("open");
        });
      });
    }

    initReveals();
  }

  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  function initCapacityDemo() {
    const btn = document.getElementById("demo-book-btn");
    if (!btn) return;
    let booked = false;
    btn.addEventListener("click", () => {
      const occ = document.getElementById("cap-occ");
      const book = document.getElementById("cap-book");
      const free = document.getElementById("cap-free");
      const label = document.getElementById("cap-result");
      if (!booked) {
        if (occ) occ.style.width = "50%";
        if (book) book.style.width = "20%";
        if (free) free.style.width = "30%";
        if (label) label.innerHTML = "<strong>After booking:</strong> 3 CBM still available on this trip.";
        btn.textContent = "Reset Demo";
        booked = true;
        if (window.CS && CS.toast) CS.toast("2 CBM reserved in the demo", "success");
      } else {
        if (occ) occ.style.width = "50%";
        if (book) book.style.width = "0%";
        if (free) free.style.width = "50%";
        if (label) label.innerHTML = "<strong>Available now:</strong> 5 CBM · Trader needs 2 CBM";
        btn.textContent = "Simulate 2 CBM Booking";
        booked = false;
      }
    });
  }

  function initHeroSearch() {
    const form = document.getElementById("hero-search-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const from = (document.getElementById("hs-from") || {}).value || "";
      const to = (document.getElementById("hs-to") || {}).value || "";
      const cbm = (document.getElementById("hs-cbm") || {}).value || "";
      try {
        localStorage.setItem(
          "ch_hero_search",
          JSON.stringify({ from, to, cbm, weight: (document.getElementById("hs-weight") || {}).value || "" })
        );
      } catch (_) {}
      window.location.href = "trader/login.html";
    });
  }

  global.CargoHiveSite = {
    initPublicShell,
    initCapacityDemo,
    initHeroSearch,
    initReveals,
    logoHTML,
    LOGO_SVG,
  };
})(window);
