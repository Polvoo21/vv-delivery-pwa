import { jsxs, jsx, Fragment } from "react/jsx-runtime";
/* empty css                    */
import { useState, useRef, useEffect } from "react";
import { UserRound, ChevronRight, Gift, PackageCheck, MapPin, Rocket, LogOut, ChevronLeft, Pencil, CakeSlice, Plus, Check, X, ShieldCheck, Send } from "lucide-react";
import { b as apiPath } from "../home-ssr.js";
import "react-dom/server";
function normalizePhone(value) {
  var _a;
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("77")) {
    digits = digits.slice(1);
  }
  const normalized = digits.startsWith("8") && digits.length > 1 ? `7${digits.slice(1)}` : digits.startsWith("7") ? digits : digits ? `7${digits}` : "";
  const limited = normalized.slice(0, 11);
  const body = limited.startsWith("7") ? limited.slice(1) : limited;
  const chunks = [
    body.slice(0, 3),
    body.slice(3, 6),
    body.slice(6, 8),
    body.slice(8, 10)
  ];
  if (!body) return "+7 ";
  let result = "+7";
  if (chunks[0]) result += ` (${chunks[0]}`;
  if (((_a = chunks[0]) == null ? void 0 : _a.length) === 3) result += ")";
  if (chunks[1]) result += ` ${chunks[1]}`;
  if (chunks[2]) result += `-${chunks[2]}`;
  if (chunks[3]) result += `-${chunks[3]}`;
  return result;
}
function isValidRuPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("7");
}
function getCustomerOrdersPath(orderId = "") {
  if (typeof window === "undefined") {
    return orderId ? `/account/orders/${encodeURIComponent(orderId)}` : "/account/orders";
  }
  const localPrefix = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.pathname.startsWith("/dev") ? "/dev" : "";
  const base = `${localPrefix}/account/orders`;
  return orderId ? `${base}/${encodeURIComponent(orderId)}` : base;
}
function getAuthLinkId() {
  return new URLSearchParams(window.location.search).get("authLink") || "";
}
function getCleanAuthReturnTo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("authLink");
  return `${url.pathname}${url.search}${url.hash}`;
}
function formatPhoneForProfile(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length !== 11) return phone || "";
  return normalizePhone(digits);
}
function parseRuDate(value) {
  const match = String(value || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}
function parseStoredDate(value) {
  const ruDate = parseRuDate(value);
  if (ruDate) return ruDate;
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}
function getAge(date) {
  const today = /* @__PURE__ */ new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || monthDiff === 0 && today.getDate() < date.getDate()) {
    age -= 1;
  }
  return age;
}
function formatChildAge(child) {
  const birthDate = parseStoredDate((child == null ? void 0 : child.birthDate) || (child == null ? void 0 : child.birthday));
  const age = birthDate ? getAge(birthDate) : Number.isInteger(child == null ? void 0 : child.age) ? child.age : null;
  if (age === null || age < 0) return "Возраст не указан";
  if (age === 0) return "Меньше года";
  const lastTwoDigits = age % 100;
  const lastDigit = age % 10;
  const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 14 ? "лет" : lastDigit === 1 ? "год" : lastDigit >= 2 && lastDigit <= 4 ? "года" : "лет";
  return `${age} ${suffix}`;
}
function createProfile(customer) {
  var _a, _b, _c;
  const contactPhone = (customer == null ? void 0 : customer.contactPhone) || (customer == null ? void 0 : customer.phone) || (customer == null ? void 0 : customer.verifiedPhone) || "";
  const hasMarketingConsent = Boolean(customer == null ? void 0 : customer.marketingConsent);
  return {
    name: (customer == null ? void 0 : customer.name) || "",
    birthDate: (customer == null ? void 0 : customer.birthDate) || (customer == null ? void 0 : customer.birthday) || "",
    gender: (customer == null ? void 0 : customer.gender) || "",
    phone: contactPhone,
    verifiedPhone: (customer == null ? void 0 : customer.verifiedPhone) || "",
    contactPhone: formatPhoneForProfile(contactPhone),
    email: (customer == null ? void 0 : customer.email) || "",
    receiptsConsent: Boolean((customer == null ? void 0 : customer.receiptsConsent) || (customer == null ? void 0 : customer.email)),
    personalDataConsent: (customer == null ? void 0 : customer.personalDataConsent) !== false,
    marketingConsent: hasMarketingConsent,
    marketing: {
      email: hasMarketingConsent && (((_a = customer == null ? void 0 : customer.marketing) == null ? void 0 : _a.email) ?? Boolean(customer == null ? void 0 : customer.email)),
      push: hasMarketingConsent && (((_b = customer == null ? void 0 : customer.marketing) == null ? void 0 : _b.push) ?? true),
      sms: hasMarketingConsent && (((_c = customer == null ? void 0 : customer.marketing) == null ? void 0 : _c.sms) ?? false)
    }
  };
}
async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    const error = new Error(data.error || "Не удалось выполнить запрос");
    if (data.retryAfter) {
      error.retryAfter = data.retryAfter;
    }
    throw error;
  }
  return data;
}
function ToggleSwitch({ checked, onChange, label, disabled = false }) {
  return /* @__PURE__ */ jsxs("label", { className: `site-profile-toggle ${disabled ? "is-disabled" : ""}`, children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "checkbox",
        checked,
        disabled,
        onChange: (event) => onChange(event.target.checked)
      }
    ),
    /* @__PURE__ */ jsx("i", { "aria-hidden": "true" })
  ] });
}
function ProfileField({ label, value, placeholder, onChange, type = "text", readOnly = false, error = "", hint = "" }) {
  return /* @__PURE__ */ jsxs("label", { className: `site-profile-field ${error ? "has-error" : ""}`, children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type,
        value,
        placeholder,
        readOnly,
        onChange: (event) => onChange == null ? void 0 : onChange(event.target.value)
      }
    ),
    hint ? /* @__PURE__ */ jsx("small", { children: hint }) : null,
    error ? /* @__PURE__ */ jsx("em", { children: error }) : null
  ] });
}
function ConsentCheckbox({ checked, onChange, children, required = false, highlightMissing = false, className = "" }) {
  const classes = [
    "site-auth-consent",
    required ? "is-required" : "",
    highlightMissing ? "is-required-missing" : "",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("label", { className: classes, children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "checkbox",
        checked,
        "aria-invalid": highlightMissing ? "true" : void 0,
        onChange: (event) => onChange(event.target.checked)
      }
    ),
    /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Check, { size: 16 }) }),
    /* @__PURE__ */ jsxs("b", { children: [
      children,
      required ? /* @__PURE__ */ jsx("em", { children: "*" }) : null
    ] }),
    highlightMissing ? /* @__PURE__ */ jsx("small", { className: "site-auth-consent-error", children: "Поставьте галочку" }) : null
  ] });
}
function SiteAuthModal({ customer, onClose, onAuthenticated, onLogout }) {
  const [authConsents, setAuthConsents] = useState({
    legalDocuments: false,
    privacyPolicy: false,
    personalData: false
  });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showAuthConsentErrors, setShowAuthConsentErrors] = useState(false);
  const [authLinkId] = useState(getAuthLinkId);
  const [authLink, setAuthLink] = useState(null);
  const [isAuthLinkLoading, setIsAuthLinkLoading] = useState(Boolean(getAuthLinkId()));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileView, setProfileView] = useState("home");
  const [profile, setProfile] = useState(() => createProfile(customer));
  const [children, setChildren] = useState(() => (customer == null ? void 0 : customer.children) || []);
  const [childDraft, setChildDraft] = useState({
    gender: "boy",
    name: "",
    birthDate: "",
    personalDataConsent: false
  });
  const [saveNotice, setSaveNotice] = useState(false);
  const [contactPhoneError, setContactPhoneError] = useState("");
  const [contactPhoneSaved, setContactPhoneSaved] = useState(false);
  const [isContactPhoneSaving, setIsContactPhoneSaving] = useState(false);
  const [isContactPhoneEditing, setIsContactPhoneEditing] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const modalRef = useRef(null);
  useEffect(() => {
    var _a;
    (_a = modalRef.current) == null ? void 0 : _a.focus();
  }, []);
  useEffect(() => {
    if (!(customer == null ? void 0 : customer.id)) return;
    setProfile(createProfile(customer));
    setChildren(customer.children || []);
    setIsContactPhoneEditing(false);
  }, [customer]);
  const hasRequiredAuthConsents = Boolean(
    authConsents.legalDocuments && authConsents.privacyPolicy && authConsents.personalData
  );
  const shouldShowRequiredConsentHint = showAuthConsentErrors && !hasRequiredAuthConsents && !authLinkId;
  const isEmailReady = /.+@.+\..+/.test(profile.email.trim());
  const contactPhone = normalizePhone(profile.contactPhone);
  const storedContactPhone = (customer == null ? void 0 : customer.contactPhone) || (customer == null ? void 0 : customer.phone) || (customer == null ? void 0 : customer.verifiedPhone) || "";
  const contactPhoneChanged = contactPhone.replace(/\D/g, "") !== String(storedContactPhone).replace(/\D/g, "");
  const contactPhoneIsValid = isValidRuPhone(contactPhone);
  const canSaveProfile = Boolean(
    profile.name.trim() && isEmailReady && profile.receiptsConsent && profile.personalDataConsent
  );
  const childBirthDate = parseRuDate(childDraft.birthDate);
  const childAge = childBirthDate ? getAge(childBirthDate) : null;
  const childBirthError = childDraft.birthDate && !childBirthDate ? "Введите дату в формате 24.06.2010" : childAge !== null && childAge > 18 ? "Возраст ребёнка не должен быть больше 18 лет" : "";
  const canSaveChild = Boolean(
    childDraft.name.trim() && childBirthDate && !childBirthError && childDraft.personalDataConsent
  );
  useEffect(() => {
    if (!authLinkId) return void 0;
    let cancelled = false;
    fetch(`${apiPath("customerAuthLink")}/${encodeURIComponent(authLinkId)}`, {
      credentials: "include"
    }).then(readJson).then((data) => {
      if (!cancelled) setAuthLink(data.challenge || null);
    }).catch((linkError) => {
      if (!cancelled) setError(linkError.message);
    }).finally(() => {
      if (!cancelled) setIsAuthLinkLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authLinkId]);
  async function startOAuth(provider) {
    if (!authLinkId && !hasRequiredAuthConsents) {
      setShowAuthConsentErrors(true);
      setError("Поставьте обязательные галочки согласия.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const data = await fetch(apiPath("customerAuthOAuthStart"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          marketingConsent,
          linkChallengeId: authLinkId || void 0,
          returnTo: getCleanAuthReturnTo()
        })
      }).then(readJson);
      window.location.href = data.url;
    } catch (oauthError) {
      setError(oauthError.message);
      setIsLoading(false);
    }
  }
  const patchProfile = (patch) => {
    setProfile((current) => ({ ...current, ...patch }));
    setSaveNotice(false);
    setProfileSaveError("");
  };
  const patchContactPhone = (value) => {
    setProfile((current) => ({ ...current, contactPhone: normalizePhone(value) }));
    setContactPhoneError("");
    setContactPhoneSaved(false);
    setSaveNotice(false);
  };
  const saveContactPhone = async () => {
    if (!contactPhoneIsValid || !contactPhoneChanged || isContactPhoneSaving) return;
    setContactPhoneError("");
    setContactPhoneSaved(false);
    setIsContactPhoneSaving(true);
    try {
      const useVerifiedPhone = Boolean(
        (customer == null ? void 0 : customer.phoneVerified) && (customer == null ? void 0 : customer.verifiedPhone) && String(customer.verifiedPhone).replace(/\D/g, "") === contactPhone.replace(/\D/g, "")
      );
      const data = await fetch(apiPath("customerAuthContactPhone"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(useVerifiedPhone ? { useVerifiedPhone: true } : { phone: contactPhone })
      }).then(readJson);
      const nextCustomer = data.customer || {
        ...customer,
        phone: contactPhone,
        contactPhone
      };
      setProfile(createProfile(nextCustomer));
      onAuthenticated(nextCustomer);
      setContactPhoneSaved(true);
      setIsContactPhoneEditing(false);
    } catch (phoneError) {
      setContactPhoneError(phoneError.message || "Не удалось сохранить контактный номер");
    } finally {
      setIsContactPhoneSaving(false);
    }
  };
  const cancelContactPhoneEditing = () => {
    setProfile((current) => ({
      ...current,
      contactPhone: formatPhoneForProfile(storedContactPhone)
    }));
    setContactPhoneError("");
    setContactPhoneSaved(false);
    setIsContactPhoneEditing(false);
  };
  const patchAuthConsent = (key, value) => {
    setAuthConsents((current) => ({
      ...current,
      [key]: value
    }));
    setError("");
  };
  const patchMarketing = (key, value) => {
    setProfile((current) => ({
      ...current,
      marketing: {
        ...current.marketing,
        [key]: value
      }
    }));
    setSaveNotice(false);
    setProfileSaveError("");
  };
  const setProfileMarketingConsent = (value) => {
    setProfile((current) => ({
      ...current,
      marketingConsent: value,
      marketing: value ? { ...current.marketing, email: true, push: true, sms: false } : { email: false, push: false, sms: false }
    }));
    setSaveNotice(false);
    setProfileSaveError("");
  };
  const saveProfile = async () => {
    if (!canSaveProfile || isProfileSaving) return;
    setIsProfileSaving(true);
    setProfileSaveError("");
    try {
      const data = await fetch(apiPath("customerAuthPreferences"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email.trim(),
          receiptsConsent: profile.receiptsConsent,
          marketingConsent: profile.marketingConsent,
          marketing: profile.marketing
        })
      }).then(readJson);
      const nextCustomer = {
        ...customer,
        ...data.customer,
        name: profile.name.trim(),
        birthDate: profile.birthDate,
        gender: profile.gender,
        personalDataConsent: profile.personalDataConsent,
        children
      };
      onAuthenticated(nextCustomer);
      setProfile(createProfile(nextCustomer));
      setSaveNotice(true);
    } catch (saveError) {
      setProfileSaveError(saveError.message);
    } finally {
      setIsProfileSaving(false);
    }
  };
  const saveChild = () => {
    if (!canSaveChild) return;
    const nextChildren = [
      ...children,
      {
        id: `child_${Date.now()}`,
        gender: childDraft.gender,
        name: childDraft.name.trim(),
        birthDate: childDraft.birthDate,
        age: childAge
      }
    ];
    setChildren(nextChildren);
    onAuthenticated({
      ...customer,
      ...profile,
      children: nextChildren
    });
    setChildDraft({
      gender: "boy",
      name: "",
      birthDate: "",
      personalDataConsent: false
    });
    setProfileView("data");
    setSaveNotice(true);
  };
  const renderSaveNotice = () => saveNotice ? /* @__PURE__ */ jsxs("div", { className: "site-profile-saved", role: "status", children: [
    /* @__PURE__ */ jsx("b", { children: "Данные сохранены" }),
    /* @__PURE__ */ jsx("span", { children: "Информация обновится в течение суток" }),
    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSaveNotice(false), children: "Продолжить" })
  ] }) : null;
  if ((customer == null ? void 0 : customer.id) && !authLinkId) {
    const profileName = profile.name || customer.name || "Гость Вместе Вкуснее";
    const verifiedPhone = formatPhoneForProfile(profile.verifiedPhone || customer.verifiedPhone);
    return /* @__PURE__ */ jsxs("div", { className: "site-auth-layer site-profile-layer", role: "presentation", children: [
      /* @__PURE__ */ jsx("button", { className: "site-auth-scrim", type: "button", "aria-label": "Закрыть кабинет", onClick: onClose }),
      /* @__PURE__ */ jsxs(
        "section",
        {
          className: "site-auth-modal site-profile-panel",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "site-auth-title",
          tabIndex: -1,
          ref: modalRef,
          children: [
            profileView === "home" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "site-profile-header", children: [
                /* @__PURE__ */ jsx("h2", { id: "site-auth-title", children: "Мой профиль" }),
                /* @__PURE__ */ jsx("span", { children: "плюс" })
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "site-profile-person", type: "button", onClick: () => setProfileView("data"), children: [
                /* @__PURE__ */ jsx("span", { className: "site-profile-avatar", children: /* @__PURE__ */ jsx(UserRound, { size: 24 }) }),
                /* @__PURE__ */ jsx("b", { children: profileName }),
                /* @__PURE__ */ jsx("small", { children: "Мои данные" }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 22 })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "site-profile-bonus-row", children: [
                /* @__PURE__ */ jsxs("article", { className: "site-profile-bonus-card", children: [
                  /* @__PURE__ */ jsx(Gift, { size: 26 }),
                  /* @__PURE__ */ jsx("strong", { children: "0" }),
                  /* @__PURE__ */ jsx("span", { children: "бонусных баллов" })
                ] }),
                /* @__PURE__ */ jsxs("article", { className: "site-profile-blue-card", children: [
                  /* @__PURE__ */ jsx("b", { children: "Вместе Вкуснее" }),
                  /* @__PURE__ */ jsx("span", { children: "Скоро добавим семейные бонусы" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "site-profile-menu", children: [
                /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => window.location.href = getCustomerOrdersPath(), children: [
                  /* @__PURE__ */ jsx(PackageCheck, { size: 22 }),
                  /* @__PURE__ */ jsx("span", { children: "Мои заказы" }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 22 })
                ] }),
                /* @__PURE__ */ jsxs("button", { type: "button", children: [
                  /* @__PURE__ */ jsx(MapPin, { size: 22 }),
                  /* @__PURE__ */ jsx("span", { children: "Мои адреса" }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 22 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("section", { className: "site-profile-missions", children: [
                /* @__PURE__ */ jsx("h3", { children: "Мои миссии" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Rocket, { size: 54 }),
                  /* @__PURE__ */ jsx("b", { children: "Собираем вам миссии" }),
                  /* @__PURE__ */ jsx("p", { children: "Следите за новостями. Скоро здесь появятся задания." })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("section", { className: "site-profile-invite", children: [
                /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Подробнее о приглашении друга", children: "i" }),
                /* @__PURE__ */ jsx("h3", { children: "Пригласите друга" }),
                /* @__PURE__ */ jsx("p", { children: "Программа приглашений появится позже. Расскажем об условиях, когда она начнёт работать." })
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "site-auth-logout", type: "button", onClick: onLogout || onClose, children: [
                /* @__PURE__ */ jsx(LogOut, { size: 18 }),
                "Выйти из кабинета"
              ] })
            ] }) : null,
            profileView === "data" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "site-profile-header site-profile-header-with-back", children: [
                /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Назад", onClick: () => setProfileView("home"), children: /* @__PURE__ */ jsx(ChevronLeft, { size: 24 }) }),
                /* @__PURE__ */ jsx("h2", { id: "site-auth-title", children: "Мои данные" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "site-profile-data-form", children: [
                /* @__PURE__ */ jsx(
                  ProfileField,
                  {
                    label: "Имя",
                    value: profile.name,
                    placeholder: "Как к вам обращаться",
                    onChange: (value) => patchProfile({ name: value })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "site-profile-field-grid", children: [
                  /* @__PURE__ */ jsx(
                    ProfileField,
                    {
                      label: "Дата рождения",
                      value: profile.birthDate,
                      placeholder: "24.06.1997",
                      onChange: (value) => patchProfile({ birthDate: value })
                    }
                  ),
                  /* @__PURE__ */ jsxs("label", { className: "site-profile-field", children: [
                    /* @__PURE__ */ jsx("span", { children: "Пол" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: profile.gender,
                        onChange: (event) => patchProfile({ gender: event.target.value }),
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: "Не указан" }),
                          /* @__PURE__ */ jsx("option", { value: "male", children: "Мужской" }),
                          /* @__PURE__ */ jsx("option", { value: "female", children: "Женский" })
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("section", { className: "site-profile-phone-block", "aria-labelledby": "site-profile-phone-title", children: [
                  /* @__PURE__ */ jsxs("div", { className: "site-profile-phone-heading", children: [
                    /* @__PURE__ */ jsx("h3", { id: "site-profile-phone-title", children: "Телефонные номера" }),
                    /* @__PURE__ */ jsx("p", { children: "Номер аккаунта и номер для связи хранятся отдельно." })
                  ] }),
                  /* @__PURE__ */ jsx(
                    ProfileField,
                    {
                      label: "Номер из сервиса входа",
                      value: verifiedPhone || "Не передан",
                      readOnly: true,
                      hint: "Подтверждён сервисом авторизации и здесь не изменяется."
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    ProfileField,
                    {
                      label: "Контактный номер для заказов",
                      value: profile.contactPhone,
                      placeholder: "+7 (999) 999-99-99",
                      type: "tel",
                      readOnly: !isContactPhoneEditing,
                      onChange: patchContactPhone,
                      hint: isContactPhoneEditing ? "Введите номер, по которому ресторан или курьер смогут связаться с вами." : "По этому номеру ресторан или курьер смогут связаться с вами.",
                      error: isContactPhoneEditing ? contactPhoneError || (!contactPhoneIsValid && profile.contactPhone ? "Укажите номер полностью" : "") : ""
                    }
                  ),
                  isContactPhoneEditing ? /* @__PURE__ */ jsxs("div", { className: "site-profile-contact-actions", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        className: "site-profile-contact-save",
                        type: "button",
                        disabled: !contactPhoneChanged || !contactPhoneIsValid || isContactPhoneSaving,
                        onClick: saveContactPhone,
                        children: isContactPhoneSaving ? "Сохраняем..." : "Сохранить"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        className: "site-profile-contact-cancel",
                        type: "button",
                        disabled: isContactPhoneSaving,
                        onClick: cancelContactPhoneEditing,
                        children: "Отмена"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs(
                    "button",
                    {
                      className: "site-profile-contact-edit",
                      type: "button",
                      onClick: () => {
                        setContactPhoneError("");
                        setContactPhoneSaved(false);
                        setIsContactPhoneEditing(true);
                      },
                      children: [
                        /* @__PURE__ */ jsx(Pencil, { size: 16 }),
                        "Изменить контактный номер"
                      ]
                    }
                  ),
                  contactPhoneSaved ? /* @__PURE__ */ jsx("p", { className: "site-profile-contact-saved", role: "status", children: "Контактный номер сохранён" }) : null
                ] }),
                /* @__PURE__ */ jsx(
                  ProfileField,
                  {
                    label: "Эл. почта",
                    value: profile.email,
                    placeholder: "email@example.ru",
                    type: "email",
                    onChange: (value) => patchProfile({ email: value }),
                    error: profile.email && !isEmailReady ? "Укажите корректную электронную почту" : ""
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("section", { className: "site-profile-children", children: [
                /* @__PURE__ */ jsx("h3", { children: "Мои дети" }),
                children.length ? /* @__PURE__ */ jsx("div", { className: "site-profile-child-list", children: children.map((child) => /* @__PURE__ */ jsxs("button", { type: "button", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: child.name }),
                    /* @__PURE__ */ jsx("small", { children: formatChildAge(child) })
                  ] }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 20 })
                ] }, child.id)) }) : /* @__PURE__ */ jsxs("div", { className: "site-profile-empty-kids", children: [
                  /* @__PURE__ */ jsx(CakeSlice, { size: 52 }),
                  /* @__PURE__ */ jsx("b", { children: "Счастливый день:" }),
                  /* @__PURE__ */ jsx("span", { children: "укажите дату рождения ребёнка" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "site-profile-add-child", type: "button", onClick: () => setProfileView("child"), children: [
                  "Добавить ребёнка",
                  /* @__PURE__ */ jsx(Plus, { size: 24 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("section", { className: "site-profile-settings", children: [
                /* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsx("a", { href: "/legal/e-receipts", target: "_blank", rel: "noreferrer", children: "Электронные чеки" }) }),
                /* @__PURE__ */ jsx(
                  ToggleSwitch,
                  {
                    label: "Получать чеки на электронную почту",
                    checked: profile.receiptsConsent,
                    onChange: (value) => patchProfile({ receiptsConsent: value })
                  }
                ),
                !profile.receiptsConsent ? /* @__PURE__ */ jsx("p", { className: "site-profile-warning", children: "Это обязательное согласие: чек нужно отправить клиенту." }) : null,
                profile.marketingConsent ? /* @__PURE__ */ jsxs("div", { className: "site-profile-marketing-settings", children: [
                  /* @__PURE__ */ jsx("h3", { children: "Акции и промокоды" }),
                  /* @__PURE__ */ jsx("p", { children: "Выберите, где хотите получать наши предложения." }),
                  /* @__PURE__ */ jsx(
                    ToggleSwitch,
                    {
                      label: "E-mail",
                      checked: profile.marketing.email,
                      onChange: (value) => patchMarketing("email", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    ToggleSwitch,
                    {
                      label: "Push-сообщения",
                      checked: profile.marketing.push,
                      onChange: (value) => patchMarketing("push", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    ToggleSwitch,
                    {
                      label: "СМС",
                      checked: profile.marketing.sms,
                      onChange: (value) => patchMarketing("sms", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      className: "site-profile-marketing-revoke",
                      type: "button",
                      onClick: () => setProfileMarketingConsent(false),
                      children: "Отключить рекламные сообщения"
                    }
                  )
                ] }) : /* @__PURE__ */ jsxs("div", { className: "site-profile-marketing-offer", children: [
                  /* @__PURE__ */ jsxs("div", { className: "site-profile-marketing-offer-head", children: [
                    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: /* @__PURE__ */ jsx(Gift, { size: 21 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("h3", { children: "Промокоды и акции для вас" }),
                      /* @__PURE__ */ jsx("p", { children: "Будем иногда присылать выгодные предложения и новости. Честно-честно: спамить не будем." })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(
                    ProfileField,
                    {
                      label: "Email для предложений",
                      value: profile.email,
                      placeholder: "name@example.ru",
                      type: "email",
                      onChange: (value) => patchProfile({ email: value }),
                      error: profile.email && !isEmailReady ? "Укажите корректный email" : ""
                    }
                  ),
                  /* @__PURE__ */ jsxs("label", { className: "site-auth-consent site-profile-marketing-consent", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: false,
                        onChange: (event) => {
                          if (event.target.checked) setProfileMarketingConsent(true);
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Check, { size: 16 }) }),
                    /* @__PURE__ */ jsxs("b", { children: [
                      "Хочу получать акции, промокоды и новости о новинках. Условия есть в",
                      " ",
                      /* @__PURE__ */ jsx("a", { href: "/legal/advertising-consent", target: "_blank", rel: "noreferrer", children: "согласии на рекламные сообщения" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "site-auth-consent site-profile-required-consent", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: profile.personalDataConsent,
                      onChange: (event) => patchProfile({ personalDataConsent: event.target.checked })
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Check, { size: 16 }) }),
                  /* @__PURE__ */ jsxs("b", { children: [
                    "Соглашаюсь на обработку",
                    " ",
                    /* @__PURE__ */ jsx("a", { href: "/legal/personal-data", target: "_blank", rel: "noreferrer", children: "моих персональных данных" })
                  ] })
                ] })
              ] }),
              profileSaveError ? /* @__PURE__ */ jsx("p", { className: "site-profile-save-error", children: profileSaveError }) : null,
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "site-profile-save",
                  type: "button",
                  disabled: !canSaveProfile || isProfileSaving,
                  onClick: saveProfile,
                  children: isProfileSaving ? "Сохраняем..." : "Сохранить"
                }
              ),
              /* @__PURE__ */ jsx("button", { className: "site-profile-delete", type: "button", children: "Удалить личный кабинет" }),
              renderSaveNotice()
            ] }) : null,
            profileView === "child" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "site-profile-header site-profile-header-with-back", children: [
                /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Назад", onClick: () => setProfileView("data"), children: /* @__PURE__ */ jsx(ChevronLeft, { size: 24 }) }),
                /* @__PURE__ */ jsx("h2", { id: "site-auth-title", children: "Добавить ребёнка" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "site-child-form", children: [
                /* @__PURE__ */ jsxs("div", { className: "site-child-gender", role: "group", "aria-label": "Пол ребёнка", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: childDraft.gender === "boy" ? "is-active" : "",
                      onClick: () => setChildDraft((current) => ({ ...current, gender: "boy" })),
                      children: "Мальчик"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: childDraft.gender === "girl" ? "is-active" : "",
                      onClick: () => setChildDraft((current) => ({ ...current, gender: "girl" })),
                      children: "Девочка"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  ProfileField,
                  {
                    label: "Имя",
                    value: childDraft.name,
                    placeholder: "Имя",
                    onChange: (value) => {
                      setChildDraft((current) => ({ ...current, name: value }));
                      setSaveNotice(false);
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  ProfileField,
                  {
                    label: "Дата рождения",
                    value: childDraft.birthDate,
                    placeholder: "24.06.2010",
                    onChange: (value) => {
                      setChildDraft((current) => ({ ...current, birthDate: value }));
                      setSaveNotice(false);
                    },
                    error: childBirthError
                  }
                ),
                /* @__PURE__ */ jsx("button", { className: "site-profile-save", type: "button", disabled: !canSaveChild, onClick: saveChild, children: "Сохранить" }),
                /* @__PURE__ */ jsxs("label", { className: "site-auth-consent site-profile-required-consent", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: childDraft.personalDataConsent,
                      onChange: (event) => setChildDraft((current) => ({
                        ...current,
                        personalDataConsent: event.target.checked
                      }))
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Check, { size: 16 }) }),
                  /* @__PURE__ */ jsxs("b", { children: [
                    "Соглашаюсь на обработку",
                    " ",
                    /* @__PURE__ */ jsx("a", { href: "/legal/personal-data", target: "_blank", rel: "noreferrer", children: "моих персональных данных" })
                  ] })
                ] })
              ] }),
              renderSaveNotice()
            ] }) : null
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "site-auth-layer", role: "presentation", children: [
    /* @__PURE__ */ jsx("button", { className: "site-auth-scrim", type: "button", "aria-label": "Закрыть вход", onClick: onClose }),
    /* @__PURE__ */ jsxs(
      "section",
      {
        className: "site-auth-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "site-auth-title",
        tabIndex: -1,
        ref: modalRef,
        children: [
          /* @__PURE__ */ jsx("button", { className: "site-auth-close", type: "button", "aria-label": "Закрыть", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { className: "site-auth-head", children: [
            authLinkId ? /* @__PURE__ */ jsx(ShieldCheck, { className: "site-auth-link-icon", size: 30 }) : null,
            /* @__PURE__ */ jsx("h2", { id: "site-auth-title", children: authLinkId ? "Подтвердите свой профиль" : "Войти или зарегистрироваться" }),
            /* @__PURE__ */ jsx("p", { children: authLinkId ? "Номер уже связан с профилем. Войдите одним из ранее подключённых способов, и мы добавим новый." : "Выберите удобный способ. Telegram передаст подтверждённый номер только с вашего согласия." })
          ] }),
          authLinkId ? /* @__PURE__ */ jsxs(Fragment, { children: [
            isAuthLinkLoading ? /* @__PURE__ */ jsx("div", { className: "site-auth-link-loading", children: "Проверяем способы входа..." }) : null,
            authLink ? /* @__PURE__ */ jsxs("div", { className: "site-auth-link-summary", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Профиль найден по номеру ",
                authLink.phone
              ] }),
              /* @__PURE__ */ jsx("b", { children: "Подтвердить через:" })
            ] }) : null,
            authLink ? /* @__PURE__ */ jsxs("div", { className: "site-auth-socials", "aria-label": "Подтверждение профиля", children: [
              authLink.linkedProviders.includes("yandex") ? /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-auth-yandex",
                  type: "button",
                  onClick: () => startOAuth("yandex"),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsx("b", { children: "Я" }),
                    "Войти с Яндекс ID"
                  ]
                }
              ) : null,
              authLink.linkedProviders.includes("vk") ? /* @__PURE__ */ jsxs("button", { className: "site-auth-vk is-coming-soon", type: "button", disabled: true, title: "VK ID временно недоступен", children: [
                /* @__PURE__ */ jsx("b", { children: "VK" }),
                "VK ID временно недоступен"
              ] }) : null,
              authLink.linkedProviders.includes("telegram") ? /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-auth-telegram",
                  type: "button",
                  onClick: () => startOAuth("telegram"),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsx("b", { children: /* @__PURE__ */ jsx(Send, { size: 15 }) }),
                    "Войти через Telegram"
                  ]
                }
              ) : null
            ] }) : null
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "site-auth-socials", "aria-label": "Быстрый вход", children: [
              /* @__PURE__ */ jsxs("button", { className: "site-auth-yandex", type: "button", onClick: () => startOAuth("yandex"), disabled: isLoading, children: [
                /* @__PURE__ */ jsx("b", { children: "Я" }),
                "Войти с Яндекс ID"
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-auth-vk is-coming-soon",
                  type: "button",
                  disabled: true,
                  title: "VK ID скоро появится",
                  children: [
                    /* @__PURE__ */ jsx("b", { children: "VK" }),
                    "VK ID скоро появится"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-auth-telegram",
                  type: "button",
                  onClick: () => startOAuth("telegram"),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsx("b", { children: /* @__PURE__ */ jsx(Send, { size: 15 }) }),
                    "Войти через Telegram"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "site-auth-form", children: [
              /* @__PURE__ */ jsxs("div", { className: "site-auth-consents", "aria-label": "Согласия на авторизацию", children: [
                /* @__PURE__ */ jsxs(
                  ConsentCheckbox,
                  {
                    checked: authConsents.legalDocuments,
                    onChange: (value) => patchAuthConsent("legalDocuments", value),
                    required: true,
                    highlightMissing: showAuthConsentErrors && !authConsents.legalDocuments,
                    children: [
                      "Продолжая, вы соглашаетесь с условиями наших",
                      " ",
                      /* @__PURE__ */ jsx("a", { href: "/legal", target: "_blank", rel: "noreferrer", children: "юридических документов" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  ConsentCheckbox,
                  {
                    checked: authConsents.privacyPolicy,
                    onChange: (value) => patchAuthConsent("privacyPolicy", value),
                    required: true,
                    highlightMissing: showAuthConsentErrors && !authConsents.privacyPolicy,
                    children: [
                      "Соглашаюсь с",
                      " ",
                      /* @__PURE__ */ jsx("a", { href: "/legal/privacy", target: "_blank", rel: "noreferrer", children: "политикой конфиденциальности" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  ConsentCheckbox,
                  {
                    checked: authConsents.personalData,
                    onChange: (value) => patchAuthConsent("personalData", value),
                    required: true,
                    highlightMissing: showAuthConsentErrors && !authConsents.personalData,
                    children: [
                      "Продолжая авторизацию, вы соглашаетесь на",
                      " ",
                      /* @__PURE__ */ jsx("a", { href: "/legal/personal-data", target: "_blank", rel: "noreferrer", children: "сбор и обработку персональных данных" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  ConsentCheckbox,
                  {
                    checked: marketingConsent,
                    onChange: (value) => {
                      setMarketingConsent(value);
                      setError("");
                    },
                    className: "site-auth-consent-optional",
                    children: [
                      "Хочу получать новости о новинках, акциях, специальных предложениях, промокоды и",
                      " ",
                      /* @__PURE__ */ jsx("a", { href: "/legal/advertising-consent", target: "_blank", rel: "noreferrer", children: "другие сообщения рекламного характера" })
                    ]
                  }
                )
              ] }),
              shouldShowRequiredConsentHint ? /* @__PURE__ */ jsx("p", { className: "site-auth-submit-hint", id: "site-auth-consent-hint", children: "Для входа проставьте обязательные галочки" }) : null
            ] })
          ] }),
          error ? /* @__PURE__ */ jsx("div", { className: "site-auth-error", children: error }) : null
        ]
      }
    )
  ] });
}
export {
  SiteAuthModal
};
