# Вместе Вкуснее

Собственная платформа для сайта, доставки, админки и партнёрских кабинетов семейной пиццерии «Вместе Вкуснее».

Проект больше не использует Netlify. Продакшен работает на личном VPS через Docker, Caddy и PostgreSQL.

## Текущая схема

- `https://vmestevkusnee.ru` — публичная заглушка основного сайта.
- `https://delivery.vmestevkusnee.ru` — публичная заглушка доставки до готовности запуска.
- `https://admin.vmestevkusnee.ru` — админка заказов, партнёров и push-уведомлений.
- `https://partners.vmestevkusnee.ru` — личный кабинет блогера/партнёра.
- `https://vmestevkusnee.ru/dev` — внутренняя рабочая версия сайта для разработки.

## Технологии

- React + Vite
- Express API
- PostgreSQL
- Docker Compose
- Caddy reverse proxy
- Web Push
- MAX Bot API для уведомлений о заказах

## Структура

```text
src/
  components/       React-экраны сайта, доставки, админки и партнёров
  data/             меню и конфиг пиццерии
  utils/            API, storage, price, notifications

server/
  index.js          Express API и SPA routes
  db.js             PostgreSQL init/pool
  orders.js         заказы, статусы, push subscriptions
  partners.js       партнёры, промокоды, комиссии
  notify.js         MAX/Telegram уведомления
  push.js           Web Push

public/
  assets/           изображения
  icons/            PWA icons
  *manifest.json    PWA manifests
  service-worker.js

Dockerfile
docker-compose.yml
Caddyfile
.env.vps.example
```

## Локальный запуск фронтенда

```bash
npm install
npm run dev
```

Обычный Vite dev server поднимает frontend. Для реальной проверки API нужен локальный сервер и PostgreSQL.

## Локальный запуск API

Создайте `.env` на основе `.env.vps.example`, поднимите PostgreSQL и запустите:

```bash
npm run server
```

Healthcheck:

```bash
curl http://localhost:3000/api/health
```

## Сборка

```bash
npm run build
npm run preview
```

## VPS env

На сервере файл `.env` лежит рядом с `docker-compose.yml`.

Минимум:

```env
POSTGRES_DB=vv_delivery
POSTGRES_USER=vv
POSTGRES_PASSWORD=long_random_password

ADMIN_PASSWORD=long_admin_password

NOTIFY_PROVIDER=max
MAX_BOT_TOKEN=max_bot_token
MAX_CHAT_ID=max_chat_id

VAPID_PUBLIC_KEY=public_key
VAPID_PRIVATE_KEY=private_key
VAPID_SUBJECT=mailto:owner@example.com
```

`TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` в коде сервера ещё поддерживаются как резервный legacy-провайдер, но текущая целевая схема — MAX.

## Docker Compose

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Проверка:

```bash
curl https://vmestevkusnee.ru/api/health
```

Ожидаемый ответ:

```json
{
  "ok": true,
  "service": "vv-delivery-api",
  "storage": "postgres"
}
```

## Caddy

Caddy проксирует все домены в контейнер приложения:

```text
vmestevkusnee.ru
delivery.vmestevkusnee.ru
admin.vmestevkusnee.ru
partners.vmestevkusnee.ru
```

Сертификаты выпускаются Caddy автоматически.

## Заказы

Клиентский заказ отправляется в:

```text
POST /api/send-order
```

Сервер:

- валидирует заказ;
- сохраняет его в PostgreSQL;
- создаёт комиссию партнёра, если использован партнёрский промокод;
- отправляет уведомление в MAX;
- отправляет push администратору, если он включил уведомления.

## Админка

Админка доступна по:

```text
https://admin.vmestevkusnee.ru
```

Пароль берётся из:

```env
ADMIN_PASSWORD
```

Возможности:

- список активных заказов;
- смена статуса заказа;
- закрытие заказа;
- создание партнёров/блогеров;
- промокоды партнёров;
- тест push-уведомлений;
- тест уведомления в MAX.

## Партнёрский кабинет

Партнёры заходят по:

```text
https://partners.vmestevkusnee.ru
```

Логин и пароль создаются вручную в админке. Партнёр видит:

- свой промокод;
- заказы по промокоду;
- сумму заказа;
- процент комиссии;
- начисленную сумму.

## PWA и push

В проекте есть отдельные manifests:

- `manifest.json` — доставка;
- `site-manifest.json` — основной сайт;
- `admin-manifest.json` — админка;
- `partner-manifest.json` — партнёры.

Service Worker кэширует shell и статические ассеты, но не кэширует `/api/*`.

Для Web Push нужны:

```env
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

## Деплой на VPS

Текущий ручной деплой:

```bash
git archive --format=tar.gz -o /tmp/vv-delivery.tar.gz HEAD
scp /tmp/vv-delivery.tar.gz root@SERVER_IP:/tmp/vv-delivery.tar.gz
ssh root@SERVER_IP
cd /opt/apps/vv-delivery-pwa/repo
tar -xzf /tmp/vv-delivery.tar.gz
docker compose up -d --build app
```

Проверить после деплоя:

```bash
docker compose ps
curl https://vmestevkusnee.ru/api/health
```

## Важные ограничения

- Основной сайт и доставка сейчас публично закрыты заглушками.
- Доставка и рабочая версия сайта не должны рекламироваться как готовые до финального запуска.
- Платёжная система пока не подключена.
- Полноценной RBAC-системы для нескольких администраторов пока нет.
- Партнёры создаются вручную через админку.

## Следующий этап

- Завершить публичный сайт.
- Завершить delivery PWA.
- Настроить боевой MAX webhook.
- Подключить онлайн-оплату.
- Добавить роли пользователей.
- Добавить нормальный CI/CD-деплой с GitHub на VPS.
