import { SITE_ENTITY } from "../shared/site-seo.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderBreadcrumbs(items) {
  if (!items.length) return "";

  return `
    <nav class="site-server-breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        ${items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return `<li>${
            isCurrent
              ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
              : `<a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>`
          }</li>`;
        }).join("")}
      </ol>
    </nav>`;
}

function renderInternalLinks(items) {
  return `
    <nav class="site-server-seo-links" aria-label="Полезные разделы">
      ${items.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("")}
    </nav>`;
}

function buildBreadcrumbSchema(page) {
  if (!page.breadcrumbs.length) return null;

  return {
    "@type": "BreadcrumbList",
    "@id": `${page.canonicalUrl}#breadcrumbs`,
    itemListElement: page.breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function buildDefaultPageSchema(page) {
  const organizationId = `${SITE_ENTITY.url}/#organization`;
  const restaurantId = `${SITE_ENTITY.url}/#restaurant`;
  const websiteId = `${SITE_ENTITY.url}/#website`;
  const pageId = `${page.canonicalUrl}#webpage`;
  const pageNode = {
    "@type": page.schemaType,
    "@id": pageId,
    url: page.canonicalUrl,
    name: page.title,
    headline: page.h1,
    description: page.description,
    inLanguage: "ru-RU",
    isPartOf: { "@id": websiteId },
    about: { "@id": restaurantId },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: page.imageUrl,
      caption: page.imageAlt
    }
  };

  if (page.path === "/") {
    pageNode.mainEntity = { "@id": restaurantId };
  }

  if (page.schemaType === "Article") {
    pageNode.author = { "@id": restaurantId };
    pageNode.publisher = { "@id": restaurantId };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_ENTITY.name,
        legalName: SITE_ENTITY.legalName,
        url: SITE_ENTITY.url,
        logo: SITE_ENTITY.logoUrl,
        telephone: SITE_ENTITY.telephone,
        email: SITE_ENTITY.email,
        taxID: SITE_ENTITY.taxId,
        identifier: [
          {
            "@type": "PropertyValue",
            propertyID: "ОГРН",
            value: SITE_ENTITY.registrationId
          },
          {
            "@type": "PropertyValue",
            propertyID: "КПП",
            value: SITE_ENTITY.kpp
          }
        ],
        legalAddress: {
          "@type": "PostalAddress",
          ...SITE_ENTITY.address
        },
        sameAs: SITE_ENTITY.sameAs
      },
      {
        "@type": "Restaurant",
        "@id": restaurantId,
        name: SITE_ENTITY.name,
        url: SITE_ENTITY.url,
        logo: SITE_ENTITY.logoUrl,
        image: SITE_ENTITY.imageUrl,
        telephone: SITE_ENTITY.telephone,
        email: SITE_ENTITY.email,
        address: {
          "@type": "PostalAddress",
          ...SITE_ENTITY.address
        },
        geo: {
          "@type": "GeoCoordinates",
          ...SITE_ENTITY.geo
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          opens: SITE_ENTITY.openingHours.opens,
          closes: SITE_ENTITY.openingHours.closes
        },
        servesCuisine: SITE_ENTITY.servesCuisine,
        hasMenu: SITE_ENTITY.menuUrl,
        hasMap: SITE_ENTITY.mapUrl,
        areaServed: {
          "@type": "City",
          name: "Чебоксары"
        },
        parentOrganization: { "@id": organizationId },
        sameAs: SITE_ENTITY.sameAs,
        potentialAction: [
          {
            "@type": "OrderAction",
            name: "Заказать доставку",
            target: SITE_ENTITY.orderUrl,
            provider: { "@id": restaurantId },
            deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"
          },
          {
            "@type": "OrderAction",
            name: "Заказать самовывоз",
            target: SITE_ENTITY.orderUrl,
            provider: { "@id": restaurantId },
            deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp"
          }
        ]
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_ENTITY.url,
        name: SITE_ENTITY.name,
        inLanguage: "ru-RU",
        publisher: { "@id": organizationId },
        about: { "@id": restaurantId }
      },
      pageNode,
      buildBreadcrumbSchema(page)
    ].filter(Boolean)
  };
}

export function renderSeoDocument(source, page, schema = buildDefaultPageSchema(page)) {
  const socialType = page.schemaType === "Article" ? "article" : "website";
  const metadata = `
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(page.canonicalUrl)}" />
    <meta property="og:type" content="${socialType}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="${escapeHtml(SITE_ENTITY.name)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${escapeHtml(page.canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(page.imageUrl)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(page.imageUrl)}" />
    <script id="site-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>
  `;
  const content = `
    <main class="site-server-seo" aria-labelledby="site-server-seo-title">
      ${renderBreadcrumbs(page.breadcrumbs)}
      <p class="site-server-seo-eyebrow">${escapeHtml(SITE_ENTITY.name)}</p>
      <h1 id="site-server-seo-title">${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.intro)}</p>
      ${renderInternalLinks(page.links)}
    </main>
  `;

  return String(source)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?>/i,
      `<meta name="description" content="${escapeHtml(page.description)}" />`
    )
    .replace("</head>", `${metadata}\n  </head>`)
    .replace(/<div\s+id="root"\s*><\/div>/i, `<div id="root">${content}</div>`);
}
