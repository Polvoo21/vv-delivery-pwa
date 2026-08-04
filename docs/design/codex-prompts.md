# Prompts for Codex

Эти промпты заменяют старые дизайн-промпты. Не использовать старое направление `warm/soft/premium family Italian` как визуальный стиль. Семейность остается только в содержании, фото и сценариях.

## Global Design Rule For Every Prompt

```text
Use the current project rules from AGENTS.md, docs/design/MASTER.md and docs/design/page-briefs.md.

Main visual direction: strict, clean, laconic food-commerce at Dodo-level UX maturity, without copying Dodo code, CSS, assets, texts, logo, illustrations, exact layout, exact animations or brand elements.

Do not add gradients of any kind: no linear-gradient, radial-gradient or conic-gradient.
Do not add orbs, bokeh, glassmorphism, heavy blur layers, neon, decorative sticker piles or random cards.
Use white/light-gray surfaces, dark text, brand red-pink action color (`--vv-orange`, currently `#ca7767`), real food images, grid, compact copy.
If a prompt says “like Dodo”, use Dodo only for UX maturity, rhythm, density and clarity. Replace Dodo orange and its derivatives with the brand red-pink accent, never with green.

Preserve order saving, checkout, payment, auth, admin and partner business logic unless explicitly asked.
Do not deploy or run VPS/server commands without explicit approval.
```

## Prompt 1: Design Audit

```text
Task: audit current UI without code changes.

Read:
- AGENTS.md
- docs/design/MASTER.md
- docs/design/page-briefs.md
- current code and screenshots if relevant

Focus:
- where old decorative style, gradients, random cards or inconsistent tokens remain
- where UX is not Dodo-level clear
- where screens are too loose, noisy or MVP-looking

Deliver:
- concise audit by page
- phased plan
- files expected to touch

Do not modify UI code.
```

## Prompt 2: Design Foundation

```text
Task: implement shared design foundation only.

Implement:
- strict tokens from MASTER.md
- base buttons, fields, cards, sheets, badges
- focus-visible, hover, active states
- reduced motion

Constraints:
- no new gradients
- no production dependency unless necessary
- no order/business logic changes

Run build if available.
```

## Prompt 3: Public Website Hero And Header

```text
Task: redesign only public website header and hero.

Style:
- strict, clean, food-commerce
- real food visual
- clear CTA grouping
- no decorative landing-page clutter
- no gradients

Keep content:
- real Italian pizza
- Чебоксары, Пирогова 1Т
- delivery, menu, booking
- kids zone, breakfasts, events, Morello Forni as content cues

Run build if available.
```

## Prompt 4: Public Sections And Footer Info

```text
Task: redesign sections after hero.

Use the clean column style like the latest footer/SEO block:
- strong heading
- 2-3 columns
- compact paragraphs
- no floating decorative cards
- no gradients

Sections:
- benefits
- menu highlights
- kids zone
- breakfast/lunch
- banquet/events
- trust/social proof
- contacts/footer

Run build if available.
```

## Prompt 5: Catalog, Cart, Checkout

```text
Task: improve catalog, cart and checkout while preserving order logic.

Scope:
- sticky categories
- product cards
- product modal
- cart drawer/sheet
- auth gate
- /checkout
- /payment entry

Style:
- Dodo-level clarity, not Dodo copy
- compact
- no gradients
- clear disabled states and reasons

Run build and report errors.
```

## Prompt 6: Admin

```text
Task: improve /admin as restaurant operations dashboard.

Keep:
- role-based manager/admin interface
- order list and statuses
- lost items
- reviews
- partners/settings for manager

Style:
- light strict dashboard by default
- orders first
- no decorative hero
- no gradients
- dense but readable

Run build. Do not deploy.
```

## Prompt 7: Partners

```text
Task: improve partner cabinet.

Style:
- financial dashboard
- strict light surfaces
- compact tables/cards
- no decorative landing
- no gradients

Must show:
- promo code
- client discount
- partner commission
- delivered orders
- accrued/paid/cancelled statuses

Run build.
```

## Prompt 8: QA And Polish

```text
Task: final QA pass, no new features unless fixing issues.

Check:
- responsive 375, 390, 768, 1024, 1440
- no horizontal overflow
- CTAs visible
- focus states
- form labels/errors
- reduced motion
- build
- order flow still works
- no Dodo copy
- no new gradients in touched files

Do not deploy.
```
