import { pool } from "../server/db.js";
import {
  getMaxNotificationConfigStatus,
  notifyMaxAudit,
  notifyMaxMasterclassRegistration,
  notifyMaxNewPaidOrder,
  notifyMaxNewReview,
  notifyMaxOrderChangeRequest,
  notifyMaxOrderStatus,
  notifyMaxPaymentProblem,
  notifyMaxRefund,
  notifyMaxSecurityAlert,
  notifyMaxTechnicalAlert
} from "../server/max-notifications.js";

const suiteId =
  process.argv[2] ||
  `full-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
const startedAt = new Date();
const skipFirst = Math.max(0, Number(process.env.MAX_TEST_SKIP_FIRST || 0));
const adminUrl = `${String(
  process.env.PUBLIC_SITE_URL || "https://vmestevkusnee.ru"
).replace(/\/$/, "")}/admin`;

const results = [];
let sequencePosition = 0;

function isoAfter(minutes) {
  return new Date(startedAt.getTime() + minutes * 60_000).toISOString();
}

function isoBefore(minutes) {
  return new Date(startedAt.getTime() - minutes * 60_000).toISOString();
}

function adminButton(label = "Открыть заказ") {
  return [
    {
      type: "inline_keyboard",
      payload: {
        buttons: [
          [
            {
              type: "link",
              text: label,
              url: adminUrl
            }
          ]
        ]
      }
    }
  ];
}

async function enqueueRaw({
  key,
  text,
  notify = true,
  priority = 90,
  button = "Открыть заказ"
}) {
  const result = await pool.query(
    `
      insert into max_notification_outbox (
        event_key, text, attachments, notify, priority, status,
        next_attempt_at, created_at, updated_at
      )
      values ($1, $2, $3::jsonb, $4, $5, 'pending', now(), now(), now())
      on conflict (event_key) do nothing
      returning id
    `,
    [
      `test-suite:${suiteId}:${key}`,
      text,
      JSON.stringify(button ? adminButton(button) : []),
      notify,
      priority
    ]
  );

  return {
    ok: true,
    queued: Boolean(result.rowCount),
    duplicate: !result.rowCount,
    id: result.rows[0]?.id || null
  };
}

async function waitForDelivery(id, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await pool.query(
      `
        select status, attempts, last_error
        from max_notification_outbox
        where id = $1
      `,
      [id]
    );
    const row = result.rows[0];

    if (row?.status === "sent") return row;
    if (row?.status === "failed") {
      throw new Error(row.last_error || `Уведомление ${id} не доставлено`);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Тайм-аут доставки уведомления ${id}`);
}

async function send(label, enqueue) {
  sequencePosition += 1;
  if (sequencePosition <= skipFirst) {
    console.log(`[${sequencePosition}] SKIP ${label}`);
    return;
  }

  const queued = await enqueue();

  if (!queued?.ok || !queued?.queued || !queued?.id) {
    throw new Error(
      `${label}: уведомление не поставлено в очередь (${JSON.stringify(queued)})`
    );
  }

  const delivery = await waitForDelivery(queued.id);
  results.push({
    label,
    id: queued.id,
    attempts: Number(delivery.attempts || 0)
  });
  console.log(`[${sequencePosition}] SENT ${label}`);
}

function makeStatusOrder(status, index) {
  const previousStatus =
    status === "payment_pending" ? null : status === "new" ? "payment_pending" : "new";
  const changedAt = isoBefore(Math.max(1, 18 - index));
  const statusHistory = [
    ...(previousStatus
      ? [
          {
            status: previousStatus,
            changedAt: isoBefore(20),
            changedBy: "Сайт"
          }
        ]
      : []),
    {
      status,
      changedAt,
      changedBy: "Администратор Мария"
    }
  ];

  return {
    id: `ТЕСТ-${suiteId}-СТАТУС`,
    status,
    total: 2140,
    createdAt: isoBefore(20),
    updatedAt: changedAt,
    statusHistory
  };
}

function operationalText(icon, title, orderId, details = []) {
  return [
    `${icon} <b>${title}</b>`,
    `Заказ #${orderId}`,
    ...details
  ].join("\n");
}

async function main() {
  const config = getMaxNotificationConfigStatus();
  if (!config.configured) {
    throw new Error(`MAX не настроен: ${JSON.stringify(config)}`);
  }

  console.log(`MAX FULL TEST SUITE ${suiteId} (skip first: ${skipFirst})`);

  const paidOrder = {
    id: `ТЕСТ-${suiteId}-1001`,
    status: "new",
    paymentStatus: "paid",
    paymentId: `yookassa-${suiteId}`,
    paymentProvider: "yookassa",
    mode: "delivery",
    requestedTime: "Побыстрее",
    total: 2940,
    customerName: "Анна Смирнова",
    customerPhone: "+7 (917) 555-21-43",
    address: "г. Чебоксары, ул. Ярмарочная, 15",
    entrance: "2",
    floor: "5",
    flat: "48",
    code: "48К",
    addressComment: "Позвонить за 5 минут, домофон иногда не работает",
    orderComment: "Пиццу нарезать на 8 кусочков",
    promoCode: "СЕМЬЯ10",
    createdAt: startedAt.toISOString(),
    items: [
      {
        name: "Пепперони",
        qty: 2,
        price: 790,
        lineTotal: 1580,
        size: "30 см",
        dough: "Традиционное",
        addons: [{ name: "Дополнительная моцарелла" }]
      },
      {
        name: "Цезарь с курицей",
        qty: 1,
        price: 690,
        lineTotal: 690
      },
      {
        name: "Морс ягодный",
        qty: 2,
        price: 335,
        lineTotal: 670
      }
    ]
  };

  await send("Новый оплаченный заказ", () =>
    notifyMaxNewPaidOrder(paidOrder)
  );

  const statuses = [
    "payment_pending",
    "payment_failed",
    "new",
    "accepted",
    "cooking",
    "courier",
    "delivered",
    "cancelled"
  ];
  for (const [index, status] of statuses.entries()) {
    await send(`Статус заказа: ${status}`, () =>
      notifyMaxOrderStatus(makeStatusOrder(status, index))
    );
  }

  await send("Запрос клиента на изменение заказа", () =>
    notifyMaxOrderChangeRequest({
      ...paidOrder,
      customerChangeRequest: {
        text: "Пожалуйста, замените морс на два апельсиновых сока.",
        createdAt: startedAt.toISOString()
      },
      updatedAt: startedAt.toISOString()
    })
  );

  await send("Оплата отклонена банком", () =>
    notifyMaxPaymentProblem(
      {
        ...paidOrder,
        id: `ТЕСТ-${suiteId}-1002`,
        paymentId: `failed-${suiteId}`,
        paymentStatus: "payment_failed"
      },
      "Банк отклонил платёж. Клиенту предложено повторить оплату."
    )
  );

  await send("Платёж отменён", () =>
    notifyMaxPaymentProblem(
      {
        ...paidOrder,
        id: `ТЕСТ-${suiteId}-1003`,
        paymentId: `cancelled-${suiteId}`,
        paymentStatus: "canceled"
      },
      "Платёж отменён пользователем на странице ЮKassa."
    )
  );

  await send("Возврат оплаты", () =>
    notifyMaxRefund(
      {
        ...paidOrder,
        id: `ТЕСТ-${suiteId}-1004`
      },
      {
        id: `refund-${suiteId}`,
        amount: { value: "1290.00" },
        status: "succeeded"
      },
      { login: "manager" }
    )
  );

  const masterclassEvent = {
    id: `pizza-kids-${suiteId}`,
    title: "Детский мастер-класс «Готовим пиццу»"
  };
  const masterclassRegistration = {
    eventId: masterclassEvent.id,
    id: `МК-${suiteId}-01`,
    status: "payment_pending",
    paymentStatus: "pending",
    name: "Елена Соколова",
    phone: "+7 (927) 555-08-16",
    participantCount: 4,
    adultsCount: 2,
    childrenCount: 2,
    childrenAges: [6, 9],
    amount: 3600
  };

  await send("Новая запись на мастер-класс", () =>
    notifyMaxMasterclassRegistration(
      masterclassRegistration,
      masterclassEvent
    )
  );
  await send("Запись на мастер-класс подтверждена", () =>
    notifyMaxMasterclassRegistration(
      {
        ...masterclassRegistration,
        status: "confirmed",
        paymentStatus: "paid"
      },
      masterclassEvent
    )
  );

  await send("Негативный отзыв", () =>
    notifyMaxNewReview({
      id: `review-low-${suiteId}`,
      rating: 2,
      productId: "Пицца Маргарита 30 см",
      orderId: `ТЕСТ-${suiteId}-0998`,
      customerName: "Игорь",
      text: "Доставка задержалась, а пицца приехала уже не горячей.",
      photos: ["/test/review-1.jpg"]
    })
  );
  await send("Положительный отзыв", () =>
    notifyMaxNewReview({
      id: `review-high-${suiteId}`,
      rating: 5,
      productId: "Пицца Пепперони 30 см",
      orderId: `ТЕСТ-${suiteId}-0999`,
      customerName: "Ольга",
      text: "Очень вкусно, быстро привезли. Спасибо!",
      photos: []
    })
  );

  const actor = { login: "manager" };
  const auditEvents = [
    ["Подключён новый ключ быстрого входа", []],
    ["Удалён ключ быстрого входа", []],
    ["Создана категория «Комбо»", []],
    ["Изменена категория «Пицца»", []],
    ["Добавлена потеряшка #071", []],
    ["Потеряшка #068 убрана", []],
    [
      "Добавлена заявка блогера на десерт",
      ["https://instagram.com/test_food_cheb"]
    ],
    ["Статус заявки блогера → выдано", []],
    ["Создан товар «Пицца Четыре сыра»", []],
    ["Изменён товар «Пицца Пепперони»", ["Статус: active", "Цена: 790 ₽"]],
    ["Добавлено видео товара «Пицца Пепперони»", []],
    ["Удалено видео товара «Пицца Пепперони»", []],
    ["Товар «Летний лимонад» убран", []],
    ["Добавлен материал в галерею", []],
    ["Изменён материал галереи", []],
    ["Материал галереи убран", []],
    ["Изменены настройки доставки", ["Загрузка: средняя"]],
    ["Отзыв → approved", ["Оценка: 5/5"]],
    ["Создан партнёр «Фитнес-клуб Атлет»", []],
    ["Изменён доступ партнёра «Фитнес-клуб Атлет»", ["Статус: active"]],
    ["Проведена выплата партнёру «Фитнес-клуб Атлет»", ["Сумма: 5 600 ₽"]],
    ["Создан промокод ЛЕТО15", []],
    ["Изменён промокод СЕМЬЯ10", ["Статус: active"]],
    [`Заказ #ТЕСТ-${suiteId}-0980 закрыт в архив`, []],
    [`Изменены данные заказа #ТЕСТ-${suiteId}-0981`, []]
  ];

  for (const [index, [title, details]] of auditEvents.entries()) {
    await send(`Админ-событие: ${title}`, () =>
      notifyMaxAudit({
        eventKey: `test-suite:${suiteId}:audit:${index + 1}`,
        title,
        details,
        actor,
        notify: true,
        priority: 50
      })
    );
  }

  await send("Неудачный вход по паролю", () =>
    notifyMaxSecurityAlert({
      login: `manager-${suiteId}`,
      ip: "95.79.18.42",
      method: "password"
    })
  );
  await send("Неудачный вход по ключу", () =>
    notifyMaxSecurityAlert({
      login: `admin-${suiteId}`,
      ip: "95.79.18.43",
      method: "passkey"
    })
  );

  const technicalEvents = [
    [
      "POST",
      `/test/${suiteId}/api`,
      500,
      "Внутренняя ошибка API",
      "Тестовый сбой обработчика. Данные пользователей не затронуты."
    ],
    [
      "ORDER",
      `/test/${suiteId}/order/promo`,
      500,
      "Оплаченный заказ создан, но применение промокода не зафиксировано",
      "Повторная синхронизация будет выполнена автоматически."
    ],
    [
      "ORDER",
      `/test/${suiteId}/order/partner-commission`,
      500,
      "Оплаченный заказ создан, но комиссия партнёра не начислена",
      "Партнёр: Фитнес-клуб Атлет."
    ],
    [
      "PUSH",
      `/test/${suiteId}/order/admin-push`,
      503,
      "PWA-push о новом заказе не доставлен администраторам",
      "MAX-уведомление при этом работает."
    ],
    [
      "POST",
      `/test/${suiteId}/api/payments/yookassa/webhook`,
      400,
      "Некорректный webhook ЮKассы",
      "Подпись или структура события не прошла проверку."
    ]
  ];

  for (const [method, route, status, message, details] of technicalEvents) {
    await send(`Техническое событие: ${message}`, () =>
      notifyMaxTechnicalAlert({
        method,
        route,
        status,
        message,
        details
      })
    );
  }

  const operationalEvents = [
    ["new-2", "⏱", "Заказ не принят 2 минуты", "ТЕСТ-2001", [], 90],
    ["new-5", "🔴", "Заказ не принят 5 минут", "ТЕСТ-2002", [], 100],
    ["new-10", "🔴", "Заказ не принят 10 минут", "ТЕСТ-2003", [], 100],
    [
      "accepted-15",
      "⏱",
      "Принятый заказ не начали готовить 15 минут",
      "ТЕСТ-2004",
      [],
      95
    ],
    [
      "cooking-30",
      "⏱",
      "Заказ готовится более 30 минут",
      "ТЕСТ-2005",
      [],
      95
    ],
    [
      "courier-45",
      "🔴",
      "Заказ у курьера более 45 минут",
      "ТЕСТ-2006",
      [],
      100
    ],
    [
      "scheduled-60",
      "⏱",
      "Отложенный заказ через 1 час",
      "ТЕСТ-2101",
      ["Статус: Получен", `Время: ${isoAfter(60)}`],
      80
    ],
    [
      "scheduled-30",
      "⏱",
      "До отложенного заказа осталось 30 минут",
      "ТЕСТ-2102",
      ["Статус: Получен", `Время: ${isoAfter(30)}`],
      85
    ],
    [
      "scheduled-15",
      "🔴",
      "До отложенного заказа осталось 15 минут",
      "ТЕСТ-2103",
      ["Статус: Принят", `Время: ${isoAfter(15)}`],
      100
    ],
    [
      "scheduled-due",
      "🔴",
      "Наступило время отложенного заказа",
      "ТЕСТ-2104",
      ["Статус: Готовится", `Время: ${startedAt.toISOString()}`],
      100
    ],
    [
      "scheduled-overdue-15",
      "🔴",
      "Отложенный заказ просрочен на 15 минут",
      "ТЕСТ-2105",
      ["Статус: Готовится", `Был назначен на ${isoBefore(15)}`],
      100
    ],
    [
      "scheduled-overdue-30",
      "🔴",
      "Отложенный заказ просрочен более чем на 30 минут",
      "ТЕСТ-2106",
      ["Статус: У курьера", `Был назначен на ${isoBefore(30)}`],
      100
    ]
  ];

  for (const [key, icon, title, orderId, details, priority] of operationalEvents) {
    await send(`Контроль срока: ${title}`, () =>
      enqueueRaw({
        key: `operational:${key}`,
        text: operationalText(icon, title, orderId, details),
        notify: true,
        priority
      })
    );
  }

  const summary = await pool.query(
    `
      select status, count(*)::int as count
      from max_notification_outbox
      where event_key like $1
      group by status
      order by status
    `,
    [`%${suiteId}%`]
  );

  const suiteSent = Number(
    summary.rows.find((row) => row.status === "sent")?.count || 0
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        suiteId,
        expected: sequencePosition,
        deliveredThisRun: results.length,
        suiteSent,
        attempts: results.reduce((sum, item) => sum + item.attempts, 0),
        outbox: summary.rows
      },
      null,
      2
    )
  );
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
