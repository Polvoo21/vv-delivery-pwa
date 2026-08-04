export const DELIVERY_SETTINGS_STORAGE_KEY = "vv_delivery_timing_settings";

export const DEFAULT_DELIVERY_SETTINGS = {
  minMinutes: 30,
  baseMinutes: 45,
  currentMinutes: 45,
  stepMinutes: 15,
  maxMinutes: 120
};

export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 22;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeDeliveryMinutes(value) {
  const number = Number(value);
  const minutes = Number.isFinite(number) ? number : DEFAULT_DELIVERY_SETTINGS.currentMinutes;
  const rounded = Math.round(minutes / DEFAULT_DELIVERY_SETTINGS.stepMinutes) * DEFAULT_DELIVERY_SETTINGS.stepMinutes;
  return clamp(rounded, DEFAULT_DELIVERY_SETTINGS.minMinutes, DEFAULT_DELIVERY_SETTINGS.maxMinutes);
}

export function normalizeDeliverySettings(settings = {}) {
  return {
    ...DEFAULT_DELIVERY_SETTINGS,
    ...settings,
    minMinutes: DEFAULT_DELIVERY_SETTINGS.minMinutes,
    baseMinutes: DEFAULT_DELIVERY_SETTINGS.baseMinutes,
    stepMinutes: DEFAULT_DELIVERY_SETTINGS.stepMinutes,
    maxMinutes: DEFAULT_DELIVERY_SETTINGS.maxMinutes,
    currentMinutes: normalizeDeliveryMinutes(settings.currentMinutes)
  };
}

export function readStoredDeliverySettings() {
  if (typeof window === "undefined") {
    return DEFAULT_DELIVERY_SETTINGS;
  }

  try {
    return normalizeDeliverySettings(JSON.parse(window.localStorage.getItem(DELIVERY_SETTINGS_STORAGE_KEY) || "{}"));
  } catch {
    return DEFAULT_DELIVERY_SETTINGS;
  }
}

export function saveStoredDeliverySettings(settings) {
  const normalized = normalizeDeliverySettings(settings);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(DELIVERY_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (safeMinutes < 60) return `${safeMinutes} мин`;

  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function formatDurationRange(fromMinutes, toMinutes) {
  const from = Math.max(0, Math.round(Number(fromMinutes) || 0));
  const to = Math.max(0, Math.round(Number(toMinutes) || 0));

  if (from < 60 && to < 60) {
    return `${from}-${to} мин`;
  }

  return `${formatDuration(from)}-${formatDuration(to)}`;
}

export function getDeliveryLoadLevel(settings) {
  const normalized = normalizeDeliverySettings(settings);
  if (normalized.currentMinutes <= normalized.baseMinutes) {
    return "low";
  }

  return normalized.currentMinutes >= 105 ? "high" : "average";
}

export function getDeliveryLoadLabel(settings) {
  const level = getDeliveryLoadLevel(settings);

  if (level === "low") return "низкая загруженность";
  if (level === "high") return "высокая загруженность";

  return "средняя загруженность";
}

export function getDeliveryEtaLabel(settings) {
  const normalized = normalizeDeliverySettings(settings);
  return `≈ ${formatDuration(normalized.currentMinutes)}`;
}

export function getDeliveryLoadMessage(settings) {
  const normalized = normalizeDeliverySettings(settings);
  const loadLabel = getDeliveryLoadLabel(normalized);
  const baseRangeLabel =
    normalized.minMinutes < normalized.baseMinutes
      ? formatDurationRange(normalized.minMinutes, normalized.baseMinutes)
      : formatDuration(normalized.baseMinutes);

  if (normalized.currentMinutes <= normalized.baseMinutes) {
    return `Сейчас ${loadLabel}. Обычно доставляем примерно за ${baseRangeLabel}.`;
  }

  return `Сейчас ${loadLabel}, поэтому доставка занимает около ${formatDuration(
    normalized.currentMinutes
  )}. Обычно укладываемся в ${baseRangeLabel} и стараемся вернуться к этому времени.`;
}

function padTime(value) {
  return String(value).padStart(2, "0");
}

export function formatTime(date) {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

function roundUpToStep(date, stepMinutes) {
  const next = new Date(date);
  next.setSeconds(0, 0);

  const remainder = next.getMinutes() % stepMinutes;
  if (remainder) {
    next.setMinutes(next.getMinutes() + stepMinutes - remainder);
  }

  return next;
}

function nextWorkingTime(date) {
  const next = new Date(date);
  const start = new Date(next);
  start.setHours(WORK_START_HOUR, 0, 0, 0);

  const end = new Date(next);
  end.setHours(WORK_END_HOUR, 0, 0, 0);

  if (next < start) return start;
  if (next >= end) {
    start.setDate(start.getDate() + 1);
    return start;
  }

  return next;
}

function isSameCalendarDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getRelativeDayLabel(date, now) {
  if (isSameCalendarDay(date, now)) return "сегодня";

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameCalendarDay(date, tomorrow)) return "завтра";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(date);
}

export function getEarliestDeliveryDate(settings, now = new Date()) {
  const normalized = normalizeDeliverySettings(settings);
  const earliest = new Date(now);
  earliest.setMinutes(earliest.getMinutes() + normalized.currentMinutes + normalized.stepMinutes);
  return nextWorkingTime(roundUpToStep(earliest, normalized.stepMinutes));
}

export function getEarliestPickupDate(now = new Date()) {
  const earliest = new Date(now);
  earliest.setMinutes(earliest.getMinutes() + 20);
  return nextWorkingTime(roundUpToStep(earliest, DEFAULT_DELIVERY_SETTINGS.stepMinutes));
}

export function getOrderTimingAvailability({
  mode = "delivery",
  settings,
  now = new Date()
} = {}) {
  const normalized = normalizeDeliverySettings(settings);
  const earliest =
    mode === "pickup"
      ? getEarliestPickupDate(now)
      : getEarliestDeliveryDate(normalized, now);
  const workStart = new Date(now);
  workStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const workEnd = new Date(now);
  workEnd.setHours(WORK_END_HOUR, 0, 0, 0);
  const isInsideWorkHours = now >= workStart && now < workEnd;
  const fitsToday = isSameCalendarDay(earliest, now) && earliest < workEnd;
  const asapAvailable = isInsideWorkHours && fitsToday;
  const relativeDay = getRelativeDayLabel(earliest, now);
  const nearestTime = formatTime(earliest);
  const fulfillmentLabel = mode === "pickup" ? "самовывоз" : "доставку";
  const nearestFulfillmentMessage =
    mode === "pickup"
      ? `Ближайший самовывоз доступен ${relativeDay} с ${nearestTime}.`
      : `Ближайшая доставка доступна ${relativeDay} с ${nearestTime}.`;

  if (asapAvailable) {
    return {
      asapAvailable: true,
      kind: "open",
      earliest,
      title: "Можно заказать побыстрее",
      message:
        mode === "pickup"
          ? `Заказ будет готов ориентировочно к ${nearestTime}.`
          : getDeliveryLoadMessage(normalized)
    };
  }

  if (now < workStart) {
    return {
      asapAvailable: false,
      kind: "before-open",
      earliest,
      title: `Пиццерия откроется ${relativeDay} в ${nearestTime}`,
      message: `Можно оформить отложенный заказ на ${fulfillmentLabel} и выбрать удобное время.`
    };
  }

  if (now >= workEnd) {
    return {
      asapAvailable: false,
      kind: "closed",
      earliest,
      title: "Сегодня пиццерия уже закрыта",
      message: `${nearestFulfillmentMessage} Выберите удобное время.`
    };
  }

  return {
    asapAvailable: false,
    kind: "closing",
    earliest,
    title: "На сегодня уже не успеем приготовить заказ",
    message: `Оформите отложенный заказ на ${fulfillmentLabel}: первый доступный слот ${relativeDay} с ${nearestTime}.`
  };
}

export function getTimeSlots({ mode = "delivery", settings, now = new Date(), count = 18 } = {}) {
  const normalized = normalizeDeliverySettings(settings);
  const stepMinutes = normalized.stepMinutes;
  const start = mode === "pickup" ? getEarliestPickupDate(now) : getEarliestDeliveryDate(normalized, now);
  const slots = [];
  const cursor = new Date(start);

  while (slots.length < count) {
    const dayEnd = new Date(cursor);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    if (cursor >= dayEnd) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }

    if (mode === "pickup") {
      slots.push({
        id: `pickup-${cursor.toISOString()}`,
        label: formatTime(cursor),
        value: cursor.toISOString()
      });
    } else {
      const windowEnd = new Date(cursor);
      windowEnd.setMinutes(windowEnd.getMinutes() + 30);

      if (windowEnd <= dayEnd) {
        slots.push({
          id: `delivery-${cursor.toISOString()}`,
          label: `${formatTime(cursor)} - ${formatTime(windowEnd)}`,
          value: cursor.toISOString()
        });
      }
    }

    cursor.setMinutes(cursor.getMinutes() + stepMinutes);
  }

  return slots;
}
