/* =====================================================================
   Passports & Prosecco: Sailings (Widgety, via same-origin proxy)
   Two modes:
     • Quick Cruise Search — destination / length / line / month across
       the whole Royal Caribbean + Norwegian fleet (catalog + dates).
     • Browse by ship — pick a ship, see all its sailings.
   All credentials stay server-side in the Pages Function.
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
  function getJSON(u) { return fetch(u, { headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }

  var DESTINATIONS = [
    { label: "Any Destination", terms: null },
    { label: "Caribbean", terms: ["caribbean"] },
    { label: "Bahamas & Perfect Day", terms: ["bahamas", "perfect day", "cococay"] },
    { label: "Bermuda", terms: ["bermuda"] },
    { label: "Mexico & Baja", terms: ["mexico", "baja", "riviera maya", "cabo"] },
    { label: "Alaska", terms: ["alaska", "glacier"] },
    { label: "Europe & Mediterranean", terms: ["europe", "mediterran", "greek", "greece", "italy", "spain", "adriatic", "fjord", "british isles", "iceland", "baltic"] },
    { label: "Canada & New England", terms: ["canada", "new england"] },
    { label: "Hawaii", terms: ["hawaii", "hawaiian"] },
    { label: "Transatlantic / Repositioning", terms: ["transatlantic", "reposition"] },
    { label: "Panama Canal", terms: ["panama"] },
    { label: "Pacific Coast", terms: ["pacific coast", "west coast"] }
  ];
  var LENGTHS = [
    { label: "Any Length", min: 0, max: 999 },
    { label: "1–5 nights", min: 1, max: 5 },
    { label: "6–8 nights", min: 6, max: 8 },
    { label: "9–11 nights", min: 9, max: 11 },
    { label: "12+ nights", min: 12, max: 999 }
  ];
  var LINES = [
    { label: "All Cruise Lines", ids: ["royal-caribbean-international", "norwegian-cruise-line"] },
    { label: "Royal Caribbean International", ids: ["royal-caribbean-international"] },
    { label: "Norwegian Cruise Line", ids: ["norwegian-cruise-line"] }
  ];
  function monthOptions() {
    var opts = ['<option value="">Any Month/Year</option>'];
    var now = new Date(); now.setDate(1);
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (var i = 0; i < 20; i++) {
      var y = now.getFullYear(), m = now.getMonth();
      var val = y + "-" + ("0" + (m + 1)).slice(-2);
      opts.push('<option value="' + val + '">' + names[m] + " " + y + "</option>");
      now.setMonth(now.getMonth() + 1);
    }
    return opts.join("");
  }

  function sailingCard(s) {
    var meta = "";
    if (s.nights) meta += '<div class="row"><span class="k">Length</span><span class="v">' + esc(s.nights) + (s.nights === 1 ? " night" : " nights") + "</span></div>";
    if (s.dateFrom) meta += '<div class="row"><span class="k">Sails</span><span class="v">' + esc(fmtDate(s.dateFrom)) + (s.dateTo ? " to " + esc(fmtDate(s.dateTo)) : "") + "</span></div>";
    if (s.from) meta += '<div class="row"><span class="k">Departs</span><span class="v">' + esc(s.from) + (s.to && s.to !== s.from ? " to " + esc(s.to) : "") + "</span></div>";
    var regions = (s.regions || []).map(function (r) { return '<span class="badge badge--live">' + esc(r) + "</span>"; }).join("");
    var avail = s.availability ? '<span class="badge badge--signature">' + esc(String(s.availability).replace(/_/g, " ")) + "</span>" : "";
    var base = bookingUrl();
    var summary = [s.line, s.ship, s.name, s.dateFrom ? "departs " + fmtDate(s.dateFrom) : ""].filter(Boolean).join(" · ");
    var link = base.indexOf("contact") !== -1 ? "contact.html?cruise_of_interest=" + encodeURIComponent(summary) : base;
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
  function sortByDate(a, b) { return new Date(a.dateFrom) - new Date(b.dateFrom); }

  /* ---------- Shell: mode toggle + two panels --------------------- */
  app.innerHTML =
    '<div class="sail-modes">' +
      '<button class="chip is-active" data-mode="search">Quick Cruise Search</button>' +
      '<button class="chip" data-mode="browse">Browse by Ship</button>' +
    '</div>' +
    '<section class="sail-search-panel" data-panel="search">' +
      '<form class="cruise-search" data-search-form>' +
        '<div class="cruise-search__grid">' +
          field("Where", '<select data-f="where">' + DESTINATIONS.map(function (d, i) { return '<option value="' + i + '">' + esc(d.label) + "</option>"; }).join("") + "</select>") +
          field("Length", '<select data-f="length">' + LENGTHS.map(function (d, i) { return '<option value="' + i + '">' + esc(d.label) + "</option>"; }).join("") + "</select>") +
          field("Date", '<select data-f="date">' + monthOptions() + "</select>") +
          field("Line", '<select data-f="line">' + LINES.map(function (d, i) { return '<option value="' + i + '">' + esc(d.label) + "</option>"; }).join("") + "</select>") +
        "</div>" +
        '<button type="submit" class="btn btn--primary cruise-search__go">Search Cruises</button>' +
      "</form>" +
      '<p class="sail-note" data-search-note></p>' +
      '<div class="deals-grid" data-search-out></div>' +
    "</section>" +
    '<section class="sail-browse-panel" data-panel="browse" hidden>' +
      '<div class="sail-controls"><div class="sail-tabs" data-line-tabs></div>' +
      '<label class="deal-sort">Ship <select data-ship-select><option>Loading…</option></select></label></div>' +
      '<div data-ship-banner></div>' +
      '<div class="deals-grid" data-browse-out><div class="deals-empty">Choose a ship to see its sailings.</div></div>' +
    "</section>";

  function field(label, control) {
    return '<label class="cruise-search__field"><span>' + esc(label) + "</span>" + control + "</label>";
  }

  // Mode toggle
  app.querySelectorAll("[data-mode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-mode");
      app.querySelectorAll("[data-mode]").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      app.querySelector('[data-panel="search"]').hidden = mode !== "search";
      app.querySelector('[data-panel="browse"]').hidden = mode !== "browse";
      if (mode === "browse" && !browseInit) initBrowse();
    });
  });

  /* ---------- Quick Cruise Search --------------------------------- */
  var searchForm = app.querySelector("[data-search-form]");
  var searchOut = app.querySelector("[data-search-out]");
  var searchNote = app.querySelector("[data-search-note]");
  var catalogCache = {};

  function catalog(id) {
    if (catalogCache[id]) return Promise.resolve(catalogCache[id]);
    return getJSON("/widgety/catalog?line=" + encodeURIComponent(id)).then(function (d) { catalogCache[id] = d.items || []; return catalogCache[id]; });
  }

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var dest = DESTINATIONS[+searchForm.querySelector('[data-f="where"]').value] || DESTINATIONS[0];
    var len = LENGTHS[+searchForm.querySelector('[data-f="length"]').value] || LENGTHS[0];
    var ym = searchForm.querySelector('[data-f="date"]').value;
    var line = LINES[+searchForm.querySelector('[data-f="line"]').value] || LINES[0];

    searchNote.textContent = "";
    searchOut.innerHTML = '<div class="deals-empty">Searching sailings…</div>';

    Promise.all(line.ids.map(catalog)).then(function (lists) {
      var items = [];
      lists.forEach(function (a) { items = items.concat(a); });
      var matched = items.filter(function (it) {
        var okW = !dest.terms || dest.terms.some(function (t) { return it.name.toLowerCase().indexOf(t) !== -1; });
        var okL = (len.min === 0 && len.max === 999) || (it.nights != null && it.nights >= len.min && it.nights <= len.max);
        return okW && okL;
      });
      var total = matched.length;
      var refs = matched.slice(0, 40).map(function (it) { return it.ref; });
      if (!refs.length) { searchOut.innerHTML = emptyMsg(); return; }
      return getJSON("/widgety/dates?refs=" + encodeURIComponent(refs.join(","))).then(function (d) {
        var sailings = (d.sailings || []).filter(function (s) { return !ym || (s.dateFrom && s.dateFrom.slice(0, 7) === ym); }).sort(sortByDate);
        if (!sailings.length) { searchOut.innerHTML = emptyMsg(); return; }
        searchOut.innerHTML = sailings.map(sailingCard).join("");
        searchNote.textContent = "Showing " + sailings.length + (sailings.length === 1 ? " sailing" : " sailings") +
          (total > 40 ? " (of " + total + " matching itineraries — narrow your search to see more)" : "") + ".";
      });
    }).catch(function () {
      searchOut.innerHTML = '<div class="deals-empty">We couldn\'t run that search just now. Please try again, or <a href="contact.html">tell us what you\'re after</a>.</div>';
    });
  });
  function emptyMsg() { return '<div class="deals-empty">No sailings matched. Try a broader destination, length, or month — or <a href="contact.html">ask us</a> and we\'ll find it.</div>'; }

  /* ---------- Browse by ship -------------------------------------- */
  var browseInit = false;
  var bState = { lines: [], lineId: null, shipId: null };
  function initBrowse() {
    browseInit = true;
    var tabsEl = app.querySelector("[data-line-tabs]");
    var shipSel = app.querySelector("[data-ship-select]");
    var bannerEl = app.querySelector("[data-ship-banner]");
    var outEl = app.querySelector("[data-browse-out]");

    function currentLine() { return bState.lines.filter(function (l) { return l.id === bState.lineId; })[0] || null; }
    function renderTabs() {
      tabsEl.innerHTML = bState.lines.map(function (l) { return '<button class="chip' + (l.id === bState.lineId ? " is-active" : "") + '" data-bline="' + esc(l.id) + '">' + esc(l.title) + "</button>"; }).join("");
      tabsEl.querySelectorAll("[data-bline]").forEach(function (b) { b.addEventListener("click", function () { bState.lineId = b.getAttribute("data-bline"); renderTabs(); renderShips(); }); });
    }
    function renderShips() {
      var ships = (currentLine() || {}).ships || [];
      shipSel.innerHTML = ships.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + "</option>"; }).join("");
      if (ships.length) { bState.shipId = ships[0].id; shipSel.value = bState.shipId; loadShip(); }
    }
    shipSel.addEventListener("change", function () { bState.shipId = shipSel.value; loadShip(); });
    function loadShip() {
      if (!bState.shipId) return;
      outEl.innerHTML = '<div class="deals-empty">Loading sailings…</div>'; bannerEl.innerHTML = "";
      getJSON("/widgety/sailings?ship=" + encodeURIComponent(bState.shipId)).then(function (data) {
        if (data.ship && data.ship.image) bannerEl.innerHTML = '<div class="sail-banner"><img src="' + esc(data.ship.image) + '" alt="' + esc(data.ship.title || "") + '" loading="lazy" /><span>' + esc(data.ship.title || "") + "</span></div>";
        var sailings = (data.sailings || []).sort(sortByDate);
        outEl.innerHTML = sailings.length ? sailings.map(sailingCard).join("") : '<div class="deals-empty">No upcoming sailings listed for this ship right now. <a href="contact.html">Contact us</a>.</div>';
      }).catch(function () { outEl.innerHTML = '<div class="deals-empty">We couldn\'t load sailings. Please refresh, or <a href="contact.html">contact us</a>.</div>'; });
    }
    outEl.innerHTML = '<div class="deals-empty">Loading ships…</div>';
    getJSON("/widgety/lines").then(function (data) {
      bState.lines = (data.lines || []).filter(function (l) { return l.ships && l.ships.length; });
      if (!bState.lines.length) { outEl.innerHTML = '<div class="deals-empty">Ships aren\'t available right now.</div>'; return; }
      bState.lineId = bState.lines[0].id; renderTabs(); renderShips();
    }).catch(function () { outEl.innerHTML = '<div class="deals-empty">We couldn\'t load the ships. Please refresh.</div>'; });
  }
})();
