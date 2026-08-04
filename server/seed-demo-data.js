import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDb, pool } from "./db.js";
import { hashPartnerPassword } from "./partners.js";

const DEMO_PREFIX = "demo_seed_";
const DEMO_PARTNER_PASSWORD = "demo2026";

export const DEMO_PARTNERS = [
  {
    id: `${DEMO_PREFIX}partner_anna`,
    name: "Анна Иванова",
    login: "demo_anna",
    password: DEMO_PARTNER_PASSWORD,
    promoCode: "ANNA10",
    discountPercent: 10,
    commissionPercent: 7
  },
  {
    id: `${DEMO_PREFIX}partner_food21`,
    name: "Еда в Чебоксарах",
    login: "demo_food21",
    password: DEMO_PARTNER_PASSWORD,
    promoCode: "FOOD12",
    discountPercent: 12,
    commissionPercent: 6
  },
  {
    id: `${DEMO_PREFIX}partner_maria`,
    name: "Мария Соколова",
    login: "demo_maria",
    password: DEMO_PARTNER_PASSWORD,
    promoCode: "MARIA7",
    discountPercent: 7,
    commissionPercent: 5
  }
];

export const DEMO_REVIEWS = [
  {
    id: `${DEMO_PREFIX}review_01`,
    productId: "signature-vv-pizza",
    rating: 5,
    customerName: "Ольга",
    text: "Очень удачное сочетание начинки, особенно понравились трюфельное масло и хрустящий край.",
    status: "approved",
    daysAgo: 2
  },
  {
    id: `${DEMO_PREFIX}review_02`,
    productId: "signature-vv-pizza",
    rating: 5,
    customerName: "Дмитрий",
    text: "Заказывали на семью. Пицца приехала горячей, начинки много, тесто тонкое.",
    status: "approved",
    daysAgo: 5
  },
  {
    id: `${DEMO_PREFIX}review_03`,
    productId: "pepperoni",
    rating: 4,
    customerName: "Алёна",
    text: "Пепперони в меру острая, сыр тянется, детям тоже понравилось.",
    status: "approved",
    daysAgo: 4
  },
  {
    id: `${DEMO_PREFIX}review_04`,
    productId: "summer-green-buckwheat-bowl",
    rating: 5,
    customerName: "Ирина",
    text: "Свежий и сытный боул. Соус хорошо дополняет говядину и овощи.",
    status: "approved",
    daysAgo: 7
  },
  {
    id: `${DEMO_PREFIX}review_05`,
    productId: "summer-seafood-salad",
    rating: 5,
    customerName: "Ксения",
    text: "Морепродукты нежные, авокадо спелое, подача аккуратная.",
    status: "approved",
    daysAgo: 9
  },
  {
    id: `${DEMO_PREFIX}review_pending_01`,
    productId: "margarita",
    rating: 5,
    customerName: "Светлана",
    text: "Классная Маргарита, ароматный соус и очень нежная моцарелла.",
    status: "pending",
    daysAgo: 0
  },
  {
    id: `${DEMO_PREFIX}review_pending_02`,
    productId: "summer-tuna-poke",
    rating: 4,
    customerName: "Максим",
    text: "Поке понравился, всё свежее. Хотелось бы чуть больше соуса.",
    status: "pending",
    daysAgo: 0
  }
];

export const DEMO_PROMO_CODES = [
  {
    id: `${DEMO_PREFIX}promo_lunch15`,
    code: "LUNCH15",
    discountPercent: 15,
    internalComment: "Обеденное предложение по будням",
    dailyStart: "12:00",
    dailyEnd: "14:00",
    weekdays: [1, 2, 3, 4, 5],
    scopeType: "categories",
    categoryIds: ["main", "pasta", "salad"],
    productIds: [],
    usageLimit: 15,
    perCustomerLimit: 1,
    minimumOrderAmount: 800,
    maximumDiscountAmount: 500
  },
  {
    id: `${DEMO_PREFIX}promo_pizza10`,
    code: "PIZZA10",
    discountPercent: 10,
    internalComment: "Промокод на две популярные пиццы",
    dailyStart: null,
    dailyEnd: null,
    weekdays: [],
    scopeType: "products",
    categoryIds: [],
    productIds: ["signature-vv-pizza", "pepperoni"],
    usageLimit: 30,
    perCustomerLimit: 2,
    minimumOrderAmount: 1000,
    maximumDiscountAmount: 700
  },
  {
    id: `${DEMO_PREFIX}promo_welcome7`,
    code: "WELCOME7",
    discountPercent: 7,
    internalComment: "Первый заказ гостя",
    dailyStart: null,
    dailyEnd: null,
    weekdays: [],
    scopeType: "all",
    categoryIds: [],
    productIds: [],
    usageLimit: null,
    perCustomerLimit: 1,
    minimumOrderAmount: null,
    maximumDiscountAmount: 300
  }
];

const PRODUCTS = {
  signature: {
    productId: "signature-vv-pizza",
    name: "Фирменная пицца «Вместе Вкуснее»",
    unitPrice: 850
  },
  pepperoni: {
    productId: "pepperoni",
    name: "Пеперони",
    unitPrice: 660
  },
  margarita: {
    productId: "margarita",
    name: "Маргарита",
    unitPrice: 640
  },
  bowl: {
    productId: "summer-green-buckwheat-bowl",
    name: "Боул с зеленой гречкой",
    unitPrice: 560
  },
  seafood: {
    productId: "summer-seafood-salad",
    name: "Салат с морепродуктами",
    unitPrice: 890
  },
  poke: {
    productId: "summer-tuna-poke",
    name: "Поке с тунцом",
    unitPrice: 620
  },
  cappuccino: {
    productId: "drink-kapuchino-200-ml",
    name: "Капучино",
    unitPrice: 220
  },
  mors: {
    productId: "drink-mors-250-ml",
    name: "Морс",
    unitPrice: 130
  }
};

const ORDER_BLUEPRINTS = [
  ["anna", 0, "approved", "delivery", [["signature", 1], ["mors", 2]]],
  ["food21", 0, "approved", "pickup", [["pepperoni", 2], ["cappuccino", 1]]],
  ["anna", 2, "paid", "delivery", [["signature", 1], ["seafood", 1]]],
  ["maria", 3, "approved", "delivery", [["bowl", 2], ["mors", 2]]],
  ["food21", 5, "paid", "pickup", [["margarita", 1], ["pepperoni", 1]]],
  ["anna", 6, "approved", "delivery", [["pepperoni", 1], ["poke", 1], ["mors", 2]]],
  ["maria", 8, "paid", "delivery", [["signature", 1], ["cappuccino", 2]]],
  ["food21", 9, "approved", "delivery", [["seafood", 1], ["bowl", 1]]],
  ["anna", 11, "paid", "pickup", [["signature", 2]]],
  ["maria", 12, "approved", "delivery", [["margarita", 1], ["bowl", 1], ["mors", 2]]],
  ["food21", 14, "paid", "delivery", [["pepperoni", 1], ["seafood", 1]]],
  ["anna", 16, "approved", "delivery", [["signature", 1], ["pepperoni", 1], ["cappuccino", 2]]],
  ["maria", 18, "paid", "pickup", [["poke", 2], ["mors", 2]]],
  ["anna", 20, "approved", "delivery", [["margarita", 2], ["cappuccino", 2]]],
  ["food21", 21, "approved", "delivery", [["signature", 1], ["bowl", 1], ["mors", 2]]]
];

function dateDaysAgo(daysAgo, hours = 13, minutes = 15) {
  const now = new Date();
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(hours, minutes, 0, 0);
  if (value > now) {
    value.setTime(now.getTime() - (45 + minutes) * 60 * 1000);
  }
  return value;
}

function createOrderItems(itemSpecs) {
  return itemSpecs.map(([key, qty]) => {
    const product = PRODUCTS[key];
    return {
      productId: product.productId,
      id: product.productId,
      name: product.name,
      qty,
      unitPrice: product.unitPrice,
      price: product.unitPrice,
      lineTotal: product.unitPrice * qty
    };
  });
}

function makeDemoOrders() {
  const partners = Object.fromEntries(
    DEMO_PARTNERS.map((partner) => [partner.id.replace(`${DEMO_PREFIX}partner_`, ""), partner])
  );

  return ORDER_BLUEPRINTS.map(([partnerKey, daysAgo, commissionStatus, mode, itemSpecs], index) => {
    const partner = partners[partnerKey];
    const items = createOrderItems(itemSpecs);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = Math.round((subtotal * partner.discountPercent) / 100);
    const total = subtotal - discount;
    const createdAt = dateDaysAgo(daysAgo, index % 2 ? 18 : 12, 10 + index * 2);
    const acceptedAt = new Date(createdAt.getTime() + (52 + index * 5) * 1000);
    const deliveredAt = new Date(createdAt.getTime() + (38 + (index % 4) * 7) * 60 * 1000);
    const orderId = `${DEMO_PREFIX}order_${partnerKey}_${String(index + 1).padStart(2, "0")}`;
    const address =
      mode === "pickup"
        ? "Самовывоз: Чебоксары, Пирогова, 1Т"
        : `Чебоксары, демо-адрес, дом ${12 + index}`;
    const statusHistory = [
      { status: "new", changedAt: createdAt.toISOString(), changedBy: "сайт", role: "system" },
      { status: "accepted", changedAt: acceptedAt.toISOString(), changedBy: "Администратор", role: "admin" },
      {
        status: "cooking",
        changedAt: new Date(acceptedAt.getTime() + 4 * 60 * 1000).toISOString(),
        changedBy: "Администратор",
        role: "admin"
      },
      {
        status: mode === "pickup" ? "delivered" : "courier",
        changedAt: new Date(deliveredAt.getTime() - 8 * 60 * 1000).toISOString(),
        changedBy: "Администратор",
        role: "admin"
      },
      {
        status: "delivered",
        changedAt: deliveredAt.toISOString(),
        changedBy: "Администратор",
        role: "admin"
      }
    ];

    return {
      id: orderId,
      partner,
      commissionStatus,
      mode,
      address,
      items,
      subtotal,
      discount,
      total,
      createdAt,
      acceptedAt,
      deliveredAt,
      responseSeconds: Math.round((acceptedAt.getTime() - createdAt.getTime()) / 1000),
      raw: {
        id: orderId,
        status: "delivered",
        customerName: ["Алексей", "Екатерина", "Мария", "Дмитрий"][index % 4],
        customerPhone: `+7 (8352) 66-${String(70 + index).padStart(2, "0")}-${String(10 + index).padStart(2, "0")}`,
        mode,
        address,
        items,
        subtotal,
        discount,
        total,
        payment: "Оплачено онлайн",
        paymentProvider: "demo",
        paymentStatus: "paid",
        paidAt: createdAt.toISOString(),
        promoCode: partner.promoCode,
        partner: { id: partner.id, name: partner.name, promoCode: partner.promoCode },
        createdAt: createdAt.toISOString(),
        updatedAt: deliveredAt.toISOString(),
        acceptedAt: acceptedAt.toISOString(),
        responseSeconds: Math.round((acceptedAt.getTime() - createdAt.getTime()) / 1000),
        statusHistory,
        adminNote: "Демо-заказ для презентации"
      }
    };
  });
}

async function clearSeedData(client) {
  await client.query("delete from product_reviews where id like $1", [`${DEMO_PREFIX}%`]);
  await client.query("delete from promo_codes where id like $1", [`${DEMO_PREFIX}%`]);
  await client.query("delete from orders where id like $1", [`${DEMO_PREFIX}%`]);
  await client.query("delete from partners where id like $1", [`${DEMO_PREFIX}%`]);
}

async function insertPartners(client) {
  for (const partner of DEMO_PARTNERS) {
    await client.query(
      `
        insert into partners (
          id, name, login, password_hash, promo_code, discount_percent,
          commission_percent, status, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, 'active', now(), now())
      `,
      [
        partner.id,
        partner.name,
        partner.login,
        hashPartnerPassword(partner.password),
        partner.promoCode,
        partner.discountPercent,
        partner.commissionPercent
      ]
    );
  }
}

async function insertPromoCodes(client) {
  for (const promo of DEMO_PROMO_CODES) {
    await client.query(
      `
        insert into promo_codes (
          id, code, discount_percent, internal_comment, valid_from, valid_until,
          daily_start, daily_end, weekdays, scope_type, category_ids, product_ids,
          usage_limit, per_customer_limit, minimum_order_amount,
          maximum_discount_amount, status, created_at, updated_at
        )
        values (
          $1, $2, $3, $4, current_date - interval '1 day',
          current_date + interval '90 days', $5, $6, $7::jsonb, $8,
          $9::jsonb, $10::jsonb, $11, $12, $13, $14, 'active', now(), now()
        )
      `,
      [
        promo.id,
        promo.code,
        promo.discountPercent,
        promo.internalComment,
        promo.dailyStart,
        promo.dailyEnd,
        JSON.stringify(promo.weekdays),
        promo.scopeType,
        JSON.stringify(promo.categoryIds),
        JSON.stringify(promo.productIds),
        promo.usageLimit,
        promo.perCustomerLimit,
        promo.minimumOrderAmount,
        promo.maximumDiscountAmount
      ]
    );
  }
}

async function insertReviews(client) {
  for (const review of DEMO_REVIEWS) {
    const createdAt = dateDaysAgo(review.daysAgo, 16, review.status === "pending" ? 35 : 20);
    const moderatedAt =
      review.status === "approved" ? new Date(createdAt.getTime() + 35 * 60 * 1000) : null;

    await client.query(
      `
        insert into product_reviews (
          id, product_id, customer_id, order_id, rating, text, status,
          moderation_note, customer_name, customer_phone, is_demo,
          created_at, updated_at, moderated_at
        )
        values ($1, $2, null, null, $3, $4, $5, $6, $7, '', true, $8, $9, $10)
      `,
      [
        review.id,
        review.productId,
        review.rating,
        review.text,
        review.status,
        review.status === "approved" ? "Одобрено для демонстрации" : "",
        review.customerName,
        createdAt,
        moderatedAt || createdAt,
        moderatedAt
      ]
    );
  }
}

async function insertOrdersAndCommissions(client) {
  const orders = makeDemoOrders();

  for (const order of orders) {
    await client.query(
      `
        insert into orders (
          id, status, raw, customer_name, customer_phone, mode, address,
          total, payment, promo_code, partner_id, archived_at, created_at,
          updated_at, customer_id, payment_provider, payment_id,
          payment_status, paid_at
        )
        values (
          $1, 'delivered', $2::jsonb, $3, $4, $5, $6, $7,
          'Оплачено онлайн', $8, $9, $10, $11, $12, null,
          'demo', $13, 'paid', $11
        )
      `,
      [
        order.id,
        JSON.stringify(order.raw),
        order.raw.customerName,
        order.raw.customerPhone,
        order.mode,
        order.address,
        order.total,
        order.partner.promoCode,
        order.partner.id,
        order.deliveredAt,
        order.createdAt,
        order.deliveredAt,
        `demo_payment_${order.id}`
      ]
    );

    const commissionAmount = Math.round((order.total * order.partner.commissionPercent) / 100);
    await client.query(
      `
        insert into partner_commissions (
          id, partner_id, order_id, promo_code, order_total,
          commission_percent, commission_amount, status, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        `${DEMO_PREFIX}commission_${order.id.replace(DEMO_PREFIX, "")}`,
        order.partner.id,
        order.id,
        order.partner.promoCode,
        order.total,
        order.partner.commissionPercent,
        commissionAmount,
        order.commissionStatus,
        order.createdAt,
        order.deliveredAt
      ]
    );
  }

  return orders.length;
}

export async function seedDemoData({ cleanupOnly = false } = {}) {
  await initDb();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await clearSeedData(client);

    if (cleanupOnly) {
      await client.query("commit");
      return { cleanupOnly: true };
    }

    await insertPartners(client);
    await insertPromoCodes(client);
    await insertReviews(client);
    const orders = await insertOrdersAndCommissions(client);
    await client.query("commit");

    return {
      cleanupOnly: false,
      partners: DEMO_PARTNERS.length,
      promoCodes: DEMO_PROMO_CODES.length,
      reviews: DEMO_REVIEWS.length,
      pendingReviews: DEMO_REVIEWS.filter((review) => review.status === "pending").length,
      orders
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function run() {
  const cleanupOnly = process.argv.includes("--cleanup");
  const result = await seedDemoData({ cleanupOnly });
  if (cleanupOnly) {
    console.log("Демонстрационные данные удалены.");
    return;
  }

  console.log(
    `Готово: ${result.partners} партнёра, ${result.promoCodes} промокода, ` +
      `${result.reviews} отзывов (${result.pendingReviews} на модерации), ${result.orders} заказов.`
  );
  console.log(`Пароль всех тестовых партнёров: ${DEMO_PARTNER_PASSWORD}`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFile === invokedFile) {
  run()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
