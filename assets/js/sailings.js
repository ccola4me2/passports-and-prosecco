/* =====================================================================
   Passports & Prosecco: Sailings (Widgety, via same-origin proxy)
   Loads Royal Caribbean + Norwegian ships from /widgety/lines, then a
   selected ship's sailings from /widgety/sailings?ship=ID and renders
   them. All credentials stay server-side in the Pages Function.
   ===================================================================== */
(function () {
  "use strict";
  var app = document.querySelector("[data-sailings-app]");
  if (!app) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(s) {
    if (!s) return "";
    var d = new Date(s);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function bookingUrl() { return (window.SITE_CONFIG && window.SITE_CONFIG.bookingUrl) || "contact.html"; }

  var state = { lines: [], lineId: null, shipId: null };

  app.innerHTML =
    '<div class="sail-controls">' +
      '<div class="sail-tabs" data-line-tabs></div>' +
      '<label class="deal-sort">Ship <select data-ship-select><option>Loading…</option></select></label>' +
    '</div>' +
    '<div class="sail-controls sail-controls--search">' +
      '<input class="sail-search" type="search" placeholder="Search itineraries by destination or name…" data-sail-search aria-label="Search itineraries" />' +
      '<label class="deal-sort">Destination <select data-region-filter><option value="">All</option></select></label>' +
      '<label class="deal-sort">Departing after <input class="sail-date" type="date" data-date-filter aria-label="Departing on or after" /></label>' +
      '<span class="sail-count" data-sail-count></span>' +
    '</div>' +
    '<div data-ship-banner></div>' +
    '<div class="deals-grid" data-sailings-out><div class="deals-empty">Loading ships…</div></div>';

  var tabsEl = app.querySelector("[data-line-tabs]");
  var shipSel = app.querySelector("[data-ship-select]");
  var bannerEl = app.querySelector("[data-ship-banner]");
  var outEl = app.querySelector("[data-sailings-out]");
  var searchEl = app.querySelector("[data-sail-search]");
  var regionEl = app.querySelector("[data-region-filter]");
  var dateEl = app.querySelector("[data-date-filter]");
  var countEl = app.querySelector("[data-sail-count]");
  var allSailings = [];
  searchEl.addEventListener("input", applyFilter);
  regionEl.addEventListener("change", applyFilter);
  dateEl.addEventListener("change", applyFilter);

  function applyFilter() {
    var q = (searchEl.value || "").trim().toLowerCase();
    var region = regionEl.value;
    var after = dateEl.value ? new Date(dateEl.value + "T00:00:00") : null;
    var list = allSailings.filter(function (s) {
      var hay = (s.name || "") + " " + (s.regions || []).join(" ") + " " + (s.from || "") + " " + (s.to || "");
      var okQ = !q || hay.toLowerCase().indexOf(q) !== -1;
      var okR = !region || (s.regions || []).indexOf(region) !== -1;
      var okD = !after || (s.dateFrom && new Date(s.dateFrom) >= after);
      return okQ && okR && okD;
    });
    if (countEl) countEl.textContent = list.length + (list.length === 1 ? " sailing" : " sailings");
    outEl.innerHTML = list.length
      ? list.map(sailingCard).join("")
      : '<div class="deals-empty">No sailings match your search. Try another destination, pick a different ship, or <a href="contact.html">ask us</a> to find one.</div>';
  }

  function currentLine() {
    return state.lines.filter(function (l) { return l.id === state.lineId; })[0] || null;
  }

  function renderTabs() {
    tabsEl.innerHTML = state.lines.map(function (l) {
      return '<button class="chip' + (l.id === state.lineId ? " is-active" : "") + '" data-line="' + esc(l.id) + '">' + esc(l.title) + "</button>";
    }).join("");
    tabsEl.querySelectorAll("[data-line]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.lineId = b.getAttribute("data-line");
        renderTabs();
        renderShipOptions();
      });
    });
  }

  function renderShipOptions() {
    var line = currentLine();
    var ships = line ? line.ships : [];
    if (!ships.length) {
      shipSel.innerHTML = '<option>No ships available</option>';
      outEl.innerHTML = '<div class="deals-empty">No ships found for this line right now. <a href="contact.html">Ask us</a> what\'s sailing.</div>';
      bannerEl.innerHTML = "";
      return;
    }
    shipSel.innerHTML = ships.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + "</option>"; }).join("");
    state.shipId = ships[0].id;
    shipSel.value = state.shipId;
    loadSailings();
  }

  shipSel.addEventListener("change", function () {
    state.shipId = shipSel.value;
    loadSailings();
  });

  function sailingCard(s) {
    var meta = "";
    if (s.nights) meta += '<div class="row"><span class="k">Length</span><span class="v">' + esc(s.nights) + (s.nights === 1 ? " night" : " nights") + "</span></div>";
    if (s.dateFrom) meta += '<div class="row"><span class="k">Sails</span><span class="v">' + esc(fmtDate(s.dateFrom)) + (s.dateTo ? " to " + esc(fmtDate(s.dateTo)) : "") + "</span></div>";
    if (s.from) meta += '<div class="row"><span class="k">Departs</span><span class="v">' + esc(s.from) + (s.to && s.to !== s.from ? " to " + esc(s.to) : "") + "</span></div>";
    var regions = (s.regions || []).map(function (r) { return '<span class="badge badge--live">' + esc(r) + "</span>"; }).join("");
    var avail = s.availability ? '<span class="badge badge--signature">' + esc(String(s.availability).replace(/_/g, " ")) + "</span>" : "";
    var base = bookingUrl();
    var link = base.indexOf("contact") !== -1 ? "contact.html?deal=" + encodeURIComponent((s.ship ? s.ship + ": " : "") + s.name) : base;
    return (
      '<article class="deal-card">' +
        '<div class="deal-card__badges">' + avail + regions + "</div>" +
        (s.ship ? '<p class="deal-card__brand">' + esc(s.ship) + "</p>" : "") +
        "<h4>" + esc(s.name) + "</h4>" +
        '<div class="deal-card__meta">' + meta + "</div>" +
        '<div class="deal-card__foot">' +
          '<span class="deal-card__valid">' + (s.line ? esc(s.line) : "") + "</span>" +
          '<a class="btn btn--primary btn--sm" href="' + esc(link) + '">Inquire</a>' +
        "</div>" +
      "</article>"
    );
  }

  function loadSailings() {
    if (!state.shipId) return;
    outEl.innerHTML = '<div class="deals-empty">Loading sailings…</div>';
    bannerEl.innerHTML = "";
    fetch("/widgety/sailings?ship=" + encodeURIComponent(state.shipId), { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        if (data.ship && data.ship.image) {
          bannerEl.innerHTML = '<div class="sail-banner"><img src="' + esc(data.ship.image) + '" alt="' + esc(data.ship.title || "") + '" loading="lazy" /><span>' + esc(data.ship.title || "") + "</span></div>";
        }
        allSailings = data.sailings || [];
        var regions = {};
        allSailings.forEach(function (s) { (s.regions || []).forEach(function (r) { regions[r] = 1; }); });
        regionEl.innerHTML = '<option value="">All</option>' + Object.keys(regions).sort().map(function (r) {
          return '<option value="' + esc(r) + '">' + esc(r) + "</option>";
        }).join("");
        if (!allSailings.length) {
          if (countEl) countEl.textContent = "";
          outEl.innerHTML = '<div class="deals-empty">No upcoming sailings listed for this ship right now. <a href="contact.html">Contact us</a> and we\'ll find one.</div>';
          return;
        }
        applyFilter();
      })
      .catch(function () {
        outEl.innerHTML = '<div class="deals-empty">We couldn\'t load sailings just now. Please refresh, or <a href="contact.html">contact us</a> and we\'ll pull them for you.</div>';
      });
  }

  fetch("/widgety/lines", { headers: { Accept: "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      state.lines = (data.lines || []).filter(function (l) { return l.ships && l.ships.length; });
      if (!state.lines.length) {
        app.innerHTML = '<div class="deals-empty">Live sailings aren\'t available right now. <a href="contact.html">Contact us</a> and we\'ll search for you.</div>';
        return;
      }
      state.lineId = state.lines[0].id;
      renderTabs();
      renderShipOptions();
    })
    .catch(function () {
      app.innerHTML = '<div class="deals-empty">We couldn\'t load the cruise lines just now. Please refresh, or <a href="contact.html">contact us</a> for current sailings.</div>';
    });
})();
