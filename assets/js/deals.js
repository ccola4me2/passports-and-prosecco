/* =====================================================================
   Passports & Prosecco — Deals engine
   Loads data/deals.json and renders:
     • [data-deals-app]   → full filterable/sortable deals page
     • [data-deals-preview] → a small "featured deals" preview (home)
   Deals past their validTo date are flagged as expired automatically.
   ===================================================================== */
(function () {
  "use strict";

  var appEl = document.querySelector("[data-deals-app]");
  var previewEl = document.querySelector("[data-deals-preview]");
  if (!appEl && !previewEl) return;

  var DATA_URL = "data/deals.json";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function parseDate(s) { var d = new Date(s + "T00:00:00"); return isNaN(d) ? null : d; }
  function isExpired(deal) { var to = parseDate(deal.validTo); return to ? to < today() : false; }
  function fmtDate(s) {
    var d = parseDate(s); if (!d) return s || "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function bookingUrl() { return (window.SITE_CONFIG && window.SITE_CONFIG.bookingUrl) || "contact.html"; }

  function dealCard(deal, brandName) {
    var expired = isExpired(deal);
    var badges = "";
    if (deal.exclusive) badges += '<span class="badge badge--exclusive">Cruise Planners Exclusive</span>';
    badges += expired
      ? '<span class="badge badge--expired">Expired</span>'
      : '<span class="badge badge--live">Available now</span>';

    var meta = "";
    if (deal.cabin) meta += '<div class="row"><span class="k">Cabin</span><span class="v">' + esc(deal.cabin) + "</span></div>";
    if (deal.price) meta += '<div class="row"><span class="k">Fare</span><span class="v deal-card__price">' + esc(deal.price) + "</span></div>";

    // CTA points to the booking/contact link, carrying the deal id for context.
    var base = bookingUrl();
    var link = base.indexOf("contact") !== -1
      ? "contact.html?deal=" + encodeURIComponent(deal.id || deal.title)
      : base;
    var ctaLabel = expired ? "Ask about similar" : (deal.ctaLabel || "Inquire Now");

    return (
      '<article class="deal-card' + (expired ? " is-expired" : "") + '" data-expired="' + expired + '">' +
        '<div class="deal-card__badges">' + badges + "</div>" +
        "<h4>" + esc(deal.title) + "</h4>" +
        '<p class="deal-card__desc">' + esc(deal.description) + "</p>" +
        (deal.discount ? '<p class="deal-card__discount">' + esc(deal.discount) + "</p>" : "") +
        '<div class="deal-card__meta">' + meta + "</div>" +
        '<div class="deal-card__foot">' +
          '<span class="deal-card__valid' + (expired ? " is-expired" : "") + '">' +
            (expired ? "Expired " + fmtDate(deal.validTo) : "Valid through " + fmtDate(deal.validTo)) +
          "</span>" +
          '<a class="btn btn--primary btn--sm" href="' + esc(link) + '">' + esc(ctaLabel) + "</a>" +
        "</div>" +
      "</article>"
    );
  }

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var brands = (data && data.brands) || [];
      if (previewEl) renderPreview(previewEl, brands);
      if (appEl) renderApp(appEl, brands, data.lastUpdated);
    })
    .catch(function (err) {
      var msg = '<div class="deals-empty">We couldn\'t load the latest deals just now. Please refresh, or <a href="contact.html">contact us</a> for current offers.</div>';
      if (appEl) appEl.innerHTML = msg;
      if (previewEl) previewEl.innerHTML = msg;
      if (window.console) console.error("Deals load error:", err);
    });

  /* ---- Home preview: a few featured, live deals ------------------- */
  function renderPreview(el, brands) {
    var cards = [];
    brands.forEach(function (b) {
      (b.deals || []).forEach(function (d) {
        if (!isExpired(d)) cards.push({ html: dealCard(d, b.name), exclusive: !!d.exclusive });
      });
    });
    // Prefer exclusives first, then cap at 3.
    cards.sort(function (a, b) { return (b.exclusive ? 1 : 0) - (a.exclusive ? 1 : 0); });
    var top = cards.slice(0, 3).map(function (c) { return c.html; });
    el.innerHTML = top.length ? top.join("") :
      '<div class="deals-empty">Fresh deals are on the way. <a href="contact.html">Ask us</a> what\'s sailing now.</div>';
  }

  /* ---- Full deals page: filter + sort ----------------------------- */
  function renderApp(el, brands, lastUpdated) {
    var state = { brand: "all", sort: "brand", showExpired: false };

    var controls =
      '<div class="deal-controls" role="group" aria-label="Filter deals by brand">' +
        '<button class="chip is-active" data-brand="all">All brands</button>' +
        brands.map(function (b) {
          return '<button class="chip" data-brand="' + esc(b.id) + '">' + esc(b.name) + "</button>";
        }).join("") +
        '<span class="deal-controls__spacer"></span>' +
        '<label class="deal-sort">Sort' +
          '<select data-sort>' +
            '<option value="brand">By brand</option>' +
            '<option value="price-asc">Price: low to high</option>' +
            '<option value="expiring">Expiring soonest</option>' +
          "</select>" +
        "</label>" +
        '<label class="deal-sort"><input type="checkbox" data-show-expired> Show expired</label>' +
      "</div>" +
      (lastUpdated ? '<p class="deals-updated">Deals last updated ' + fmtDate(lastUpdated) + ". Offers subject to availability and change.</p>" : "") +
      '<div data-deals-out></div>';

    el.innerHTML = controls;
    var out = el.querySelector("[data-deals-out]");

    function priceNum(d) {
      var m = String(d.price || "").replace(/,/g, "").match(/(\d+(\.\d+)?)/);
      return m ? parseFloat(m[1]) : Number.MAX_SAFE_INTEGER;
    }

    function draw() {
      var visibleBrands = brands.filter(function (b) {
        return state.brand === "all" || b.id === state.brand;
      });

      var html = "";
      var totalShown = 0;

      visibleBrands.forEach(function (b) {
        var deals = (b.deals || []).filter(function (d) {
          return state.showExpired ? true : !isExpired(d);
        });

        if (state.sort === "price-asc") deals.sort(function (a, c) { return priceNum(a) - priceNum(c); });
        else if (state.sort === "expiring") deals.sort(function (a, c) {
          var da = parseDate(a.validTo) || 0, dc = parseDate(c.validTo) || 0; return da - dc;
        });

        if (!deals.length) return;
        totalShown += deals.length;

        html +=
          '<section class="brand-block" id="brand-' + esc(b.id) + '">' +
            '<div class="brand-block__head">' +
              '<div class="brand-logo" aria-hidden="true">' + esc(b.name) + '<br><small>[LOGO]</small></div>' +
              "<h3>" + esc(b.name) + "</h3>" +
              '<span class="brand-block__count">' + deals.length + (deals.length === 1 ? " offer" : " offers") + "</span>" +
            "</div>" +
            '<div class="deals-grid">' +
              deals.map(function (d) { return dealCard(d, b.name); }).join("") +
            "</div>" +
          "</section>";
      });

      out.innerHTML = totalShown ? html :
        '<div class="deals-empty">No current deals in this view. Try “All brands,” toggle “Show expired,” or <a href="contact.html">ask us</a> for a custom quote.</div>';
    }

    // Wire controls
    el.querySelectorAll(".chip[data-brand]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.brand = chip.getAttribute("data-brand");
        el.querySelectorAll(".chip[data-brand]").forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        draw();
      });
    });
    el.querySelector("[data-sort]").addEventListener("change", function (e) { state.sort = e.target.value; draw(); });
    el.querySelector("[data-show-expired]").addEventListener("change", function (e) { state.showExpired = e.target.checked; draw(); });

    draw();
  }
})();
