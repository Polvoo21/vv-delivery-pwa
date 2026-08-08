import { readFile } from "node:fs/promises";
import path from "node:path";
import { getRouteRedirect, isKnownFrontendPath } from "../shared/site-routes.js";

function getQuerySuffix(originalUrl = "") {
  const queryIndex = String(originalUrl).indexOf("?");
  return queryIndex === -1 ? "" : String(originalUrl).slice(queryIndex);
}

export function canonicalRedirectMiddleware(request, response, next) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  if (request.path === "/api" || request.path.startsWith("/api/")) {
    return next();
  }

  const redirect = getRouteRedirect(request.path);
  if (!redirect) return next();

  return response.redirect(
    redirect.status,
    `${redirect.target}${getQuerySuffix(request.originalUrl)}`
  );
}

export function renderNotFoundHtml(source) {
  const metadata = `
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="Запрошенная страница не найдена. Перейдите на главную страницу семейной пиццерии «Вместе Вкуснее»." />
  `;
  const content = `
    <main class="site-server-not-found" aria-labelledby="site-not-found-title">
      <p>Ошибка 404</p>
      <h1 id="site-not-found-title">Страница не найдена</h1>
      <p>Возможно, адрес изменился или в ссылке есть ошибка.</p>
      <nav aria-label="Полезные ссылки">
        <a href="/">На главную</a>
        <a href="/#menu">Посмотреть меню</a>
        <a href="/delivery-zones">Зоны доставки</a>
      </nav>
    </main>
  `;

  return String(source)
    .replace(/<title>[\s\S]*?<\/title>/i, "<title>Страница не найдена | Вместе Вкуснее</title>")
    .replace(/<meta\s+name="description"[\s\S]*?>/i, "")
    .replace("</head>", `${metadata}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

export function createSpaFallbackHandler({ distDir }) {
  const indexPath = path.join(distDir, "index.html");

  return async function spaFallbackHandler(request, response, next) {
    if (isKnownFrontendPath(request.path)) {
      return response.sendFile(indexPath);
    }

    try {
      const source = await readFile(indexPath, "utf8");
      return response.status(404).type("html").send(renderNotFoundHtml(source));
    } catch (error) {
      return next(error);
    }
  };
}

