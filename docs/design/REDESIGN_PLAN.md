# Redesign Plan: Вместе Вкуснее

Дата: 2026-07-07

## Objective

Перевести продукт в строгий лаконичный food-commerce стиль уровня зрелой доставки. Старое направление с теплой декоративностью, кремовыми лендингами, градиентами, орбами и случайными карточками больше не использовать.

## Principles

- Сначала локально, деплой только после ручной проверки и разрешения.
- Не трогать production-сервер без явного разрешения.
- Не ломать сохранение заказов, админку, оплату, авторизацию, партнерские начисления.
- Dodo использовать как UX-бенчмарк, не как источник копирования. Dodo-оранжевый всегда заменять на фирменный красно-розовый акцент `#ca7767` / `--vv-orange`, не на зеленый.
- Никаких новых градиентов.
- При касании старых экранов заменять градиенты на solid colors, реальные фото, border, shadow.
- Все экраны должны быть частью одной строгой системы.

## Target Product Structure

- `vmestevkusnee.ru`: публичный сайт, каталог, доставка, checkout.
- `/checkout`: оформление заказа.
- `/payment`: переход к онлайн-оплате.
- `/admin`: единая админка, интерфейс зависит от роли.
- Partners functionality: через партнерский кабинет/раздел без отдельного визуального языка.

## Design Tokens

Use tokens from `docs/design/MASTER.md`. Target palette:

- background: `#f5f6f7`;
- surface: `#ffffff`;
- soft surface: `#f0f2f4`;
- text: `#1f2328`;
- muted: `#68707a`;
- border: `#e1e4e8`;
- action accent: brand red-pink `#ca7767`;
- status colors only for statuses.

No `linear-gradient`, `radial-gradient`, `conic-gradient`.

## Phase 1: Rules And CSS Cleanup Baseline

Goal: prevent old design language from returning.

Actions:

- Keep `AGENTS.md`, `MASTER.md`, `page-briefs.md`, prompts and reference docs aligned.
- Search new code for `gradient`, `orb`, `glass`, `bokeh`, decorative blur before finalizing UI work.
- Do not do a massive CSS rewrite without visual QA.

Verification:

- Build passes.
- No new gradient usage in touched files.

## Phase 2: Public Site

Goal: make public site strict, clean and commerce-ready.

Actions:

- Simplify hero.
- Remove decorative pлашки and random cards.
- Use real food visual and clear CTA.
- Make SEO/footer/info blocks in clean columns.
- Keep restaurant content: pizza, kids zone, breakfasts, events, Morello Forni.

Risk:

- Public anchors and CTAs.
- Responsive header.

## Phase 3: Catalog, Cart, Checkout

Goal: catalog and checkout feel like a mature delivery product.

Actions:

- Sticky categories.
- Product cards with stable media.
- Cart drawer/sheet with clear totals.
- `/checkout` form with sticky summary.
- Payment radio rows and save-card option.

Business logic:

- Keep API payloads unless a task explicitly changes them.
- Keep order saving and admin processing.

## Phase 4: Admin

Goal: operational dashboard, not MVP panel.

Actions:

- Orders first.
- Role-based manager/admin interface.
- Light strict dashboard.
- Clear statuses.
- Lost items, reviews, partners, settings in role-appropriate places.
- Remove decorative hero/gradient surfaces as screens are touched.

## Phase 5: Partners

Goal: clean financial cabinet.

Actions:

- Promo code block.
- Discount and commission.
- Delivered orders counted.
- Statuses: pending/accrued/paid/cancelled.
- Search and table readability.

## Phase 6: Legal And SEO Pages

Goal: document center and SEO blocks are clean, not decorative.

Actions:

- Left nav + document card.
- Short guest summary + full numbered text.
- Footer/info blocks in columns.
- No gradients or oversized decorative cards.

## QA

Check before final:

- `npm run build`;
- responsive at 375, 390, 768, 1024, 1440;
- no horizontal overflow;
- CTAs visible;
- focus-visible;
- disabled buttons explain reason when needed;
- no Dodo copy;
- no new gradients in touched files;
- order/admin logic not broken.

## Do Not Change Without Separate Approval

- VPS/server config.
- Database contracts.
- Payment production credentials.
- Admin auth model beyond requested role work.
- Partner commission calculation.
- Deployment.
