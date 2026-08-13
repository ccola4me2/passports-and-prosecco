/* =====================================================================
   Passports & Prosecco: GoHighLevel (LeadConnector) request form
   Embeds the GHL form into any [data-ghl-form] element and pre-fills the
   "Cruise of Interest" field from the page URL, so a sailing/deal the
   visitor clicked "Inquire" on arrives already filled in.

   Form ID + field key live in assets/js/config.js (ghlFormId,
   ghlCruiseFieldKey). The field key MUST match your GHL field's key.
   ===================================================================== */
(function () {
  "use strict";
  var host = document.querySelector("[data-ghl-form]");
  if (!host) return;

  var cfg = window.SITE_CONFIG || {};
  var formId = cfg.ghlFormId;
  if (!formId) { host.innerHTML = '<p class="form__note">Request form is not configured yet.</p>'; return; }
  var fieldKey = cfg.ghlCruiseFieldKey || "cruise_of_interest";

  // Pull the cruise summary passed from an "Inquire" button.
  var params = new URLSearchParams(location.search);
  var cruise = params.get("cruise_of_interest") || params.get("cruise") || params.get("deal") || "";

  var base = "https://api.leadconnectorhq.com/widget/form/" + encodeURIComponent(formId);
  var qs = new URLSearchParams();
  if (cruise) qs.set(fieldKey, cruise);
  // Forward common contact params too, if present.
  ["name", "first_name", "last_name", "email", "phone"].forEach(function (k) {
    var v = params.get(k);
    if (v) qs.set(k, v);
  });
  var src = base + (qs.toString() ? "?" + qs.toString() : "");

  host.innerHTML = "";
  var iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.id = "inline-" + formId;
  iframe.title = "Request a Quote";
  iframe.setAttribute("data-layout", "{'id':'INLINE'}");
  iframe.setAttribute("data-form-id", formId);
  iframe.setAttribute("data-form-name", "Request");
  iframe.style.cssText = "width:100%;min-height:720px;border:none;border-radius:12px;background:#fff;";
  host.appendChild(iframe);

  if (!document.querySelector('script[data-ghl-embed]')) {
    var s = document.createElement("script");
    s.src = "https://link.msgsndr.com/js/form_embed.js";
    s.async = true;
    s.setAttribute("data-ghl-embed", "1");
    document.body.appendChild(s);
  }
})();
