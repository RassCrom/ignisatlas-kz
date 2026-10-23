# M0 «Основа» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подготовить фундамент нового сайта: тесты и CI, чистые зависимости, токены и шрифты дизайн-системы, новую систему языков с префиксом в адресе, старую карту по `/{lang}/map/legacy` и проверку связки deck.gl + глобус MapLibre.

**Architecture:** Новый код живёт в `src/design`, `src/i18n`, `src/app` и `src/dev`. Он не трогает старые модули, кроме двух точечных правок: старый `I18nProvider` становится управляемым извне, а `App` переходит на таблицу маршрутов `createAppRoutes(pages)`. Язык определяется первым сегментом адреса. Старые страницы продолжают работать под префиксом, пока их не заменят этапы M2–M4.

**Tech Stack:** React 19, Vite 6.4, react-router-dom 7.15, MapLibre GL 5.24, vitest + @testing-library/react + jsdom, Playwright, fontsource, fontkit, deck.gl 9.4 (только в проверочной странице), pnpm 10.30.2.

**Spec:** `docs/superpowers/specs/2026-10-23-tungi-dala-redesign-design.md` (разделы 2, 6, 8, 10, 11, 13, 14)

## Global Constraints

- Языки: `kk` (по умолчанию), `ru`, `en`. Все адреса с префиксом `/kk`, `/ru`, `/en`. Адрес `/` ведёт на сохранённый язык, затем на язык браузера, по умолчанию `kk`.
- Ключ хранения языка остаётся прежним: `fires-kz-language`.
- Если перевода нет, показывается русский текст (spec §12).
- В казахских словарях нет латинской транслитерации (spec §10).
- Шрифты: Roboto Flex (ширина 120–151, вес 700–1000), Onest 400–600, Spectral 300 и 300 italic, IBM Plex Mono 400–500. У каждого есть ә ғ қ ң ө ұ ү һ і. Раздаются с собственного домена через fontsource, подмножества latin, cyrillic и cyrillic-ext.
- Цвета токенов берутся из spec §6.2. Исключение: Бумага `--ink-dim` = `#5F6266` вместо `#6B6E72`. Значение из спецификации даёт контраст 4,35 : 1 к `#ECEDE7` и не проходит AA, которого требует §6.2.
- Шкала размеров: 12, 14, 16, 18, 22, 28, 36, 48, 72, 104 px. Кривая интерфейса `cubic-bezier(.16,1,.3,1)`, интерфейсные длительности 150–220 мс.
- Старая карта работает без изменений. Её единственный новый адрес — `/{lang}/map/legacy`. До этапа M2 тот же компонент отвечает и на `/{lang}/map`.
- **Отклонение от spec §8.2, согласовано владельцем 23.10.2026.** Файлы старой карты (`src/modules/MapPage`, `src/shared/components/Sidebar`, `src/app/store`) в M0 физически не переносятся в `src/legacy/`. Перенос затронул бы сотни импортов и смешался бы с незакоммиченной работой в этих же файлах. Изоляцию даёт правило ESLint в Task 9: новый код не может импортировать старые модули. Файлы удаляются целиком в фазе 2.
- `/report` и `/research` без префикса временно ведут на `/{lang}/report` и `/{lang}/research`. Переадресация на атлас появится в M4.
- Один менеджер пакетов — pnpm 10.30.2.
- deck.gl не попадает в продакшен-сборку M0.
- JS первого экрана не растёт: новый код M0 не добавляет тяжёлых зависимостей в основной чанк.

## Review Focus

1. Мусор в префиксе (`/de/map`, `/KK/report`, `/kk` без слэша) → пользователь попадает на страницу с правильным языком, а не на пустой экран. Тест в Task 9.
2. `localStorage` бросает исключение (приватный режим Safari) → язык определяется по браузеру, сайт не падает. Тест в Task 6.
3. Смена языка на глубокой странице сохраняет путь, `?query` и `#hash` (`/ru/map/legacy?x=1#y` → `/en/map/legacy?x=1#y`). Тест в Task 6.
4. Ключа нет в `kk` → показывается русский текст, а не сам ключ. Тест в Task 6.
5. Прямая загрузка глубокого адреса после деплоя (`/ru/map/legacy`) отдаёт приложение, а не 404. Тест в Task 11 (e2e на `vite preview`).

---

### Task 0: Подготовка ветки

**Files:** нет

- [ ] **Step 1: Проверить, что незакоммиченной работы нет**

Run: `git status --short`
Expected: пустой вывод. Если в списке есть файлы, остановитесь и попросите владельца закоммитить или отложить их (spec §13, п. 9). Сами ничего не коммитьте и не откладывайте.

- [ ] **Step 2: Создать ветку от текущей**

Run: `git switch -c feature/tungi-dala`
Expected: `Switched to a new branch 'feature/tungi-dala'`

---

### Task 1: Тестовый стенд vitest

**Files:**
- Modify: `package.json` (scripts `test`, `test:watch`; devDependencies)
- Modify: `vite.config.js` (блок `test`)
- Create: `src/test/setup.js`
- Test: `src/shared/utils/fireApi.test.js`

**Interfaces:**
- Produces: `pnpm test` запускает все `src/**/*.test.{js,jsx}` и `scripts/**/*.test.mjs` в jsdom. Матчеры `@testing-library/jest-dom` подключены глобально.

- [ ] **Step 1: Написать тест на существующую функцию**

```js
import { describe, expect, it } from 'vitest';
import { normalizeFireDate } from 'src/shared/utils/fireApi';

describe('normalizeFireDate', () => {
  it('pads dotted dates', () => expect(normalizeFireDate('2024.7.3')).toBe('2024-07-03'));
  it('rejects impossible dates', () => expect(normalizeFireDate('2024-02-30')).toBeNull());
});
```

- [ ] **Step 2: Убедиться, что тест не запускается**

Run: `pnpm test`
Expected: ошибка `Missing script: "test"`.

- [ ] **Step 3: Подключить vitest**

Установите `vitest` той версии, у которой в `peerDependencies` есть Vite 6 (проверка: `npm view vitest@<версия> peerDependencies`; запасной вариант — последняя 3.2.x). Также установите `jsdom`, `@testing-library/react` и `@testing-library/jest-dom` как devDependencies.

В `vite.config.js` добавьте блок `test`: `environment: 'jsdom'`, `setupFiles: ['src/test/setup.js']`, `include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.mjs']`. Алиас `src` уже есть в `resolve`.

`setup.js` импортирует `@testing-library/jest-dom/vitest`. Скрипты: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Запустить тест**

Run: `pnpm test`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.js src/test/setup.js src/shared/utils/fireApi.test.js
git commit -m "test: add vitest harness"
```

---

### Task 2: Чистка зависимостей и сборки

**Files:**
- Delete: `package-lock.json`, `yarn.lock` (в git), `yarn-error.log` (только на диске, он в .gitignore)
- Modify: `package.json`, `netlify.toml`

**Interfaces:**
- Produces: `"packageManager": "pnpm@10.30.2"` в `package.json`; Netlify собирает командой `pnpm build`.

- [ ] **Step 1: Удалить lock-файлы и лог**

Run: `git rm package-lock.json yarn.lock` и удалите `yarn-error.log`.

- [ ] **Step 2: Поправить `package.json`**

- Добавьте `"packageManager": "pnpm@10.30.2"`.
- Удалите неиспользуемые `@tanstack/react-query`, `tippy.js`, `vite-plugin-optimize-persist` и `vite-plugin-package-config`: ни одного импорта в `src/`, `vite.config.js` и `index.html` нет.
- Перенесите `eslint-import-resolver-alias` и `eslint-plugin-import` в devDependencies.
- Запустите `pnpm install`.

- [ ] **Step 3: Поправить `netlify.toml`**

- Команда сборки: `command = "pnpm build"`.
- Добавьте `[build.environment]` с `NODE_VERSION = "22"`.
- Удалите блоки `[context.production]`, `[context.deploy-preview]` и `[context.dev]`: `VITE_API_URL` в коде не используется, адреса в них заглушки.
- Перенаправление `/* → /index.html 200` оставьте.

- [ ] **Step 4: Проверить, что всё собирается**

Run: `pnpm lint && pnpm test && pnpm build`
Expected: lint без ошибок (предупреждения были и раньше), тесты проходят, `vite build` пишет `dist/`.

- [ ] **Step 5: Commit**

```bash
git add -A package.json pnpm-lock.yaml netlify.toml
git commit -m "chore: use pnpm only and drop unused dependencies"
```

---

### Task 3: Неиспользуемые файлы в public

**Files:**
- Create: `scripts/lib/unused-public.mjs`, `scripts/find-unused-public.mjs`
- Test: `scripts/lib/unused-public.test.mjs`
- Delete: файлы, которые найдёт скрипт
- Modify: `src/modules/LandingPage/**/Hero*.jsx` (убрать ссылку на отсутствующий `hero-800.webp` из `srcSet`)

**Interfaces:**
- Produces: `findUnusedPublic(files: string[], sources: string[]): string[]`. `files` — пути относительно `public/` через `/`, `sources` — тексты исходников. Возвращает отсортированный список неиспользуемых файлов.

- [ ] **Step 1: Написать тест**

```js
import { expect, it } from 'vitest';
import { findUnusedPublic } from './unused-public.mjs';

it('keeps files referenced by name or by their folder prefix', () => {
  const files = ['hero.webp', 'hero-2.webp', 'icons/a.svg', 'layers/x.geojson'];
  const sources = ['<img src="/hero.webp">', 'fetch(`/icons/${name}.svg`)'];
  expect(findUnusedPublic(files, sources)).toEqual(['hero-2.webp', 'layers/x.geojson']);
});
```

- [ ] **Step 2: Запустить тест**

Run: `pnpm test scripts/lib/unused-public.test.mjs`
Expected: FAIL, модуль не найден.

- [ ] **Step 3: Реализовать функцию и CLI**

Файл считается используемым, если в каком-нибудь исходнике встречается его путь (`/hero.webp` или `hero.webp`) или префикс его папки со слэшем (`/icons/`).

CLI `scripts/find-unused-public.mjs` читает все файлы `public/`, а исходники берёт из `src/**/*.{js,jsx,scss,css}`, `index.html`, `vite.config.js` и `public/**/*.{json,css,html}`. Найденный список печатает по одному файлу на строку.

- [ ] **Step 4: Запустить тест и скрипт**

Run: `pnpm test scripts/lib/unused-public.test.mjs && node scripts/find-unused-public.mjs`
Expected: тест проходит. В списке есть `layers/water_bodies.geojson`, `layers/districts.geojson`, `layers/kz_1.json` и `hero-2.webp`. Каждую строку перепроверьте через `git grep -n "<имя файла>"`.

- [ ] **Step 5: Удалить найденное и починить srcSet**

Удалите перечисленные файлы через `git rm`. Из `srcSet` героя на старом лендинге уберите отсутствующий `hero-800.webp`.

Run: `pnpm build && du -sh dist`
Expected: сборка проходит, `dist` меньше примерно на 100 МБ (было 199 МБ).

- [ ] **Step 6: Commit**

```bash
git add -A public scripts src/modules/LandingPage
git commit -m "chore: remove unused public assets (~100 MB)"
```

---

### Task 4: Токены дизайн-системы и шкалы данных

**Files:**
- Create: `src/design/tokens.css`, `src/design/scales.json`, `src/design/contrast.js`
- Modify: `src/main.jsx` (импорт `src/design/tokens.css`)
- Test: `src/design/tokens.test.js`, `src/design/contrast.test.js`

**Interfaces:**
- Produces: CSS-переменные на `:root, [data-surface="night"]` и `[data-surface="paper"]`:
  - цвета: `--bg`, `--surface`, `--surface-2`, `--line`, `--ink`, `--ink-dim`, `--fire`, `--fire-hot` (Ночь), `--scar` (Ночь), `--steppe` (Бумага), `--sky` (Ночь);
  - общие: `--sh-night`, `--sh-saffron`, `--sh-felt`, `--sh-ember`;
  - шрифты: `--font-display`, `--font-text`, `--font-serif`, `--font-mono`;
  - размеры: `--fs-12` … `--fs-104`;
  - движение: `--ease-ui`, `--dur-ui` (180ms), `--dur-scene` (750ms).
- Produces: `contrastRatio(hexA: string, hexB: string): number` — формула относительной яркости WCAG 2.1.
- Produces: `src/design/scales.json` с ключами `ember`, `ink`, `diverging`, `landcover`. Его же читает конвейер M1.

- [ ] **Step 1: Написать тесты**

```js
// contrast.test.js
it('matches WCAG reference values', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  expect(contrastRatio('#6B6E72', '#ECEDE7')).toBeCloseTo(4.35, 1);
});

// tokens.test.js: tokens.css читается через fs, переменные разбираются по блокам [data-surface]
it.each([
  ['night', '--ink', '--bg', 4.5], ['night', '--ink-dim', '--bg', 4.5], ['night', '--ink-dim', '--surface-2', 4.5],
  ['night', '--fire', '--bg', 3], ['paper', '--ink', '--bg', 4.5], ['paper', '--ink-dim', '--bg', 4.5],
  ['paper', '--ink-dim', '--surface-2', 4.5], ['paper', '--fire', '--bg', 3],
])('%s %s on %s ≥ %f', (surface, fg, bg, min) => {
  expect(contrastRatio(token(surface, fg), token(surface, bg))).toBeGreaterThanOrEqual(min);
});
it('night palette uses spec values', () => {
  expect(token('night', '--bg')).toBe('#05060A');
  expect(token('night', '--fire')).toBe('#FF6A1A');
});
it('paper ink-dim is the AA-corrected value', () => expect(token('paper', '--ink-dim')).toBe('#5F6266'));
```

```js
// scales.test.js (рядом с tokens.test.js)
it('scales match the spec', () => {
  expect(scales.ember).toEqual(['#1D1C42', '#6E2D40', '#D2401E', '#E8A33D', '#FFE6B0']);
  expect(scales.ink).toEqual(['#DEDBD0', '#E7B79E', '#DE7F5C', '#C7432A', '#8E1F12']);
  expect(Object.keys(scales.landcover)).toEqual(['cropland', 'crop_mosaic', 'grassland', 'shrubland', 'forest', 'wetland', 'sparse_bare', 'other']);
});
```

- [ ] **Step 2: Запустить тесты**

Run: `pnpm test src/design`
Expected: FAIL, файлов ещё нет.

- [ ] **Step 3: Написать токены, шкалы и `contrastRatio`**

Значения цветов берутся из таблицы spec §6.2. Исключение: Бумага `--ink-dim: #5F6266`.

Ночь — это `:root` и `[data-surface="night"]`, Бумага — `[data-surface="paper"]`. В каждом блоке задайте `color-scheme`.

Шрифтовые переменные (имена семейств fontsource):
- `--font-display: "Roboto Flex Variable", "Onest Variable", system-ui, sans-serif`;
- `--font-text: "Onest Variable", system-ui, sans-serif`;
- `--font-serif: "Spectral", Georgia, serif`;
- `--font-mono: "IBM Plex Mono", ui-monospace, monospace`.

Шкалы:
- `diverging`: `["#3FA9FF", "#1C1F2A", "#FF6A1A"]`;
- `landcover`: цвета из `wak2/wak2/step5_landcover.py`, `COLORS`: cropland `#E8C547`, crop_mosaic `#B8963A`, grassland `#9CC45A`, shrubland `#5F8F5B`, forest `#2E7D4F`, wetland `#3FA9F5`, sparse_bare `#B08968`, other `#6B7075`.

- [ ] **Step 4: Запустить тесты**

Run: `pnpm test src/design`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/design src/main.jsx
git commit -m "feat(design): add night/paper tokens and data scales"
```

---

### Task 5: Шрифты и проверка казахских букв

**Files:**
- Create: `src/design/fonts.js`, `scripts/lib/glyphs.mjs`, `scripts/check-kazakh-glyphs.mjs`
- Modify: `src/main.jsx` (импорт `src/design/fonts.js`), `package.json` (скрипт `check:glyphs`, зависимости)
- Test: `scripts/lib/glyphs.test.mjs`

**Interfaces:**
- Produces: `KAZAKH_CODEPOINTS = [0x04D9, 0x0493, 0x049B, 0x04A3, 0x04E9, 0x04B1, 0x04AF, 0x04BB, 0x0456]`.
- Produces: `missingCodePoints(fontFiles: string[], codePoints: number[]): Promise<number[]>` — кодовые точки, которых нет ни в одном из файлов. Файлы шрифта открываются через fontkit.
- Produces: `pnpm check:glyphs` — выход с кодом 1, если хотя бы в одном семействе нет букв.

- [ ] **Step 1: Установить шрифты и fontkit**

Run: `pnpm add @fontsource-variable/roboto-flex @fontsource-variable/onest @fontsource/spectral @fontsource/ibm-plex-mono && pnpm add -D fontkit`
Expected: пакеты в `package.json`. Посмотрите имена файлов: `ls node_modules/@fontsource-variable/roboto-flex/files | grep cyrillic`.

- [ ] **Step 2: Написать тест**

```js
const onest = 'node_modules/@fontsource-variable/onest/files';
it('finds all Kazakh letters in Onest cyrillic subsets', async () => {
  const files = (await readdir(onest)).filter((f) => /cyrillic/.test(f)).map((f) => `${onest}/${f}`);
  expect(await missingCodePoints(files, KAZAKH_CODEPOINTS)).toEqual([]);
});
it('reports all letters missing from a latin-only subset', async () => {
  const latin = (await readdir(onest)).filter((f) => /-latin-wght/.test(f)).map((f) => `${onest}/${f}`);
  expect(await missingCodePoints(latin, KAZAKH_CODEPOINTS)).toHaveLength(9);
});
```

- [ ] **Step 3: Запустить тест**

Run: `pnpm test scripts/lib/glyphs.test.mjs`
Expected: FAIL, модуль не найден.

- [ ] **Step 4: Реализовать проверку и подключить шрифты**

`check-kazakh-glyphs.mjs` проходит по четырём семействам. Для каждого берёт файлы cyrillic и cyrillic-ext тех начертаний, которые подключены в `fonts.js`, печатает недостающие буквы по семействам и выходит с кодом 1, если что-то пропущено.

`fonts.js` импортирует:
- `@fontsource-variable/roboto-flex/full.css` (все оси, включая ширину);
- `@fontsource-variable/onest/index.css`;
- `@fontsource/spectral/300.css` и `300-italic.css`;
- `@fontsource/ibm-plex-mono/400.css` и `500.css`.

Скрипт в `package.json`: `"check:glyphs": "node scripts/check-kazakh-glyphs.mjs"`.

- [ ] **Step 5: Запустить тесты и проверку**

Run: `pnpm test scripts/lib/glyphs.test.mjs && pnpm check:glyphs && pnpm build`
Expected: тесты проходят. `check:glyphs` печатает `4 families OK`. Сборка кладёт woff2 в `dist/assets`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/design/fonts.js src/main.jsx scripts/lib/glyphs.mjs scripts/lib/glyphs.test.mjs scripts/check-kazakh-glyphs.mjs
git commit -m "feat(design): self-host fonts and check Kazakh glyphs"
```

---

### Task 6: Ядро языков

**Files:**
- Create: `src/i18n/locales.js`, `src/i18n/detectLocale.js`, `src/i18n/paths.js`, `src/i18n/createTranslator.js`
- Test: `src/i18n/detectLocale.test.js`, `src/i18n/paths.test.js`, `src/i18n/createTranslator.test.js`

**Interfaces:**
- Produces (`locales.js`):
  - `LOCALES = ['kk', 'ru', 'en']`, `DEFAULT_LOCALE = 'kk'`, `FALLBACK_LOCALE = 'ru'`;
  - `INTL_LOCALE = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' }`;
  - `LOCALE_STORAGE_KEY = 'fires-kz-language'`;
  - `isLocale(x: unknown): boolean`, `normalizeLocale(x: string): string | null` (без учёта регистра: `'KK'` → `'kk'`).
- Produces: `detectLocale({ storage, languages }): string`.
- Produces (`paths.js`):
  - `splitLocalePath(pathname: string): { locale: string | null, rest: string }`; `rest` всегда начинается с `/`;
  - `withLocale(locale: string, rest: string): string`;
  - `swapLocaleInPath(pathname: string, search: string, hash: string, nextLocale: string): string`.
- Produces: `createTranslator({ locale, dictionaries, formatToken }): (key: string, params?: object) => string`.
  - `dictionaries` имеет вид `{ [locale]: { [namespace]: object } }`. Ключ `'common.nav.story'`: первый сегмент — пространство имён.
  - Порядок поиска: `locale`, затем `FALLBACK_LOCALE`, затем сам ключ.
  - Значение-объект `{ one, few, many, other }` выбирается по `Intl.PluralRules(INTL_LOCALE[locale]).select(params.count)` с откатом на `other`.
  - `{{name}}` подставляется из `params`.
  - `{{n:id}}` уходит в `formatToken('n', id)`. Если `formatToken` не передан, токен остаётся как есть. Этот вход использует M1.

- [ ] **Step 1: Написать тесты**

```js
// detectLocale.test.js
it('prefers a saved locale', () => expect(detectLocale({ storage: fakeStorage('ru'), languages: ['en-US'] })).toBe('ru'));
it('uses the browser language next', () => expect(detectLocale({ storage: fakeStorage(null), languages: ['en-US', 'ru'] })).toBe('en'));
it('defaults to kk', () => expect(detectLocale({ storage: fakeStorage(null), languages: ['de-DE'] })).toBe('kk'));
it('survives a throwing storage', () => {
  const storage = { getItem: () => { throw new Error('SecurityError'); } };
  expect(detectLocale({ storage, languages: ['ru-RU'] })).toBe('ru');
});

// paths.test.js
it('splits a prefixed path', () => expect(splitLocalePath('/ru/map/legacy')).toEqual({ locale: 'ru', rest: '/map/legacy' }));
it('treats an unknown first segment as path', () => expect(splitLocalePath('/map')).toEqual({ locale: null, rest: '/map' }));
it('normalises case', () => expect(splitLocalePath('/KK/report')).toEqual({ locale: 'kk', rest: '/report' }));
it('keeps query and hash on swap', () =>
  expect(swapLocaleInPath('/ru/map/legacy', '?x=1', '#y', 'en')).toBe('/en/map/legacy?x=1#y'));
it('handles a bare locale', () => expect(swapLocaleInPath('/kk', '', '', 'ru')).toBe('/ru/'));

// createTranslator.test.js
const dictionaries = {
  kk: { common: { nav: { story: 'Тарих' }, fires: { one: '{{count}} өрт', other: '{{count}} өрт' } } },
  ru: { common: { nav: { story: 'История', map: 'Карта' }, fires: { one: '{{count}} пожар', few: '{{count}} пожара', many: '{{count}} пожаров', other: '{{count}} пожара' } } },
};
it('reads the current locale', () => expect(createTranslator({ locale: 'kk', dictionaries })('common.nav.story')).toBe('Тарих'));
it('falls back to Russian', () => expect(createTranslator({ locale: 'kk', dictionaries })('common.nav.map')).toBe('Карта'));
it('returns the key when nothing matches', () => expect(createTranslator({ locale: 'en', dictionaries })('common.nav.atlas')).toBe('common.nav.atlas'));
it('picks Russian plural forms', () => {
  const t = createTranslator({ locale: 'ru', dictionaries });
  expect([1, 3, 5].map((count) => t('common.fires', { count }))).toEqual(['1 пожар', '3 пожара', '5 пожаров']);
});
it('delegates number tokens', () => {
  const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: 'в {{n:ratio}} раза' } } }, formatToken: (kind, id) => `${kind}:${id}` });
  expect(t('s.a')).toBe('в n:ratio раза');
});
```

- [ ] **Step 2: Запустить тесты**

Run: `pnpm test src/i18n`
Expected: FAIL, модулей нет.

- [ ] **Step 3: Реализовать четыре модуля по интерфейсам выше**

`detectLocale` читает `storage.getItem(LOCALE_STORAGE_KEY)` внутри `try/catch`, затем берёт первый язык из `languages`, чья часть до дефиса проходит `isLocale`.

- [ ] **Step 4: Запустить тесты**

Run: `pnpm test src/i18n`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/i18n
git commit -m "feat(i18n): add locale detection, path helpers and translator"
```

---

### Task 7: LocaleProvider, общий словарь и старый провайдер

**Files:**
- Create: `src/i18n/LocaleProvider.jsx`, `src/i18n/dictionaries.js`, `src/i18n/locales/kk/common.json`, `src/i18n/locales/ru/common.json`, `src/i18n/locales/en/common.json`
- Modify: `src/shared/i18n/I18nProvider.jsx`
- Test: `src/i18n/LocaleProvider.test.jsx`, `src/shared/i18n/I18nProvider.test.jsx`

**Interfaces:**
- Consumes: Task 6 целиком.
- Produces:
  - `<LocaleProvider locale={string}>`; `useLocale(): { locale, t, setLocale(next: string) }`;
  - `setLocale` пишет язык в хранилище (в `try/catch`) и вызывает `navigate(swapLocaleInPath(...), { replace: false })`;
  - провайдер ставит `document.documentElement.lang = locale`.
- Produces: старый `I18nProvider` принимает необязательные `language` и `onLanguageChange(code)`. Если передан `language`, провайдер управляемый: не читает и не пишет `localStorage`, а `setLanguage(code)` вызывает `onLanguageChange(code)`.
- Produces: `dictionaries` — `{ kk: { common }, ru: { common }, en: { common } }`.

Словарь `common.json` (`kk` / `ru` / `en`):

| Ключ | kk | ru | en |
|---|---|---|---|
| `nav.story` | Тарих | История | Story |
| `nav.atlas` | Атлас | Атлас | Atlas |
| `nav.map` | Карта | Карта | Map |
| `nav.data` | Деректер | Данные | Data |
| `lang.kk` / `lang.ru` / `lang.en` | Қазақша / Русский / English | те же | те же |
| `langShort.kk` / `.ru` / `.en` | ҚАЗ / РУС / ENG | те же | те же |
| `skipToContent` | Мазмұнға өту | Перейти к содержимому | Skip to content |

- [ ] **Step 1: Написать тесты**

```jsx
// LocaleProvider.test.jsx
function Probe() { const { t, setLocale } = useLocale(); const loc = useLocation(); return <><p>{t('common.nav.story')}</p><p data-testid="path">{loc.pathname + loc.search}</p><button onClick={() => setLocale('en')}>en</button></>; }
it('translates, sets html lang and switches locale keeping the path', async () => {
  render(<MemoryRouter initialEntries={['/ru/map/legacy?x=1']}><LocaleProvider locale="ru"><Probe /></LocaleProvider></MemoryRouter>);
  expect(screen.getByText('История')).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('ru');
  await userEvent.click(screen.getByText('en'));
  expect(screen.getByTestId('path')).toHaveTextContent('/en/map/legacy?x=1');
});

// I18nProvider.test.jsx
it('delegates language changes in controlled mode', async () => {
  const onLanguageChange = vi.fn();
  render(<I18nProvider language="ru" onLanguageChange={onLanguageChange}><SwitchProbe to="en" /></I18nProvider>);
  await userEvent.click(screen.getByRole('button'));
  expect(onLanguageChange).toHaveBeenCalledWith('en');
});
```

`@testing-library/user-event` поставьте как devDependency. `SwitchProbe` — кнопка внутри теста, которая вызывает `useI18n().setLanguage(to)`.

- [ ] **Step 2: Запустить тесты**

Run: `pnpm test src/i18n/LocaleProvider.test.jsx src/shared/i18n/I18nProvider.test.jsx`
Expected: FAIL

- [ ] **Step 3: Реализовать провайдер, словари и управляемый режим старого провайдера**

- [ ] **Step 4: Запустить тесты**

Run: `pnpm test`
Expected: PASS, все тесты, включая предыдущие задачи.

- [ ] **Step 5: Commit**

```bash
git add src/i18n src/shared/i18n package.json pnpm-lock.yaml
git commit -m "feat(i18n): add LocaleProvider and controlled legacy provider"
```

---

### Task 8: Проверка словарей в CI

**Files:**
- Create: `scripts/lib/i18n-check.mjs`, `scripts/check-i18n.mjs`
- Modify: `package.json` (скрипт `check:i18n`)
- Test: `scripts/lib/i18n-check.test.mjs`

**Interfaces:**
- Produces: `compareKeys(dicts: Record<string, object>): string[]` — ошибки вида `"en/common: missing nav.data"`, `"ru/common: extra nav.old"` и `"kk/common: empty nav.map"`.
- Produces: `findLatinInKazakh(dict: object, allow: string[]): string[]` — ошибки вида `"kk/common: nav.story contains 'Tarih'"`.
- Produces: `KK_LATIN_ALLOW = ['Tabiat Küzeti', 'NASA', 'FIRMS', 'MODIS', 'VIIRS', 'MCD64A1', 'ERA5-Land', 'ERA5', 'FWI', 'GFAS', 'GFED', 'CO₂', 'CH₄', 'PM2.5', 'OpenStreetMap', 'Sentinel-2', 'Terra', 'Aqua', 'S-NPP', 'NOAA-20', 'NOAA-21', 'PNG', 'CSV', 'ENG']`.
- Produces: `pnpm check:i18n` проверяет `src/i18n/locales/{kk,ru,en}/*.json` и выходит с кодом 1 при ошибках. Старый `src/shared/i18n/config.js` не проверяется: он уходит вместе со старыми страницами.

- [ ] **Step 1: Написать тесты**

```js
it('reports missing, extra and empty keys against the union', () => {
  const errors = compareKeys({ kk: { common: { a: 'x', b: '' } }, ru: { common: { a: 'x', b: 'y', c: 'z' } }, en: { common: { a: 'x', b: 'y' } } });
  expect(errors).toEqual(expect.arrayContaining(['kk/common: empty b', 'kk/common: missing c', 'en/common: missing c']));
});
it('flags Latin transliteration but allows listed terms and placeholders', () => {
  const dict = { common: { ok: 'MODIS {{count}} нүкте', bad: 'Qazaqstandaghy örtter' } };
  expect(findLatinInKazakh(dict, KK_LATIN_ALLOW)).toEqual(["kk/common: bad contains 'Qazaqstandaghy'"]);
});
```

- [ ] **Step 2: Запустить тесты**

Run: `pnpm test scripts/lib/i18n-check.test.mjs`
Expected: FAIL

- [ ] **Step 3: Реализовать**

Перед поиском из строки вырезаются `{{...}}` и разрешённые термины. Ошибкой считается любая оставшаяся последовательность из трёх и более латинских букв, включая буквы с диакритикой.

- [ ] **Step 4: Запустить тесты и проверку**

Run: `pnpm test scripts/lib/i18n-check.test.mjs && pnpm check:i18n`
Expected: PASS; `check:i18n` печатает `i18n OK (3 locales, 1 namespaces)`.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/i18n-check.mjs scripts/lib/i18n-check.test.mjs scripts/check-i18n.mjs package.json
git commit -m "chore(i18n): add dictionary checks"
```

---

### Task 9: Маршруты с префиксом языка

**Files:**
- Create: `src/app/routes.jsx`, `src/app/LocaleLayout.jsx`, `src/app/RootRedirect.jsx`
- Modify: `src/app/App.jsx`, `eslint.config.js` (граница импортов)
- Test: `src/app/routes.test.jsx`

**Interfaces:**
- Consumes: Task 6 (`splitLocalePath`, `normalizeLocale`, `detectLocale`, `withLocale`); Task 7 (`LocaleProvider`, управляемый `I18nProvider`).
- Produces: `createAppRoutes(pages): RouteObject[]`. `pages = { Landing, LegacyMap, Report, Research, NotFound, GlobeSpike? }` — React-компоненты. `GlobeSpike` необязателен.

Таблица маршрутов:

| Путь | Элемент |
|---|---|
| `/` | `RootRedirect` → `withLocale(detectLocale(...), '/')` |
| `/:lang/*` с допустимым языком в любом регистре | `LocaleLayout`: если регистр не нижний — замена на нижний; оборачивает в `LocaleProvider` и управляемый `I18nProvider`, у которого `onLanguageChange` = `setLocale` |
| `/:lang/*` с недопустимым первым сегментом | `<Navigate replace to={withLocale(detectLocale(), pathname) + search + hash} />` |
| `index` | `Landing` (временно, до M3) |
| `map` и `map/legacy` | `LegacyMap` (`/map` временно, до M2) |
| `report`, `research` | `Report`, `Research` (временно, до M4) |
| `dev/globe-spike` | `GlobeSpike`, только если передан |
| `*` | `NotFound` |

В `App.jsx` таблица передаётся в `useRoutes(createAppRoutes(PAGES), location)` внутри существующих `AnimatePresence` и `Suspense`.

`PAGES.LegacyMap` — `() => <MainLayout><MapPage /></MainLayout>`, как сейчас. `GlobeSpike` добавляется в `PAGES` только под `import.meta.env.DEV` через `lazy(() => import('src/dev/GlobeSpike'))`.

- [ ] **Step 1: Написать тесты (страницы — заглушки)**

```jsx
const stub = (name) => () => <h1>{name}</h1>;
const pages = { Landing: stub('landing'), LegacyMap: stub('legacy-map'), Report: stub('report'), Research: stub('research'), NotFound: stub('404') };
function renderAt(url, storageLocale = null) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']); // jsdom reports en-US; force the kk default
  localStorage.clear(); if (storageLocale) localStorage.setItem('fires-kz-language', storageLocale);
  const router = createMemoryRouter(createAppRoutes(pages), { initialEntries: [url] });
  render(<RouterProvider router={router} />); return router;
}
it('redirects / to the saved locale', async () => { const r = renderAt('/', 'ru'); await screen.findByText('landing'); expect(r.state.location.pathname).toBe('/ru/'); });
it('prefixes unprefixed legacy URLs', async () => { const r = renderAt('/map'); await screen.findByText('legacy-map'); expect(r.state.location.pathname).toBe('/kk/map'); });
it('lowercases the locale', async () => { const r = renderAt('/KK/report'); await screen.findByText('report'); expect(r.state.location.pathname).toBe('/kk/report'); });
it('keeps query and hash on the legacy map', async () => { const r = renderAt('/ru/map/legacy?x=1#h'); await screen.findByText('legacy-map'); expect(r.state.location).toMatchObject({ search: '?x=1', hash: '#h' }); });
it('shows 404 for unknown pages instead of a blank screen', async () => { renderAt('/de/map'); await screen.findByText('404'); });
it('serves a bare locale without a trailing slash', async () => { renderAt('/en'); await screen.findByText('landing'); expect(document.documentElement.lang).toBe('en'); });
it('has no spike route unless provided', async () => { renderAt('/kk/dev/globe-spike'); await screen.findByText('404'); });
```

- [ ] **Step 2: Запустить тесты**

Run: `pnpm test src/app/routes.test.jsx`
Expected: FAIL

- [ ] **Step 3: Реализовать маршруты и перевести `App.jsx` на `useRoutes`**

- [ ] **Step 4: Добавить границу импортов**

В `eslint.config.js` для файлов `src/{design,i18n,data,dev,features,map}/**/*.{js,jsx}` и `src/app/{routes,LocaleLayout,RootRedirect}.jsx` включите `no-restricted-imports`. Запрещённые шаблоны: `src/modules/*`, `src/shared/components/Sidebar/*`, `src/app/store/*`. Сообщение: «Новый код не зависит от старой карты (план M0)».

Run: `pnpm lint`
Expected: 0 ошибок. Проверьте правило: временно добавьте `import 'src/modules/MapPage/MapPage'` в `src/app/routes.jsx`, lint должен дать ошибку `no-restricted-imports`; затем уберите строку.

- [ ] **Step 5: Запустить тесты и проверить вручную**

Run: `pnpm test && pnpm dev`. Откройте `http://localhost:5173/`, затем `/ru/map/legacy` и переключите язык в шапке старой карты.
Expected: тесты проходят. `/` ведёт на `/kk/`. На карте после переключения языка адрес меняется на `/en/map/legacy`, а карта не перезагружается.

- [ ] **Step 6: Commit**

```bash
git add src/app eslint.config.js
git commit -m "feat(app): locale-prefixed routes with legacy map at /map/legacy"
```

---

### Task 10: Проверка связки deck.gl и глобуса MapLibre (spec §13, п. 4)

**Files:**
- Create: `src/dev/GlobeSpike.jsx`, `docs/superpowers/notes/2026-10-23-globe-deck-spike.md`
- Modify: `package.json` (`@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/mapbox` версии 9.4.0)

**Interfaces:**
- Consumes: Task 9 (`GlobeSpike` в `PAGES` под `import.meta.env.DEV`).
- Produces: записка с вердиктом «interleaved подходит» или «нужен custom layer». От вердикта зависит план M3.

- [ ] **Step 1: Поставить deck.gl**

Run: `pnpm add @deck.gl/core@9.4.0 @deck.gl/layers@9.4.0 @deck.gl/mapbox@9.4.0`

- [ ] **Step 2: Собрать страницу проверки**

`GlobeSpike.jsx`:
- MapLibre со стилем `https://tiles.openfreemap.org/styles/dark` и проекцией `globe`;
- `MapboxOverlay({ interleaved: true })` со `ScatterplotLayer` из 20 000 точек со случайными координатами в рамке Казахстана (lon 46–87, lat 40–56, фиксированное зерно);
- счётчик кадров по `requestAnimationFrame` и кнопка «globe / mercator»;
- все ошибки консоли выводятся списком на странице.

- [ ] **Step 3: Пройти проверки на `pnpm dev` по адресу `/kk/dev/globe-spike`**

Критерии и что записать в записку:
1. Точки не сползают при вращении глобуса на масштабах 1,5; 3 и 5 (по снимку экрана на каждом).
2. В консоли нет ошибок и предупреждений deck.gl и MapLibre.
3. При облёте на ноутбуке держится не меньше 50 кадров в секунду.
4. Переключение globe → mercator на масштабе 5 и больше не сдвигает точки.

Если все четыре пункта выполнены, вердикт — «deck.gl interleaved». Если нет, вердикт — «custom layer MapLibre для углей, deck.gl только для плоской карты» (spec §8.1).

- [ ] **Step 4: Убедиться, что deck.gl не попал в продакшен**

Run: `pnpm build && grep -l "MapboxOverlay" dist/assets/*.js`
Expected: `grep` ничего не находит (код выхода 1).

- [ ] **Step 5: Commit**

```bash
git add src/dev/GlobeSpike.jsx docs/superpowers/notes/2026-10-23-globe-deck-spike.md package.json pnpm-lock.yaml
git commit -m "spike: deck.gl interleaved on MapLibre globe"
```

---

### Task 11: E2E-проверка и CI

**Files:**
- Create: `playwright.config.js`, `e2e/smoke.spec.js`, `.github/workflows/ci.yml`
- Modify: `package.json` (скрипт `e2e`, devDependency `@playwright/test`), `.gitignore` (`test-results/`, `playwright-report/`)

**Interfaces:**
- Consumes: все предыдущие задачи.
- Produces: `pnpm e2e` (Playwright, chromium, сервер `pnpm build && pnpm preview --port 4173 --strictPort`). CI на push и pull request: установка, `lint`, `test`, `check:i18n`, `check:glyphs`, `build`, `e2e`.

- [ ] **Step 1: Написать e2e-тесты**

```js
const errorsOf = (page) => { const e = []; page.on('console', (m) => m.type() === 'error' && !/net::ERR_/.test(m.text()) && e.push(m.text())); page.on('pageerror', (x) => e.push(String(x))); return e; };
test('root goes to Kazakh', async ({ page }) => { const e = errorsOf(page); await page.goto('/'); await expect(page).toHaveURL(/\/kk\/$/); expect(e).toEqual([]); });
test('old report URL gets a prefix', async ({ page }) => { await page.goto('/report'); await expect(page).toHaveURL(/\/kk\/report$/); });
test('deep link to the legacy map loads the map', async ({ page }) => { await page.goto('/ru/map/legacy'); await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15000 }); });
test('html lang follows the prefix', async ({ page }) => { await page.goto('/en/'); await expect(page.locator('html')).toHaveAttribute('lang', 'en'); });
```

- [ ] **Step 2: Запустить e2e**

Run: `pnpm add -D @playwright/test && pnpm exec playwright install chromium && pnpm e2e`
Expected: 4 passed. Если какой-то тест падает, причину ищите в задачах 2–9: e2e только проверяет их результат.

- [ ] **Step 3: Написать `.github/workflows/ci.yml`**

- Ubuntu, `pnpm/action-setup@v4` (версия берётся из `packageManager`), `actions/setup-node@v4` с `node-version: 22` и `cache: pnpm`.
- Шаги: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm check:i18n`, `pnpm check:glyphs`, `pnpm build`, `pnpm exec playwright install --with-deps chromium`, `pnpm e2e`.
- При падении загружается `playwright-report` как артефакт.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.js e2e .github/workflows/ci.yml package.json pnpm-lock.yaml .gitignore
git commit -m "ci: run lint, unit, i18n, glyph and e2e checks"
```

- [ ] **Step 5: Проверить CI на GitHub**

Сначала спросите владельца репозитория, можно ли отправить ветку. После разрешения:
Run: `git push -u origin feature/tungi-dala`, затем `gh run watch`
Expected: workflow зелёный.
