import { jsxs, jsx, Fragment } from "react/jsx-runtime";
/* empty css                    */
import { useState, useRef, useMemo, useEffect } from "react";
import { ChevronLeft, Check, Phone, Baby, CalendarDays, Mail } from "lucide-react";
import { b as apiPath } from "../home-ssr.js";
import "react-dom/server";
const STEP_ORDER = ["contact", "children", "email"];
const SITE_ONBOARDING_DEMO_MODE = false;
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
  const date = /* @__PURE__ */ new Date(`${isoDate}T00:00:00`);
  const isRealDate = !Number.isNaN(date.getTime()) && date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month) && date.getDate() === Number(day);
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
  return /* @__PURE__ */ jsxs("div", { className: "site-onboarding-progress", "aria-label": `Шаг ${activeIndex + 1} из 3`, children: [
    /* @__PURE__ */ jsx("div", { className: "site-onboarding-stories", "aria-hidden": "true", children: STEP_ORDER.map((item, index) => /* @__PURE__ */ jsx("i", { className: index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : "" }, item)) }),
    /* @__PURE__ */ jsxs("span", { children: [
      "Шаг ",
      activeIndex + 1,
      " из 3"
    ] })
  ] });
}
function SiteContactPhoneModal({ customer, onSaved, demoMode = false, onComplete }) {
  const [demoStep, setDemoStep] = useState("contact");
  const [stepOverride, setStepOverride] = useState(null);
  const resolvedStep = demoMode ? demoStep : (customer == null ? void 0 : customer.onboardingStep) || ((customer == null ? void 0 : customer.requiresContactPhoneSetup) ? "contact" : "children");
  const step = stepOverride || resolvedStep;
  const verifiedPhone = normalizePhone(customer == null ? void 0 : customer.verifiedPhone);
  const [phone, setPhone] = useState("");
  const [hasChildrenChoice, setHasChildrenChoice] = useState(null);
  const [child, setChild] = useState({ name: "", birthDate: "", personalDataConsent: false });
  const [birthDateInput, setBirthDateInput] = useState("");
  const [email, setEmail] = useState((customer == null ? void 0 : customer.email) || "");
  const [marketingConsent, setMarketingConsent] = useState(Boolean(customer == null ? void 0 : customer.marketingConsent));
  const [emailVerification, setEmailVerification] = useState({ available: false, required: false });
  const [emailChallenge, setEmailChallenge] = useState(null);
  const [emailCode, setEmailCode] = useState("");
  const [resendAfter, setResendAfter] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  const customPhone = useMemo(() => normalizePhone(phone), [phone]);
  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const oldestChildDate = useMemo(() => {
    const date = /* @__PURE__ */ new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  }, []);
  const birthDateInvalid = birthDateInput.length === 10 && !child.birthDate;
  useEffect(() => {
    var _a;
    (_a = modalRef.current) == null ? void 0 : _a.focus();
  }, [step]);
  useEffect(() => {
    if (step === "email") {
      setEmail((customer == null ? void 0 : customer.email) || "");
      setEmailChallenge(null);
      setEmailCode("");
      fetch(apiPath("customerAuthEmailVerificationConfig"), { credentials: "include" }).then(readJson).then((data) => setEmailVerification({ available: Boolean(data.available), required: Boolean(data.required) })).catch(() => setEmailVerification({ available: false, required: false }));
    }
    setError("");
  }, [customer == null ? void 0 : customer.email, step]);
  useEffect(() => {
    if (resendAfter <= 0) return void 0;
    const timer = window.setInterval(() => setResendAfter((value) => Math.max(0, value - 1)), 1e3);
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
        onComplete == null ? void 0 : onComplete();
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
        marketingConsent: (customer == null ? void 0 : customer.marketingConsent) || marketingConsent
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
          marketingConsent: (customer == null ? void 0 : customer.marketingConsent) || marketingConsent
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
    if (!(emailChallenge == null ? void 0 : emailChallenge.id) || emailCode.length !== 6 || isSaving) return;
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
      onComplete == null ? void 0 : onComplete();
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
  return /* @__PURE__ */ jsxs("div", { className: "site-auth-layer site-contact-phone-layer", role: "presentation", children: [
    /* @__PURE__ */ jsx("div", { className: "site-auth-scrim", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs(
      "section",
      {
        className: "site-auth-modal site-contact-phone-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "site-contact-phone-title",
        tabIndex: -1,
        ref: modalRef,
        children: [
          /* @__PURE__ */ jsx(OnboardingProgress, { step }),
          step !== "contact" ? /* @__PURE__ */ jsxs(
            "button",
            {
              className: "site-onboarding-back",
              type: "button",
              disabled: isSaving,
              onClick: handleBack,
              children: [
                /* @__PURE__ */ jsx(ChevronLeft, { size: 18 }),
                "Назад"
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxs("div", { className: "site-contact-phone-head", children: [
            /* @__PURE__ */ jsx("h2", { id: "site-contact-phone-title", children: stepMeta.title }),
            /* @__PURE__ */ jsx("p", { children: stepMeta.text })
          ] }),
          step === "contact" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            verifiedPhone ? /* @__PURE__ */ jsxs("div", { className: "site-contact-phone-detected", children: [
              /* @__PURE__ */ jsx("span", { children: "Сервис входа подтвердил ваш номер" }),
              /* @__PURE__ */ jsx("strong", { children: formatPhone(verifiedPhone) }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  disabled: isSaving,
                  onClick: () => saveStep("customerAuthContactPhone", { useVerifiedPhone: true }),
                  children: [
                    /* @__PURE__ */ jsx(Check, { size: 18 }),
                    "Оставить этот номер"
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsx("p", { className: "site-contact-phone-missing", children: "Сервис входа не передал номер. Укажите контакт для заказа." }),
            verifiedPhone ? /* @__PURE__ */ jsx("div", { className: "site-contact-phone-divider", children: /* @__PURE__ */ jsx("span", { children: "или другой номер" }) }) : null,
            /* @__PURE__ */ jsxs("label", { className: "site-contact-phone-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Контактный номер" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Phone, { size: 19 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "tel",
                    inputMode: "tel",
                    autoComplete: "tel",
                    value: phone,
                    placeholder: "+7 (___) ___-__-__",
                    onChange: (event) => {
                      setPhone(formatPhoneInput(event.target.value));
                      setError("");
                    }
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "site-contact-phone-submit",
                type: "button",
                disabled: !customPhone || isSaving,
                onClick: () => saveStep("customerAuthContactPhone", { phone: customPhone }),
                children: isSaving ? "Сохраняем..." : "Использовать этот номер"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "site-contact-phone-note", children: "Способ входа не изменится. В аккаунт вы по-прежнему входите через выбранный сервис." })
          ] }) : null,
          step === "children" && hasChildrenChoice !== true ? /* @__PURE__ */ jsxs("div", { className: "site-onboarding-choice", children: [
            /* @__PURE__ */ jsx("button", { type: "button", disabled: isSaving, onClick: () => setHasChildrenChoice(true), children: "Да, есть" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                disabled: isSaving,
                onClick: () => saveStep("customerAuthOnboardingChildren", { hasChildren: false }),
                children: isSaving ? "Сохраняем..." : "Нет"
              }
            )
          ] }) : null,
          step === "children" && hasChildrenChoice === true ? /* @__PURE__ */ jsxs("div", { className: "site-onboarding-child-form", children: [
            /* @__PURE__ */ jsxs("label", { className: "site-contact-phone-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Имя ребёнка" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Baby, { size: 19 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: child.name,
                    autoComplete: "off",
                    placeholder: "Как зовут ребёнка",
                    onChange: (event) => setChild((current) => ({ ...current, name: event.target.value }))
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: `site-contact-phone-field ${birthDateInvalid ? "has-error" : ""}`, children: [
              /* @__PURE__ */ jsx("span", { children: "Дата рождения" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(CalendarDays, { size: 19 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    inputMode: "numeric",
                    autoComplete: "bday",
                    maxLength: 10,
                    placeholder: "ДД.ММ.ГГГГ",
                    value: birthDateInput,
                    onChange: (event) => {
                      const nextValue = formatBirthDateInput(event.target.value);
                      setBirthDateInput(nextValue);
                      setChild((current) => ({
                        ...current,
                        birthDate: parseBirthDate(nextValue, oldestChildDate, today)
                      }));
                      setError("");
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("small", { children: birthDateInvalid ? "Проверьте дату рождения" : "Например, 24.06.2020" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "site-onboarding-consent", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: child.personalDataConsent,
                  onChange: (event) => setChild((current) => ({ ...current, personalDataConsent: event.target.checked }))
                }
              ),
              /* @__PURE__ */ jsx("span", { children: "Я законный представитель и согласен на сохранение этих данных" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "site-contact-phone-submit",
                type: "button",
                disabled: !child.name.trim() || !child.birthDate || !child.personalDataConsent || isSaving,
                onClick: () => saveStep("customerAuthOnboardingChildren", { hasChildren: true, child }),
                children: isSaving ? "Сохраняем..." : "Добавить и продолжить"
              }
            )
          ] }) : null,
          step === "email" ? /* @__PURE__ */ jsxs("div", { className: "site-onboarding-email-form", children: [
            /* @__PURE__ */ jsxs("label", { className: "site-contact-phone-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Email" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Mail, { size: 19 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    inputMode: "email",
                    autoComplete: "email",
                    value: email,
                    placeholder: "name@example.ru",
                    onChange: (event) => {
                      setEmail(event.target.value);
                      setEmailChallenge(null);
                      setEmailCode("");
                      setError("");
                    },
                    disabled: Boolean(emailChallenge) || isSaving
                  }
                )
              ] })
            ] }),
            (customer == null ? void 0 : customer.marketingConsent) ? /* @__PURE__ */ jsx("p", { className: "site-onboarding-marketing-note", children: "Рекламные письма отправляем только с согласия. Вы уже дали его при входе, поэтому повторно ничего отмечать не нужно." }) : /* @__PURE__ */ jsxs("div", { className: "site-onboarding-marketing-offer", children: [
              /* @__PURE__ */ jsx("p", { children: "Можно ещё получать акции и промокоды. Только с вашего согласия, честно-честно спамить не будем." }),
              /* @__PURE__ */ jsxs("label", { className: "site-onboarding-consent", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: marketingConsent,
                    onChange: (event) => setMarketingConsent(event.target.checked)
                  }
                ),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Хочу получать акции, промокоды и новости о новинках. Условия есть в",
                  " ",
                  /* @__PURE__ */ jsx("a", { href: "/legal/advertising-consent", target: "_blank", rel: "noreferrer", children: "согласии на рекламные сообщения" })
                ] })
              ] })
            ] }),
            emailChallenge ? /* @__PURE__ */ jsxs("div", { className: "site-onboarding-email-code", children: [
              /* @__PURE__ */ jsxs("label", { className: "site-contact-phone-field", children: [
                /* @__PURE__ */ jsx("span", { children: "Код из письма" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Mail, { size: 19 }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      inputMode: "numeric",
                      autoComplete: "one-time-code",
                      maxLength: 6,
                      value: emailCode,
                      placeholder: "000000",
                      onChange: (event) => {
                        setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                      },
                      autoFocus: true
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "site-onboarding-marketing-note", children: [
                "Отправили код на ",
                /* @__PURE__ */ jsx("strong", { children: emailChallenge.email }),
                ". Он действует 10 минут."
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "site-contact-phone-submit",
                  type: "button",
                  disabled: emailCode.length !== 6 || isSaving,
                  onClick: verifyEmail,
                  children: isSaving ? "Проверяем..." : "Подтвердить email"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "site-onboarding-skip",
                  type: "button",
                  disabled: resendAfter > 0 || isSaving,
                  onClick: startEmailVerification,
                  children: resendAfter > 0 ? `Отправить снова через ${resendAfter} сек.` : "Отправить код снова"
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              "button",
              {
                className: "site-contact-phone-submit",
                type: "button",
                disabled: !emailReady || isSaving,
                onClick: startEmailVerification,
                children: isSaving ? "Отправляем..." : emailVerification.available ? "Получить код" : "Сохранить email"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "site-contact-phone-note", children: "Email не меняет способ входа. Рекламные письма отправляем только с отдельного согласия." })
          ] }) : null,
          error ? /* @__PURE__ */ jsx("p", { className: "site-auth-error", role: "alert", children: error }) : null
        ]
      }
    )
  ] });
}
export {
  SITE_ONBOARDING_DEMO_MODE,
  SiteContactPhoneModal
};
