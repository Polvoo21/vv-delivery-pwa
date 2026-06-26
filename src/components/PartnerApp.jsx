import { useEffect, useMemo, useState } from "react";
import { KeyRound, LogOut, RefreshCw, ShieldCheck, TicketPercent, WalletCards } from "lucide-react";
import { apiPath } from "../utils/api";
import { formatPrice } from "../utils/price";

const TOKEN_KEY = "vv_partner_token";

function formatDate(value) {
  if (!value) return "сейчас";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status) {
  if (status === "approved" || status === "paid") return "approved";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

export default function PartnerApp() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [loginForm, setLoginForm] = useState({
    login: "",
    password: ""
  });
  const [partner, setPartner] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  const summary = useMemo(
    () => ({
      orders: commissions.length,
      revenue: commissions.reduce((sum, item) => sum + Number(item.orderTotal || 0), 0),
      commission: commissions.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
      payable: commissions
        .filter((item) => item.status === "approved" || item.status === "paid")
        .reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0)
    }),
    [commissions]
  );

  useEffect(() => {
    if (token) {
      loadDashboard(token);
    }
  }, [token]);

  async function loadDashboard(nextToken = token) {
    if (!nextToken) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiPath("partnerMe"), {
        headers: {
          Authorization: `Bearer ${nextToken}`
        }
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(data.error || "Не удалось загрузить кабинет");
      }

      setPartner(data.partner);
      setCommissions(data.commissions || []);
    } catch (dashboardError) {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setPartner(null);
      setCommissions([]);
      setError(dashboardError.message || "Не удалось загрузить кабинет");
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiPath("partnerLogin"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false || !data.token) {
        throw new Error(data.error || "Не удалось войти");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPartner(data.partner);
    } catch (loginError) {
      setError(loginError.message || "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setPartner(null);
    setCommissions([]);
  }

  if (!token) {
    return (
      <main className="partner-shell">
        <section className="admin-login">
          <div className="admin-brand">
            <img src="/icons/icon-192.png" alt="" />
            <div>
              <b>Вместе Вкуснее</b>
              <span>Кабинет партнёра</span>
            </div>
          </div>
          <div className="admin-login-card">
            <div className="admin-lock">
              <KeyRound size={30} />
            </div>
            <p className="eyebrow">Партнёрская программа</p>
            <h1>Войти в кабинет</h1>
            <p>Логин, пароль и промокод выдаёт администратор пиццерии.</p>
            <form onSubmit={login}>
              <label className="field">
                <span>Логин</span>
                <input
                  value={loginForm.login}
                  onChange={(event) => setLoginForm((current) => ({ ...current, login: event.target.value }))}
                  placeholder="Ваш логин"
                  autoComplete="username"
                />
              </label>
              <label className="field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Ваш пароль"
                  autoComplete="current-password"
                />
              </label>
              <button className="primary-action" type="submit" disabled={loading}>
                <ShieldCheck size={18} />
                {loading ? "Проверяем..." : "Войти"}
              </button>
            </form>
            {error ? <div className="admin-alert">{error}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="partner-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/icons/icon-192.png" alt="" />
          <div>
            <b>{partner?.name || "Партнёр"}</b>
            <span>Промокод {partner?.promoCode || "-"}</span>
          </div>
        </div>
        <div className="admin-toolbar">
          <button type="button" onClick={() => loadDashboard()} disabled={loading} aria-label="Обновить">
            <RefreshCw size={18} />
          </button>
          <button type="button" onClick={logout} aria-label="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-hero partner-hero">
        <div>
          <p className="eyebrow">К выплате</p>
          <h1>{formatPrice(summary.payable)} ₽</h1>
          <span>Комиссия начисляется после статуса заказа «Доставлен».</span>
        </div>
        <div className="admin-hero-icon">
          <WalletCards size={28} />
        </div>
      </section>

      <section className="admin-stats">
        <article>
          <TicketPercent size={18} />
          <span>Промокод</span>
          <b>{partner?.promoCode}</b>
        </article>
        <article>
          <span>Заказы</span>
          <b>{summary.orders}</b>
        </article>
        <article>
          <span>Выручка</span>
          <b>{formatPrice(summary.revenue)} ₽</b>
        </article>
        <article>
          <span>Всего комиссии</span>
          <b>{formatPrice(summary.commission)} ₽</b>
        </article>
      </section>

      <section className="admin-orders">
        <div className="admin-section-title">
          <h2>Заказы по промокоду</h2>
          <span>{loading ? "Обновляем..." : "Номер, сумма и начисление"}</span>
        </div>

        {commissions.length ? (
          commissions.map((commission) => (
            <article className="admin-order-card partner-order-card" key={commission.id}>
              <div className="admin-order-head">
                <div>
                  <b>#{commission.orderId}</b>
                  <span>{formatDate(commission.createdAt)}</span>
                </div>
                <strong className={`partner-commission-status ${statusClass(commission.status)}`}>
                  {commission.statusLabel}
                </strong>
              </div>
              <div className="partner-order-grid">
                <div>
                  <span>Сумма заказа</span>
                  <b>{formatPrice(commission.orderTotal)} ₽</b>
                </div>
                <div>
                  <span>Комиссия</span>
                  <b>{formatPrice(commission.commissionAmount)} ₽</b>
                </div>
                <div>
                  <span>Ставка</span>
                  <b>{commission.commissionPercent}%</b>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="admin-empty">
            <TicketPercent size={34} />
            <h3>Заказов пока нет</h3>
            <p>Когда клиент оформит заказ с вашим промокодом, он появится здесь.</p>
          </div>
        )}
      </section>
    </main>
  );
}
