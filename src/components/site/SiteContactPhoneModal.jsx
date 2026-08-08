import { useEffect, useMemo, useRef, useState } from "react";
import { Baby, CalendarDays, Check, ChevronLeft, Mail, Phone } from "lucide-react";
import { apiPath } from "../../utils/api";

const STEP_ORDER = ["contact", "children", "email"];

// Enable only when the onboarding flow needs to be shown independently of account state.
export const SITE_ONBOARDING_DEMO_MODE = false;

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  return "";
}

function formatPhone(value) {
  const normalized = normalizePhone(value);
  if (!normalized) return value || "";
  const digits = normalized.slice(2);
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

function formatPhoneInput(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const local = digits.slice(1);
  let result = "+7";
  if (local.length) result += ` (${local.slice(0, 3)}`;
  if (local.length >= 3) result += ")";
  if (local.length > 3) result += ` ${local.slice(3, 6)}`;
  if (local.length > 6) result += `-${local.slice(6, 8)}`;
  if (local.length > 8) result += `-${local.slice(8, 10)}`;
  return result;
}

function formatBirthDateInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function parseBirthDate(value, minDate, maxDate) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || ""));
  if (!match) return "";

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const date = new Date(`${isoDate}T00:00:00`);
  const isRealDate =
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day);

  if (!isRealDate || isoDate < minDate || isoDate > maxDate) return "";
  return isoDate;
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось сохранить данные");
  }
  return data;
}

function OnboardingProgress({ step }) {
  const activeIndex = Math.max(0, STEP_ORDER.indexOf(step));
  return (
    <div className="site-onboarding-progress" aria-label={`Шаг ${activeIndex + 1} из 3`}>
      <div className="site-onboarding-stories" aria-hidden="true">
        {STEP_ORDER.map((item, index) => (
          <i key={item} className={index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : ""} />
        ))}
      </div>
      <span>Шаг {activeIndex + 1} из 3</span>
    </div>
  );
}

export function SiteContactPhoneModal({ customer, onSaved, demoMode = false, onComplete }) {
  const [demoStep, setDemoStep] = useState("contact");
  const [stepOverride, setStepOverride] = useState(null);
  const resolvedStep = demoMode
    ? demoStep
    : customer?.onboardingStep || (customer?.requiresContactPhoneSetup ? "contact" : "children");
  const step = stepOverride || resolvedStep;
  const verifiedPhone = normalizePhone(customer?.verifiedPhone);
  const [phone, setPhone] = useState("");
  const [hasChildrenChoice, setHasChildrenChoice] = useState(null);
  const [child, setChild] = useState({ name: "", birthDate: "", personalDataConsent: false });
  const [birthDateInput, setBirthDateInput] = useState("");
  const [email, setEmail] = useState(customer?.email || "");
  const [marketingConsent, setMarketingConsent] = useState(Boolean(customer?.marketingConsent));
  const [emailVerification, setEmailVerification] = useState({ available: false, required: false });
  const [emailChallenge, setEmailChallenge] = useState(null);
  const [emailCode, setEmailCode] = useState("");
  const [resendAfter, setResendAfter] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  const customPhone = useMemo(() => normalizePhone(phone), [phone]);
  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const today = new Date().toISOString().slice(0, 10);
  const oldestChildDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  }, []);
  const birthDateInvalid = birthDateInput.length === 10 && !child.birthDate;

  useEffect(() => {
    modalRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step === "email") {
      setEmail(customer?.email || "");
      setEmailChallenge(null);
      setEmailCode("");
      fetch(apiPath("customerAuthEmailVerificationConfig"), { credentials: "include" })
        .then(readJson)
        .then((data) => setEmailVerification({ available: Boolean(data.available), required: Boolean(data.required) }))
        .catch(() => setEmailVerification({ available: false, required: false }));
    }
    setError("");
  }, [customer?.email, step]);

  useEffect(() => {
    if (resendAfter <= 0) return undefined;
    const timer = window.setInterval(() => setResendAfter((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendAfter]);

  async function saveStep(apiName, payload) {
    setError("");
    setIsSaving(true);
    try {
      const data = await fetch(apiPath(apiName), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(readJson);
      onSaved(data.customer);

      if (step === "email") {
        onComplete?.();
      } else {
        setStepOverride(null);
        if (demoMode) {
          setDemoStep(step === "contact" ? "children" : "email");
        }
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function startEmailVerification() {
    if (!emailReady || isSaving) return;
    if (!emailVerification.available) {
      await saveStep("customerAuthOnboardingEmail", {
        email: email.trim(),
        marketingConsent: customer?.marketingConsent || marketingConsent
      });
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const data = await fetch(apiPath("customerAuthEmailVerificationStart"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          marketingConsent: customer?.marketingConsent || marketingConsent
        })
      }).then(readJson);
      setEmailChallenge({ id: data.challengeId, email: data.email });
      setEmailCode("");
      setResendAfter(Number(data.retryAfterSeconds || 60));
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function verifyEmail() {
    if (!emailChallenge?.id || emailCode.length !== 6 || isSaving) return;
    setError("");
    setIsSaving(true);
    try {
      const data = await fetch(apiPath("customerAuthEmailVerificationVerify"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: emailChallenge.id, code: emailCode })
      }).then(readJson);
      onSaved(data.customer);
      onComplete?.();
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    setError("");

    if (step === "email") {
      setHasChildrenChoice(null);
      setStepOverride("children");
      return;
    }

    if (step === "children") {
      if (hasChildrenChoice === true) {
        setHasChildrenChoice(null);
      } else {
        setStepOverride("contact");
      }
      return;
    }

  }

  const stepMeta = {
    contact: {
      title: "Как с вами связаться?",
      text: "Этот номер увидят только ресторан и курьер при выполнении заказа."
    },
    children: {
      title: "У вас есть дети?",
      text: "Сохраним дату и поздравим ребёнка с днём рождения."
    },
    email: {
      title: "Подтвердите email",
      text: "На него будем отправлять электронные чеки и сервисные уведомления о заказах."
    }
  }[step] || {};

  return (
    <div className="site-auth-layer site-contact-phone-layer" role="presentation">
      <div className="site-auth-scrim" aria-hidden="true" />
      <section
        className="site-auth-modal site-contact-phone-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-contact-phone-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <OnboardingProgress step={step} />
        {step !== "contact" ? (
          <button
            className="site-onboarding-back"
            type="button"
            disabled={isSaving}
            onClick={handleBack}
          >
            <ChevronLeft size={18} />
            Назад
          </button>
        ) : null}
        <div className="site-contact-phone-head">
          <h2 id="site-contact-phone-title">{stepMeta.title}</h2>
          <p>{stepMeta.text}</p>
        </div>

        {step === "contact" ? (
          <>
            {verifiedPhone ? (
              <div className="site-contact-phone-detected">
                <span>Сервис входа подтвердил ваш номер</span>
                <strong>{formatPhone(verifiedPhone)}</strong>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => saveStep("customerAuthContactPhone", { useVerifiedPhone: true })}
                >
                  <Check size={18} />
                  Оставить этот номер
                </button>
              </div>
            ) : (
              <p className="site-contact-phone-missing">Сервис входа не передал номер. Укажите контакт для заказа.</p>
            )}

            {verifiedPhone ? <div className="site-contact-phone-divider"><span>или другой номер</span></div> : null}

            <label className="site-contact-phone-field">
              <span>Контактный номер</span>
              <div>
                <Phone size={19} />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  placeholder="+7 (___) ___-__-__"
                  onChange={(event) => {
                    setPhone(formatPhoneInput(event.target.value));
                    setError("");
                  }}
                />
              </div>
            </label>
            <button
              className="site-contact-phone-submit"
              type="button"
              disabled={!customPhone || isSaving}
              onClick={() => saveStep("customerAuthContactPhone", { phone: customPhone })}
            >
              {isSaving ? "Сохраняем..." : "Использовать этот номер"}
            </button>
            <p className="site-contact-phone-note">
              Способ входа не изменится. В аккаунт вы по-прежнему входите через выбранный сервис.
            </p>
          </>
        ) : null}

        {step === "children" && hasChildrenChoice !== true ? (
          <div className="site-onboarding-choice">
            <button type="button" disabled={isSaving} onClick={() => setHasChildrenChoice(true)}>
              Да, есть
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => saveStep("customerAuthOnboardingChildren", { hasChildren: false })}
            >
              {isSaving ? "Сохраняем..." : "Нет"}
            </button>
          </div>
        ) : null}

        {step === "children" && hasChildrenChoice === true ? (
          <div className="site-onboarding-child-form">
            <label className="site-contact-phone-field">
              <span>Имя ребёнка</span>
              <div>
                <Baby size={19} />
                <input
                  value={child.name}
                  autoComplete="off"
                  placeholder="Как зовут ребёнка"
                  onChange={(event) => setChild((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
            </label>
            <label className={`site-contact-phone-field ${birthDateInvalid ? "has-error" : ""}`}>
              <span>Дата рождения</span>
              <div>
                <CalendarDays size={19} />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  maxLength={10}
                  placeholder="ДД.ММ.ГГГГ"
                  value={birthDateInput}
                  onChange={(event) => {
                    const nextValue = formatBirthDateInput(event.target.value);
                    setBirthDateInput(nextValue);
                    setChild((current) => ({
                      ...current,
                      birthDate: parseBirthDate(nextValue, oldestChildDate, today)
                    }));
                    setError("");
                  }}
                />
              </div>
              <small>{birthDateInvalid ? "Проверьте дату рождения" : "Например, 24.06.2020"}</small>
            </label>
            <label className="site-onboarding-consent">
              <input
                type="checkbox"
                checked={child.personalDataConsent}
                onChange={(event) =>
                  setChild((current) => ({ ...current, personalDataConsent: event.target.checked }))
                }
              />
              <span>Я законный представитель и согласен на сохранение этих данных</span>
            </label>
            <button
              className="site-contact-phone-submit"
              type="button"
              disabled={!child.name.trim() || !child.birthDate || !child.personalDataConsent || isSaving}
              onClick={() => saveStep("customerAuthOnboardingChildren", { hasChildren: true, child })}
            >
              {isSaving ? "Сохраняем..." : "Добавить и продолжить"}
            </button>
          </div>
        ) : null}

        {step === "email" ? (
          <div className="site-onboarding-email-form">
            <label className="site-contact-phone-field">
              <span>Email</span>
              <div>
                <Mail size={19} />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  placeholder="name@example.ru"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailChallenge(null);
                    setEmailCode("");
                    setError("");
                  }}
                  disabled={Boolean(emailChallenge) || isSaving}
                />
              </div>
            </label>
            {customer?.marketingConsent ? (
              <p className="site-onboarding-marketing-note">
                Рекламные письма отправляем только с согласия. Вы уже дали его при входе, поэтому повторно
                ничего отмечать не нужно.
              </p>
            ) : (
              <div className="site-onboarding-marketing-offer">
                <p>Можно ещё получать акции и промокоды. Только с вашего согласия, честно-честно спамить не будем.</p>
                <label className="site-onboarding-consent">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                  />
                  <span>
                    Хочу получать акции, промокоды и новости о новинках. Условия есть в{" "}
                    <a href="/legal/advertising-consent" target="_blank" rel="noreferrer">
                      согласии на рекламные сообщения
                    </a>
                  </span>
                </label>
              </div>
            )}
            {emailChallenge ? (
              <div className="site-onboarding-email-code">
                <label className="site-contact-phone-field">
                  <span>Код из письма</span>
                  <div>
                    <Mail size={19} />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={emailCode}
                      placeholder="000000"
                      onChange={(event) => {
                        setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                      }}
                      autoFocus
                    />
                  </div>
                </label>
                <p className="site-onboarding-marketing-note">
                  Отправили код на <strong>{emailChallenge.email}</strong>. Он действует 10 минут.
                </p>
                <button
                  className="site-contact-phone-submit"
                  type="button"
                  disabled={emailCode.length !== 6 || isSaving}
                  onClick={verifyEmail}
                >
                  {isSaving ? "Проверяем..." : "Подтвердить email"}
                </button>
                <button
                  className="site-onboarding-skip"
                  type="button"
                  disabled={resendAfter > 0 || isSaving}
                  onClick={startEmailVerification}
                >
                  {resendAfter > 0 ? `Отправить снова через ${resendAfter} сек.` : "Отправить код снова"}
                </button>
              </div>
            ) : (
              <button
                className="site-contact-phone-submit"
                type="button"
                disabled={!emailReady || isSaving}
                onClick={startEmailVerification}
              >
                {isSaving
                  ? "Отправляем..."
                  : emailVerification.available
                    ? "Получить код"
                    : "Сохранить email"}
              </button>
            )}
            <p className="site-contact-phone-note">
              Email не меняет способ входа. Рекламные письма отправляем только с отдельного согласия.
            </p>
          </div>
        ) : null}

        {error ? <p className="site-auth-error" role="alert">{error}</p> : null}
      </section>
    </div>
  );
}
