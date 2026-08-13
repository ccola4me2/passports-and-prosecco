/* =====================================================================
   Cloudflare Pages Function: Widgety proxy (server-side)
   Keeps the Widgety App ID + Token as environment SECRETS so they never
   reach the browser or the repo. The frontend calls same-origin routes:

     GET /widgety/lines            -> Royal Caribbean + Norwegian, each
                                      with their ships (id, name, image)
     GET /widgety/sailings?ship=ID -> that ship's sailings (itinerary,
                                      nights, dates, ports, regions)

   Set these in Cloudflare Pages > Settings > Environment variables:
     WIDGETY_APP_ID   (your App ID)
     WIDGETY_TOKEN    (your Token)  <- mark as encrypted/secret
   ===================================================================== */

const WIDGETY_BASE = "https://www.widgety.co.uk/api";
const ACCEPT = "application/json;api_version=3";
const MAX_SAILINGS = 40; // stay well under the subrequest limit
const LINES = [
  { id: "royal-caribbean-international", title: "Royal Caribbean International" },
  { id: "norwegian-cruise-line", title: "Norwegian Cruise Line" }
];

function json(obj, status, cacheSeconds) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeconds ? "public, max-age=" + cacheSeconds : "no-store"
    }
  });
}

function authUrl(url, env) {
  const u = new URL(url);
  u.searchParams.set("app_id", env.WIDGETY_APP_ID);
  u.searchParams.set("token", env.WIDGETY_TOKEN);
  return u.toString();
}

async function wget(url, env) {
  const res = await fetch(authUrl(url, env), {
    headers: { Accept: ACCEPT },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!res.ok) throw new Error("Widgety " + res.status);
  return res.json();
}

export async function onRequestGet(context) {
  const { request, env, params } = context;

  if (!env.WIDGETY_APP_ID || !env.WIDGETY_TOKEN) {
    return json({ error: "Widgety credentials are not configured. Add WIDGETY_APP_ID and WIDGETY_TOKEN in Cloudflare Pages > Settings > Environment variables." }, 500);
  }

  const seg = params && params.path ? (Array.isArray(params.path) ? params.path : [params.path]) : [];
  const route = seg[0] || "";
  const url = new URL(request.url);

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  try {
    let out;

    if (route === "lines") {
      const lines = await Promise.all(LINES.map(async (l) => {
        try {
          const op = await wget(WIDGETY_BASE + "/operators/" + l.id + ".json", env);
          const ships = (op.ships || [])
            .map((s) => ({ id: s.id, name: s.name, image: s.cover_image_href || s.profile_image_href || null }))
            .filter((s) => s.id && s.name);
          return { id: l.id, title: op.title || l.title, ships: ships };
        } catch (e) {
          return { id: l.id, title: l.title, ships: [] };
        }
      }));
      out = json({ lines: lines }, 200, 3600);

    } else if (route === "sailings") {
      const shipId = url.searchParams.get("ship");
      if (!shipId) return json({ error: "Missing ship parameter." }, 400);

      const ship = await wget(WIDGETY_BASE + "/ships/" + encodeURIComponent(shipId) + ".json", env);
      const seen = {};
      const cruises = (Array.isArray(ship.cruises) ? ship.cruises : [])
        .filter((c) => c && c.ref && !seen[c.ref] && (seen[c.ref] = 1))
        .slice(0, MAX_SAILINGS);

      const rows = await Promise.all(cruises.map(async (c) => {
        try {
          const dateUrl = c.holiday_date || (WIDGETY_BASE + "/holidays/dates/" + c.ref + ".json");
          const d = await wget(dateUrl, env);
          return {
            ref: d.date_ref || c.ref,
            name: d.name || c.name || "",
            nights: d.cruise_nights || d.duration_days || null,
            line: d.operator_title || null,
            ship: d.ship_title || ship.title || null,
            dateFrom: d.date_from || null,
            dateTo: d.date_to || null,
            from: d.starts_at && d.starts_at.name ? d.starts_at.name : null,
            to: d.ends_at && d.ends_at.name ? d.ends_at.name : null,
            regions: Array.isArray(d.regions) ? d.regions.slice(0, 3) : [],
            availability: d.availability_string || null
          };
        } catch (e) {
          return null;
        }
      }));

      const sailings = rows
        .filter(Boolean)
        .filter((s) => s.dateFrom)
        .sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));

      out = json({
        ship: { id: shipId, title: ship.title || null, image: ship.cover_image_href || ship.profile_image_href || null },
        sailings: sailings
      }, 200, 1800);

    } else {
      out = json({ error: "Unknown route." }, 404);
    }

    if (out.status === 200) context.waitUntil(cache.put(cacheKey, out.clone()));
    return out;
  } catch (e) {
    return json({ error: "Upstream error contacting Widgety." }, 502);
  }
}
