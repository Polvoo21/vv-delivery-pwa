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

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function subscribeForPush(successMessage, failureMessage) {
  if (!("PushManager" in window)) {
    return {
      ok: false,
      message: "Push-уведомления не поддерживаются этим браузером."
    };
  }

  const permission = await requestNotificationPermission();
  if (!permission.ok) {
    return permission;
  }

  try {
    const configResponse = await fetch("/.netlify/functions/push-config");
    const config = await configResponse.json().catch(() => ({}));

    if (!configResponse.ok || !config.ok || !config.publicKey) {
      return {
        ok: false,
        message: config.error || "Push-ключи не настроены на Netlify."
      };
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      }));

    return {
      ok: true,
      message: successMessage,
      subscription: subscription.toJSON()
    };
  } catch {
    return {
      ok: false,
      message: failureMessage
    };
  }
}

export function subscribeForOrderPush() {
  return subscribeForPush(
    "Уведомления о статусе заказа включены.",
    "Не удалось включить push-уведомления о статусе заказа."
  );
}

export function subscribeForAdminPush() {
  return subscribeForPush(
    "Уведомления администратора включены.",
    "Не удалось включить push-уведомления администратора."
  );
}
