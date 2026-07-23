const target = process.argv[2];

if (!target) {
  throw new Error("Usage: node scripts/verify-response-headers.mjs <deployment-url>");
}

const url = new URL(target);
if (!/^https?:$/.test(url.protocol)) {
  throw new Error("Deployment health checks only support HTTP(S) URLs.");
}
if (url.username || url.password || url.search || url.hash) {
  throw new Error("Pass a public deployment origin without credentials, query strings, or hashes.");
}

const requestHeaders = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  requestHeaders["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const pageResponse = await fetchChecked(url, "app shell");
assertContentType(pageResponse, "text/html", "app shell");
assertSecurityHeaders(pageResponse);

const pageHtml = await pageResponse.text();
for (const marker of ['id="root"', 'rel="manifest"']) {
  if (!pageHtml.includes(marker)) {
    throw new Error(`App shell is missing required marker: ${marker}`);
  }
}

const manifestHref = readAttribute(pageHtml, "link", "rel", "manifest", "href");
if (!manifestHref) {
  throw new Error("App shell does not link to a web app manifest.");
}

const manifestUrl = new URL(manifestHref, pageResponse.url);
assertSameOrigin(manifestUrl, url, "manifest");
const manifestResponse = await fetchChecked(manifestUrl, "web app manifest");
const manifest = await manifestResponse.json();
if (
  typeof manifest.name !== "string" ||
  !manifest.name.includes("BudgetBuddy") ||
  manifest.display !== "standalone" ||
  manifest.start_url !== "/"
) {
  throw new Error("Web app manifest is missing the production name, start URL, or display mode.");
}

const iconSizes = new Set(
  Array.isArray(manifest.icons) ? manifest.icons.map((icon) => icon?.sizes) : []
);
for (const requiredSize of ["192x192", "512x512"]) {
  if (!iconSizes.has(requiredSize)) {
    throw new Error(`Web app manifest is missing its ${requiredSize} icon.`);
  }
}

const assetUrls = [
  ...readAssetUrls(pageHtml, "script", "src"),
  ...readAssetUrls(pageHtml, "link", "href").filter((assetUrl) =>
    /\/assets\/[^/?]+\.(?:css|js)$/.test(new URL(assetUrl, pageResponse.url).pathname)
  )
];
if (assetUrls.length < 2) {
  throw new Error("App shell does not reference the expected versioned JavaScript and CSS assets.");
}
for (const assetUrl of new Set(assetUrls)) {
  const resolvedAssetUrl = new URL(assetUrl, pageResponse.url);
  assertSameOrigin(resolvedAssetUrl, url, "static asset");
  await fetchChecked(resolvedAssetUrl, `static asset ${resolvedAssetUrl.pathname}`);
}

const serviceWorkerResponse = await fetchChecked(new URL("/sw.js", url), "service worker");
assertContentType(serviceWorkerResponse, "javascript", "service worker");
assertSecurityHeaders(serviceWorkerResponse);
const serviceWorkerCacheControl = serviceWorkerResponse.headers.get("cache-control") ?? "";
for (const requiredPolicy of ["no-cache", "no-store", "max-age=0", "must-revalidate"]) {
  if (!serviceWorkerCacheControl.includes(requiredPolicy)) {
    throw new Error(`Service worker Cache-Control is missing ${requiredPolicy}.`);
  }
}

const serviceWorkerSource = await serviceWorkerResponse.text();
for (const safeCachingMarker of [
  "requestUrl.origin !== self.location.origin",
  "STATIC_ASSET_PATTERN",
  'request.mode === "navigate"'
]) {
  if (!serviceWorkerSource.includes(safeCachingMarker)) {
    throw new Error(`Service worker is missing its cache boundary: ${safeCachingMarker}`);
  }
}
if (/(?:auth|rest|functions)\/v1|\.supabase\.co/i.test(serviceWorkerSource)) {
  throw new Error("Service worker source references a financial-data or authentication endpoint.");
}

const offlineResponse = await fetchChecked(new URL("/offline.html", url), "offline fallback");
assertContentType(offlineResponse, "text/html", "offline fallback");

for (const [pathname, expectedText] of [
  ["/privacy.html", "Privacy"],
  ["/terms.html", "Terms"]
]) {
  const legalResponse = await fetchChecked(new URL(pathname, url), pathname);
  assertContentType(legalResponse, "text/html", pathname);
  if (!(await legalResponse.text()).includes(expectedText)) {
    throw new Error(`${pathname} does not contain its expected title.`);
  }
}

const securityTextResponse = await fetchChecked(
  new URL("/.well-known/security.txt", url),
  "security.txt"
);
assertContentType(securityTextResponse, "text/plain", "security.txt");
const securityText = await securityTextResponse.text();
for (const field of ["Contact:", "Expires:"]) {
  if (!securityText.includes(field)) {
    throw new Error(`security.txt is missing ${field}`);
  }
}

console.log(`Verified public deployment health for ${url.origin}.`);

async function fetchChecked(resourceUrl, label) {
  const response = await fetch(resourceUrl, {
    headers: requestHeaders,
    redirect: "follow",
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }
  return response;
}

function assertContentType(response, expected, label) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes(expected)) {
    throw new Error(
      `${label} must use a ${expected} content type; received ${contentType || "none"}.`
    );
  }
}

function assertSecurityHeaders(response) {
  const requiredHeaders = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin"
  };

  for (const [name, expected] of Object.entries(requiredHeaders)) {
    const actual = response.headers.get(name);
    if (actual !== expected) {
      throw new Error(`${name} must be ${expected}; received ${actual ?? "no header"}.`);
    }
  }

  const permissionsPolicy = response.headers.get("permissions-policy") ?? "";
  for (const directive of ["camera=()", "microphone=()", "geolocation=()", "payment=()"]) {
    if (!permissionsPolicy.includes(directive)) {
      throw new Error(`Permissions-Policy is missing: ${directive}`);
    }
  }

  const csp = response.headers.get("content-security-policy") ?? "";
  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self' https://challenges.cloudflare.com",
    "worker-src 'self'",
    "manifest-src 'self'"
  ]) {
    if (!csp.includes(directive)) {
      throw new Error(`Content-Security-Policy is missing: ${directive}`);
    }
  }
  if (/script-src[^;]*(?:'unsafe-inline'|'unsafe-eval')/.test(csp)) {
    throw new Error("Content-Security-Policy permits unsafe scripts.");
  }
}

function assertSameOrigin(resourceUrl, deploymentUrl, label) {
  if (resourceUrl.origin !== deploymentUrl.origin) {
    throw new Error(`${label} must be served from the deployment origin.`);
  }
}

function readAttribute(html, tagName, matchingAttribute, matchingValue, resultAttribute) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  for (const tag of tags) {
    const matchValue = tag.match(new RegExp(`${matchingAttribute}=["']([^"']+)["']`, "i"))?.[1];
    if (matchValue?.split(/\s+/).includes(matchingValue)) {
      return tag.match(new RegExp(`${resultAttribute}=["']([^"']+)["']`, "i"))?.[1];
    }
  }
  return undefined;
}

function readAssetUrls(html, tagName, attribute) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  return tags
    .map((tag) => tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1])
    .filter((value) => typeof value === "string" && value.startsWith("/assets/"));
}
