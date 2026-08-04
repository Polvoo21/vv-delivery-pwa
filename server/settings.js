export const DEFAULT_DELIVERY_SETTINGS = {
  minMinutes: 30,
  baseMinutes: 45,
  currentMinutes: 45,
  stepMinutes: 15,
  maxMinutes: 120
};

const SETTINGS_KEY = "delivery_timing";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDeliveryMinutes(value) {
  const number = Number(value);
  const minutes = Number.isFinite(number) ? number : DEFAULT_DELIVERY_SETTINGS.currentMinutes;
  const rounded = Math.round(minutes / DEFAULT_DELIVERY_SETTINGS.stepMinutes) * DEFAULT_DELIVERY_SETTINGS.stepMinutes;
  return clamp(rounded, DEFAULT_DELIVERY_SETTINGS.minMinutes, DEFAULT_DELIVERY_SETTINGS.maxMinutes);
}

export function normalizeDeliverySettings(value = {}) {
  return {
    ...DEFAULT_DELIVERY_SETTINGS,
    minMinutes: DEFAULT_DELIVERY_SETTINGS.minMinutes,
    baseMinutes: DEFAULT_DELIVERY_SETTINGS.baseMinutes,
    stepMinutes: DEFAULT_DELIVERY_SETTINGS.stepMinutes,
    maxMinutes: DEFAULT_DELIVERY_SETTINGS.maxMinutes,
    currentMinutes: normalizeDeliveryMinutes(value.currentMinutes),
    updatedAt: value.updatedAt || null
  };
}

export async function getDeliverySettings(pool) {
  const result = await pool.query("select value from app_settings where key = $1", [SETTINGS_KEY]);
  return normalizeDeliverySettings(result.rows[0]?.value || {});
}

export async function saveDeliverySettings(pool, settings) {
  const normalized = normalizeDeliverySettings({
    ...settings,
    updatedAt: new Date().toISOString()
  });

  const result = await pool.query(
    `
      insert into app_settings (key, value, updated_at)
      values ($1, $2, now())
      on conflict (key) do update set
        value = excluded.value,
        updated_at = now()
      returning value
    `,
    [SETTINGS_KEY, normalized]
  );

  return normalizeDeliverySettings(result.rows[0]?.value || normalized);
}
