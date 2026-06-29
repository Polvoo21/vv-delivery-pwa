# Вместе Вкуснее | PWA-доставка

MVP PWA-приложения доставки и самовывоза для семейной пиццерии «Вместе Вкуснее». Проект можно запускать в двух режимах:

- рекомендуемый VPS-режим: React/Vite фронтенд + Node API + PostgreSQL + общий Caddy HTTPS-прокси;
- резервный Netlify-режим: Vite build + Netlify Functions + Telegram + Netlify Blobs.

Tilda в этой схеме не нужна: сайт, API, админка, база заказов и push-логика живут на своём сервере.

## Технологии

- React + Vite
- Leaflet + OpenStreetMap/CARTO Voyager для карты без API-ключа
- LocalStorage для адреса, корзины, промокода, профиля и истории заказов
- Service Worker + Web App Manifest для PWA
- Node.js + Express API для VPS
- PostgreSQL для заказов и push-подписок администратора
- Docker Compose для приложения и PostgreSQL
- Caddy route для общего reverse proxy на VPS
- Netlify Functions и Netlify Blobs оставлены как резервный способ деплоя

## Структура проекта

```text
src/
  main.jsx
  App.jsx
  data/
    menu.js
    config.js
  components/
    SplashScreen.jsx
    AddressScreen.jsx
    MapPicker.jsx
    HomeScreen.jsx
    StoriesRow.jsx
    OfferBanner.jsx
    CategoryTabs.jsx
    ProductCard.jsx
    ProductModal.jsx
    CartSheet.jsx
    CheckoutSheet.jsx
    ProfileSheet.jsx
    PromoCodeSheet.jsx
    InfoSheet.jsx
    Toast.jsx
  utils/
    storage.js
    notifications.js
    price.js
    validators.js

public/
  manifest.json
  admin-manifest.json
  service-worker.js
  icons/
  assets/
    pizza-main.webp

netlify/
  functions/
    send-order.js
    admin-orders.js
    blob-test.js
    push-config.js
    lib/
      orders-store.js
      push.js

server/
  index.js
  db.js
  orders.js
  order-utils.js
  push.js

Dockerfile
docker-compose.yml
Caddyfile
.env.vps.example
```

## Локальный запуск

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
npm run preview
```

Запуск Node API локально требует PostgreSQL и `.env` с `DATABASE_URL`, поэтому для обычной проверки интерфейса достаточно `npm run dev`.

Для VPS-сборки фронтенд должен ходить в `/api/...`. В PowerShell:

```powershell
$env:VITE_API_MODE="vps"
npm run build
```

В Docker это уже настроено через `ARG VITE_API_MODE=vps`.

## Деплой на VPS

На текущем VPS уже есть общий Caddy-прокси в `/opt/apps/proxy`, который владеет портами `80` и `443`. Поэтому проект не публикует публичные порты и подключает web-контейнер к общей Docker-сети `edge`.

Рекомендуемая схема:

```text
браузер/PWA
↓
Caddy HTTPS из /opt/apps/proxy
↓
Node API + статический dist
↓
PostgreSQL
↓
Telegram Bot API / Web Push
```

Базовый запуск:

```bash
git clone https://github.com/Polvoo21/vv-delivery-pwa.git
cd vv-delivery-pwa
cp .env.vps.example .env
nano .env
docker compose up -d --build
```

В `.env` заполните:

```text
APP_DOMAIN=your-domain.ru
POSTGRES_DB=vv_delivery
POSTGRES_USER=vv
POSTGRES_PASSWORD=длинный_пароль_базы
ADMIN_PASSWORD=пароль_админки
TELEGRAM_BOT_TOKEN=токен_бота
TELEGRAM_CHAT_ID=id_группы
VAPID_PUBLIC_KEY=публичный_vapid_ключ
VAPID_PRIVATE_KEY=приватный_vapid_ключ
VAPID_SUBJECT=mailto:owner@example.com
```

Перед публичным запуском направьте DNS A-запись домена на IP VPS `216.57.105.205`, затем добавьте блок из `Caddyfile` в `/opt/apps/proxy/Caddyfile` и перезагрузите Caddy:

```bash
docker compose -f /opt/apps/proxy/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

IP-адрес без HTTPS-домена годится только для черновой проверки. Установка PWA и Web Push на iPhone требуют HTTPS-домен.

Проверка после запуска:

```bash
docker compose ps
curl https://your-domain.ru/api/health
```

Ожидаемый ответ:

```json
{
  "ok": true,
  "service": "vv-delivery-api",
  "storage": "postgres"
}
```

Публичные домены:

```text
vmestevkusnee.ru           -> основной сайт пиццерии
www.vmestevkusnee.ru       -> редирект на vmestevkusnee.ru
delivery.vmestevkusnee.ru  -> PWA-доставка
partners.vmestevkusnee.ru  -> кабинет блогера
admin.vmestevkusnee.ru     -> админка
```

В общий `/opt/apps/proxy/Caddyfile` добавьте блоки из `Caddyfile` в корне проекта.

Заказы на VPS хранятся в PostgreSQL. Старые заказы из Netlify Blobs автоматически не мигрируются; при необходимости нужен отдельный скрипт переноса.

Для локальной проверки Netlify Function удобнее использовать Netlify CLI:

```bash
netlify dev
```

## Деплой на Netlify

Подключите GitHub-репозиторий к Netlify и укажите:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

В репозитории уже есть `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Environment Variables

Для VPS основные переменные лежат в `.env`:

```text
APP_DOMAIN
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
ADMIN_PASSWORD
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

Для резервного Netlify-деплоя добавьте:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
ADMIN_PASSWORD
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
NETLIFY_BLOBS_SITE_ID
NETLIFY_BLOBS_TOKEN
```

Токен Telegram не используется во фронтенде. В VPS-режиме он читается только в `server/index.js`, в Netlify-режиме только в `netlify/functions/send-order.js`.

`ADMIN_PASSWORD` нужен для панели `/admin`. Пароль не вшивается во фронтенд: админ вводит его в форме, а сервер проверяет значение в API.

`VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY` нужны для настоящих Web Push-уведомлений о смене статуса заказа. `VAPID_SUBJECT` можно указать как контакт, например `mailto:owner@example.com`.

`NETLIFY_BLOBS_SITE_ID` и `NETLIFY_BLOBS_TOKEN` нужны только как запасной ручной режим для Netlify Blobs. В обычном Netlify Functions-окружении Blobs инициализируются через `connectLambda(event)`. Если `/.netlify/functions/blob-test` возвращает `MissingBlobsEnvironmentError`, добавьте эти две переменные: `NETLIFY_BLOBS_SITE_ID` равен Project ID сайта, а `NETLIFY_BLOBS_TOKEN` равен Netlify Personal Access Token с доступом к сайту.

## Telegram-бот

1. В Telegram откройте `@BotFather`.
2. Создайте бота командой `/newbot`.
3. Скопируйте токен и добавьте его в Netlify как `TELEGRAM_BOT_TOKEN`.
4. Добавьте бота в группу заявок.
5. Напишите любое сообщение в группу.
6. Откройте в браузере:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

7. Найдите `chat.id` группы и добавьте его в Netlify как `TELEGRAM_CHAT_ID`.

Для супергрупп chat id часто начинается с `-100`.

## Как проверить заказ

1. Запустите проект через Netlify или `netlify dev`.
2. Выберите доставку или самовывоз.
3. Добавьте товар в корзину.
4. Примените промокод `VV25`, если нужно.
5. Перейдите к оформлению.
6. Введите имя и телефон.
7. Нажмите «Отправить заказ».

Если env-переменные не заданы, API вернёт понятную ошибку про `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`.

После успешной отправки в Telegram заказ сохраняется в PostgreSQL на VPS или в Netlify Blobs в резервном Netlify-режиме и появляется в админке.

## Как проверить Netlify Blobs

После деплоя откройте:

```text
https://ваш-сайт.netlify.app/.netlify/functions/blob-test
```

Ожидаемый ответ:

```json
{
  "ok": true,
  "store": "vv-orders"
}
```

Для тестовой записи отправьте `POST` на тот же адрес. Например из терминала:

```bash
curl -X POST https://ваш-сайт.netlify.app/.netlify/functions/blob-test
```

После этого в Netlify → Blobs должен появиться store `vv-orders` и ключи `orders-index`, `order:...`. Debug-функцию `blob-test.js` можно удалить после презентационной проверки.

## Как проверить админку

1. На VPS добавьте в `.env`, либо в Netlify добавьте env-переменную:

```text
ADMIN_PASSWORD=любой_тестовый_пароль
```

2. Сделайте redeploy.
3. Откройте:

```text
https://ваш-сайт.netlify.app/admin
```

4. Введите пароль.
5. Оформите тестовый заказ в клиентском приложении.
6. Обновите админку и поменяйте статус:
   - Принят;
   - Готовится;
   - У курьера;
   - Доставлен.

Если клиент разрешил уведомления при оформлении заказа, при смене статуса админкой ему придёт Web Push:

```text
Вместе Вкуснее
Статус заказа #...: Готовится
```

Для генерации VAPID-ключей можно использовать пакет `web-push`:

```bash
npx web-push generate-vapid-keys
```

Затем добавьте значения в Netlify как `VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY`.

Локально `/admin` открывается в демо-режиме, если проект запущен через обычный `npm run dev` или `npm run preview`. Для проверки реального VPS API используйте Docker Compose или локальный PostgreSQL + `npm run server`; для проверки Netlify Functions локально используйте `netlify dev`.

Для отдельной иконки админки на iPhone откройте именно `/admin`, дождитесь загрузки экрана входа и добавьте страницу на экран «Домой». В проекте есть отдельный `admin.html` и `admin-manifest.json`, поэтому Netlify отдаёт для `/admin` админский manifest сразу до запуска React. Если раньше уже добавляли иконку, удалите её и добавьте заново: iOS может держать старый `start_url` из основного manifest. Safari может визуально показывать только домен без `/admin`, это нормально; проверять нужно по тому, какой экран открывается при запуске иконки.

## Как проверить PWA

1. Соберите и задеплойте проект на HTTPS-домене Netlify.
2. Откройте сайт в Chrome/Edge.
3. DevTools → Application:
   - Manifest должен отображаться без критичных ошибок;
   - Service Worker должен быть активен;
   - Cache Storage не должен содержать запросы к `/.netlify/functions/*`.
4. Установите приложение на главный экран и откройте в standalone-режиме.

Service Worker версионирован, чистит старые кэши при активации и не кэширует Netlify Functions.

## Как проверить уведомления

1. Откройте личный кабинет.
2. Нажмите «Отправить тестовое уведомление».
3. Разрешите уведомления, если браузер спросит.
4. Должно появиться уведомление:
   - Заголовок: «Вместе Вкуснее»
   - Текст: «Тестовое уведомление работает»

На iPhone уведомления работают только в установленном PWA и после разрешения.

## Что уже реализовано

- Splash screen
- Выбор доставки или самовывоза
- Карта Чебоксар на Leaflet
- Геопозиция и reverse geocoding через Nominatim
- Сохранение адреса и повторный вход сразу на главный экран
- Главный экран с историями, оффером, категориями и меню
- Карточка товара с размерами, тестом, добавками и удалением ингредиентов
- Корзина с количеством, удалением, upsell-блоком и итогами
- Промокод `VV25`
- Оформление заказа и отправка в Telegram через VPS API или Netlify Function
- Тестовая админка `/admin` с паролем, списком заказов и сменой статусов
- Личный кабинет с адресом, локальной историей заказов, тестом уведомлений и очисткой данных
- PWA manifest и service worker

## Известные ограничения

- Клиентская история заказов хранится на устройстве. Серверная история на VPS хранится в PostgreSQL.
- Админка защищена простым паролем для презентации, без ролей, пользователей и аудита.
- Нет боевых удалённых push-уведомлений для всех клиентов.
- Нет rate limit, капчи и антиспам-защиты.
- Фото блюд пока тестовые. Основное фото пиццы лежит в `public/assets/pizza-main.webp`; остальные позиции подготовлены так, чтобы позже заменить визуалы на реальные фотографии.

## Следующая версия

- Supabase/PostgreSQL:
  - таблица `orders`;
  - таблица `order_items`;
  - статусы заказов;
  - профили клиентов;
  - адреса клиентов.
- Экран `/admin`:
  - список заказов;
  - смена статусов;
  - комментарии администратора;
  - фильтры и поиск.
- Реальные push-уведомления:
  - Web Push/FCM;
  - хранение push subscriptions;
  - уведомления клиенту при смене статуса.
- Реальные фотографии блюд и актуальное меню.
- Проверка зоны доставки и расчёт времени.
