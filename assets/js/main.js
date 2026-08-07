/* =====================================================================
   Passports & Prosecco: Shared site behavior
   - Injects contact/booking/social values from config.js
   - Mobile nav toggle, active link, scroll reveal, footer year
   - Contact form (front-end validation + friendly confirmation)
   ===================================================================== */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};

  /* ---- 1. Populate config-driven placeholders ---------------------- */
  function setText(sel, value) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (value) el.textContent = value;
    });
  }
  function setAttr(sel, attr, value) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (value) el.setAttribute(attr, value);
    });
  }

  setText("[data-cfg='advisors']", cfg.advisors);
  setText("[data-cfg='affiliation']", cfg.affiliation);
  setText("[data-cfg='floridaSeller']", cfg.floridaSeller);
  setAttr("[data-cfg-href='booking']", "href", cfg.bookingUrl);

  // Render the advisor team (name + phone + email) into any [data-advisors] block.
  var team = cfg.team || [];
  document.querySelectorAll("[data-advisors]").forEach(function (host) {
    host.textContent = "";
    team.forEach(function (a) {
      var wrap = document.createElement("div");
      wrap.className = "advisor";
      var name = document.createElement("p");
      name.className = "advisor__name";
      name.textContent = a.name;
      wrap.appendChild(name);
      if (a.phone) {
        var tel = document.createElement("a");
        tel.className = "advisor__link";
        tel.href = a.phoneLink || ("tel:" + a.phone.replace(/[^0-9+]/g, ""));
        tel.textContent = a.phone;
        wrap.appendChild(tel);
      }
      if (a.email) {
        var mail = document.createElement("a");
        mail.className = "advisor__link";
        mail.href = "mailto:" + a.email;
        mail.textContent = a.email;
        wrap.appendChild(mail);
      }
      host.appendChild(wrap);
    });
  });

  if (cfg.social) {
    Object.keys(cfg.social).forEach(function (key) {
      var url = cfg.social[key];
      document.querySelectorAll("[data-social='" + key + "']").forEach(function (el) {
        if (url && url !== "#") {
          el.setAttribute("href", url);
        } else {
          el.setAttribute("href", "#");
          el.setAttribute("aria-disabled", "true");
          el.setAttribute("title", "Link coming soon");
        }
      });
    });
  }

  /* ---- 2. Mobile nav ---------------------------------------------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { header.classList.remove("nav-open"); });
    });
  }

  /* ---- 3. Active nav link ------------------------------------------ */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (a) {
    var target = a.getAttribute("href");
    if (target === here || (here === "" && target === "index.html")) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---- 4. Footer year --------------------------------------------- */
  setText("[data-year]", String(new Date().getFullYear()));

  /* ---- 5. Scroll reveal ------------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- 6. Contact form -------------------------------------------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    // Pre-fill travel interest if arriving from a deal link (?deal=… or ?interest=…)
    var params = new URLSearchParams(location.search);
    var interest = params.get("interest") || params.get("deal");
    if (interest) {
      var msg = form.querySelector("#cf-message");
      if (msg && !msg.value) msg.value = "I'm interested in this deal: " + interest;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var success = document.querySelector("#contact-success");
      // NOTE: No backend is wired up yet. This shows a friendly confirmation.
      // See README > "Wiring up the contact form" to connect Formspree/email.
      if (success) {
        success.style.display = "block";
        success.setAttribute("role", "status");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }
})();
