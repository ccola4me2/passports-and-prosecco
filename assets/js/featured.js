/* =====================================================================
   Passports & Prosecco: Featured Cruises
   Loads data/featured-cruises.json and renders spotlight cruise cards
   that deep-link to the live booking pages on the Cruise Planners
   consumer site. Also wires the "Browse all" / "All deals" buttons.
   ===================================================================== */
(function () {
  "use strict";
  var host = document.querySelector("[data-featured]");
  if (!host) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(s) {
    var d = new Date(s + "T00:00:00");
    return isNaN(d.getTime()) ? esc(s) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  fetch("data/featured-cruises.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var cruises = (data && data.cruises) || [];
      host.innerHTML = cruises.length ? cruises.map(function (c) {
        var voyage = c.nights + (c.nights === 1 ? " night" : " nights") + " · Departs " + fmtDate(c.departs);
        var badge = c.badge ? '<span class="badge badge--signature">' + esc(c.badge) + "</span>" : "";
        var photo = c.image
          ? '<div class="deal-card__photo"><img src="' + esc(c.image) + '" alt="' + esc(c.line + " " + c.ship) + '" loading="lazy" />' + badge + "</div>"
          : "";
        return (
          '<article class="deal-card deal-card--photo">' +
            photo +
            '<div class="deal-card__body">' +
              (c.image ? "" : '<div class="deal-card__badges">' + badge + "</div>") +
              '<p class="deal-card__brand">' + esc(c.line) + "</p>" +
              "<h4>" + esc(c.ship) + "</h4>" +
              '<div class="deal-card__meta">' +
                '<div class="row"><span class="k">Voyage</span><span class="v">' + esc(voyage) + "</span></div>" +
                (c.price ? '<div class="row"><span class="k">Fare</span><span class="v">' + esc(c.price) + "</span></div>" : "") +
              "</div>" +
              '<div class="deal-card__foot">' +
                '<span class="deal-card__valid">Book direct online</span>' +
                '<a class="btn btn--primary btn--sm" href="' + esc(c.url) + '" target="_blank" rel="noopener">View &amp; Book</a>' +
              "</div>" +
            "</div>" +
          "</article>"
        );
      }).join("") : '<div class="deals-empty">Featured cruises are on the way. <a href="contact.html">Ask us</a> what\'s sailing now.</div>';

      var s = document.querySelector("[data-search-url]");
      if (s && data.searchUrl) s.setAttribute("href", data.searchUrl);
      var dl = document.querySelector("[data-deals-url]");
      if (dl && data.dealsUrl) dl.setAttribute("href", data.dealsUrl);
    })
    .catch(function (err) {
      host.innerHTML = '<div class="deals-empty">We couldn\'t load featured cruises just now. Please refresh, or <a href="contact.html">contact us</a> for current options.</div>';
      if (window.console) console.error("Featured cruises load error:", err);
    });
})();
