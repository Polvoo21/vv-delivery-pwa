export function validateOrder(order) {
  const errors = [];
  const phoneDigits = String(order.customerPhone || "").replace(/\D/g, "");

  if (!order.customerName || !String(order.customerName).trim()) {
    errors.push("customerName обязателен");
  }

  if (!order.customerPhone || !String(order.customerPhone).trim()) {
    errors.push("customerPhone обязателен");
  } else if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    errors.push("customerPhone должен быть в формате +7 (999) 999-99-99");
  }

  if (!Array.isArray(order.items)) {
    errors.push("items должен быть массивом");
  } else {
    if (order.items.length === 0) errors.push("items не должен быть пустым");
    if (order.items.length > 30) errors.push("items не должен содержать больше 30 позиций");

    order.items.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        errors.push(`items[${index}] должен быть объектом`);
        return;
      }

      if (!item.name || !String(item.name).trim()) {
        errors.push(`items[${index}].name обязателен`);
      }

      if (!Number(item.qty) || Number(item.qty) <= 0) {
        errors.push(`items[${index}].qty должен быть больше 0`);
      }

      if (Number(item.qty) > 99) {
        errors.push(`items[${index}].qty слишком большой`);
      }
    });
  }

  if (!Number(order.total) || Number(order.total) <= 0) {
    errors.push("total должен быть больше 0");
  }

  return errors;
}
