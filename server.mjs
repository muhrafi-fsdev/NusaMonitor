import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");
const PORT = Number(process.env.PORT || 3000);
const APP_USER_AGENT = process.env.APP_USER_AGENT || "NusaMonitor-Indonesia/1.0 contact=raymufiyo@gmail.com";

const CACHE = new Map();
const SOURCE_TIMEOUT_MS = 15000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function jsonResponse(res, status, body, extraHeaders = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders
  });
  res.end(data);
}

function textResponse(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": contentType });
  res.end(body);
}

function errorPayload(source, error) {
  return {
    ok: false,
    source,
    updatedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error)
  };
}

async function cached(key, ttlMs, loader) {
  const existing = CACHE.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  const value = await loader();
  CACHE.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "user-agent": APP_USER_AGENT,
        accept: "application/json, application/xml, text/xml, */*",
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} dari ${new URL(url).hostname}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCoordinate(value) {
  const [lat, lon] = String(value || "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
}

function normalizeEarthquake(item, kind) {
  const coords = parseCoordinate(item.Coordinates || item.coordinates);
  const magnitude = Number(item.Magnitude || item.magnitude || 0);
  const depthKm = Number.parseFloat(String(item.Kedalaman || item.depth || "0"));
  return {
    id: `${item.DateTime || item.Tanggal || "unknown"}-${coords?.join("-") || item.Wilayah}`,
    type: "earthquake",
    kind,
    title: item.Wilayah || "Gempabumi Indonesia",
    magnitude,
    depthKm: Number.isFinite(depthKm) ? depthKm : null,
    coordinates: coords,
    occurredAt: item.DateTime || null,
    dateLocal: [item.Tanggal, item.Jam].filter(Boolean).join(" "),
    felt: item.Dirasakan || null,
    potential: item.Potensi || null,
    source: "BMKG"
  };
}

async function getEarthquakes() {
  return cached("earthquakes", 60_000, async () => {
    const urls = [
      ["felt", "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json"],
      ["m5plus", "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"]
    ];
    const results = await Promise.allSettled(urls.map(async ([kind, url]) => {
      const response = await fetchWithTimeout(url);
      const payload = await response.json();
      const rows = payload?.Infogempa?.gempa || [];
      return rows.map((row) => normalizeEarthquake(row, kind));
    }));

    const events = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    const unique = [...new Map(events.map((event) => [event.id, event])).values()]
      .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)));

    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => String(result.reason?.message || result.reason));

    return {
      ok: unique.length > 0,
      source: "BMKG Data Gempabumi Terbuka",
      sourceUrl: "https://data.bmkg.go.id/gempabumi/",
      updatedAt: new Date().toISOString(),
      count: unique.length,
      events: unique,
      errors
    };
  });
}

function xmlDecode(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function extractXmlTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? xmlDecode(match[1]) : null;
}

async function getWeatherAlerts() {
  return cached("weather-alerts", 120_000, async () => {
    const response = await fetchWithTimeout("https://www.bmkg.go.id/alerts/nowcast/id", {
      headers: { accept: "application/rss+xml, application/xml, text/xml" }
    });
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match, index) => {
      const block = match[1];
      return {
        id: `bmkg-alert-${index}-${extractXmlTag(block, "pubDate") || ""}`,
        type: "weather-alert",
        title: extractXmlTag(block, "title") || "Peringatan Dini Cuaca",
        description: extractXmlTag(block, "description") || "",
        link: extractXmlTag(block, "link"),
        publishedAt: extractXmlTag(block, "pubDate"),
        source: "BMKG"
      };
    });
    return {
      ok: true,
      source: "BMKG Peringatan Dini Cuaca",
      sourceUrl: "https://data.bmkg.go.id/peringatan-dini-cuaca/",
      updatedAt: new Date().toISOString(),
      count: items.length,
      alerts: items
    };
  });
}

async function getWeather(adm4) {
  const valid = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(adm4);
  if (!valid) throw new Error("Kode ADM4 tidak valid. Contoh: 31.71.03.1001");
  return cached(`weather:${adm4}`, 300_000, async () => {
    const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`;
    const response = await fetchWithTimeout(url);
    const payload = await response.json();
    const groups = payload?.data?.[0]?.cuaca || [];
    const forecast = groups.flat().filter(Boolean).slice(0, 24).map((item) => ({
      localDateTime: item.local_datetime,
      utcDateTime: item.utc_datetime,
      temperatureC: item.t,
      humidityPercent: item.hu,
      description: item.weather_desc,
      descriptionEn: item.weather_desc_en,
      windKmh: item.ws,
      windDirection: item.wd,
      cloudCoverPercent: item.tcc,
      visibility: item.vs_text,
      image: item.image
    }));
    return {
      ok: true,
      source: "BMKG Data Prakiraan Cuaca Terbuka",
      sourceUrl: "https://data.bmkg.go.id/prakiraan-cuaca/",
      updatedAt: new Date().toISOString(),
      location: payload?.lokasi || null,
      count: forecast.length,
      forecast
    };
  });
}

async function getDisasterReports(timeperiod, disaster) {
  const seconds = Math.min(604800, Math.max(60, Number(timeperiod) || 86400));
  const allowed = new Set(["", "flood", "earthquake", "fire", "haze", "wind", "volcano"]);
  const safeDisaster = allowed.has(disaster) ? disaster : "";
  const query = new URLSearchParams({ geoformat: "geojson", timeperiod: String(seconds) });
  if (safeDisaster) query.set("disaster", safeDisaster);
  return cached(`petabencana:${query}`, 120_000, async () => {
    const response = await fetchWithTimeout(`https://api.petabencana.id/reports?${query}`);
    const payload = await response.json();
    const featureCollection = payload?.result || payload;
    const features = Array.isArray(featureCollection?.features) ? featureCollection.features : [];
    const reports = features.map((feature) => ({
      id: String(feature.properties?.pkey || feature.id || crypto.randomUUID()),
      type: "disaster-report",
      disasterType: feature.properties?.disaster_type || "unknown",
      title: feature.properties?.title || feature.properties?.disaster_type || "Laporan bencana",
      text: feature.properties?.text || "",
      status: feature.properties?.status || null,
      createdAt: feature.properties?.created_at || null,
      sourceName: feature.properties?.source || "PetaBencana",
      imageUrl: feature.properties?.image_url || null,
      coordinates: feature.geometry?.type === "Point" ? [feature.geometry.coordinates?.[1], feature.geometry.coordinates?.[0]] : null,
      raw: feature
    })).filter((report) => Array.isArray(report.coordinates) && report.coordinates.every(Number.isFinite));
    return {
      ok: true,
      source: "PetaBencana Open API",
      sourceUrl: "https://docs.petabencana.id/routes",
      updatedAt: new Date().toISOString(),
      timeperiod: seconds,
      count: reports.length,
      reports
    };
  });
}

async function getNews(query, maxrecords) {
  const cleanQuery = String(query || "Indonesia").slice(0, 120).trim() || "Indonesia";
  const limit = Math.min(50, Math.max(5, Number(maxrecords) || 20));
  return cached(`news:${cleanQuery}:${limit}`, 300_000, async () => {
    const params = new URLSearchParams({
      query: cleanQuery,
      mode: "ArtList",
      maxrecords: String(limit),
      format: "json",
      sort: "HybridRel"
    });
    const response = await fetchWithTimeout(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`);
    const payload = await response.json();
    const articles = Array.isArray(payload?.articles) ? payload.articles.map((article) => ({
      title: article.title,
      url: article.url,
      urlMobile: article.url_mobile || null,
      sourceCountry: article.sourcecountry || null,
      domain: article.domain || null,
      language: article.language || null,
      seenDate: article.seendate || null,
      socialImage: article.socialimage || null
    })) : [];
    return {
      ok: true,
      source: "GDELT DOC 2.0",
      sourceUrl: "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
      updatedAt: new Date().toISOString(),
      query: cleanQuery,
      count: articles.length,
      articles
    };
  });
}

async function safeSource(name, loader) {
  try { return await loader(); }
  catch (error) { return errorPayload(name, error); }
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health") {
    return jsonResponse(res, 200, {
      ok: true,
      app: "NusaMonitor Indonesia Live",
      now: new Date().toISOString(),
      runtime: process.version
    });
  }
  if (url.pathname === "/api/earthquakes") {
    return jsonResponse(res, 200, await safeSource("BMKG Earthquakes", getEarthquakes));
  }
  if (url.pathname === "/api/weather-alerts") {
    return jsonResponse(res, 200, await safeSource("BMKG Weather Alerts", getWeatherAlerts));
  }
  if (url.pathname === "/api/weather") {
    const adm4 = url.searchParams.get("adm4") || "31.71.03.1001";
    return jsonResponse(res, 200, await safeSource("BMKG Weather", () => getWeather(adm4)));
  }
  if (url.pathname === "/api/disaster-reports") {
    return jsonResponse(res, 200, await safeSource("PetaBencana", () => getDisasterReports(
      url.searchParams.get("timeperiod") || "86400",
      url.searchParams.get("disaster") || ""
    )));
  }
  if (url.pathname === "/api/news") {
    return jsonResponse(res, 200, await safeSource("GDELT", () => getNews(
      url.searchParams.get("query") || "Indonesia",
      url.searchParams.get("maxrecords") || "20"
    )));
  }
  if (url.pathname === "/api/overview") {
    const [earthquakes, alerts, reports, news] = await Promise.all([
      safeSource("BMKG Earthquakes", getEarthquakes),
      safeSource("BMKG Weather Alerts", getWeatherAlerts),
      safeSource("PetaBencana", () => getDisasterReports(url.searchParams.get("timeperiod") || "86400", "")),
      safeSource("GDELT", () => getNews("Indonesia", 16))
    ]);
    return jsonResponse(res, 200, {
      ok: [earthquakes, alerts, reports, news].some((item) => item.ok),
      updatedAt: new Date().toISOString(),
      earthquakes,
      alerts,
      reports,
      news
    });
  }
  return jsonResponse(res, 404, { ok: false, error: "API route tidak ditemukan" });
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) return textResponse(res, 403, "Forbidden");
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const data = await readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[extname(filePath)] || "application/octet-stream",
      "cache-control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600"
    });
    res.end(data);
  } catch {
    if (!extname(pathname)) {
      try {
        const data = await readFile(join(PUBLIC_DIR, "index.html"));
        res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-cache" });
        return res.end(data);
      } catch {}
    }
    textResponse(res, 404, "Not Found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    return jsonResponse(res, 500, errorPayload("NusaMonitor Server", error));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`NusaMonitor Indonesia Live berjalan di http://localhost:${PORT}`);
});
