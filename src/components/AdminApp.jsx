import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  KeyRound,
  LogOut,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  Truck,
  UserRound
} from "lucide-react";
import { formatPrice } from "../utils/price";

const PASSWORD_KEY = "vv_admin_password";

const STATUS_LABELS = {
  accepted: "Принят",
  cooking: "Готовится",
  courier: "У курьера",
  delivered: "Доставлен"
};

const STATUS_ICONS = {
  accepted: CheckCircle2,
  cooking: ChefHat,
  courier: Truck,
  delivered: PackageCheck
};

const DEMO_ORDERS = [
  {
    id: "DEMO-1024",
    status: "accepted",
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    mode: "delivery",
    address: "Чебоксары, ул. Пирогова, 1Т",
    entrance: "2",
    flat: "18",
    customerName: "Анна",
    customerPhone: "+7 (8352) 70-00-97",
    payment: "картой при получении",
    total: 1280,
    items: [
      {
        name: "Пепперони с халапеньо и мёдом",
        qty: 1,
        size: 30,
        dough: "Традиционное",
        lineTotal: 720,
        addons: [{ name: "Моцарелла" }]
      },
      {
        name: "Морс ягодный",
        qty: 2,
        lineTotal: 320
      }
    ]
  },
  {
    id: "DEMO-1023",
    status: "cooking",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    mode: "pickup",
    address: "Чебоксары, ул. Пирогова, 1Т",
    customerName: "Илья",
    customerPhone: "+7 900 000-00-00",
    payment: "наличными",
    total: 1015,
    items: [
      {
        name: "Пицца Цезарь",
        qty: 1,
        size: 35,
        dough: "Тонкое",
        lineTotal: 890
      },
      {
        name: "Капучино",
        qty: 1,
        lineTotal: 180
      }
    ]
  }
];

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function adminErrorMessage(error) {
  if (!error) return "Не удалось выполнить действие";
  return error.details ? `${error.message}: ${error.details}` : error.message || "Не удалось выполнить действие";
}

function formatDate(value) {
  if (!value) return "сейчас";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getOrderTotalByStatus(orders) {
  return Object.keys(STATUS_LABELS).map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length
  }));
}

function compactAddress(order) {
  const details = [
    order.entrance ? `подъезд ${order.entrance}` : "",
    order.flat ? `кв. ${order.flat}` : ""
  ].filter(Boolean);

  return details.length ? `${order.address}, ${details.join(", ")}` : order.address;
}

function itemLine(item) {
  const meta = [item.size ? `${item.size} см` : "", item.dough || ""].filter(Boolean).join(", ");
  const addons = item.addons?.length
    ? ` + ${item.addons.map((addon) => (typeof addon === "string" ? addon : addon.name)).join(", ")}`
    : "";

  return `${item.name} × ${item.qty}${meta ? ` · ${meta}` : ""}${addons}`;
}

export default function AdminApp() {
  const demoRequested = new URLSearchParams(window.location.search).get("demo") === "1" && isLocalhost();
  const savedPassword = demoRequested ? "" : sessionStorage.getItem(PASSWORD_KEY) || "";
  const [password, setPassword] = useState(() => (demoRequested ? "__local_demo__" : ""));
  const [draftPassword, setDraftPassword] = useState(savedPassword);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(Boolean(savedPassword));

  const stats = useMemo(() => getOrderTotalByStatus(orders), [orders]);
  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  useEffect(() => {
    if (demoRequested) {
      setDemoMode(true);
      setOrders(DEMO_ORDERS);
      setError("");
      setCheckingSession(false);
      return;
    }

    const storedPassword = sessionStorage.getItem(PASSWORD_KEY) || "";
    if (storedPassword) {
      verifyLogin(storedPassword, { persist: false });
    } else {
      setCheckingSession(false);
    }
  }, [demoRequested]);

  async function fetchOrders(nextPassword) {
    const response = await fetch("/.netlify/functions/admin-orders", {
      headers: {
        "x-admin-password": nextPassword
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const nextError = new Error(data.error || "Не удалось загрузить заказы");
      nextError.status = response.status;
      nextError.details = data.details;
      nextError.name = data.name || "AdminRequestError";
      throw nextError;
    }

    return data.orders || [];
  }

  async function verifyLogin(nextPassword, options = {}) {
    const shouldPersist = options.persist !== false;

    setLoading(true);
    setError("");

    try {
      const nextOrders = await fetchOrders(nextPassword);
      setDemoMode(false);
      setOrders(nextOrders);
      setPassword(nextPassword);
      if (shouldPersist) {
        sessionStorage.setItem(PASSWORD_KEY, nextPassword);
      }
      return true;
    } catch (loginError) {
      sessionStorage.removeItem(PASSWORD_KEY);
      setPassword("");
      setOrders([]);
      setError(adminErrorMessage(loginError));
      return false;
    } finally {
      setLoading(false);
      setCheckingSession(false);
    }
  }

  async function loadOrders(nextPassword = password) {
    if (!nextPassword) return;

    setLoading(true);
    setError("");

    try {
      const nextOrders = await fetchOrders(nextPassword);
      setDemoMode(false);
      setOrders(nextOrders);
    } catch (fetchError) {
      if (fetchError.status === 401) {
        sessionStorage.removeItem(PASSWORD_KEY);
        setPassword("");
        setOrders([]);
        setDraftPassword(nextPassword);
        setError(adminErrorMessage(fetchError));
      } else if (isLocalhost()) {
        setDemoMode(true);
        setOrders(DEMO_ORDERS);
        setError("Локальный демо-режим: Netlify Functions доступны после деплоя или через netlify dev.");
      } else {
        setError(adminErrorMessage(fetchError));
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, status) {
    if (demoMode) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
        )
      );
      return;
    }

    setError("");
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
      )
    );

    try {
      const response = await fetch("/.netlify/functions/admin-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          id: orderId,
          status
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || "Не удалось обновить статус");
      }

      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
    } catch (statusError) {
      setError(statusError.message || "Не удалось обновить статус");
      loadOrders();
    }
  }

  async function login(event) {
    event.preventDefault();
    const next = draftPassword.trim();
    if (!next) {
      setError("Введите пароль администратора");
      return;
    }

    await verifyLogin(next);
  }

  function logout() {
    sessionStorage.removeItem(PASSWORD_KEY);
    setPassword("");
    setDraftPassword("");
    setOrders([]);
    setError("");
    setDemoMode(false);
  }

  if (!password) {
    return (
      <main className="admin-shell">
        <section className="admin-login">
          <div className="admin-brand">
            <img src="/icons/icon-192.png" alt="" />
            <div>
              <b>Вместе Вкуснее</b>
              <span>Панель заказов</span>
            </div>
          </div>
          <div className="admin-login-card">
            <div className="admin-lock">
              <KeyRound size={30} />
            </div>
            <p className="eyebrow">Админка MVP</p>
            <h1>Войти в заказы</h1>
            <p>
              Тестовый вход по паролю. Пароль хранится только в Netlify Environment Variables как
              <b> ADMIN_PASSWORD</b>.
            </p>
            <form onSubmit={login}>
              <label className="field">
                <span>Пароль администратора</span>
                <input
                  type="password"
                  value={draftPassword}
                  onChange={(event) => setDraftPassword(event.target.value)}
                  placeholder="Введите пароль"
                />
              </label>
              <button className="primary-action" type="submit" disabled={loading || checkingSession}>
                <ShieldCheck size={18} />
                {loading || checkingSession ? "Проверяем..." : "Войти"}
              </button>
            </form>
            {error ? <div className="admin-alert">{error}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/icons/icon-192.png" alt="" />
          <div>
            <b>Вместе Вкуснее</b>
            <span>Панель заказов</span>
          </div>
        </div>
        <div className="admin-toolbar">
          <button type="button" onClick={() => loadOrders()} disabled={loading} aria-label="Обновить">
            <RefreshCw size={18} />
          </button>
          <button type="button" onClick={logout} aria-label="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {demoMode ? (
        <div className="admin-demo-banner">
          Локальный демо-режим. На Netlify здесь будут реальные заказы из Blobs.
        </div>
      ) : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-hero">
        <div>
          <p className="eyebrow">Сегодня</p>
          <h1>{orders.length} заказов</h1>
          <span>Сумма в списке: {formatPrice(revenue)} ₽</span>
        </div>
        <div className="admin-hero-icon">
          <Send size={28} />
        </div>
      </section>

      <section className="admin-stats">
        {stats.map(({ status, count }) => {
          const Icon = STATUS_ICONS[status];
          return (
            <article key={status}>
              <Icon size={18} />
              <span>{STATUS_LABELS[status]}</span>
              <b>{count}</b>
            </article>
          );
        })}
      </section>

      <section className="admin-orders">
        <div className="admin-section-title">
          <h2>Заказы</h2>
          <span>{loading ? "Обновляем..." : "Смена статусов в один клик"}</span>
        </div>

        {orders.length ? (
          orders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status] || CheckCircle2;
            return (
              <article className="admin-order-card" key={order.id}>
                <div className="admin-order-head">
                  <div>
                    <b>#{order.id}</b>
                    <span>
                      <Clock size={15} />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <strong className={`admin-status ${order.status}`}>
                    <StatusIcon size={16} />
                    {STATUS_LABELS[order.status] || "Принят"}
                  </strong>
                </div>

                <div className="admin-order-meta">
                  <div>
                    <UserRound size={16} />
                    <span>
                      <b>{order.customerName || "Гость"}</b>
                      {order.customerPhone || "-"}
                    </span>
                  </div>
                  <div>
                    {order.mode === "pickup" ? <PackageCheck size={16} /> : <Bike size={16} />}
                    <span>
                      <b>{order.mode === "pickup" ? "Самовывоз" : "Доставка"}</b>
                      {compactAddress(order)}
                    </span>
                  </div>
                </div>

                <div className="admin-items">
                  {(order.items || []).map((item, index) => (
                    <div key={`${order.id}-${item.name}-${index}`}>{itemLine(item)}</div>
                  ))}
                </div>

                <div className="admin-order-bottom">
                  <strong>{formatPrice(order.total)} ₽</strong>
                  <span>
                    {order.payment || "оплата при получении"} · push {order.pushEnabled ? "включён" : "не включён"}
                  </span>
                </div>

                <div className="admin-status-actions">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <button
                      key={status}
                      type="button"
                      className={order.status === status ? "active" : ""}
                      onClick={() => updateStatus(order.id, status)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })
        ) : (
          <div className="admin-empty">
            <PackageCheck size={34} />
            <h3>Заказов пока нет</h3>
            <p>Оформите тестовый заказ в приложении, и он появится здесь после отправки в Telegram.</p>
          </div>
        )}
      </section>
    </main>
  );
}
