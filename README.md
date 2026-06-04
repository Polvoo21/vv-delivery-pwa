# Вместе Вкуснее | PWA-доставка

MVP PWA-приложения доставки и самовывоза для семейной пиццерии «Вместе Вкуснее». Проект подготовлен под GitHub → Netlify auto deploy: фронтенд собирается через Vite, заказы уходят через Netlify Function в Telegram-группу.

## Технологии

- React + Vite
- Leaflet + OpenStreetMap/CARTO Voyager для карты без API-ключа
- LocalStorage для адреса, корзины, промокода, профиля и истории заказов
- Service Worker + Web App Manifest для PWA
- Netlify Functions для безопасной отправки заказов в Telegram
- Netlify Blobs для тестового хранения заказов и админки

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
  service-worker.js
  icons/
  assets/
    pizza-main.webp

netlify/
  functions/
    send-order.js
    admin-orders.js
    push-config.js
    lib/
      orders-store.js
      push.js
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

В Netlify добавьте:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
ADMIN_PASSWORD
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

Токен не используется во фронтенде. Он читается только в `netlify/functions/send-order.js` через `process.env.TELEGRAM_BOT_TOKEN`.

`ADMIN_PASSWORD` нужен для тестовой панели `/admin`. Пароль не вшивается во фронтенд: админ вводит его в форме, а Netlify Function проверяет значение на сервере.

`VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY` нужны для настоящих Web Push-уведомлений о смене статуса заказа. `VAPID_SUBJECT` можно указать как контакт, например `mailto:owner@example.com`.

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

Если env-переменные не заданы, функция вернёт понятную ошибку: `В Netlify не настроены TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID`.

После успешной отправки в Telegram заказ сохраняется в Netlify Blobs и появляется в админке.

## Как проверить админку

1. В Netlify добавьте env-переменную:

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

Локально `/admin` открывается в демо-режиме, если проект запущен через обычный `npm run dev` или `npm run preview`. Для проверки реальных Netlify Functions локально используйте `netlify dev`.

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
- Оформление заказа и отправка в Telegram через Netlify Function
- Тестовая админка `/admin` с паролем, списком заказов и сменой статусов
- Личный кабинет с адресом, локальной историей заказов, тестом уведомлений и очисткой данных
- PWA manifest и service worker

## Известные ограничения

- Это MVP без полноценной SQL-базы: клиентская история хранится на устройстве, а админка хранит заказы в Netlify Blobs.
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
