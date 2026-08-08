import { useEffect, useRef, useState } from "react";
import {
  Baby,
  CakeSlice,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  LogOut,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  Rocket,
  Send,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import { apiPath } from "../../utils/api";
import { isValidRuPhone, normalizePhone } from "../../utils/validators";
import { getCustomerOrdersPath } from "./customerOrders";

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
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
}

function formatChildAge(child) {
  const birthDate = parseStoredDate(child?.birthDate || child?.birthday);
  const age = birthDate ? getAge(birthDate) : Number.isInteger(child?.age) ? child.age : null;

  if (age === null || age < 0) return "Возраст не указан";
  if (age === 0) return "Меньше года";

  const lastTwoDigits = age % 100;
  const lastDigit = age % 10;
  const suffix =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? "лет"
      : lastDigit === 1
        ? "год"
        : lastDigit >= 2 && lastDigit <= 4
          ? "года"
          : "лет";

  return `${age} ${suffix}`;
}

function createProfile(customer) {
  const contactPhone = customer?.contactPhone || customer?.phone || customer?.verifiedPhone || "";
  const hasMarketingConsent = Boolean(customer?.marketingConsent);

  return {
    name: customer?.name || "",
    birthDate: customer?.birthDate || customer?.birthday || "",
    gender: customer?.gender || "",
    phone: contactPhone,
    verifiedPhone: customer?.verifiedPhone || "",
    contactPhone: formatPhoneForProfile(contactPhone),
    email: customer?.email || "",
    receiptsConsent: Boolean(customer?.receiptsConsent || customer?.email),
    personalDataConsent: customer?.personalDataConsent !== false,
    marketingConsent: hasMarketingConsent,
    marketing: {
      email: hasMarketingConsent && (customer?.marketing?.email ?? Boolean(customer?.email)),
      push: hasMarketingConsent && (customer?.marketing?.push ?? true),
      sms: hasMarketingConsent && (customer?.marketing?.sms ?? false)
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
  return (
    <label className={`site-profile-toggle ${disabled ? "is-disabled" : ""}`}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

function ProfileField({ label, value, placeholder, onChange, type = "text", readOnly = false, error = "", hint = "" }) {
  return (
    <label className={`site-profile-field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
      {error ? <em>{error}</em> : null}
    </label>
  );
}

function ConsentCheckbox({ checked, onChange, children, required = false, highlightMissing = false, className = "" }) {
  const classes = [
    "site-auth-consent",
    required ? "is-required" : "",
    highlightMissing ? "is-required-missing" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes}>
      <input
        type="checkbox"
        checked={checked}
        aria-invalid={highlightMissing ? "true" : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <Check size={16} />
      </span>
      <b>
        {children}
        {required ? <em>*</em> : null}
      </b>
      {highlightMissing ? <small className="site-auth-consent-error">Поставьте галочку</small> : null}
    </label>
  );
}

export function SiteAuthModal({ customer, onClose, onAuthenticated, onLogout }) {
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
  const [children, setChildren] = useState(() => customer?.children || []);
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
    modalRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!customer?.id) return;

    setProfile(createProfile(customer));
    setChildren(customer.children || []);
    setIsContactPhoneEditing(false);
  }, [customer]);

  const hasRequiredAuthConsents = Boolean(
    authConsents.legalDocuments &&
      authConsents.privacyPolicy &&
      authConsents.personalData
  );
  const shouldShowRequiredConsentHint = showAuthConsentErrors && !hasRequiredAuthConsents && !authLinkId;
  const isEmailReady = /.+@.+\..+/.test(profile.email.trim());
  const contactPhone = normalizePhone(profile.contactPhone);
  const storedContactPhone = customer?.contactPhone || customer?.phone || customer?.verifiedPhone || "";
  const contactPhoneChanged =
    contactPhone.replace(/\D/g, "") !== String(storedContactPhone).replace(/\D/g, "");
  const contactPhoneIsValid = isValidRuPhone(contactPhone);
  const canSaveProfile = Boolean(
    profile.name.trim() &&
      isEmailReady &&
      profile.receiptsConsent &&
      profile.personalDataConsent
  );
  const childBirthDate = parseRuDate(childDraft.birthDate);
  const childAge = childBirthDate ? getAge(childBirthDate) : null;
  const childBirthError =
    childDraft.birthDate && !childBirthDate
      ? "Введите дату в формате 24.06.2010"
      : childAge !== null && childAge > 18
        ? "Возраст ребёнка не должен быть больше 18 лет"
        : "";
  const canSaveChild = Boolean(
    childDraft.name.trim() &&
      childBirthDate &&
      !childBirthError &&
      childDraft.personalDataConsent
  );

  useEffect(() => {
    if (!authLinkId) return undefined;

    let cancelled = false;
    fetch(`${apiPath("customerAuthLink")}/${encodeURIComponent(authLinkId)}`, {
      credentials: "include"
    })
      .then(readJson)
      .then((data) => {
        if (!cancelled) setAuthLink(data.challenge || null);
      })
      .catch((linkError) => {
        if (!cancelled) setError(linkError.message);
      })
      .finally(() => {
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
          linkChallengeId: authLinkId || undefined,
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
        customer?.phoneVerified &&
          customer?.verifiedPhone &&
          String(customer.verifiedPhone).replace(/\D/g, "") === contactPhone.replace(/\D/g, "")
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
      marketing: value
        ? { ...current.marketing, email: true, push: true, sms: false }
        : { email: false, push: false, sms: false }
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

  const renderSaveNotice = () =>
    saveNotice ? (
      <div className="site-profile-saved" role="status">
        <b>Данные сохранены</b>
        <span>Информация обновится в течение суток</span>
        <button type="button" onClick={() => setSaveNotice(false)}>
          Продолжить
        </button>
      </div>
    ) : null;

  if (customer?.id && !authLinkId) {
    const profileName = profile.name || customer.name || "Гость Вместе Вкуснее";
    const verifiedPhone = formatPhoneForProfile(profile.verifiedPhone || customer.verifiedPhone);

    return (
      <div className="site-auth-layer site-profile-layer" role="presentation">
        <button className="site-auth-scrim" type="button" aria-label="Закрыть кабинет" onClick={onClose} />
        <section
          className="site-auth-modal site-profile-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-auth-title"
          tabIndex={-1}
          ref={modalRef}
        >
          {profileView === "home" ? (
            <>
              <div className="site-profile-header">
                <h2 id="site-auth-title">Мой профиль</h2>
                <span>плюс</span>
              </div>

              <button className="site-profile-person" type="button" onClick={() => setProfileView("data")}>
                <span className="site-profile-avatar">
                  <UserRound size={24} />
                </span>
                <b>{profileName}</b>
                <small>Мои данные</small>
                <ChevronRight size={22} />
              </button>

              <div className="site-profile-bonus-row">
                <article className="site-profile-bonus-card">
                  <Gift size={26} />
                  <strong>0</strong>
                  <span>бонусных баллов</span>
                </article>
                <article className="site-profile-blue-card">
                  <b>Вместе Вкуснее</b>
                  <span>Скоро добавим семейные бонусы</span>
                </article>
              </div>

              <div className="site-profile-menu">
                <button type="button" onClick={() => (window.location.href = getCustomerOrdersPath())}>
                  <PackageCheck size={22} />
                  <span>Мои заказы</span>
                  <ChevronRight size={22} />
                </button>
                <button type="button">
                  <MapPin size={22} />
                  <span>Мои адреса</span>
                  <ChevronRight size={22} />
                </button>
              </div>

              <section className="site-profile-missions">
                <h3>Мои миссии</h3>
                <div>
                  <Rocket size={54} />
                  <b>Собираем вам миссии</b>
                  <p>Следите за новостями. Скоро здесь появятся задания.</p>
                </div>
              </section>

              <section className="site-profile-invite">
                <button type="button" aria-label="Подробнее о приглашении друга">
                  i
                </button>
                <h3>Пригласите друга</h3>
                <p>Программа приглашений появится позже. Расскажем об условиях, когда она начнёт работать.</p>
              </section>

              <button className="site-auth-logout" type="button" onClick={onLogout || onClose}>
                <LogOut size={18} />
                Выйти из кабинета
              </button>
            </>
          ) : null}

          {profileView === "data" ? (
            <>
              <div className="site-profile-header site-profile-header-with-back">
                <button type="button" aria-label="Назад" onClick={() => setProfileView("home")}>
                  <ChevronLeft size={24} />
                </button>
                <h2 id="site-auth-title">Мои данные</h2>
              </div>

              <div className="site-profile-data-form">
                <ProfileField
                  label="Имя"
                  value={profile.name}
                  placeholder="Как к вам обращаться"
                  onChange={(value) => patchProfile({ name: value })}
                />
                <div className="site-profile-field-grid">
                  <ProfileField
                    label="Дата рождения"
                    value={profile.birthDate}
                    placeholder="24.06.1997"
                    onChange={(value) => patchProfile({ birthDate: value })}
                  />
                  <label className="site-profile-field">
                    <span>Пол</span>
                    <select
                      value={profile.gender}
                      onChange={(event) => patchProfile({ gender: event.target.value })}
                    >
                      <option value="">Не указан</option>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </label>
                </div>
                <section className="site-profile-phone-block" aria-labelledby="site-profile-phone-title">
                  <div className="site-profile-phone-heading">
                    <h3 id="site-profile-phone-title">Телефонные номера</h3>
                    <p>Номер аккаунта и номер для связи хранятся отдельно.</p>
                  </div>
                  <ProfileField
                    label="Номер из сервиса входа"
                    value={verifiedPhone || "Не передан"}
                    readOnly
                    hint="Подтверждён сервисом авторизации и здесь не изменяется."
                  />
                  <ProfileField
                    label="Контактный номер для заказов"
                    value={profile.contactPhone}
                    placeholder="+7 (999) 999-99-99"
                    type="tel"
                    readOnly={!isContactPhoneEditing}
                    onChange={patchContactPhone}
                    hint={
                      isContactPhoneEditing
                        ? "Введите номер, по которому ресторан или курьер смогут связаться с вами."
                        : "По этому номеру ресторан или курьер смогут связаться с вами."
                    }
                    error={
                      isContactPhoneEditing
                        ? contactPhoneError || (!contactPhoneIsValid && profile.contactPhone ? "Укажите номер полностью" : "")
                        : ""
                    }
                  />
                  {isContactPhoneEditing ? (
                    <div className="site-profile-contact-actions">
                      <button
                        className="site-profile-contact-save"
                        type="button"
                        disabled={!contactPhoneChanged || !contactPhoneIsValid || isContactPhoneSaving}
                        onClick={saveContactPhone}
                      >
                        {isContactPhoneSaving ? "Сохраняем..." : "Сохранить"}
                      </button>
                      <button
                        className="site-profile-contact-cancel"
                        type="button"
                        disabled={isContactPhoneSaving}
                        onClick={cancelContactPhoneEditing}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      className="site-profile-contact-edit"
                      type="button"
                      onClick={() => {
                        setContactPhoneError("");
                        setContactPhoneSaved(false);
                        setIsContactPhoneEditing(true);
                      }}
                    >
                      <Pencil size={16} />
                      Изменить контактный номер
                    </button>
                  )}
                  {contactPhoneSaved ? (
                    <p className="site-profile-contact-saved" role="status">
                      Контактный номер сохранён
                    </p>
                  ) : null}
                </section>
                <ProfileField
                  label="Эл. почта"
                  value={profile.email}
                  placeholder="email@example.ru"
                  type="email"
                  onChange={(value) => patchProfile({ email: value })}
                  error={profile.email && !isEmailReady ? "Укажите корректную электронную почту" : ""}
                />
              </div>

              <section className="site-profile-children">
                <h3>Мои дети</h3>
                {children.length ? (
                  <div className="site-profile-child-list">
                    {children.map((child) => (
                      <button type="button" key={child.id}>
                        <span>
                          <b>{child.name}</b>
                          <small>{formatChildAge(child)}</small>
                        </span>
                        <ChevronRight size={20} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="site-profile-empty-kids">
                    <CakeSlice size={52} />
                    <b>Счастливый день:</b>
                    <span>укажите дату рождения ребёнка</span>
                  </div>
                )}
                <button className="site-profile-add-child" type="button" onClick={() => setProfileView("child")}>
                  Добавить ребёнка
                  <Plus size={24} />
                </button>
              </section>

              <section className="site-profile-settings">
                <h3>
                  <a href="/legal/e-receipts" target="_blank" rel="noreferrer">
                    Электронные чеки
                  </a>
                </h3>
                <ToggleSwitch
                  label="Получать чеки на электронную почту"
                  checked={profile.receiptsConsent}
                  onChange={(value) => patchProfile({ receiptsConsent: value })}
                />
                {!profile.receiptsConsent ? (
                  <p className="site-profile-warning">Это обязательное согласие: чек нужно отправить клиенту.</p>
                ) : null}

                {profile.marketingConsent ? (
                  <div className="site-profile-marketing-settings">
                    <h3>Акции и промокоды</h3>
                    <p>Выберите, где хотите получать наши предложения.</p>
                    <ToggleSwitch
                      label="E-mail"
                      checked={profile.marketing.email}
                      onChange={(value) => patchMarketing("email", value)}
                    />
                    <ToggleSwitch
                      label="Push-сообщения"
                      checked={profile.marketing.push}
                      onChange={(value) => patchMarketing("push", value)}
                    />
                    <ToggleSwitch
                      label="СМС"
                      checked={profile.marketing.sms}
                      onChange={(value) => patchMarketing("sms", value)}
                    />
                    <button
                      className="site-profile-marketing-revoke"
                      type="button"
                      onClick={() => setProfileMarketingConsent(false)}
                    >
                      Отключить рекламные сообщения
                    </button>
                  </div>
                ) : (
                  <div className="site-profile-marketing-offer">
                    <div className="site-profile-marketing-offer-head">
                      <span aria-hidden="true">
                        <Gift size={21} />
                      </span>
                      <div>
                        <h3>Промокоды и акции для вас</h3>
                        <p>Будем иногда присылать выгодные предложения и новости. Честно-честно: спамить не будем.</p>
                      </div>
                    </div>
                    <ProfileField
                      label="Email для предложений"
                      value={profile.email}
                      placeholder="name@example.ru"
                      type="email"
                      onChange={(value) => patchProfile({ email: value })}
                      error={profile.email && !isEmailReady ? "Укажите корректный email" : ""}
                    />
                    <label className="site-auth-consent site-profile-marketing-consent">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={(event) => {
                          if (event.target.checked) setProfileMarketingConsent(true);
                        }}
                      />
                      <span>
                        <Check size={16} />
                      </span>
                      <b>
                        Хочу получать акции, промокоды и новости о новинках. Условия есть в{" "}
                        <a href="/legal/advertising-consent" target="_blank" rel="noreferrer">
                          согласии на рекламные сообщения
                        </a>
                      </b>
                    </label>
                  </div>
                )}

                <label className="site-auth-consent site-profile-required-consent">
                  <input
                    type="checkbox"
                    checked={profile.personalDataConsent}
                    onChange={(event) => patchProfile({ personalDataConsent: event.target.checked })}
                  />
                  <span>
                    <Check size={16} />
                  </span>
                  <b>
                    Соглашаюсь на обработку{" "}
                    <a href="/legal/personal-data" target="_blank" rel="noreferrer">
                      моих персональных данных
                    </a>
                  </b>
                </label>
              </section>

              {profileSaveError ? <p className="site-profile-save-error">{profileSaveError}</p> : null}
              <button
                className="site-profile-save"
                type="button"
                disabled={!canSaveProfile || isProfileSaving}
                onClick={saveProfile}
              >
                {isProfileSaving ? "Сохраняем..." : "Сохранить"}
              </button>
              <button className="site-profile-delete" type="button">
                Удалить личный кабинет
              </button>
              {renderSaveNotice()}
            </>
          ) : null}

          {profileView === "child" ? (
            <>
              <div className="site-profile-header site-profile-header-with-back">
                <button type="button" aria-label="Назад" onClick={() => setProfileView("data")}>
                  <ChevronLeft size={24} />
                </button>
                <h2 id="site-auth-title">Добавить ребёнка</h2>
              </div>

              <div className="site-child-form">
                <div className="site-child-gender" role="group" aria-label="Пол ребёнка">
                  <button
                    type="button"
                    className={childDraft.gender === "boy" ? "is-active" : ""}
                    onClick={() => setChildDraft((current) => ({ ...current, gender: "boy" }))}
                  >
                    Мальчик
                  </button>
                  <button
                    type="button"
                    className={childDraft.gender === "girl" ? "is-active" : ""}
                    onClick={() => setChildDraft((current) => ({ ...current, gender: "girl" }))}
                  >
                    Девочка
                  </button>
                </div>

                <ProfileField
                  label="Имя"
                  value={childDraft.name}
                  placeholder="Имя"
                  onChange={(value) => {
                    setChildDraft((current) => ({ ...current, name: value }));
                    setSaveNotice(false);
                  }}
                />
                <ProfileField
                  label="Дата рождения"
                  value={childDraft.birthDate}
                  placeholder="24.06.2010"
                  onChange={(value) => {
                    setChildDraft((current) => ({ ...current, birthDate: value }));
                    setSaveNotice(false);
                  }}
                  error={childBirthError}
                />

                <button className="site-profile-save" type="button" disabled={!canSaveChild} onClick={saveChild}>
                  Сохранить
                </button>

                <label className="site-auth-consent site-profile-required-consent">
                  <input
                    type="checkbox"
                    checked={childDraft.personalDataConsent}
                    onChange={(event) =>
                      setChildDraft((current) => ({
                        ...current,
                        personalDataConsent: event.target.checked
                      }))
                    }
                  />
                  <span>
                    <Check size={16} />
                  </span>
                  <b>
                    Соглашаюсь на обработку{" "}
                    <a href="/legal/personal-data" target="_blank" rel="noreferrer">
                      моих персональных данных
                    </a>
                  </b>
                </label>
              </div>
              {renderSaveNotice()}
            </>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="site-auth-layer" role="presentation">
      <button className="site-auth-scrim" type="button" aria-label="Закрыть вход" onClick={onClose} />
      <section
        className="site-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-auth-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <button className="site-auth-close" type="button" aria-label="Закрыть" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="site-auth-head">
          {authLinkId ? <ShieldCheck className="site-auth-link-icon" size={30} /> : null}
          <h2 id="site-auth-title">{authLinkId ? "Подтвердите свой профиль" : "Войти или зарегистрироваться"}</h2>
          <p>
            {authLinkId
              ? "Номер уже связан с профилем. Войдите одним из ранее подключённых способов, и мы добавим новый."
              : "Выберите удобный способ. Telegram передаст подтверждённый номер только с вашего согласия."}
          </p>
        </div>

        {authLinkId ? (
          <>
            {isAuthLinkLoading ? <div className="site-auth-link-loading">Проверяем способы входа...</div> : null}
            {authLink ? (
              <div className="site-auth-link-summary">
                <span>Профиль найден по номеру {authLink.phone}</span>
                <b>Подтвердить через:</b>
              </div>
            ) : null}
            {authLink ? (
              <div className="site-auth-socials" aria-label="Подтверждение профиля">
                {authLink.linkedProviders.includes("yandex") ? (
                  <button
                    className="site-auth-yandex"
                    type="button"
                    onClick={() => startOAuth("yandex")}
                    disabled={isLoading}
                  >
                    <b>Я</b>
                    Войти с Яндекс ID
                  </button>
                ) : null}
                {authLink.linkedProviders.includes("vk") ? (
                  <button className="site-auth-vk is-coming-soon" type="button" disabled title="VK ID временно недоступен">
                    <b>VK</b>
                    VK ID временно недоступен
                  </button>
                ) : null}
                {authLink.linkedProviders.includes("telegram") ? (
                  <button
                    className="site-auth-telegram"
                    type="button"
                    onClick={() => startOAuth("telegram")}
                    disabled={isLoading}
                  >
                    <b><Send size={15} /></b>
                    Войти через Telegram
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="site-auth-socials" aria-label="Быстрый вход">
              <button className="site-auth-yandex" type="button" onClick={() => startOAuth("yandex")} disabled={isLoading}>
                <b>Я</b>
                Войти с Яндекс ID
              </button>
              <button
                className="site-auth-vk is-coming-soon"
                type="button"
                disabled
                title="VK ID скоро появится"
              >
                <b>VK</b>
                VK ID скоро появится
              </button>
              <button
                className="site-auth-telegram"
                type="button"
                onClick={() => startOAuth("telegram")}
                disabled={isLoading}
              >
                <b><Send size={15} /></b>
                Войти через Telegram
              </button>
            </div>

            <div className="site-auth-form">
              <div className="site-auth-consents" aria-label="Согласия на авторизацию">
                <ConsentCheckbox
                  checked={authConsents.legalDocuments}
                  onChange={(value) => patchAuthConsent("legalDocuments", value)}
                  required
                  highlightMissing={showAuthConsentErrors && !authConsents.legalDocuments}
                >
                  Продолжая, вы соглашаетесь с условиями наших{" "}
                  <a href="/legal" target="_blank" rel="noreferrer">
                    юридических документов
                  </a>
                </ConsentCheckbox>
                <ConsentCheckbox
                  checked={authConsents.privacyPolicy}
                  onChange={(value) => patchAuthConsent("privacyPolicy", value)}
                  required
                  highlightMissing={showAuthConsentErrors && !authConsents.privacyPolicy}
                >
                  Соглашаюсь с{" "}
                  <a href="/legal/privacy" target="_blank" rel="noreferrer">
                    политикой конфиденциальности
                  </a>
                </ConsentCheckbox>
                <ConsentCheckbox
                  checked={authConsents.personalData}
                  onChange={(value) => patchAuthConsent("personalData", value)}
                  required
                  highlightMissing={showAuthConsentErrors && !authConsents.personalData}
                >
                  Продолжая авторизацию, вы соглашаетесь на{" "}
                  <a href="/legal/personal-data" target="_blank" rel="noreferrer">
                    сбор и обработку персональных данных
                  </a>
                </ConsentCheckbox>
                <ConsentCheckbox
                  checked={marketingConsent}
                  onChange={(value) => {
                    setMarketingConsent(value);
                    setError("");
                  }}
                  className="site-auth-consent-optional"
                >
                  Хочу получать новости о новинках, акциях, специальных предложениях, промокоды и{" "}
                  <a href="/legal/advertising-consent" target="_blank" rel="noreferrer">
                    другие сообщения рекламного характера
                  </a>
                </ConsentCheckbox>
              </div>
              {shouldShowRequiredConsentHint ? (
                <p className="site-auth-submit-hint" id="site-auth-consent-hint">
                  Для входа проставьте обязательные галочки
                </p>
              ) : null}
            </div>
          </>
        )}

        {error ? <div className="site-auth-error">{error}</div> : null}
      </section>
    </div>
  );
}
