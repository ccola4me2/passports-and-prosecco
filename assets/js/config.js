/*
 * SITE CONFIGURATION: Passports & Prosecco
 * ------------------------------------------------------------------
 * Non-technical admins: this is the one place to update contact info,
 * booking links, and social handles. Change the values inside the
 * quotes below, save, and every page updates automatically.
 * Do NOT change the words on the left (phone, email, etc.).
 * ------------------------------------------------------------------
 */
window.SITE_CONFIG = {
  brandName: "Passports & Prosecco",
  tagline: "We plan it. You live it.",
  advisors: "Brent & Shannon",
  advisorsTitle: "Your Travel Advisors",

  // --- Advisor contact details (shown in footer and on the contact page) ---
  // Edit names/phones/emails here and they update everywhere automatically.
  team: [
    {
      name: "Brent Beasley",
      phone: "561-777-9911",
      phoneLink: "tel:+15617779911",
      email: "brent.beasley@cruiseplanners.com"
    },
    {
      name: "Shannon Hamilton",
      phone: "865-256-1400",
      phoneLink: "tel:+18652561400",
      email: "shannon.hamilton@cruiseplanners.com"
    }
  ],

  // --- Booking / quote link (buttons across the site point here) ---
  // Paste your Cruise Planners booking or quote-request URL here.
  // Leave as "contact.html" to send people to the on-site contact form.
  bookingUrl: "contact.html",

  // --- GoHighLevel (LeadConnector) request form ---
  // ghlFormId: the ID from your form embed URL (.../widget/form/THIS_PART).
  // ghlCruiseFieldKey: the URL key of your "Cruise of Interest" field. It must
  // EXACTLY match the field's key in GHL for the sailing details to pre-fill.
  ghlFormId: "TS38U9Knz8aGxWE5JDUA",
  ghlCruiseFieldKey: "contact.cruise_of_interest",

  // --- Cruise Planners affiliation line (shown in footer + contact) ---
  affiliation: "An independent affiliate of Cruise Planners.",
  floridaSeller: "Fla. Seller of Travel Reg. No. TI128169",

  // --- Social links (leave "#" to hide/placeholder) ---
  social: {
    facebook: "#",
    instagram: "#",
    tiktok: "#"
  }
};
