export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return {
      ok: false,
      message: "Уведомления не поддерживаются в этом браузере."
    };
  }

  if (!("serviceWorker" in navigator)) {
    return {
      ok: false,
      message: "Service Worker недоступен, поэтому локальное PWA-уведомление сейчас не показать."
    };
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission !== "granted") {
    return {
      ok: false,
      message:
        "Разрешение на уведомления не выдано. На iPhone уведомления работают только в установленном PWA и после разрешения."
    };
  }

  return {
    ok: true,
    message: "Уведомления разрешены."
  };
}

export async function showLocalNotification(title, body) {
  const permission = await requestNotificationPermission();

  if (!permission.ok) {
    return permission;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "vv-local-test"
    });

    return {
      ok: true,
      message: "Уведомление отправлено."
    };
  } catch {
    return {
      ok: false,
      message:
        "Не удалось показать уведомление. На iPhone проверьте, что сайт установлен как PWA и уведомления разрешены."
    };
  }
}
