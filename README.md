# Passports &amp; Prosecco, Website

Boutique travel advisory site for **Passports &amp; Prosecco** (Brent &amp; Shannon, independent Cruise Planners advisors).

> **Tagline:** We plan it. You live it.

This is a **plain HTML / CSS / JavaScript** site, **no build step, no Node, no framework**. That's on purpose: anyone can edit a text file and the site just works. It hosts anywhere static (Cloudflare Pages, GitHub Pages, Netlify) with zero configuration.

---

## 📁 Project structure

```
passports-and-prosecco/
├── index.html          Home
├── deals.html          Weekly Deals (the core feature)
├── about.html          About Brent & Shannon
├── services.html       Service tiers + types of travel
├── contact.html        Contact form + details
├── 404.html            Friendly not-found page
├── sitemap.xml         For search engines (update domain when live)
├── robots.txt          For search engines
├── data/
│   └── deals.json      ← THE WEEKLY DEALS LIVE HERE (edit this)
└── assets/
    ├── css/styles.css  All styling
    ├── js/
    │   ├── config.js   ← CONTACT INFO & LINKS LIVE HERE (edit this)
    │   ├── main.js     Shared behavior (don't need to touch)
    │   └── deals.js    Deals engine (don't need to touch)
    └── images/
        ├── favicon.svg       Browser-tab icon (placeholder)
        ├── og-cover.svg      Social-share image (placeholder)
        └── brands/           Cruise-line logos go here
```

**The only two files you'll normally edit are `data/deals.json` and `assets/js/config.js`.**

---

## 🖊️ Updating the weekly deals

All deals live in **`data/deals.json`**. It's a structured list of **brands** (cruise lines / travel brands), and each brand has a list of **deals**. The site reads this file automatically, add, edit, or remove a deal and the Deals page and Home preview update on the next page load.

### The shape of the file

```json
{
  "weekOf": "2026-08-03",
  "featuredSupplier": "Royal Caribbean International",
  "brands": [
    {
      "brand": "Royal Caribbean International",
      "logo": "[ROYAL CARIBBEAN LOGO]",
      "featured": true,
      "deals": [
        {
          "title": "Signature Exclusive: Specialty Dining for Two",
          "description": "Receive a Specialty Dining Experience for Two on select sailings.",
          "bookingWindow": "August 1–31, 2026",
          "sailingWindow": "3+ Night Balcony & above sailings departing 10/1/26–3/31/27",
          "badge": "Signature Exclusive"
        }
      ]
    }
  ]
}
```

### Field cheat-sheet

| Field | What it does |
|-------|--------------|
| `weekOf` | The week these deals are for (`YYYY-MM-DD`). Shown at the top of the Deals page. Update it each week. |
| `featuredSupplier` | The brand name to spotlight first in the Home-page preview. Must match a `brand` below exactly. |
| **Brand** `brand` | The brand name shown on the page and used for the filter buttons (e.g. `Celebrity Cruises`). |
| **Brand** `logo` | Brand logo. A `[BRACKETED PLACEHOLDER]` shows as text until you add a real logo (see "Adding a brand logo"). |
| **Brand** `featured` | Optional `true` to prioritize this brand in the Home preview. Only put it on one brand. |
| `title` | The headline of the deal. |
| `description` | One or two sentences describing the offer. |
| `bookingWindow` | When guests can book, e.g. `"July 1 – August 31, 2026"` or `"Now through December 31, 2026"`. **The site reads the LAST date here as the expiration** — after it passes, the deal is auto-flagged "Expired" and hidden unless a visitor ticks "Show expired." Always include the year. |
| `sailingWindow` | When/what can sail, e.g. `"Select sailings through 2027"`. Free text. |
| `badge` | `"Cruise Planners Exclusive"` (navy badge), `"Signature Exclusive"` (gold badge), or `null` for no badge. |

### Common tasks

**➕ Add a new deal to an existing brand**, find that brand's `"deals": [ ... ]` list and add a new `{ ... }` block. Put a comma after the previous block:

```json
        },
        {
          "title": "New offer title",
          "description": "One sentence about the offer.",
          "bookingWindow": "Now through December 31, 2026",
          "sailingWindow": "Select sailings",
          "badge": "Cruise Planners Exclusive"
        }
```

**🆕 Add a whole new brand**, copy an entire brand block (from `{` to its matching `}`), paste it into the `"brands": [ ... ]` list, and change the `brand`, `logo`, and deals. Add a comma between brand blocks.

**✏️ Edit a deal**, change the text between the quotes. Don't remove the quotes or the commas.

**🗑️ Remove a deal**, delete its `{ ... }` block (and the comma that joins it to its neighbor). Or just let it expire, expired deals hide themselves.

> **Tip on the expiration date:** the site figures out when an offer expires from the last date written in `bookingWindow`, so keep it human-readable *with the year* — `"July 22 – August 31, 2026"`, `"Now through December 31, 2026"`, `"August 1–31, 2026"` all work. If you write a booking window with no year, that deal simply never auto-expires (it stays visible until you remove it).

### ⚠️ The one rule of JSON

Punctuation matters. Keep every `"quote"`, `,` comma, and `{ }` bracket exactly as shown. A common mistake is a **trailing comma after the last item** in a list, don't put a comma after the final `}` in a list.

**Before saving, paste the whole file into a free validator like <https://jsonlint.com>**, it will flag any typo in seconds. If the Deals page ever shows "We couldn't load the latest deals," it's almost always a punctuation slip in `deals.json`.

### Adding a brand logo

1. Save the logo (PNG or SVG) into `assets/images/brands/`, e.g. `royal-caribbean.png`.
2. In `deals.json`, set that brand's `"logo"` to `"assets/images/brands/royal-caribbean.png"`.

*(Until you add real logos, brand names simply appear as text, nothing breaks.)*

---

## ☎️ Updating contact info, booking link &amp; social

Open **`assets/js/config.js`** and edit the values inside the quotes. This one file feeds the header, footer, and contact page across the whole site.

```js
window.SITE_CONFIG = {
  phone: "[PHONE]",                 // e.g. "(555) 123-4567"
  phoneLink: "tel:+10000000000",    // e.g. "tel:+15551234567"
  email: "[EMAIL]",                 // e.g. "brent@passports-and-prosecco.com"
  bookingUrl: "contact.html",       // your Cruise Planners booking/quote URL, or leave as contact.html
  ...
  social: { facebook: "#", instagram: "#", tiktok: "#" }  // paste real profile URLs
};
```

- **`bookingUrl`**, paste your Cruise Planners quote/booking link here and every "Plan My Trip / Get a Quote" button across the site points to it. Leave it as `"contact.html"` to keep sending people to the on-site form.
- **Social links**, replace `"#"` with the full profile URL. Any left as `"#"` are treated as "coming soon."

---

## 🏷️ Swapping in the Cruise Planners logo

The logo appears in **three spots**, all marked with dashed placeholder boxes reading `[CRUISE PLANNERS LOGO]` / `[CP LOGO]`: the header, the footer, and the contact page.

1. Save the official logo to `assets/images/` (e.g. `cruise-planners-logo.png`).
2. In each HTML file, find the placeholder, search for `brand-lockup__logo` (header/footer) or `[CRUISE PLANNERS LOGO]` (contact page), and replace the placeholder `<span>…</span>` with:
   ```html
   <img src="assets/images/cruise-planners-logo.png" alt="Cruise Planners" style="height:44px" />
   ```

Do the same to swap the **favicon** (`assets/images/favicon.svg`) and the **social-share image** (`assets/images/og-cover.svg`, for best results export a real photo at **1200 × 630 px** and update the `og:image` lines in each page's `<head>`).

Other placeholders to replace when you're ready: `[ADVISOR HEADSHOT]`, `[TESTIMONIAL PLACEHOLDER]`, `[XX]+ years`, `[CERTIFICATIONS]`, and the `[FL Seller of Travel Ref. No.]` disclosure in `config.js`.

---

## ✉️ Wiring up the contact form

Right now the contact form validates and shows a friendly "thank you," but **it does not yet send an email** (a static site can't send mail by itself). Two easy, free options:

- **[Formspree](https://formspree.io)**, sign up, create a form, and you'll get an endpoint like `https://formspree.io/f/abcdwxyz`. In `contact.html`, change the `<form>` tag to:
  ```html
  <form id="contact-form" class="form" action="https://formspree.io/f/abcdwxyz" method="POST">
  ```
  Then in `assets/js/main.js`, remove the `e.preventDefault();` line so the form submits normally (or leave the JS to keep the on-page confirmation and let Formspree's AJAX handle delivery, their docs show both).
- **[Netlify Forms](https://docs.netlify.com/forms/setup/)**, if you host on Netlify, just add `netlify` to the `<form>` tag.

---

## 🚀 Publishing / hosting

Any static host works. Two common choices:

- **Cloudflare Pages**, connect this GitHub repo, set the build command to *none* and the output directory to the repo root (`/`). Every push to `main` auto-deploys.
- **GitHub Pages**, repo **Settings → Pages → Deploy from branch → `main` / root**.

To preview locally with nothing installed, just open `index.html` in a browser. *(The Deals page uses `fetch` to load `deals.json`; some browsers block that from a `file://` path. If deals don't appear locally, run a tiny local server, e.g. `python3 -m http.server`, and visit `http://localhost:8000`. Once hosted online, it works normally.)*

Remember to update the domain in `sitemap.xml`, `robots.txt`, and the `<link rel="canonical">` / `og:url` tags once your real domain is set.

---

## ✅ Accessibility &amp; SEO notes

- Semantic HTML, skip-to-content link, keyboard-focus styles, reduced-motion support, and labeled form fields.
- Per-page `<title>`, meta description, canonical, Open Graph &amp; Twitter tags; `sitemap.xml` + `robots.txt`.
- Navy/ivory palette chosen for readable contrast.

---

*Built as a maintainable starting point, swap the placeholders, keep the structure.*
