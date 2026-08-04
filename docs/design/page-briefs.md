# Page Briefs for «Вместе Вкуснее»

## Общее правило

Все страницы делаем в строгом лаконичном food-commerce стиле: белый/светло-серый фон, темный текст, фирменные красно-розовые CTA, крупные фото еды, чистая сетка, короткие тексты. Без градиентов, орбов, bokeh, glassmorphism, декоративных стикеров и случайных плашек.

Dodo использовать как ориентир по зрелости интерфейса: ясность, плотность, checkout, корзина, категории, модалки, футер. Нельзя копировать код, ассеты, тексты, логотипы, фирменные элементы и точную раскладку. Dodo-оранжевый всегда заменять на наш фирменный красно-розовый акцент (`--vv-orange`, сейчас `#ca7767`), не на зеленый.

Все публичные страницы используют одну и ту же шапку сайта `SiteHeader`: до скролла, после скролла, с меню, входом и корзиной. Внутренние страницы не делают собственную мини-шапку вместо общей; кнопку “назад” размещать внутри hero или контента.

## 1. Public Website: `vmestevkusnee.ru`

Goal: быстро объяснить ресторан, меню, доставку, бронь и доверие.

Keep as content:

- настоящая итальянская пицца;
- Чебоксары, Пирогова 1Т;
- детская зона;
- завтраки, обеды, праздники;
- Morello Forni;
- CTA: “Посмотреть меню”, “Оформить доставку”, “Забронировать стол”.

Visual direction:

- strict hero, not decorative landing;
- real food visual, no abstract background;
- one clear primary CTA;
- navigation like mature delivery product;
- footer/info blocks like the last added SEO/footer block: headline, 2-3 columns, compact text.

Structure:

1. Sticky top header.
2. Hero with food visual, copy, CTAs, location.
3. Quick benefits strip.
4. Menu highlights or seasonal cards.
5. Family/kids zone block.
6. Banquet/events block.
7. SEO/info block in clean columns.
8. Contacts and footer.

## 2. Delivery And Checkout: same site, `/checkout`

Goal: fast ordering on the main site without the old delivery subdomain as a separate product direction.

Keep:

- delivery/pickup toggle;
- address flow with map/form;
- cart drawer/sheet;
- auth gate before checkout;
- order saving into database and admin panel.

Visual direction:

- Dodo-level clarity, but original assets/content;
- sticky categories;
- compact product cards;
- right cart drawer on desktop;
- bottom sheet on mobile;
- checkout as clean form page;
- order summary sticky on desktop;
- payment methods as clear radio rows.

Suggested flow:

1. Catalog.
2. Product details.
3. Cart drawer/sheet.
4. Auth modal if user is not authorized.
5. `/checkout`.
6. `/payment` for online payment.
7. Success/status screen.

## 3. Admin: `/admin`

Goal: restaurant operations dashboard.

Rules:

- one `/admin` URL;
- role determines interface: manager or administrator;
- orders first;
- dense, readable, light professional UI;
- no dark MVP style unless separately approved;
- no gradients;
- no decorative hero blocks.

Must include:

- active orders summary;
- statuses: принят, готовится, у курьера, доставлен, закрыт;
- order list/cards;
- one-click status change;
- refresh controls;
- lost items add/delete/archive;
- manager-only settings, reviews, partners.

## 4. Partners

Goal: partner/blogger cabinet with promo code, orders and payouts.

Visual direction:

- financial dashboard, not landing page;
- light strict surfaces;
- compact cards;
- clear order and commission table;
- no decorative background.

Must show:

- personal promo code;
- client discount;
- partner commission percent;
- delivered orders counted;
- accrued amount;
- paid/cancelled statuses;
- rules and support contact.

## 5. Legal Pages

Goal: documents are easy to read but legally structured.

Visual direction:

- same strict document center;
- left nav, clean card, readable sections;
- no decorative gradients;
- no huge marketing hero;
- concise “Кратко для гостя” followed by full numbered legal text.

## 6. Shared Responsive Behavior

Desktop:

- container 1180-1320 px;
- sticky header where useful;
- catalog grid 3-4 columns;
- cart drawer right.

Tablet:

- 2 columns where appropriate;
- larger touch targets.

Mobile:

- no horizontal overflow;
- sticky bottom cart CTA;
- bottom sheets instead of centered modals when content is operational;
- forms with clear labels;
- product cards one column or compact two-column only if readable.
