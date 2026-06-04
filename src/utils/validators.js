export function validateCheckout(order) {
  const errors = {};

  if (!order.customerName?.trim()) {
    errors.customerName = "Введите имя";
  }

  if (!order.customerPhone?.trim()) {
    errors.customerPhone = "Введите телефон";
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
  return String(value || "").replace(/[^\d+()\-\s]/g, "").slice(0, 24);
}
