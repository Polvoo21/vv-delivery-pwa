# Design System MASTER for «Вместе Вкуснее»

## Статус

Этот документ заменяет старые дизайн-правила. Старое направление `Warm Food Commerce`, `Soft Restaurant UI`, кремовые лендинги, декоративные плашки, орбы, bokeh, glassmorphism и градиентные фоны больше не использовать.

Главный ориентир: строгий, чистый, лаконичный food-commerce уровня Dodo по UX-зрелости. Не копировать Dodo буквально: нельзя брать код, CSS, ассеты, тексты, логотипы, фирменные иллюстрации, точную раскладку, точные анимации и брендовые элементы.

Если в задаче звучит “как Dodo” или “в стиле Dodo”, использовать Dodo только как UX/композиционный референс. Dodo-оранжевый и его производные всегда заменять на фирменный красно-розовый акцент «Вместе Вкуснее» (`--vv-orange`, сейчас `#ca7767`) и его мягкие производные. Не заменять этот акцент зеленым.

## Product Style

Цель: сайт, доставка, админка и партнерский кабинет должны выглядеть как зрелый ресторанный digital-продукт, а не как декоративный лендинг.

Ключевые признаки:

- белый или очень светло-серый фон;
- темный читаемый текст;
- фирменный красно-розовый только как action-color;
- чистые карточки без лишних рамок;
- плотная сетка и ровные отступы;
- крупные реальные фото еды;
- короткие тексты;
- спокойные hover/active states;
- единая публичная шапка `SiteHeader` на всех страницах сайта, с тем же compact-состоянием при скролле и тем же меню, что на главной;
- минимум декора;
- никаких градиентов.

Семейность, ресторан, детская зона, Morello Forni, завтраки, праздники и локальность Чебоксар остаются в контенте и фотографиях. Визуально это не должно превращаться в “теплый декоративный” стиль.

Внутренние страницы могут иметь кнопку “вернуться назад”, но она размещается в контенте страницы. Нельзя заменять ею общую шапку сайта или делать отдельную кастомную мини-шапку.

## Forbidden Visuals

Запрещено добавлять:

- `linear-gradient`, `radial-gradient`, `conic-gradient`;
- декоративные орбы, bokeh, световые пятна;
- glassmorphism и тяжелые blur-слои;
- неон, кислотные цвета;
- случайные наклейки, стикеры, разрозненные бейджи;
- тяжелые черные тени;
- 5 разных радиусов и стилей карточек на одной странице;
- emoji как UI-иконки;
- hero из декоративных SVG/градиентных абстракций.

Если в существующем CSS есть градиенты, при следующем касании этих блоков заменять их на плоские цвета, реальные изображения, аккуратные overlay только через solid rgba, border и shadow.

## Color Tokens

Базовая палитра должна быть сдержанной:

```css
:root {
  --vv-bg: #f5f6f7;
  --vv-surface: #ffffff;
  --vv-surface-soft: #f0f2f4;
  --vv-surface-hover: #e9ecef;
  --vv-border: #e1e4e8;
  --vv-border-strong: #d2d6db;

  --vv-text: #1f2328;
  --vv-text-muted: #68707a;
  --vv-text-soft: #8a929c;

  /* Legacy token name: --vv-orange means brand red-pink accent, not Dodo orange. */
  --vv-orange: #ca7767;
  --vv-orange-hover: #b96558;
  --vv-orange-soft: #f5ded8;
  --vv-orange-softer: #fbefec;
  --vv-orange-rgb: 202, 119, 103;

  --vv-success: #159947;
  --vv-warning: #d98200;
  --vv-danger: #d43f2f;
  --vv-info: #2f6fed;

  --vv-dark: #242629;
}
```

Usage:

- Primary CTA: `--vv-orange`, то есть фирменный красно-розовый акцент, не Dodo orange.
- Secondary surfaces: white or light gray.
- Text: `--vv-text`.
- Muted copy: `--vv-text-muted`.
- Status colors only for statuses.
- No more than one strong accent in a block.

## Typography

Use system sans, Inter or Manrope. No handwritten or playful display fonts.

```css
--vv-font-body: Inter, Manrope, system-ui, sans-serif;
--vv-h1: clamp(36px, 5vw, 72px);
--vv-h2: clamp(28px, 3vw, 44px);
--vv-h3: clamp(22px, 2vw, 30px);
--vv-body-lg: 18px;
--vv-body: 16px;
--vv-small: 14px;
--vv-caption: 12px;
```

Rules:

- Headings are strong but compact.
- No oversized marketing typography inside tools, cards, checkout, admin, partner cabinet.
- Product names: 18-20 px.
- Product descriptions: 13-15 px, muted.
- Prices and totals: clear, tabular where possible.

## Spacing and Layout

```css
--vv-container: 1180px;
--vv-container-wide: 1320px;
--vv-gutter-mobile: 16px;
--vv-gutter-tablet: 24px;
--vv-gutter-desktop: 32px;

--vv-space-1: 4px;
--vv-space-2: 8px;
--vv-space-3: 12px;
--vv-space-4: 16px;
--vv-space-5: 20px;
--vv-space-6: 24px;
--vv-space-8: 32px;
--vv-space-10: 40px;
--vv-space-12: 48px;
--vv-space-16: 64px;
```

Rules:

- All major layouts use a grid.
- Repeated blocks share dimensions and rhythm.
- No floating decorative sections.
- No card inside card unless it is a real nested control.
- Footer/info blocks should be clean like the recent SEO/footer block: headline, 2-3 columns, short paragraphs.

## Radii and Shadows

```css
--vv-radius-sm: 8px;
--vv-radius-md: 12px;
--vv-radius-lg: 16px;
--vv-radius-xl: 20px;
--vv-radius-pill: 999px;

--vv-shadow-card: 0 8px 24px rgba(31, 35, 40, 0.08);
--vv-shadow-float: 0 18px 48px rgba(31, 35, 40, 0.14);
```

Rules:

- Default cards: radius 8-12.
- Modals/sheets: radius 16-20.
- Buttons: pill or radius 12-16.
- Shadows are light and utilitarian.
- No “soft premium” oversized rounded cards.

## Components

### Button

- Primary: solid brand red-pink accent.
- Secondary: light gray or white with border.
- Destructive: solid red only when needed.
- Height: 44-52 px.
- No gradients.
- Hover: darker fill or light gray background.
- Active: slight press, no bounce.

### ProductCard

- Image first, stable aspect ratio.
- Name, short description, price, CTA.
- Badges only when useful: новинка, хит, острое.
- No decorative badge piles.

### CategoryTabs

- Sticky on catalog/checkout contexts.
- Light gray background, black/brand-accent active state.
- Horizontal scroll on mobile.
- No glass blur.

### CartDrawer / CartSheet

- Clean side drawer on desktop, bottom sheet on mobile.
- Visible total and CTA.
- Promo code and upsell should not compete with checkout CTA.

### AddressSheet

- Map and form are functional, not decorative.
- Delivery/pickup segmented control.
- Saved addresses when available.
- Main CTA fixed inside sheet.

### Checkout

- Separate page `/checkout`.
- Sticky order summary on desktop.
- Strict form rows.
- Payment methods are clear radio rows.
- If “Картой на сайте” selected, show save-card checkbox.

### Admin

- `/admin` only.
- Role changes interface, not URL.
- Orders first.
- Dense but readable.
- Light professional dashboard by default; dark only if explicitly chosen later.

### Partners

- Financial cabinet, not marketing landing.
- Promo code, discount, commission, order list, statuses.
- Clean tables/cards, no decorative background.

## Motion

```css
--vv-ease: cubic-bezier(.2,.8,.2,1);
--vv-duration-fast: 140ms;
--vv-duration-base: 200ms;
--vv-duration-sheet: 300ms;
```

Use:

- hover/press: 140-200 ms;
- modal/sheet/drawer: 260-320 ms;
- loading: subtle.

No decorative entrance animations. No parallax. No animated gradients.

Always respect:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility

- Focus states visible.
- Touch targets at least 44 px.
- Text contrast WCAG AA.
- Forms have labels.
- Disabled buttons explain why when the reason is not obvious.
- Modals lock background scroll correctly.

## Definition of Done

Work is accepted when:

- the screen follows this strict clean product style;
- no new gradients were added;
- no old decorative visual language returned;
- responsive checks pass at 375, 390, 768, 1024, 1440 px;
- build passes;
- order saving/admin processing is not broken;
- no Dodo code/assets/texts/brand elements were copied.
