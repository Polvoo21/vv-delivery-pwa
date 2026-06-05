export function validateCheckout(order) {
  const errors = {};

  if (!order.customerName?.trim()) {
    errors.customerName = "Введите имя";
  }

  if (!isValidRuPhone(order.customerPhone)) {
    errors.customerPhone = "Введите телефон в формате +7 (999) 999-99-99";
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.items = "Корзина пустая";
  }

  if (!Number(order.total) || Number(order.total) <= 0) {
    errors.total = "Сумма заказа должна быть больше 0";
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;

export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const normalized =
    digits.startsWith("8") && digits.length > 1
      ? `7${digits.slice(1)}`
      : digits.startsWith("7")
        ? digits
        : digits
          ? `7${digits}`
          : "";
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
  if (chunks[0]?.length === 3) result += ")";
  if (chunks[1]) result += ` ${chunks[1]}`;
  if (chunks[2]) result += `-${chunks[2]}`;
  if (chunks[3]) result += `-${chunks[3]}`;

  return result;
}

export function isValidRuPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("7");
}
