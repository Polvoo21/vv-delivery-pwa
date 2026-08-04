import "dotenv/config";
import { getYooKassaShopInfo, getYooKassaPublicConfig } from "../server/yookassa.js";

function mask(value) {
  const text = String(value || "");
  return text.length <= 4 ? "****" : `${"*".repeat(Math.min(8, text.length - 4))}${text.slice(-4)}`;
}

const config = getYooKassaPublicConfig();
if (!config.configured) {
  console.error("ЮKassa не настроена: заполните YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.");
  process.exitCode = 1;
} else {
  try {
    const shop = await getYooKassaShopInfo();
    console.log(`ЮKassa отвечает. Магазин: ${mask(shop.account_id || process.env.YOOKASSA_SHOP_ID)}`);
    console.log(`Статус магазина: ${shop.status || "не указан"}`);
    console.log(`Режим приложения: ${config.mode}`);
    console.log(`Передача receipt: ${config.receiptEnabled ? "включена" : "выключена"}`);
    if (shop.fiscalization) {
      console.log(`Фискализация ЮKassa: ${JSON.stringify(shop.fiscalization)}`);
    }
  } catch (error) {
    console.error(`Проверка ЮKassa не пройдена: ${error.message}`);
    if (error.details?.httpStatus) console.error(`HTTP: ${error.details.httpStatus}`);
    if (error.details?.providerCode) console.error(`Код ЮKassa: ${error.details.providerCode}`);
    process.exitCode = 1;
  }
}
