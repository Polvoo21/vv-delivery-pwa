import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TicketPercent,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { apiPath } from "../utils/api";
import { formatPrice } from "../utils/price";

const TOKEN_KEY = "vv_partner_token";
const DEV_PARTNER_TOKEN = "__vv_dev_partner_token__";

const DEV_PARTNER = {
  id: "partner_dev",
  name: "Dev партнёр",
  login: "dev",
  promoCode: "DEV",
  discountPercent: 10,
  commissionPercent: 7,
  payableAmount: 108,
  paidAmount: 112
};

const DEV_COMMISSIONS = [
  {
    id: "commission_dev_1028",
    orderId: "DEV-1028",
    orderTotal: 1540,
    commissionPercent: 7,
    commissionAmount: 108,
    status: "approved",
    statusLabel: "Начислено",
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    items: [
      { name: "Семейное комбо из 3 пицц", qty: 1, weight: "3 пиццы" },
      { name: "Морс ягодный", qty: 2, weight: "0,5 л" }
    ]
  },
  {
    id: "commission_dev_1027",
    orderId: "DEV-1027",
    orderTotal: 1530,
    commissionPercent: 7,
    commissionAmount: 107,
    status: "pending",
    statusLabel: "Ожидает выполнения",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    items: [
      { name: "Пицца Том ям", qty: 1, weight: "30 см" },
      { name: "Добрый Кола", qty: 1, weight: "1 л" }
    ]
  },
  {
    id: "commission_dev_1026",
    orderId: "DEV-1026",
    orderTotal: 1600,
    commissionPercent: 7,
    commissionAmount: 112,
    status: "paid",
    statusLabel: "Выплачено",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    items: [
      { name: "Пепперони", qty: 1, weight: "30 см" },
      { name: "Сырная", qty: 1, weight: "30 см" }
    ]
  }
];

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
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

function statusClass(status) {
  if (status === "approved" || status === "paid") return "approved";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

function isDevCredentials(form) {
  return String(form.login || "").trim().toLowerCase() === "dev" && String(form.password || "") === "dev";
}

function legalHref(path) {
  if (typeof window === "undefined") return path;
  if (window.location.hostname.startsWith("partners.")) {
    return `https://vmestevkusnee.ru${path}`;
  }
  return path;
}

function formatOrderItemMeta(item) {
  return [item.weight, item.addons?.length ? `+ ${item.addons.join(", ")}` : "", item.removed?.length ? `без ${item.removed.join(", ")}` : ""]
    .filter(Boolean)
    .join(" · ");
}

function OrderItemLine({ item }) {
  const meta = formatOrderItemMeta(item);

  return (
    <li>
      <span>
        <b>{item.name}</b>
        {meta ? <small>{meta}</small> : null}
        {item.comboItems?.length ? (
          <em>
            {item.comboItems.map((comboItem) => `${comboItem.name}${comboItem.qty > 1 ? ` × ${comboItem.qty}` : ""}`).join(", ")}
          </em>
        ) : null}
      </span>
      <strong>×{item.qty || 1}</strong>
    </li>
  );
}

export default function PartnerApp() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [loginForm, setLoginForm] = useState(() =>
    isLocalhost()
      ? {
          login: "dev",
          password: "dev"
        }
      : {
          login: "",
          password: ""
        }
  );
  const [partner, setPartner] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => {
    const approvedAmount = commissions
      .filter((item) => item.status === "approved")
      .reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);
    const partnerPayableAmount = Number(partner?.payableAmount);
    const partnerPaidAmount = Number(partner?.paidAmount);
    const paidAmount = commissions
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);

    return {
      orders: commissions.length,
      revenue: commissions.reduce((sum, item) => sum + Number(item.orderTotal || 0), 0),
      commission: commissions.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
      pending: commissions
        .filter((item) => item.status !== "approved" && item.status !== "paid" && item.status !== "cancelled")
        .reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
      payable:
        partner?.payableAmount !== undefined && Number.isFinite(partnerPayableAmount)
          ? partnerPayableAmount
          : approvedAmount,
      paid:
        partner?.paidAmount !== undefined && Number.isFinite(partnerPaidAmount)
          ? partnerPaidAmount
          : paidAmount
    };
  }, [commissions, partner?.paidAmount, partner?.payableAmount]);

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
      if (isLocalhost() && nextToken === DEV_PARTNER_TOKEN) {
        setPartner(DEV_PARTNER);
        setCommissions(DEV_COMMISSIONS);
        return;
      }

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
      if (isLocalhost() && isDevCredentials(loginForm)) {
        localStorage.setItem(TOKEN_KEY, DEV_PARTNER_TOKEN);
        setToken(DEV_PARTNER_TOKEN);
        setPartner(DEV_PARTNER);
        setCommissions(DEV_COMMISSIONS);
        setError("");
        return;
      }

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

  async function copyPromoCode() {
    if (!partner?.promoCode) return;

    try {
      const write = () => {
        const buffer = document.createElement("textarea");
        buffer.value = partner.promoCode;
        buffer.setAttribute("readonly", "");
        buffer.style.position = "fixed";
        buffer.style.opacity = "0";
        document.body.appendChild(buffer);
        buffer.select();
        document.execCommand("copy");
        document.body.removeChild(buffer);
      };

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(partner.promoCode).catch(write);
      } else {
        write();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (!token) {
    return (
      <main className="partner-shell partner-shell-login">
        <section className="partner-login" aria-label="Вход в партнёрский кабинет">
          <div className="partner-login-card">
            <h2>Войти в кабинет</h2>
            <form className="partner-login-form" onSubmit={login}>
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
            {error ? <div className="partner-alert">{error}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="partner-shell partner-shell-workspace">
      <div className="partner-sticky-header">
        <header className="partner-topbar">
          <div className="partner-brand">
            <img src="/assets/site/vv-logo-full.svg" alt="Вместе Вкуснее" />
            <div>
              <b>Партнёрский кабинет</b>
              <span>{partner?.name || "Партнёр"} · {partner?.promoCode || "-"}</span>
            </div>
          </div>
          <div className="partner-toolbar">
            <button type="button" onClick={() => loadDashboard()} disabled={loading} aria-label="Обновить данные">
              <RefreshCw size={18} />
              <span>{loading ? "Обновляем" : "Обновить"}</span>
            </button>
            <button type="button" onClick={logout} aria-label="Выйти из партнёрского кабинета">
              <LogOut size={18} />
              <span>Выйти</span>
            </button>
          </div>
        </header>
      </div>

      {error ? <div className="partner-alert">{error}</div> : null}

      <section className="partner-dashboard">
        <header className="partner-dashboard-heading">
          <div>
            <p className="eyebrow">Партнёр · {partner?.name || "аккаунт"}</p>
            <h1>Сводка партнёра</h1>
          </div>
          <span>Учитываются подтверждённые заказы</span>
        </header>

        <div className="partner-promo-strip">
          <span className="partner-promo-icon" aria-hidden="true">
            <TicketPercent size={18} />
          </span>
          <div>
            <b>Промокод {partner?.promoCode || "-"}</b>
            <span>
              Скидка гостю {partner?.discountPercent || 0}% · комиссия партнёру{" "}
              {partner?.commissionPercent || 0}%
            </span>
          </div>
          <button type="button" onClick={copyPromoCode} disabled={!partner?.promoCode}>
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Скопировано" : "Скопировать код"}
          </button>
        </div>

        <div className="partner-stats" aria-label="Финансовая сводка">
          <article className="partner-stat-card featured">
            <WalletCards size={19} />
            <span>К выплате</span>
            <b>{formatPrice(summary.payable)} ₽</b>
            <small>Начислено, но ещё не выплачено</small>
          </article>
          <article className="partner-stat-card">
            <TicketPercent size={19} />
            <span>Заказы</span>
            <b>{summary.orders}</b>
            <small>{summary.pending ? `${formatPrice(summary.pending)} ₽ ожидает` : "Нет заказов в ожидании"}</small>
          </article>
          <article className="partner-stat-card">
            <TrendingUp size={19} />
            <span>Выручка</span>
            <b>{formatPrice(summary.revenue)} ₽</b>
            <small>Заказы с вашим промокодом</small>
          </article>
          <article className="partner-stat-card">
            <CheckCircle2 size={19} />
            <span>Выплачено</span>
            <b>{formatPrice(summary.paid)} ₽</b>
            <small>Подтверждённые выплаты</small>
          </article>
        </div>
      </section>

      <div className="partner-workspace-grid">
        <section className="partner-orders">
          <div className="partner-section-title">
            <div>
              <h2>История начислений</h2>
              <p>Заказы и комиссия по промокоду {partner?.promoCode || "-"}.</p>
            </div>
            <span>{loading ? "Обновляем..." : `${commissions.length} записей`}</span>
          </div>

          {commissions.length ? (
            <div className="partner-ledger" role="table" aria-label="История партнёрских начислений">
              <div className="partner-ledger-head" role="row">
                <span role="columnheader">Заказ</span>
                <span role="columnheader">Состав</span>
                <span role="columnheader">Статус</span>
                <span role="columnheader">Сумма</span>
                <span role="columnheader">Процент</span>
                <span role="columnheader">Начисление</span>
              </div>

              {commissions.map((commission) => {
                const items = Array.isArray(commission.items) ? commission.items : [];
                return (
                  <article className="partner-ledger-row" role="row" key={commission.id}>
                    <div className="partner-ledger-order" role="cell">
                      <b>#{commission.orderId}</b>
                      <span>{formatDate(commission.createdAt)}</span>
                    </div>

                    <div className="partner-ledger-items" role="cell">
                      {items.length ? (
                        <ul>
                          {items.map((item, index) => (
                            <OrderItemLine item={item} key={`${commission.id}-${item.productId || item.name}-${index}`} />
                          ))}
                        </ul>
                      ) : (
                        <p>Состав заказа не сохранился.</p>
                      )}
                    </div>

                    <div className="partner-ledger-status" role="cell">
                      <strong className={`partner-commission-status ${statusClass(commission.status)}`}>
                        {commission.statusLabel}
                      </strong>
                    </div>
                    <div className="partner-ledger-number" role="cell" data-label="Сумма">
                      <b>{formatPrice(commission.orderTotal)} ₽</b>
                    </div>
                    <div className="partner-ledger-number" role="cell" data-label="Процент">
                      <b>{commission.commissionPercent}%</b>
                    </div>
                    <div className="partner-ledger-number is-accent" role="cell" data-label="Начисление">
                      <b>{formatPrice(commission.commissionAmount)} ₽</b>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="partner-empty">
              <TicketPercent size={32} />
              <h3>Начислений пока нет</h3>
              <p>Заказ с вашим промокодом появится здесь после оформления.</p>
            </div>
          )}
        </section>

        <aside className="partner-aside" aria-label="Условия партнёрской программы">
          <section className="partner-side-card">
            <header>
              <h2>Ваши условия</h2>
              <span>Кратко</span>
            </header>
            <div className="partner-condition-list">
              <div>
                <TicketPercent size={18} />
                <span>
                  <b>Скидка гостю {partner?.discountPercent || 0}%</b>
                  <small>Применяется по коду {partner?.promoCode || "-"}</small>
                </span>
              </div>
              <div>
                <WalletCards size={18} />
                <span>
                  <b>Комиссия {partner?.commissionPercent || 0}%</b>
                  <small>От суммы учтённого заказа</small>
                </span>
              </div>
              <div>
                <CheckCircle2 size={18} />
                <span>
                  <b>Только завершённые заказы</b>
                  <small>Отмены и тестовые заказы не начисляются</small>
                </span>
              </div>
            </div>
          </section>

          <section className="partner-side-card partner-help-card">
            <h2>Вопрос по начислению?</h2>
            <p>Передайте администратору номер заказа из истории. Спорные начисления проверяются вручную.</p>
            <a href={legalHref("/legal/partners")} target="_blank" rel="noreferrer">
              <FileText size={17} />
              Правила партнёрства
            </a>
            <a href={legalHref("/legal/loyalty")} target="_blank" rel="noreferrer">
              <TicketPercent size={17} />
              Правила промокодов
            </a>
          </section>
        </aside>
      </div>
    </main>
  );
}
