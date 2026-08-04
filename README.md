# Codex redesign pack for «Вместе Вкуснее»

Версия: VPS.

Пакет можно положить в корень репозитория. Он нужен, чтобы Codex перестал угадывать дизайн “на вкус” и работал по системе: бренд, UI-токены, страницы, приемка.

## 1. Установить UI UX Pro Max для Codex

```bash
cd /path/to/your/repo
npm install -g ui-ux-pro-max-cli
uipro init --ai codex
```

Альтернатива без глобальной установки:

```bash
cd /path/to/your/repo
npx ui-ux-pro-max-cli init --ai codex
```

Проверь, что в проекте появилась skill-папка для Codex. В актуальной структуре Codex читает repo skills из `.agents/skills`.

## 2. Положить эти файлы в репозиторий

Скопируй в корень репозитория:

```text
AGENTS.md
docs/design/MASTER.md
docs/design/page-briefs.md
docs/design/codex-prompts.md
.agents/skills/vv-food-redesign/SKILL.md
```

## 3. Подготовить референсы

Не скармливай Codex весь zip Dodo как “код для копирования”. Это шум и риск копипаста. Лучше добавить 8-12 скриншотов в:

```text
docs/design/reference/
```

Рекомендуемые имена:

```text
current-home-desktop.png
current-delivery-mobile.png
current-admin-login.png
current-admin-dashboard.png
current-partners.png
reference-dodo-home-desktop.png
reference-dodo-catalog-desktop.png
reference-dodo-product-card.png
reference-dodo-cart-drawer.png
reference-dodo-address-mobile.png
```

Dodo использовать только как UX-бенчмарк: структура, ясность, каталог, корзина, адрес, микровзаимодействия. Не копировать код, ассеты, тексты, логотипы, фирменные иллюстрации.

## 4. Запускать работу этапами

Открой `docs/design/codex-prompts.md` и запускай промпты по очереди. Не проси сразу “пересобери все сайты”. Сначала аудит и дизайн-система, потом фундамент компонентов, потом по одной поверхности: публичный сайт, доставка, админка, партнеры.

Так как проект на личном VPS: сначала локальный preview, скриншоты и build. Не выполнять ssh, rsync/scp, git pull на сервере, docker compose, pm2/systemctl/nginx restart/reload без отдельного подтверждения. После проверки Codex должен дать список команд для VPS-деплоя, но не запускать их сам.
