# Reference Mapping: Strict Food-Commerce Benchmark

Дата: 2026-07-07

## Rule

Dodo используется как ориентир по зрелости UX: ясная навигация, каталог, корзина, checkout, профиль, футер, плотность карточек и читаемость. Нельзя копировать код, CSS, ассеты, тексты, логотипы, фирменные иллюстрации, точную раскладку, цветовую систему, анимации и брендовые элементы.

Визуальное направление «Вместе Вкуснее»: строгий лаконичный food-commerce. Белый/светло-серый фон, темный текст, фирменные красно-розовые CTA, реальные фото еды, чистая сетка, короткая подача, без градиентов.

Цветовое правило для Dodo-референсов: Dodo-оранжевый и все похожие производные не переносить. Заменять на наш фирменный красно-розовый акцент (`--vv-orange`, сейчас `#ca7767`) и мягкие производные. Зеленый использовать только как вторичный/смысловой цвет, не как замена Dodo-оранжевого CTA.

## Pattern Mapping

| Benchmark pattern | Why it works | Adaptation for Вместе Вкуснее | What not to copy |
| --- | --- | --- | --- |
| Sticky category navigation | Быстрый переход между категориями. | Sticky nav с нашими категориями, light gray surface, brand-accent active state. | Точные размеры, категории, расположение, Dodo active chip. |
| Product grid | Еда продается через фото, название, цену и CTA. | Крупные фото, короткое название, цена, аккуратная кнопка. | Dodo images, names, badges, geometry. |
| Product configurator | Пользователь понимает размер, тесто, добавки, цену. | Наш product modal/sheet с понятными опциями и sticky CTA. | Точный split layout, labels, ingredient visuals. |
| Cart drawer/sheet | Корзина рядом, checkout не теряется. | Desktop right drawer, mobile bottom sheet, clear total and CTA. | Точные тексты, иллюстрации, upsell-композиции. |
| Address modal | Адрес задает доставку и самовывоз. | Карта Чебоксар, delivery/pickup switch, saved addresses, Пирогова 1Т. | Dodo/Yandex visual details, markers, exact composition. |
| Login modal | Вход не ломает shopping context. | Yandex ID, VK ID, Telegram, required consents, concise disabled reason. | Dodo phone-only modal, texts, visuals. |
| Checkout | Перед оплатой видны адрес, время, оплата, сумма. | `/checkout` with sticky summary, radio payments, save card option. | Dodo payment providers/visuals unless real integration exists. |
| Footer/info block | SEO and trust live below commerce without clutter. | Clean columns like the latest footer/info block: big title, compact columns, no cards. | Dodo legal text, claims, metrics. |
| Profile | История, карты, адреса повышают доверие. | Наш profile with orders, addresses, cards when connected. | Dodo bonus mechanics and terms. |

## Public Site

Must:

- strict hero;
- real food visual;
- one primary CTA per context;
- clean header;
- SEO/info blocks in compact columns;
- no decorative gradients or random cards.

Content may mention family, kids zone, Morello Forni, breakfasts and events. Visual style stays strict.

## Delivery And Checkout

Must:

- catalog-first flow;
- sticky categories;
- compact product cards;
- cart drawer/sheet;
- `/checkout` on main site;
- `/payment` for online payment;
- no old `delivery` subdomain direction.

## Admin

Must:

- `/admin` only;
- role-based interface;
- orders first;
- light professional dashboard unless separately changed;
- no decorative hero, no gradients.

## Partners

Must:

- financial dashboard;
- promo code, discount, commission, delivered orders, payout statuses;
- clean table/card layout;
- no landing-page styling.

## Non-Negotiables

- No new gradients.
- No old warm decorative visual language.
- No copying Dodo assets, code, texts or exact layout.
- Keep Cheboksary, Pirogova 1T, restaurant content and order/admin business logic.
- Do not deploy from design work without approval.
