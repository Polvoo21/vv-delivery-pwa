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

function renderAnswerSections(items = []) {
  if (!items.length) return "";

  return `
    <section class="site-server-answers" aria-labelledby="site-server-answers-title">
      <h2 id="site-server-answers-title">Короткие ответы</h2>
      ${items.map((item) => `
        <article>
          <h3>${escapeHtml(item.heading)}</h3>
          <p>${escapeHtml(item.answer)}</p>
        </article>`).join("")}
    </section>`;
}

function formatDateRu(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function renderSources(items = [], dateModified = "") {
  if (!items.length) return "";

  return `
    <section class="site-server-sources" aria-labelledby="site-server-sources-title">
      <h2 id="site-server-sources-title">Источники</h2>
      ${dateModified ? `<p>Источники проверены <time datetime="${escapeHtml(dateModified)}">${escapeHtml(formatDateRu(dateModified))}</time>.</p>` : ""}
      <ul>
        ${items.map((item) => `
          <li><a href="${escapeHtml(item.href)}" rel="noreferrer">${escapeHtml(item.label)}</a></li>`).join("")}
      </ul>
    </section>`;
}

function renderCatalogSnapshot(catalog) {
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : [];
  const products = Array.isArray(catalog?.products)
    ? catalog.products.filter((product) => product?.name && Number(product.price) > 0)
    : [];
  if (!categories.length || !products.length) return "";

  const productsByCategory = new Map();
  products.forEach((product) => {
    const categoryId = product.category || product.categoryId;
    if (!productsByCategory.has(categoryId)) productsByCategory.set(categoryId, []);
    productsByCategory.get(categoryId).push(product);
  });

  const groups = categories
    .map((category) => ({ category, products: productsByCategory.get(category.id) || [] }))
    .filter((group) => group.products.length);
  if (!groups.length) return "";

  return `
    <section class="site-server-menu" id="server-menu" aria-labelledby="site-server-menu-title">
      <h2 id="site-server-menu-title">Актуальное меню и цены</h2>
      <p>Цены загружены из того же действующего каталога, который используется при оформлении заказа.</p>
      ${groups.map(({ category, products: categoryProducts }) => `
        <section aria-labelledby="site-server-category-${escapeHtml(category.id)}">
          <h3 id="site-server-category-${escapeHtml(category.id)}">${escapeHtml(category.title)}</h3>
          <ul>
            ${categoryProducts.map((product) => `
              <li>
                <span>${escapeHtml(product.name)}${product.weight ? `, ${escapeHtml(product.weight)}` : ""}</span>
                <data value="${escapeHtml(product.price)}">${Number(product.price).toLocaleString("ru-RU")} ₽</data>
              </li>`).join("")}
          </ul>
        </section>`).join("")}
    </section>`;
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
    if (page.dateModified) pageNode.dateModified = page.dateModified;
    if (page.sources?.length) pageNode.citation = page.sources.map((source) => source.href);
  }

  if (page.schemaType === "Service") {
    pageNode.serviceType = page.serviceType || page.h1;
    pageNode.provider = { "@id": restaurantId };
    pageNode.areaServed = { "@type": "City", name: "Чебоксары" };
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

export function renderSeoDocument(
  source,
  page,
  schema = buildDefaultPageSchema(page),
  { catalog = null, appHtml = "" } = {}
) {
  const socialType = page.schemaType === "Article" ? "article" : "website";
  const homepageLcpImages = [
    {
      href: "/assets/site/interior-window-hero-720.avif",
      srcset: "/assets/site/interior-window-hero-480.avif 480w, /assets/site/interior-window-hero-720.avif 720w",
      sizes: "(max-width: 768px) calc(100vw - 52px), 360px"
    }
  ];
  const routeLcpImages = page.path === "/"
    ? homepageLcpImages
    : page.path === "/bez-perchatok"
      ? [{
          href: "/assets/site/no-gloves-hero-1280.avif",
          srcset: "/assets/site/no-gloves-hero-640.avif 640w, /assets/site/no-gloves-hero-1280.avif 1280w",
          sizes: "100vw"
        }]
      : [];
  const lcpPreload = routeLcpImages
    .map((image) => `
    <link
      rel="preload"
      as="image"
      href="${image.href}"
      ${image.srcset ? `imagesrcset="${image.srcset}"` : ""}
      ${image.sizes ? `imagesizes="${image.sizes}"` : ""}
      ${image.media ? `media="${image.media}"` : ""}
      type="image/avif"
      fetchpriority="high"
    />`)
    .join("");
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
      ${renderAnswerSections(page.answers)}
      ${page.path === "/" ? renderCatalogSnapshot(catalog) : ""}
      ${renderSources(page.sources, page.dateModified)}
      ${renderInternalLinks(page.links)}
    </main>
  `;
  const supplementalContent = appHtml
    ? `
    <section class="site-server-seo site-server-seo-supplement" aria-labelledby="site-server-answers-title">
      ${renderAnswerSections(page.answers)}
      ${page.path === "/" ? renderCatalogSnapshot(catalog) : ""}
      ${renderSources(page.sources, page.dateModified)}
      ${renderInternalLinks(page.links)}
    </section>
  `
    : "";
  const documentWithLcpPreload = /<meta\s+name="viewport"[\s\S]*?>/i.test(source)
    ? String(source).replace(
        /(<meta\s+name="viewport"[\s\S]*?>)/i,
        `$1${lcpPreload}`
      )
    : String(source).replace(/<head>/i, `<head>${lcpPreload}`);

  return documentWithLcpPreload
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?>/i,
      `<meta name="description" content="${escapeHtml(page.description)}" />`
    )
    .replace("</head>", `${metadata}\n  </head>`)
    .replace(
      /<div\s+id="root"\s*><\/div>/i,
      `<div id="root">${appHtml || content}</div>${supplementalContent}`
    );
}
