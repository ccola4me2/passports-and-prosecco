/* =====================================================================
   Passports & Prosecco: Deals engine
   Loads data/deals.json and renders:
     • [data-deals-app]     -> full filterable/sortable deals page
     • [data-deals-preview] -> a small "featured deals" preview (home)

   Data model (per brand): { brand, logo, featured?, deals: [ ... ] }
   Data model (per deal):  { title, description, bookingWindow,
                             sailingWindow, badge }
   The offer's expiry is derived automatically from the END of its
   bookingWindow, so deals you can no longer book are flagged "Expired".
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
  function slug(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function bookingUrl() { return (window.SITE_CONFIG && window.SITE_CONFIG.bookingUrl) || "contact.html"; }

  var MONTHS = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  // Best-effort parse of the END date from a free-text booking window such as
  // "August 1-31, 2026", "Now through December 31, 2026", "July 22 - August 31, 2026".
  // Strategy: last 4-digit year + last month name + last day number before the year.
  function parseEndDate(s) {
    if (!s) return null;
    var years = String(s).match(/\b(20\d{2})\b/g);
    if (!years) return null;
    var year = parseInt(years[years.length - 1], 10);
    var lower = String(s).toLowerCase();
    var month = -1, monthPos = -1;
    for (var name in MONTHS) {
      var pos = lower.lastIndexOf(name);
      if (pos > monthPos) { monthPos = pos; month = MONTHS[name]; }
    }
    if (month < 0) return null;
    var beforeYear = String(s).slice(0, String(s).lastIndexOf(String(year)));
    var nums = beforeYear.match(/\d{1,2}/g);
    var day = nums ? parseInt(nums[nums.length - 1], 10) : 1;
    if (day < 1 || day > 31) day = 1;
    var d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  function isExpired(deal) {
    var end = parseEndDate(deal.bookingWindow);
    return end ? end < today() : false;
  }
  function fmtDate(d) {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function isExclusive(deal) { return !!deal.badge; }

  // Where a brand's logo lives: an explicit path in the data wins; otherwise
  // the renderer looks for assets/images/brands/<brand-slug>.png automatically.
  function logoSrc(b) {
    var logo = b.logo || "";
    if (/^(assets\/|https?:|\/)/i.test(logo)) return logo;
    return "assets/images/brands/" + slug(b.brand) + ".png";
  }
  // Render a labeled placeholder box first (no broken-image flash), tagged with
  // where its logo would live so we can upgrade it once the file exists.
  function brandLogoHtml(b) {
    return '<div class="brand-logo" aria-hidden="true" data-logo-src="' + esc(logoSrc(b)) +
           '" data-brand="' + esc(b.brand) + '">' + esc(b.brand) + "<br><small>[LOGO]</small></div>";
  }
  // Quietly preload each brand's logo; if the file is present, swap the placeholder
  // for the real image. Missing files simply leave the placeholder in place.
  function upgradeLogos(scope) {
    scope.querySelectorAll(".brand-logo[data-logo-src]").forEach(function (box) {
      var src = box.getAttribute("data-logo-src");
      if (!src) return;
      var probe = new Image();
      probe.onload = function () {
        var img = document.createElement("img");
        img.className = "brand-logo-img";
        img.src = src;
        img.alt = (box.getAttribute("data-brand") || "") + " logo";
        img.loading = "lazy";
        if (box.parentNode) box.parentNode.replaceChild(img, box);
      };
      probe.src = src;
    });
  }

  function badgeHtml(deal, expired) {
    var out = "";
    if (deal.badge) {
      var cls = /cruise\s*planners/i.test(deal.badge) ? "badge--exclusive" : "badge--signature";
      out += '<span class="badge ' + cls + '">' + esc(deal.badge) + "</span>";
    }
    out += expired
      ? '<span class="badge badge--expired">Expired</span>'
      : '<span class="badge badge--live">Available now</span>';
    return out;
  }

  function dealCard(deal, brandName, showBrand) {
    var expired = isExpired(deal);
    var end = parseEndDate(deal.bookingWindow);

    var meta = "";
    if (deal.bookingWindow) meta += '<div class="row"><span class="k">Book by</span><span class="v">' + esc(deal.bookingWindow) + "</span></div>";
    if (deal.sailingWindow) meta += '<div class="row"><span class="k">Sailings</span><span class="v">' + esc(deal.sailingWindow) + "</span></div>";

    var base = bookingUrl();
    var link = base.indexOf("contact") !== -1
      ? "contact.html?deal=" + encodeURIComponent((brandName ? brandName + ": " : "") + deal.title)
      : base;
    var ctaLabel = expired ? "Ask about similar" : "Inquire Now";

    var validText = expired
      ? (end ? "Booking closed " + fmtDate(end) : "Offer expired")
      : (end ? "Book by " + fmtDate(end) : "Limited-time offer");

    return (
      '<article class="deal-card' + (expired ? " is-expired" : "") + '" data-expired="' + expired + '">' +
        (showBrand && brandName ? '<p class="deal-card__brand">' + esc(brandName) + "</p>" : "") +
        '<div class="deal-card__badges">' + badgeHtml(deal, expired) + "</div>" +
        "<h4>" + esc(deal.title) + "</h4>" +
        '<p class="deal-card__desc">' + esc(deal.description) + "</p>" +
        '<div class="deal-card__meta">' + meta + "</div>" +
        '<div class="deal-card__foot">' +
          '<span class="deal-card__valid' + (expired ? " is-expired" : "") + '">' + validText + "</span>" +
          '<a class="btn btn--primary btn--sm" href="' + esc(link) + '">' + ctaLabel + "</a>" +
        "</div>" +
      "</article>"
    );
  }

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var brands = (data && data.brands) || [];
      if (previewEl) renderPreview(previewEl, brands, data.featuredSupplier);
      if (appEl) renderApp(appEl, brands, data.weekOf);
    })
    .catch(function (err) {
      var msg = '<div class="deals-empty">We couldn\'t load the latest deals just now. Please refresh, or <a href="contact.html">contact us</a> for current offers.</div>';
      if (appEl) appEl.innerHTML = msg;
      if (previewEl) previewEl.innerHTML = msg;
      if (window.console) console.error("Deals load error:", err);
    });

  /* ---- Home preview: a few featured, live deals ------------------- */
  function renderPreview(el, brands, featuredSupplier) {
    var cards = [];
    brands.forEach(function (b) {
      (b.deals || []).forEach(function (d) {
        if (isExpired(d)) return;
        var rank = 0;
        if (b.featured || (featuredSupplier && b.brand === featuredSupplier)) rank += 4;
        if (/cruise\s*planners/i.test(d.badge || "")) rank += 2;
        else if (d.badge) rank += 1;
        cards.push({ html: dealCard(d, b.brand, true), rank: rank });
      });
    });
    cards.sort(function (a, b) { return b.rank - a.rank; });
    var top = cards.slice(0, 3).map(function (c) { return c.html; });
    el.innerHTML = top.length ? top.join("") :
      '<div class="deals-empty">Fresh deals are on the way. <a href="contact.html">Ask us</a> what\'s sailing now.</div>';
  }

  /* ---- Full deals page: filter + sort ----------------------------- */
  function renderApp(el, brands, weekOf) {
    var state = { brand: "all", sort: "brand", showExpired: false };

    var weekLabel = "";
    if (weekOf) {
      var wd = new Date(weekOf + "T00:00:00");
      if (!isNaN(wd.getTime())) weekLabel = "Deals for the week of " + fmtDate(wd) + ". Offers subject to availability and change.";
    }

    var controls =
      '<div class="deal-controls" role="group" aria-label="Filter deals by brand">' +
        '<button class="chip is-active" data-brand="all">All brands</button>' +
        brands.map(function (b) {
          return '<button class="chip" data-brand="' + esc(slug(b.brand)) + '">' + esc(b.brand) + "</button>";
        }).join("") +
        '<span class="deal-controls__spacer"></span>' +
        '<label class="deal-sort">Sort' +
          '<select data-sort>' +
            '<option value="brand">By brand</option>' +
            '<option value="exclusive">Exclusives first</option>' +
            '<option value="expiring">Expiring soonest</option>' +
          "</select>" +
        "</label>" +
        '<label class="deal-sort"><input type="checkbox" data-show-expired> Show expired</label>' +
      "</div>" +
      (weekLabel ? '<p class="deals-updated">' + weekLabel + "</p>" : "") +
      '<div data-deals-out></div>';

    el.innerHTML = controls;
    var out = el.querySelector("[data-deals-out]");

    function draw() {
      var visibleBrands = brands.filter(function (b) {
        return state.brand === "all" || slug(b.brand) === state.brand;
      });

      var html = "";
      var totalShown = 0;

      visibleBrands.forEach(function (b) {
        var deals = (b.deals || []).filter(function (d) {
          return state.showExpired ? true : !isExpired(d);
        });

        if (state.sort === "exclusive") {
          deals = deals.slice().sort(function (a, c) { return (isExclusive(c) ? 1 : 0) - (isExclusive(a) ? 1 : 0); });
        } else if (state.sort === "expiring") {
          deals = deals.slice().sort(function (a, c) {
            var da = parseEndDate(a.bookingWindow), dc = parseEndDate(c.bookingWindow);
            return (da ? da.getTime() : Infinity) - (dc ? dc.getTime() : Infinity);
          });
        }

        if (!deals.length) return;
        totalShown += deals.length;

        html +=
          '<section class="brand-block" id="brand-' + esc(slug(b.brand)) + '">' +
            '<div class="brand-block__head">' +
              brandLogoHtml(b) +
              "<h3>" + esc(b.brand) + "</h3>" +
              '<span class="brand-block__count">' + deals.length + (deals.length === 1 ? " offer" : " offers") + "</span>" +
            "</div>" +
            '<div class="deals-grid">' +
              deals.map(function (d) { return dealCard(d, b.brand); }).join("") +
            "</div>" +
          "</section>";
      });

      out.innerHTML = totalShown ? html :
        '<div class="deals-empty">No current deals in this view. Try "All brands," toggle "Show expired," or <a href="contact.html">ask us</a> for a custom quote.</div>';
      upgradeLogos(out);
    }

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
