function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

function upsertCanonical(href) {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", href);
}

export function syncSiteSeoHead(page) {
  if (!page || typeof document === "undefined") return;

  document.title = page.title;
  upsertCanonical(page.canonicalUrl);
  upsertMeta('meta[name="description"]', { name: "description", content: page.description });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: "index, follow, max-image-preview:large"
  });
  upsertMeta('meta[property="og:type"]', {
    property: "og:type",
    content: page.schemaType === "Article" ? "article" : "website"
  });
  upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "ru_RU" });
  upsertMeta('meta[property="og:site_name"]', {
    property: "og:site_name",
    content: "Вместе Вкуснее"
  });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: page.title });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: page.description
  });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: page.canonicalUrl });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: page.imageUrl });
  upsertMeta('meta[property="og:image:type"]', {
    property: "og:image:type",
    content: "image/jpeg"
  });
  upsertMeta('meta[property="og:image:width"]', {
    property: "og:image:width",
    content: "1200"
  });
  upsertMeta('meta[property="og:image:height"]', {
    property: "og:image:height",
    content: "630"
  });
  upsertMeta('meta[property="og:image:alt"]', {
    property: "og:image:alt",
    content: page.imageAlt
  });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: page.title });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: page.description
  });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: page.imageUrl });
}
