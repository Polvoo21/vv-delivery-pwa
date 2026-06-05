const CACHE_VERSION = "vv-delivery-mvp-v1.1.2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/admin.html",
  "/manifest.json",
  "/admin-manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon.svg",
  "/assets/pizza-main.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/.netlify/functions/")) return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const fallbackUrl = url.pathname.startsWith("/admin") ? "/admin.html" : "/index.html";
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(fallbackUrl, copy));
          return response;
        })
        .catch(() => caches.match(fallbackUrl))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const targetPath = new URL(targetUrl).pathname;
      const matchingClient = clientList.find((client) => {
        try {
          return new URL(client.url).pathname.startsWith(targetPath);
        } catch {
          return false;
        }
      });

      if (matchingClient) return matchingClient.focus();
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      body: event.data?.text()
    };
  }

  const title = data.title || "Вместе Вкуснее";
  const body = data.body || "Статус заказа обновлён";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.notificationTag || (data.orderId ? `vv-order-${data.orderId}` : "vv-order-status"),
      renotify: true,
      data: {
        url: data.url || "/",
        orderId: data.orderId || null,
        status: data.status || null
      }
    })
  );
});
