# M1 «Данные» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать конвейер, который превращает исследование wak2 в данные сайта: JSON-сводки и числа на самом сайте, тяжёлые тайлы, снимки и пакеты пожаров на Cloudflare R2, плюс слой данных во фронтенде с подстановкой чисел в тексты.

**Architecture:** Python-пакет `pipeline/tabiat_pipeline` с шагами, которые запускаются командой `python -m tabiat_pipeline run <step>`. Шаги читают папку исследования только на чтение и пишут в `pipeline/work` (промежуточное) и `pipeline/out/2026-10-07` (результат). Тайлы режет GDAL 3.13 из QGIS 4.2.3: в нём есть драйвер PMTiles. Docker и WSL на машине не установлены, поэтому tippecanoe не используется. Шаг `publish_local` кладёт лёгкую часть в `public/data/2026-10-07`, шаг `r2_upload` отправляет тяжёлую часть в бакет.

**Tech Stack:** Python 3.12 (uv), pandas, geopandas, pyogrio, pyproj, numpy, pillow, pmtiles (Python), jsonschema, boto3, pytest; GDAL 3.13.3 CLI из `D:/Program Files/QGIS 4.2.3/bin` через `o4w_env.bat`; mapshaper (npm, devDependency сайта); на фронтенде — модули `src/data/*` и проверка текстов в CI.

**Spec:** `docs/superpowers/specs/2026-10-23-tungi-dala-redesign-design.md` (разделы 7, 10, 11.2, 12, 13)

**Depends on:** M0, Task 4 (`src/design/scales.json`) и Task 6–8 (`createTranslator` с `formatToken`, `LocaleProvider`, `scripts/lib/i18n-check.mjs`). Если M0 ещё не влит, задачи 1–13 этого плана можно выполнять, а задача 14 ждёт M0.

## Global Constraints

- Версия данных `2026-10-07` (дата отчёта wak2). Детекции идут до `2026-09-21`, гари MCD64A1 — до `2026-07`.
- Папка `D:/projects/geo/kz/wildfire_analysis_kz` (`WAK2_ROOT`) только читается. Повторный шаг 0 wak2 пишет в `pipeline/work/wak2` через `paths.root` в копии конфига.
- Исходные слои проекта лежат в ESRI:102025. Всё, что уходит на сайт, переводится в EPSG:4326. GeoJSON пишется с 5 знаками после запятой.
- На сайт в `public/data/{version}/` уходят: `summaries/` (до 2 МБ всего), `numbers.json` (до 200 КБ), `boundaries.topo.json` (до 400 КБ), `grid/` (до 600 КБ в gzip). Всё остальное уходит на R2 под префиксом `{version}/`.
- Бюджеты R2:
  - каждый PMTiles точек — до 250 МБ;
  - гари — до 300 МБ;
  - каждый растровый PMTiles — до 80 МБ;
  - каждый слой условий и последствий — до 20 МБ;
  - пакет пожара — до 2 МБ;
  - снимок — до 1,5 МБ и до 2048 px по большей стороне.
- Детекции берутся только из очищенных данных wak2 (`*_clean.parquet`): заводы и факелы уже исключены. Счёт по годам совпадает с рядами wak2: `modis_ta` с 2003 года, `viirs_snpp` с 2012 года.
- `numbers.json` = 397 чисел `numbers.csv` + 3 производных:
  - `ba_ratio_decades`: 2,674 → «2,7»;
  - `settlements_ba_5km_share`: 84,06 → «84»;
  - `official_ratio_2022`: 12,05 → «12».
- Лицензии:
  - геометрии WDPA не публикуются;
  - точки наблюдений сайгака (`saiga_locations_*`) не читаются;
  - производные слоя OSM получают подпись ODbL в манифесте.
- В пакете пожара не больше 5 000 детекций (выборка с `random_state=0`).
- Бакет R2 `tabiat-data`. CORS: GET и HEAD с заголовком Range. Файлы под версией кешируются как `public, max-age=31536000, immutable`, корневой `manifest.json` — `public, max-age=300`.
- Языки и шкалы цветов берутся из `src/design/scales.json` сайта (M0, Task 4), а не копируются в конвейер.

## Review Focus

1. Районы с одинаковыми английскими названиями (Zhambyl, Esil, Abay, Aktogay District) → у каждого свой код района. В wak2 они записаны как «Name (Region)». Тест в Task 4.
2. Неполный 2026 год (гари январь–июль, детекции до 21.09) → помечен как неполный, а не показан полным годом с рекордно низким значением. Тест в Task 4.
3. Повторный запуск шага → результат перезаписывается, объекты не дублируются в GPKG и PMTiles. Тест в Task 8.
4. Неверный `WAK2_ROOT` или отсутствующий входной файл → ошибка с полным путём сразу при старте, а не через 20 минут работы. Тест в Task 1.
5. Казахские буквы проходят через GeoJSON, TopoJSON и JSON без порчи («Ұлытау облысы» читается из результата так же). Тест в Task 5.

---

### Task 1: Каркас конвейера

**Files:**
- Create: `pipeline/pyproject.toml`, `pipeline/README.md`
- Create: `pipeline/tabiat_pipeline/__init__.py`, `config.py`, `gdal.py`, `io.py`, `cli.py`, `__main__.py`, `steps/__init__.py`
- Create: `pipeline/tests/conftest.py`, `pipeline/tests/test_config.py`, `pipeline/tests/test_gdal.py`, `pipeline/tests/test_io.py`
- Modify: `.gitignore` (`pipeline/.venv/`, `pipeline/work/`, `pipeline/out/`)

**Interfaces:**
- Produces: `Settings` (frozen dataclass):
  - поля: `wak2_root: Path`, `web_root: Path`, `work_dir: Path`, `out_dir: Path`, `version: str`, `gdal_env_script: Path | None`;
  - свойства: `wak2_outputs = wak2_root / 'wak2' / 'outputs'`, `project_data = wak2_root / 'data'`.
- Produces: `load_settings(env: Mapping[str, str] = os.environ) -> Settings`.
  - Переменные: `TABIAT_WAK2_ROOT` (по умолчанию `D:/projects/geo/kz/wildfire_analysis_kz`), `TABIAT_WORK_DIR` (`pipeline/work`), `TABIAT_OUT_DIR` (`pipeline/out/{version}`), `TABIAT_DATA_VERSION` (`2026-10-07`), `TABIAT_GDAL_ENV` (`D:/Program Files/QGIS 4.2.3/bin/o4w_env.bat`, если файл есть, иначе `None`).
  - `web_root` — родитель папки `pipeline`.
  - Бросает `FileNotFoundError` с полным путём, если нет `{wak2_outputs}/report/numbers.csv`.
- Produces: `gdal_command(tool: str, args: Sequence[str], settings: Settings) -> list[str]`. Если задан `gdal_env_script` и ОС Windows, результат — `['cmd', '/c', f'call "{script}" && {tool} {subprocess.list2cmdline(args)}']`, иначе `[tool, *args]`.
- Produces: `run_gdal(tool, args, settings) -> str` (stdout). При ненулевом коде бросает `GdalError(tool, returncode, stderr)`.
- Produces (`io.py`):
  - `write_json(path: Path, obj) -> int` — пишет UTF-8, `ensure_ascii=False`, компактные разделители, `allow_nan=False`; создаёт папки; возвращает число байт;
  - `rnd(x, nd: int) -> float | None` — NaN и None превращает в None;
  - `read_csv(path: Path) -> pd.DataFrame` — кодировка `utf-8-sig`.
- Produces: `STEPS: dict[str, Callable[[Settings], None]]` в `steps/__init__.py` (порядок регистрации = порядок `all`). CLI: `python -m tabiat_pipeline list | run <step...> | run all`.
- Produces: маркеры pytest `gdal` (нужен GDAL) и `data` (нужны данные wak2, медленно). Без флагов `-m` запускаются только быстрые тесты.

- [ ] **Step 1: Создать окружение**

Run: `uv venv --python 3.12 pipeline/.venv`
Expected: `Creating virtual environment at: pipeline/.venv`. uv может скачать Python 3.12, это нормально.

- [ ] **Step 2: Написать тесты**

```python
# test_config.py
def test_defaults(fake_wak2):
    s = load_settings({'TABIAT_WAK2_ROOT': str(fake_wak2)})
    assert s.version == '2026-10-07'
    assert s.out_dir == s.web_root / 'pipeline' / 'out' / '2026-10-07'

def test_missing_root_names_the_file(tmp_path):
    with pytest.raises(FileNotFoundError, match=r'numbers\.csv'):
        load_settings({'TABIAT_WAK2_ROOT': str(tmp_path)})

# test_gdal.py
def test_windows_command_wraps_env_script(settings_with_script, monkeypatch):
    monkeypatch.setattr(sys, 'platform', 'win32')
    cmd = gdal_command('ogr2ogr', ['-f', 'PMTiles', 'out file.pmtiles'], settings_with_script)
    assert cmd[:2] == ['cmd', '/c'] and 'o4w_env.bat' in cmd[2] and '"out file.pmtiles"' in cmd[2]

@pytest.mark.gdal
def test_gdal_available(settings):
    assert 'GDAL 3.' in run_gdal('gdalinfo', ['--version'], settings)

# test_io.py
def test_write_json_rejects_nan(tmp_path):
    with pytest.raises(ValueError):
        write_json(tmp_path / 'a.json', {'x': float('nan')})

def test_write_json_keeps_kazakh(tmp_path):
    write_json(tmp_path / 'a.json', {'n': 'Ұлытау'})
    assert 'Ұлытау' in (tmp_path / 'a.json').read_text(encoding='utf-8')
```

`conftest.py` даёт фикстуры `fake_wak2` (папка с пустым `wak2/outputs/report/numbers.csv`), `settings` (настоящие пути) и `settings_with_script`.

- [ ] **Step 3: Запустить тесты**

Run: `uv pip install --python pipeline/.venv pytest && pipeline/.venv/Scripts/python -m pytest pipeline/tests`
Expected: FAIL, пакета нет.

- [ ] **Step 4: Реализовать каркас**

Зависимости в `pyproject.toml`: numpy, pandas, pyarrow, scipy, geopandas, shapely, pyproj, pyogrio, matplotlib и pyyaml (их требует шаг 0 wak2), а также pillow, pmtiles, jsonschema, boto3 и requests. В extra `dev` — pytest.

Установка: `uv pip install --python pipeline/.venv -e "pipeline[dev]"`.

В `README.md` опишите: установку, переменные окружения, порядок шагов, запуск тестов с маркерами и ручные шаги R2 из Task 13.

- [ ] **Step 5: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests && pipeline/.venv/Scripts/python -m pytest pipeline/tests -m gdal`
Expected: PASS в обоих запусках.

- [ ] **Step 6: Commit**

```bash
git add pipeline .gitignore
git commit -m "feat(pipeline): scaffold settings, GDAL runner and CLI"
```

---

### Task 2: Восстановить очищенные детекции wak2

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/wak2_clean.py`
- Test: `pipeline/tests/test_wak2_clean.py`

**Interfaces:**
- Consumes: `Settings`, `STEPS`.
- Produces:
  - `write_wak2_config(s) -> Path` — копия `{wak2_root}/wak2/config.yaml`, где изменено только `paths.root = {work_dir}/wak2`; сохраняется в `{work_dir}/wak2_config.yaml`;
  - `run(s)` — шаг `wak2_clean`: `[sys.executable, 'run.py', '--steps', '0', '--config', <copy>]` с `cwd={wak2_root}/wak2`;
  - `clean_parquet(s, sensor: Literal['modis', 'viirs']) -> Path` = `{work_dir}/wak2/data/processed/{sensor}_clean.parquet`;
  - `load_clean(s, sensor, columns: list[str] | None = None) -> pd.DataFrame`.
- Produces: обязательные столбцы `CLEAN_COLUMNS = ['lat', 'lon', 'acq_date', 'acq_time', 'satellite', 'sensor', 'frp', 'conf_class', 'daynight', 'admin1', 'admin2']`.

- [ ] **Step 1: Написать тесты**

```python
def test_config_copy_changes_only_root(settings):
    copy = yaml.safe_load(write_wak2_config(settings).read_text(encoding='utf-8'))
    orig = yaml.safe_load((settings.wak2_root / 'wak2' / 'config.yaml').read_text(encoding='utf-8'))
    assert copy['paths'].pop('root') == str(settings.work_dir / 'wak2')
    orig['paths'].pop('root')
    assert copy == orig

@pytest.mark.data
def test_clean_detections_match_wak2(settings):
    for sensor in ('modis', 'viirs'):
        df = load_clean(settings, sensor)
        assert set(CLEAN_COLUMNS) <= set(df.columns)
        assert df['acq_date'].max() == pd.Timestamp('2026-09-21')
    for table in ('data_coverage.csv', 'detections_by_satellite_year.csv'):
        ours = read_csv(settings.work_dir / 'wak2' / 'outputs' / 'tables' / 'step0' / table)
        theirs = read_csv(settings.wak2_outputs / 'tables' / 'step0' / table)
        pd.testing.assert_frame_equal(ours, theirs)
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_wak2_clean.py`
Expected: FAIL

- [ ] **Step 3: Реализовать шаг и зарегистрировать его как `wak2_clean`**

- [ ] **Step 4: Запустить шаг и тесты**

Run: `pipeline/.venv/Scripts/python -m tabiat_pipeline run wak2_clean && pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_wak2_clean.py -m "data or not data"`
Expected: в логе wak2 есть строки «Сохранено MODIS» и «Сохранено VIIRS»; тесты проходят. Если таблицы step0 не совпали, данные или версия wak2 не те, что у отчёта 07.10.2026. Остановитесь и сообщите владельцу: дальше идти нельзя.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps pipeline/tests/test_wak2_clean.py
git commit -m "feat(pipeline): regenerate wak2 clean detections into work dir"
```

---

### Task 3: numbers.json

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/numbers.py`, `pipeline/schemas/numbers.schema.json`
- Test: `pipeline/tests/test_numbers.py`

**Interfaces:**
- Produces: `display_decimals(value: float, unit: str) -> int` по правилам:

| Единица | Знаков |
|---|---|
| `p` | 3 |
| начинается с `ρ` | 2 |
| содержит `%` | 1, если модуль меньше 10; иначе 0 |
| начинается с `раз` | 2, если модуль меньше 1; иначе 1 |
| начинается с `км²` | 0 |
| `млн т` | 1, если модуль меньше 100; иначе 0 |
| любая другая | 0, если модуль ≥ 100; 1, если ≥ 10; иначе 2 |

- Produces: `format_ru(value: float, decimals: int) -> str` — `2.674, 1` → `'2,7'`; группы разрядов через неразрывный пробел.
- Produces: `Derived` (dataclass: `id`, `text_ru`, `unit`, `period`, `source`, `method`, `compute: Callable[[Settings], float]`, `expected: str`, `decimals: int`) и `DERIVED` из трёх записей:
  - `ba_ratio_decades`: средняя `ba_km2` за 2001–2010 / средняя за 2016–2025 по `tables/step4/ba_annual.csv`; ожидается `'2,7'`, 1 знак, единица `раз`;
  - `settlements_ba_5km_share`: доля строк `tables/step8/settlement_exposure.csv` с `ba_years_5km > 0` × 100; ожидается `'84'`, 0 знаков, `%`;
  - `official_ratio_2022`: `mcd64a1_ha / official_total_ha` за 2022 по `story/official/official_vs_satellite_by_year.csv`; ожидается `'12'`, 0 знаков, `раз`.
- Produces: `NumberMismatch(Exception)` — бросается, если `format_ru(value, decimals) != expected`.
- Produces: `build_numbers(s) -> dict[str, dict]`. Запись: `{'value': float | str, 'unit', 'period', 'source', 'method', 'decimals': int | None, 'text_ru'}`. Значения, которые не читаются как число (даты), остаются строками с `decimals: None`.
- Produces: шаг `numbers` пишет `{out_dir}/numbers.json`.

- [ ] **Step 1: Написать тесты**

```python
def test_display_rules():
    assert display_decimals(5.516, '%') == 1 and display_decimals(21.47, '%') == 0
    assert display_decimals(0.266, 'раз (RR)') == 2 and display_decimals(917686.2, 'км²') == 0

def test_format_ru():
    assert format_ru(2.674, 1) == '2,7' and format_ru(917686.2, 0) == '917\u00a0686'

@pytest.mark.data
def test_numbers(settings):
    n = build_numbers(settings)
    assert len(n) == 397 + 3
    assert n['ever_burned_km2']['value'] == pytest.approx(917686.222, abs=0.01)
    assert n['data_last_modis']['value'] == '2026-09-21' and n['data_last_modis']['decimals'] is None
    assert n['ba_ratio_decades']['value'] == pytest.approx(2.674, abs=0.001)
    assert n['settlements_ba_5km_share']['value'] == pytest.approx(84.06, abs=0.01)
    assert n['official_ratio_2022']['value'] == pytest.approx(12.05, abs=0.01)

@pytest.mark.data
def test_mismatch_stops_the_build(settings, monkeypatch):
    broken = [dataclasses.replace(DERIVED[0], expected='3,1')] + DERIVED[1:]
    monkeypatch.setattr(numbers_step, 'DERIVED', broken)
    with pytest.raises(NumberMismatch, match='ba_ratio_decades'):
        build_numbers(settings)
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_numbers.py -m "data or not data"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

Перед записью файл проверяется по схеме `numbers.schema.json`.

- [ ] **Step 4: Запустить тесты и шаг**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_numbers.py -m "data or not data" && pipeline/.venv/Scripts/python -m tabiat_pipeline run numbers`
Expected: PASS; `out/2026-10-07/numbers.json` меньше 200 КБ.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/numbers.py pipeline/schemas/numbers.schema.json pipeline/tests/test_numbers.py
git commit -m "feat(pipeline): build numbers.json with derived headline numbers"
```

---

### Task 4: JSON-сводки

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/summaries.py`
- Create: `pipeline/schemas/{national,year_month,oblasts,districts,landcover,settlements,emissions,official,ytd2026}.schema.json`
- Test: `pipeline/tests/test_summaries.py`

**Interfaces:**
- Produces: `admin_keys(s) -> tuple[dict[str, str], dict[str, tuple[str, str]]]`.
  - Читает атрибуты `data/admin_boundaries/kaz-adm2-23-cc.gpkg`.
  - Первый словарь: `ADM1_EN → ADM1_PCODE`.
  - Второй: ключ района → `(ADM2_PCODE, ADM1_PCODE)`. Ключ — `ADM2_EN`, если название уникально, иначе `f"{ADM2_EN} ({ADM1_EN})"`, как в wak2.
- Produces: девять функций `build_<name>(s)`. Все массивы по годам выровнены по `years`; где значения нет, стоит `null`.

| Файл `summaries/<name>.json` | Форма | Источник в wak2 |
|---|---|---|
| `national` | `{years: [2001..2026], partial: {"2026": {ba_to: "2026-07", det_to: "2026-09-21"}}, ba_km2, det_modis_ta, det_viirs_snpp, fwi_season, co2_mt: {gfas4htap, gfed5}}` | `step4/ba_annual.csv` (`ba_km2`); суммы строк `step2/year_month_counts_*`; `step6/weather_by_year_oblast.csv` (`region == 'Казахстан'`); `step7/emissions_annual.csv` (`co2_kz`) |
| `year_month` | `{modis_ta: {years, counts: [[12]]}, viirs_snpp: {years, counts}, ba_km2: {years: [2001..2026], values: [[12]]}}` | `step2/year_month_counts_*`; `step4/ba_year_month.csv` (пропуски = 0) |
| `oblasts` | 20 × `{pcode, name_en, area_km2, ba_mean_km2, burn_rate_pct, share_pct, worst_year, worst_year_km2, trend_pct_decade, trend_p, ratio_early_late, rank, ba_km2: [25 лет 2001–2025], month_profile_modis_ta: [12], fwi_trend_pct_decade}` | `step4/ba_oblast_summary.csv`; `step2/oblast_month_profile_modis_ta.csv`; `step6/weather_trends.csv` (`variable == 'fwi_season_mean'`) |
| `districts` | 218 × `{pcode, oblast_pcode, name_en (без скобок), area_km2, ba_mean_km2, burn_rate_pct, share_pct, worst_year, trend_pct_decade, rank, ba_km2: [25]}` | `step4/ba_district_summary.csv` |
| `landcover` | `{classes: [8 ключей в порядке HARM], esa: {class: {area_km2, ba_mean_km2, ba_share_pct, burn_rate_pct, trend_pct_decade, det_viirs_share_pct, spring_share_pct}}, modis: {...}, by_year_esa: {years: [2001..2025], <class>: [...]}}` | `step5/class_summary.csv`; `step5/ba_by_class_year_esa.csv` |
| `settlements` | `{total: 5472, by_year: {years: [2001..2026], partial: [2026], n_ba_1km, n_ba_2km, n_ba_5km, n_ba_10km}}` | `step8/settlement_exposure_by_year.csv`, `step8/settlement_exposure.csv` |
| `emissions` | `{years, sources: {gfas4htap: {co2_mt, ch4_kt, pm25_kt}, gfed5: {...}}}` | `step7/emissions_annual.csv` (`*_kz`) |
| `official` | `{years, satellite_ha, official_total_ha, official_forest_ha, official_steppe_ha}` | `story/official/official_vs_satellite_by_year.csv` |
| `ytd2026` | `{cutoff: "09-21", series: {modis_ta: {years, n_det, rank_2026, n_years}, viirs_snpp: {...}}, oblasts: [{pcode, n_2026, mean_2012_2025, ratio_to_mean, rank}]}` | `step10/year_to_date_by_series.csv`, `step10/oblasts_2026_vs_past.csv` |

- Produces: шаг `summaries` пишет девять файлов в `{out_dir}/summaries/` и проверяет каждый по схеме.

- [ ] **Step 1: Написать тесты (все с маркером `data`)**

```python
def test_national(settings):
    n = build_national(settings)
    assert n['years'][0] == 2001 and n['years'][-1] == 2026
    assert n['ba_km2'][1] == pytest.approx(235155.1, abs=0.1)
    assert n['det_modis_ta'][:2] == [None, None] and n['det_modis_ta'][2] == 94792
    assert n['partial']['2026'] == {'ba_to': '2026-07', 'det_to': '2026-09-21'}

def test_year_month(settings):
    assert build_year_month(settings)['modis_ta']['counts'][0][3] == 19557  # April 2003

def test_oblasts(settings):
    ob = build_oblasts(settings)
    assert len(ob) == 20 and len({o['pcode'] for o in ob}) == 20
    akt = next(o for o in ob if o['name_en'] == 'Aktobe Region')
    assert akt['ba_mean_km2'] == pytest.approx(13553.8, abs=0.1) and akt['share_pct'] == pytest.approx(18.5, abs=0.1)
    assert len(akt['ba_km2']) == 25 and len(akt['month_profile_modis_ta']) == 12

def test_districts_resolve_duplicate_names(settings):
    ds = build_districts(settings)
    assert len(ds) == 218 and len({d['pcode'] for d in ds}) == 218
    zh = [d for d in ds if d['name_en'] == 'Zhambyl District']
    assert len(zh) == 3 and len({d['oblast_pcode'] for d in zh}) == 3

def test_partial_year_is_marked(settings):
    assert build_settlements(settings)['by_year']['partial'] == [2026]

def test_official_2022(settings):
    of = build_official(settings); i = of['years'].index(2022)
    assert of['satellite_ha'][i] == pytest.approx(1912651.7) and of['official_total_ha'][i] == 158700.0

def test_outputs_fit_budget(settings):
    run(settings)
    assert sum(p.stat().st_size for p in (settings.out_dir / 'summaries').glob('*.json')) < 2_000_000
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_summaries.py -m data`
Expected: FAIL

- [ ] **Step 3: Реализовать функции, схемы и шаг `summaries`**

- [ ] **Step 4: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_summaries.py -m data`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/summaries.py pipeline/schemas pipeline/tests/test_summaries.py
git commit -m "feat(pipeline): build JSON summaries from wak2 tables"
```

---

### Task 5: Границы областей и районов с названиями на трёх языках

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/boundaries.py`, `pipeline/data/district_name_overrides.csv` (только заголовок `adm2_pcode,name_kk,name_ru,name_en`)
- Modify: `package.json` сайта (devDependency `mapshaper`, точная версия)
- Test: `pipeline/tests/test_boundaries.py`

**Interfaces:**
- Produces: `title_ru(upper: str) -> str`.
  - Каждое слово и каждая часть через дефис — с заглавной буквы.
  - Служебные слова (`район`, `область`, `имени`) — строчные.
  - Префиксы `Г.` и `ГОРОД ` убираются.
- Produces: `match_by_overlap(ours: GeoDataFrame, osm: GeoDataFrame) -> pd.DataFrame[pcode, osm_index, share]`. Для каждой нашей единицы берётся объект OSM с наибольшей площадью пересечения. `share` = пересечение / площадь нашей единицы. Считается в ESRI:102025.
- Produces: `build_boundaries(s) -> tuple[GeoDataFrame, GeoDataFrame]` в EPSG:4326.
  - Области: `pcode`, `name_kk`, `name_ru`, `name_en`.
  - Районы: `pcode`, `oblast_pcode`, `name_kk`, `name_ru`, `name_en`.
  - Источники: `data/admin_boundaries/kaz-adm1-23-cc.gpkg` и `kaz-adm2-23-cc.gpkg`. Названия: `name_kk` из OSM, `name_ru = title_ru(taldau)` из OSM, `name_en` = `ADM1_EN` / `ADM2_EN` исследования. В OSM у Актюбинской области записано «Aqtöbe region», поэтому соединение идёт по площади, а не по имени.
  - Правки из `district_name_overrides.csv` применяются последними.
  - Районы с `share < 0.5` попадают в `{work_dir}/district_names_review.csv` для ручной проверки.
- Produces: шаг `boundaries` пишет `{out_dir}/boundaries.topo.json` с объектами `adm1` и `adm2`. Команда: `pnpm exec mapshaper -i adm1.geojson adm2.geojson combine-files -simplify 8% keep-shapes -o format=topojson quantization=100000 <out>`, запускается из `web_root`.

- [ ] **Step 1: Поставить mapshaper в проект сайта**

Run: `pnpm add -D mapshaper@<текущая версия из npm view mapshaper version>`

- [ ] **Step 2: Написать тесты**

```python
@pytest.mark.parametrize('src,expected', [
    ('ЖАНИБЕКСКИЙ РАЙОН', 'Жанибекский район'),
    ('СЕВЕРО-КАЗАХСТАНСКАЯ ОБЛАСТЬ', 'Северо-Казахстанская область'),
    ('ОБЛАСТЬ ҰЛЫТАУ', 'область Ұлытау'),
    ('Г.АСТАНА', 'Астана'),
    ('РАЙОН ИМЕНИ ГАБИТА МУСРЕПОВА', 'район имени Габита Мусрепова'),
])
def test_title_ru(src, expected):
    assert title_ru(src) == expected

@pytest.mark.data
def test_boundaries(settings):
    adm1, adm2 = build_boundaries(settings)
    assert len(adm1) == 20 and len(adm2) == 218
    for df in (adm1, adm2):
        assert df[['name_kk', 'name_ru', 'name_en']].notna().all().all()
        assert (df[['name_kk', 'name_ru', 'name_en']] != '').all().all()
    assert adm1.set_index('pcode').loc['KAZ019', 'name_kk'] == 'Ұлытау облысы'

@pytest.mark.data
def test_topojson_output(settings):
    run(settings)
    topo = json.loads((settings.out_dir / 'boundaries.topo.json').read_text(encoding='utf-8'))
    assert set(topo['objects']) == {'adm1', 'adm2'}
    assert (settings.out_dir / 'boundaries.topo.json').stat().st_size < 400_000
    assert any(g['properties']['name_kk'] == 'Ұлытау облысы' for g in topo['objects']['adm1']['geometries'])
```

- [ ] **Step 3: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_boundaries.py -m "data or not data"`
Expected: FAIL

- [ ] **Step 4: Реализовать**

- [ ] **Step 5: Запустить тесты и просмотреть список на проверку**

Run: тесты из шага 3 и `type pipeline\work\district_names_review.csv`
Expected: PASS. Каждый район из списка на проверку откройте рядом со слоем OSM. Если название неверно, добавьте строку в `district_name_overrides.csv` и запустите шаг снова. Список и правки покажите владельцу: казахские названия районов потом вычитывает носитель языка (spec §13, п. 1).

- [ ] **Step 6: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/boundaries.py pipeline/data pipeline/tests/test_boundaries.py package.json pnpm-lock.yaml
git commit -m "feat(pipeline): trilingual region and district boundaries as TopoJSON"
```

---

### Task 6: Сетка детекций для истории

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/grid.py`
- Test: `pipeline/tests/test_grid.py`

**Interfaces:**
- Consumes: `load_clean` (Task 2).
- Produces: `CELL_M = 10_000`; `GridResult` (dataclass):
  - `cells: np.ndarray` (n × 2, lon и lat центров);
  - `modis: np.ndarray` (uint16, n × 26, годы 2001–2026);
  - `viirs: np.ndarray` (uint16, n × 15, годы 2012–2026).
- Produces: `build_grid(modis: pd.DataFrame, viirs: pd.DataFrame) -> GridResult`.
  - На входе столбцы `lon`, `lat`, `acq_date`, `satellite`.
  - Клетки считаются в ESRI:102025: `floor(x / CELL_M)`, `floor(y / CELL_M)`; центр переводится обратно в lon/lat с 4 знаками.
  - VIIRS — только `satellite == 'S-NPP'`. MODIS — все спутники.
  - Индекс клеток общий для обоих датчиков: объединение непустых клеток.
  - Бросает `OverflowError`, если счёт больше 65 535.
- Produces: `write_grid(result, out_dir) -> None` и `read_grid(out_dir) -> GridResult`. Файлы:
  - `grid/index.json` = `{cell_km: 10, cells_crs: "ESRI:102025", cells: [[lon, lat]], modis: {file: "grid_modis.bin", years: [2001..2026]}, viirs: {file: "grid_viirs.bin", years: [2012..2026]}, dtype: "uint16le", layout: "cells x years, row-major"}`;
  - `grid/grid_modis.bin` и `grid/grid_viirs.bin`.
- Produces: шаг `grid`.

- [ ] **Step 1: Написать тесты**

```python
def test_roundtrip(tmp_path):
    df = pd.DataFrame({'lon': [66.9, 66.9001, 70.0], 'lat': [50.1, 50.1001, 45.0],
                       'acq_date': pd.to_datetime(['2005-07-07', '2005-07-08', '2017-04-01']), 'satellite': ['Terra', 'Aqua', 'Terra']})
    res = build_grid(df, df.iloc[:0])
    assert res.modis.sum(axis=0)[2005 - 2001] == 2 and res.modis.shape == (2, 26)
    write_grid(res, tmp_path)
    back = read_grid(tmp_path)
    np.testing.assert_array_equal(back.modis, res.modis)

def test_overflow_is_an_error():
    df = pd.DataFrame({'lon': [66.9] * 70000, 'lat': [50.1] * 70000,
                       'acq_date': pd.Timestamp('2005-07-07'), 'satellite': 'Terra'})
    with pytest.raises(OverflowError):
        build_grid(df, df.iloc[:0])

@pytest.mark.data
def test_grid_totals_match_wak2(settings):
    run(settings)
    g = read_grid(settings.out_dir)
    ym_m = read_csv(settings.wak2_outputs / 'tables/step2/year_month_counts_modis_ta.csv').set_index('year').sum(axis=1)
    ym_v = read_csv(settings.wak2_outputs / 'tables/step2/year_month_counts_viirs_snpp.csv').set_index('year').sum(axis=1)
    for y in range(2003, 2027):
        assert g.modis[:, y - 2001].sum() == ym_m[y]
    for y in range(2012, 2027):
        assert g.viirs[:, y - 2012].sum() == ym_v[y]
    size = sum(len(gzip.compress(p.read_bytes())) for p in (settings.out_dir / 'grid').iterdir())
    assert size < 600_000
```

Сверка MODIS начинается с 2003 года: ряд `modis_ta` в wak2 стартует, когда есть оба спутника, Terra и Aqua.

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_grid.py -m "data or not data"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS. Если суммы по годам расходятся, сравните фильтр спутников со списком `series.modis_ta` в `config.yaml` wak2.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/grid.py pipeline/tests/test_grid.py
git commit -m "feat(pipeline): 10 km yearly detection grid for the story"
```

---

### Task 7: PMTiles точек MODIS и VIIRS

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/points.py`
- Test: `pipeline/tests/test_points.py`

**Interfaces:**
- Consumes: `load_clean` (Task 2), `run_gdal` (Task 1).
- Produces:
  - `EPOCH = date(2001, 1, 1)`;
  - `SAT_CODES = {'Terra': 'T', 'Aqua': 'A', 'S-NPP': 'N', 'NOAA-20': 'J1', 'NOAA-21': 'J2'}`.
- Produces: `to_point_attributes(df) -> pd.DataFrame[lon, lat, d, t, frp, c, dn, s]`:
  - `d` — int32, дни от `EPOCH`;
  - `t` — int16, время HHMM в UTC;
  - `frp` — float32, 1 знак;
  - `c` — первая буква `conf_class` (`'l'`, `'n'`, `'h'`), иначе `'u'`;
  - `dn` — `'D'` или `'N'`;
  - `s` — код спутника.
- Produces: `write_points_pmtiles(df, path: Path, layer: str, s, minzoom=4, maxzoom=10) -> None`. Пишет временный GPKG (EPSG:4326), затем `ogr2ogr -f PMTiles <path> <gpkg> -nln <layer> -dsco MINZOOM=4 -dsco MAXZOOM=10 -dsco MAX_SIZE=1000000 -dsco MAX_FEATURES=400000`. Старый файл удаляется перед записью.
- Produces: шаг `points` пишет `{out_dir}/tiles/firms_modis.pmtiles` (слой `modis`) и `firms_viirs.pmtiles` (слой `viirs`, все спутники VIIRS с кодом в `s`).

- [ ] **Step 1: Написать тесты**

```python
def test_attributes():
    df = pd.DataFrame({'lon': [66.9], 'lat': [50.1], 'acq_date': [pd.Timestamp('2026-09-21')], 'acq_time': [845],
                       'frp': [12.34], 'conf_class': ['nominal'], 'daynight': ['D'], 'satellite': ['NOAA-20']})
    row = to_point_attributes(df).iloc[0]
    assert row['d'] == 9394 and row['t'] == 845 and row['frp'] == pytest.approx(12.3, abs=1e-4)
    assert (row['c'], row['dn'], row['s']) == ('n', 'D', 'J1')

@pytest.mark.data
@pytest.mark.gdal
def test_all_points_present_from_z8(settings):
    run(settings)
    for sensor, layer in (('modis', 'modis'), ('viirs', 'viirs')):
        path = settings.out_dir / 'tiles' / f'firms_{sensor}.pmtiles'
        info = run_gdal('ogrinfo', ['-ro', '-so', '-oo', 'ZOOM_LEVEL=8', str(path), layer], settings)
        count = int(re.search(r'Feature Count: (\d+)', info).group(1))
        assert count >= len(load_clean(settings, sensor, columns=['lat']))  # tile buffers may duplicate, never drop
        assert path.stat().st_size < 250_000_000
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_points.py -m "data or gdal or not data"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS. Если на z8 точек меньше, чем в источнике, драйвер отбросил их из-за лимитов тайла. Увеличьте `MAX_FEATURES` и `MAX_SIZE` вдвое и повторите. Если не помогает, сообщите владельцу: для z8–z10 тогда нужен отдельный файл без лимитов.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/points.py pipeline/tests/test_points.py
git commit -m "feat(pipeline): MODIS and VIIRS detection PMTiles"
```

---

### Task 8: PMTiles гарей MCD64A1

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/burned.py`
- Test: `pipeline/tests/test_burned.py`

**Interfaces:**
- Consumes: `run_gdal`.
- Produces: `year_commands(tif: Path, year: int, work: Path, adm0_4326: Path) -> list[tuple[str, list[str]]]` — последовательность вызовов GDAL для одного года:
  1. `gdal_translate -of VRT -a_nodata 0 <tif> <vrt>`;
  2. `gdal raster polygonize` по VRT в `<work>/ba_<year>.gpkg`, поле `m` (имена флагов уточните через `gdal raster polygonize --help` на GDAL 3.13);
  3. `ogr2ogr -append <work>/burned.gpkg ... -nln burned -t_srs EPSG:4326 -clipdst <adm0_4326> -dialect SQLite -sql "SELECT m, <year> AS y, geom FROM <layer>"`.
- Produces: `areas_by_year(gpkg: Path) -> pd.Series` — км² по годам в ESRI:102025.
- Produces: шаг `burned`:
  - удаляет `work/burned.gpkg`;
  - переводит `data/admin_boundaries/kaz-adm0-23.gpkg` в EPSG:4326;
  - обрабатывает `data/burned_area/mcd64a1/burn_month_{2001..2026}.tif`;
  - пишет `{out_dir}/tiles/burned_area.pmtiles` (слой `burned`, MINZOOM=3, MAXZOOM=10, атрибуты `y`, `m`).

- [ ] **Step 1: Написать тесты**

```python
def test_year_commands_mask_zero_and_tag_year(tmp_path):
    cmds = year_commands(Path('burn_month_2005.tif'), 2005, tmp_path, tmp_path / 'adm0.gpkg')
    assert cmds[0][0] == 'gdal_translate' and '-a_nodata' in cmds[0][1] and '0' in cmds[0][1]
    assert '2005 AS y' in ' '.join(cmds[-1][1])

@pytest.mark.data
@pytest.mark.gdal
def test_areas_match_ba_annual_and_rerun_is_idempotent(settings):
    run(settings)
    areas = areas_by_year(settings.work_dir / 'burned.gpkg')
    ba = read_csv(settings.wak2_outputs / 'tables/step4/ba_annual.csv').set_index('year')['ba_km2']
    for y in range(2001, 2027):
        assert areas[y] == pytest.approx(ba[y], rel=0.01)
    n1 = len(gpd.read_file(settings.work_dir / 'burned.gpkg', columns=['y']))
    run(settings)
    assert len(gpd.read_file(settings.work_dir / 'burned.gpkg', columns=['y'])) == n1
    assert (settings.out_dir / 'tiles' / 'burned_area.pmtiles').stat().st_size < 300_000_000
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_burned.py -m "data or gdal or not data"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS. Площадь за 2026 год сверяется с неполной строкой `ba_annual` (январь–июль, 7 097,9 км²).

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/burned.py pipeline/tests/test_burned.py
git commit -m "feat(pipeline): MCD64A1 burned area polygons as PMTiles"
```

---

### Task 9: Растровые PMTiles: «сколько раз горело», CO₂, земной покров

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/rasters.py`
- Test: `pipeline/tests/test_rasters.py`

**Interfaces:**
- Consumes: `run_gdal`; `{web_root}/src/design/scales.json` (M0, Task 4); функция `esa_class(v)` из `{wak2_root}/wak2/wak2/step5_landcover.py` (импорт через `sys.path`).
- Produces: `hex_to_rgb(h: str) -> tuple[int, int, int]`.
- Produces: таблицы цветов для `gdaldem color-relief` в виде строк `value R G B A`:
  - `color_table_frequency(scales) -> str`: `0` → `0 0 0 0`; `1` → `ember[1]`; `2` → `ember[2]`; `4` → `ember[3]`; `10` → `ember[4]`;
  - `color_table_co2(scales, vmax: float) -> str`: `0` прозрачный, затем пять ступеней `ember` равномерно до `vmax`; `vmax` = 99-й перцентиль (`gdalinfo -json -stats`);
  - `color_table_landcover(scales, esa_class) -> str`: каждый код 0–255, для которого `esa_class` возвращает класс, получает цвет класса из `scales.landcover`; остальные прозрачны. Используется с `-exact_color_entry`.
- Produces: `raster_to_pmtiles(src: Path, table: str, out: Path, s, maxzoom: int, resampling: str, exact: bool) -> None`. Цепочка: `gdaldem color-relief -alpha` → `gdalwarp -t_srs EPSG:3857 -r <resampling>` → `gdal_translate -of MBTiles` → `gdaladdo` → `pmtiles.convert.mbtiles_to_pmtiles` (сигнатуру проверьте в установленной версии пакета).
- Produces: шаг `rasters`:
  - `tiles/burn_frequency.pmtiles` из `outputs/gis/burn_frequency_2001_2025.tif`: maxzoom 9, `near`;
  - `tiles/co2_density.pmtiles` из `outputs/gis/fire_co2_density_2003_2023.tif`: maxzoom 6, `bilinear`;
  - `tiles/landcover_esa.pmtiles` из `data/lulc/esa_300m/esa_cci_lc-300m-21.tif`: maxzoom 9, `near`, exact.

- [ ] **Step 1: Написать тесты**

```python
def test_frequency_table(scales):
    lines = color_table_frequency(scales).splitlines()
    assert lines[0] == '0 0 0 0 0' and lines[-1] == '10 255 230 176 255'

def test_landcover_table_uses_wak2_classes(scales, esa_class):
    table = dict(l.split(' ', 1) for l in color_table_landcover(scales, esa_class).splitlines())
    assert table['10'] == '232 197 71 255'   # cropland #E8C547
    assert table['130'] == '156 196 90 255'  # grassland #9CC45A

@pytest.mark.data
@pytest.mark.gdal
def test_raster_tiles(settings):
    run(settings)
    for name, maxz in (('burn_frequency', 9), ('co2_density', 6), ('landcover_esa', 9)):
        path = settings.out_dir / 'tiles' / f'{name}.pmtiles'
        with open(path, 'rb') as f:
            h = Reader(MmapSource(f)).header()
        # field names follow the installed pmtiles package (pmtiles.reader.Reader.header())
        assert h['max_zoom'] == maxz and h['tile_type'] == TileType.PNG
        assert 45 < h['min_lon_e7'] / 1e7 and h['max_lon_e7'] / 1e7 < 89 and 39 < h['min_lat_e7'] / 1e7
        assert path.stat().st_size < 80_000_000
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_rasters.py -m "data or gdal or not data"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/rasters.py pipeline/tests/test_rasters.py
git commit -m "feat(pipeline): burn frequency, CO2 and land cover raster PMTiles"
```

---

### Task 10: Слои условий и последствий

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/overlays.py`, `pipeline/tabiat_pipeline/steps/osm_protected.py`
- Test: `pipeline/tests/test_overlays.py`

**Interfaces:**
- Produces: `write_overlay(gdf, out_base: Path, keep: list[str], s) -> Path`.
  - Переводит слой в EPSG:4326 и оставляет только колонки из `keep`.
  - Пишет `<out_base>.geojson` (RFC 7946, `COORDINATE_PRECISION=5`).
  - Если файл больше 5 МБ, вместо него пишет `<out_base>.pmtiles` через `ogr2ogr -f PMTiles` (MAXZOOM=10).
  - Возвращает путь к итоговому файлу.
- Produces: `OVERPASS_QUERY` — `[out:json][timeout:180];area["ISO3166-1"="KZ"][admin_level=2]->.kz;(relation["boundary"="protected_area"](area.kz);way["boundary"="protected_area"](area.kz););out geom;`.
- Produces: `fetch_osm_protected(s) -> Path` — кеш в `{work_dir}/osm_protected.json`; если файл уже есть, повторно не скачивает.
- Produces: `osm_to_polygons(overpass_json: dict) -> gpd.GeoDataFrame[osm_id, name, name_kk, name_ru, protect_class, geometry]`. Замкнутые ways становятся полигонами, relations собираются из внешних и внутренних колец через `shapely.ops.polygonize`.
- Produces: `overlay_sources(s) -> dict[str, Path]` — входной файл для каждого слоя из таблицы ниже. Точек наблюдений сайгака в нём нет.
- Produces: шаг `overlays` пишет в `{out_dir}/overlays/`:

| Файл | Источник | Колонки |
|---|---|---|
| `fwi_trends` | `outputs/gis/fwi_grid_trends.gpkg` | тренд FWI в % за 10 лет и p (имена — через `pyogrio.read_info`) |
| `dominant_burned_class` | `outputs/gis/dominant_burned_class_25km.gpkg` | класс |
| `settlements` | `outputs/gis/exposed_settlements.gpkg` + `tables/step8/settlement_exposure.csv` по `osm_id` | `osm_id, name, place, population, ba_years_5km, last_ba_year_5km, admin1` |
| `saiga_ranges` | `data/protected/saiga/saiga_seasonal_ranges_bizhanova2025.gpkg` | сезон и название ареала |
| `protected_areas_osm` | Overpass | `osm_id, name, name_kk, name_ru, protect_class` |

- [ ] **Step 1: Написать тесты**

```python
def test_write_overlay_keeps_only_listed_columns(tmp_path, settings):
    gdf = gpd.GeoDataFrame({'a': [1], 'secret': ['x']}, geometry=[Point(66.123456789, 50.1)], crs=4326)
    path = write_overlay(gdf, tmp_path / 'o', ['a'], settings)
    feat = json.loads(path.read_text(encoding='utf-8'))['features'][0]
    assert set(feat['properties']) == {'a'} and feat['geometry']['coordinates'][0] == 66.12346

def test_relation_becomes_multipolygon():
    data = json.loads((FIXTURES / 'overpass_relation.json').read_text(encoding='utf-8'))
    gdf = osm_to_polygons(data)
    assert gdf.geometry.iloc[0].geom_type in ('Polygon', 'MultiPolygon') and gdf['osm_id'].iloc[0] == 'r123'

def test_saiga_observations_are_never_read(settings):
    assert not any('saiga_locations' in str(p) for p in overlay_sources(settings).values())

@pytest.mark.data
def test_overlays(settings):
    run(settings)
    out = settings.out_dir / 'overlays'
    st = json.loads(next(out.glob('settlements.*')).read_text(encoding='utf-8'))
    assert len(st['features']) == 5472 and 'ba_years_5km' in st['features'][0]['properties']
    for p in out.glob('*.geojson'):
        assert not re.search(r'wdpa', p.read_text(encoding='utf-8'), re.I)
    assert all(p.stat().st_size < 20_000_000 for p in out.iterdir())
```

Положите фикстуру `pipeline/tests/fixtures/overpass_relation.json`: одна relation с двумя внешними ways, которые вместе образуют кольцо.

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_overlays.py -m "data or not data"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

Перед первым запуском `fetch_osm_protected` предупредите владельца, что шаг скачивает данные OSM (ODbL) с overpass-api.de.

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/overlays.py pipeline/tabiat_pipeline/steps/osm_protected.py pipeline/tests
git commit -m "feat(pipeline): FWI, land cover, settlement, saiga and OSM protected area layers"
```

---

### Task 11: Пакеты шести пожаров и снимки

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/fires.py`, `pipeline/schemas/fire_package.schema.json`
- Test: `pipeline/tests/test_fires.py`

**Interfaces:**
- Consumes: `load_clean` (Task 2), `run_gdal`, `write_json`.
- Produces: `STORY_FIRES` — пары `(slug, wak2_id)`:
  - `('2005-amangeldi', '2005_kostanay_s55971')`
  - `('2017-shet', '2017_karaganda_s154020')`
  - `('2021-ile-delta', '2021_almaty_s178681')`
  - `('2022-amankaragay', '2022_kostanay_s186253')`
  - `('2023-semey-ormany', '2023_abay_s188840')`
  - `('2026-aksuat-kokpekty', '2026_abay_e210902')`
- Produces: `build_package(slug: str, wak2_id: str, s) -> dict` = `{slug, wak2_id, meta, imagery, layers}`.
  - `meta` — строка `story/story_fires.csv` с этим `id`: даты, `ba_mcd64a1_km2`, `fastest_day`, `fastest_day_km2`, `fastest_day_share_pct`, `fwi_pct_grow`, `co2_mt`, `settlements_within_10km`, `nearest_town`, `nearest_town_km`.
  - Для пяти пожаров MCD64A1 слои берутся из `outputs/gis/fires/{wak2_id}.gpkg`:
    - `burned_by_day` — `day_index`, `date`, `area_km2`;
    - `detections` — `sensor`, `date`, `day_index`, `local_hour`, `frp`; не больше 5 000 штук, `sample(random_state=0)`;
    - `ignition`;
    - `settlements_10km` — `name`, `place`, `population`, `dist_km`.
  - Для `2026_abay_e210902` слоёв MCD64A1 нет, поэтому:
    - `burned_outline` — из `story/imagery/2026_abay_e210902/s2_burn_outline.gpkg`;
    - `detections` — VIIRS из `load_clean` в рамке контура плюс 10 км, с 2026-08-15 по 2026-08-18;
    - `ignition` — самая ранняя из этих детекций;
    - `settlements_10km` — из `outputs/gis/exposed_settlements.gpkg` по расстоянию в ESRI:102025.
- Produces: `export_imagery(wak2_id, slug, s) -> dict` = `{before, after, corners}`.
  - Снимки берутся из `story/imagery/{wak2_id}/truecolor_{before,after}.jpg`, ужимаются до 2048 px по большей стороне и сохраняются в WebP с качеством 80 как `fires/{slug}/{before,after}.webp`.
  - `corners` — четыре угла `[[lon, lat] × 4]` (верхний левый, верхний правый, нижний правый, нижний левый) из `gdalinfo -json <truecolor_before.tif>`, поле `wgs84Extent`.
- Produces: шаг `fires` пишет `{out_dir}/fires/{slug}.json` (по схеме) и снимки.

- [ ] **Step 1: Написать тесты (`data` и `gdal`)**

```python
def test_six_packages(settings):
    run(settings)
    assert sorted(p.stem for p in (settings.out_dir / 'fires').glob('*.json')) == sorted(slug for slug, _ in STORY_FIRES)

@pytest.mark.parametrize('slug,ba', [('2005-amangeldi', 10638.7), ('2023-semey-ormany', 545)])
def test_daily_burn_adds_up(settings, slug, ba):
    pkg = json.loads((settings.out_dir / 'fires' / f'{slug}.json').read_text(encoding='utf-8'))
    total = sum(f['properties']['area_km2'] for f in pkg['layers']['burned_by_day']['features'])
    assert total == pytest.approx(ba, rel=0.01)

def test_limits(settings):
    for p in (settings.out_dir / 'fires').glob('*.json'):
        pkg = json.loads(p.read_text(encoding='utf-8'))
        assert len(pkg['layers']['detections']['features']) <= 5000 and p.stat().st_size < 2_000_000
        assert all(46 < lon < 88 and 40 < lat < 56 for lon, lat in pkg['imagery']['corners'])
    for img in (settings.out_dir / 'fires').rglob('*.webp'):
        assert img.stat().st_size < 1_500_000 and max(Image.open(img).size) <= 2048

def test_2026_uses_sentinel_outline(settings):
    pkg = json.loads((settings.out_dir / 'fires' / '2026-aksuat-kokpekty.json').read_text(encoding='utf-8'))
    assert 'burned_outline' in pkg['layers'] and 'burned_by_day' not in pkg['layers']
```

Значение 545 км² для «Семей орманы» сверьте со столбцом `ba_mcd64a1_km2` в `story_fires.csv` и при расхождении возьмите значение оттуда.

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_fires.py -m "data and gdal"`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/fires.py pipeline/schemas/fire_package.schema.json pipeline/tests/test_fires.py
git commit -m "feat(pipeline): story fire packages with before/after imagery"
```

---

### Task 12: Бюджеты, манифест и выкладка на сайт

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/manifest.py`, `pipeline/tabiat_pipeline/steps/publish_local.py`
- Test: `pipeline/tests/test_manifest.py`

**Interfaces:**
- Produces: `BUDGETS: list[tuple[str, int, str]]` — шаблон пути, лимит в байтах, режим (`'each'`, `'total'` или `'gzip_total'`):
  - `('summaries/*.json', 2_000_000, 'total')`
  - `('numbers.json', 200_000, 'each')`
  - `('boundaries.topo.json', 400_000, 'each')`
  - `('grid/*', 600_000, 'gzip_total')`
  - `('tiles/firms_*.pmtiles', 250_000_000, 'each')`
  - `('tiles/burned_area.pmtiles', 300_000_000, 'each')`
  - `('tiles/burn_frequency.pmtiles', 80_000_000, 'each')`, `('tiles/co2_density.pmtiles', 80_000_000, 'each')`, `('tiles/landcover_esa.pmtiles', 80_000_000, 'each')`
  - `('overlays/*', 20_000_000, 'each')`
  - `('fires/*.json', 2_000_000, 'each')`
  - `('fires/*/*.webp', 1_500_000, 'each')`
- Produces: `check_budgets(out_dir) -> list[str]` — нарушения вида `"tiles/firms_modis.pmtiles: 263 MB > 250 MB"`.
- Produces: `SITE_PATTERNS = ['summaries/*', 'numbers.json', 'boundaries.topo.json', 'grid/*']`. Остальные файлы получают `location: 'r2'`.
- Produces: `build_manifest(out_dir, version) -> dict` = `{version, archive_end: '2026-09-21', ba_end: '2026-07', files: {relpath: {bytes, sha256, location}}, attribution: [...]}`.
  - `attribution` — строки NASA FIRMS, NASA MCD64A1/MCD12Q1, Copernicus (ERA5-Land, CEMS FWI, CAMS GFAS), GFED5 (CC BY 4.0), «© OpenStreetMap contributors, ODbL», GeoNames (CC BY 4.0), ESA CCI Land Cover, ареалы сайгака (Bizhanova et al., 2025, CC BY).
- Produces: шаг `manifest`. Если `check_budgets` нашёл нарушения, шаг падает. Иначе пишет `{out_dir}/manifest.json`.
- Produces: шаг `publish_local`:
  - очищает `{web_root}/public/data/{version}/`;
  - копирует туда файлы с `location == 'site'` и `manifest.json`;
  - пишет `{web_root}/src/data/version.json` = `{"version": "2026-10-07", "archiveEnd": "2026-09-21", "baEnd": "2026-07"}`.

- [ ] **Step 1: Написать тесты (на временной папке)**

```python
def test_budget_violation_is_reported(tmp_path):
    (tmp_path / 'numbers.json').write_bytes(b'x' * 200_001)
    assert check_budgets(tmp_path) == ['numbers.json: 0.2 MB > 0.2 MB']

def test_manifest_locations_and_hashes(tmp_path):
    (tmp_path / 'numbers.json').write_text('{}'); (tmp_path / 'tiles').mkdir(); (tmp_path / 'tiles/burned_area.pmtiles').write_bytes(b'PMTiles')
    m = build_manifest(tmp_path, '2026-10-07')
    assert m['files']['numbers.json']['location'] == 'site' and m['files']['tiles/burned_area.pmtiles']['location'] == 'r2'
    assert m['files']['numbers.json']['sha256'] == hashlib.sha256(b'{}').hexdigest()

def test_publish_copies_only_site_files(tmp_path, make_settings):
    s = make_settings(web_root=tmp_path / 'web', out_dir=tmp_path / 'out')
    (s.out_dir / 'tiles').mkdir(parents=True)
    (s.out_dir / 'numbers.json').write_text('{}'); (s.out_dir / 'tiles/burned_area.pmtiles').write_bytes(b'PMTiles')
    manifest_step.run(s); publish_local.run(s)
    pub = s.web_root / 'public' / 'data' / '2026-10-07'
    assert sorted(p.name for p in pub.rglob('*') if p.is_file()) == ['manifest.json', 'numbers.json']
    assert json.loads((s.web_root / 'src/data/version.json').read_text()) == {'version': '2026-10-07', 'archiveEnd': '2026-09-21', 'baEnd': '2026-07'}
```

`make_settings` — фикстура из `conftest.py`, которая собирает `Settings` с подменёнными путями без проверки `numbers.csv`.

Сообщение о нарушении пишется в мегабайтах с одним знаком (`f'{size / 1e6:.1f} MB > {limit / 1e6:.1f} MB'`).

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_manifest.py`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты, затем весь конвейер**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_manifest.py && pipeline/.venv/Scripts/python -m tabiat_pipeline run all`
Expected: тесты проходят; `run all` заканчивается шагом `publish_local` без ошибок; в `public/data/2026-10-07/` лежат `summaries/`, `numbers.json`, `boundaries.topo.json`, `grid/` и `manifest.json`.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/manifest.py pipeline/tabiat_pipeline/steps/publish_local.py pipeline/tests/test_manifest.py public/data/2026-10-07 src/data/version.json
git commit -m "feat(pipeline): budgets, manifest and site data publish"
```

---

### Task 13: Cloudflare R2: CORS и загрузка

**Files:**
- Create: `pipeline/tabiat_pipeline/steps/r2.py`
- Test: `pipeline/tests/test_r2.py`

**Interfaces:**
- Consumes: `build_manifest` (Task 12).
- Produces: `R2Config(account_id, access_key_id, secret_access_key, bucket, allowed_origins: list[str])` из переменных `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (по умолчанию `tabiat-data`) и `R2_ALLOWED_ORIGINS` (через запятую). Если переменных нет, ошибка перечисляет их имена.
- Produces: `make_client(cfg)` — boto3 S3 с `endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com'` и `region_name='auto'`.
- Produces: `CONTENT_TYPES = {'.pmtiles': 'application/vnd.pmtiles', '.json': 'application/json', '.geojson': 'application/geo+json', '.webp': 'image/webp'}`.
- Produces: `UploadItem(key, path, content_type, cache_control)` и `upload_plan(manifest, out_dir, version) -> list[UploadItem]`:
  - каждый файл с `location == 'r2'` идёт под ключом `{version}/{relpath}` с `public, max-age=31536000, immutable`;
  - `{version}/manifest.json` — с тем же кешированием;
  - корневой `manifest.json` — с `public, max-age=300`.
- Produces: `upload(items, client) -> None` — делает `head_object` для каждого ключа:
  - если объекта нет, загружает;
  - если есть и размер совпадает, пропускает;
  - если есть и размер другой, бросает `ImmutableKeyConflict` (кроме корневого `manifest.json`, его можно перезаписать).
- Produces: `cors_rules(origins) -> dict` для `put_bucket_cors`:
  - методы `GET`, `HEAD`;
  - заголовки `Range`, `If-Match`, `If-None-Match`;
  - открытые заголовки `ETag`, `Content-Length`, `Content-Range`, `Accept-Ranges`;
  - `MaxAgeSeconds: 86400`.
- Produces: шаги `r2_cors` и `r2_upload` (в `run all` не входят).

- [ ] **Step 1: Написать тесты (поддельный клиент)**

```python
def test_plan_keys_and_cache():
    manifest = {'files': {'tiles/firms_modis.pmtiles': {'location': 'r2', 'bytes': 7}, 'numbers.json': {'location': 'site', 'bytes': 2}}}
    plan = {i.key: i for i in upload_plan(manifest, Path('out'), '2026-10-07')}
    assert set(plan) == {'2026-10-07/tiles/firms_modis.pmtiles', '2026-10-07/manifest.json', 'manifest.json'}
    assert plan['manifest.json'].cache_control == 'public, max-age=300'
    assert plan['2026-10-07/tiles/firms_modis.pmtiles'].content_type == 'application/vnd.pmtiles'

def test_versioned_key_is_never_overwritten(tmp_path):
    f = tmp_path / 'a.pmtiles'; f.write_bytes(b'12345')
    client = FakeS3(existing={'2026-10-07/a.pmtiles': 3})
    with pytest.raises(ImmutableKeyConflict):
        upload([UploadItem('2026-10-07/a.pmtiles', f, 'application/vnd.pmtiles', 'immutable')], client)

def test_missing_env_lists_names():
    with pytest.raises(KeyError, match='R2_ACCOUNT_ID'):
        R2Config.from_env({})
```

- [ ] **Step 2: Запустить тесты**

Run: `pipeline/.venv/Scripts/python -m pytest pipeline/tests/test_r2.py`
Expected: FAIL

- [ ] **Step 3: Реализовать**

- [ ] **Step 4: Запустить тесты**

Run: та же команда.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/tabiat_pipeline/steps/r2.py pipeline/tests/test_r2.py
git commit -m "feat(pipeline): R2 upload plan, immutability guard and CORS"
```

- [ ] **Step 6: Настоящая загрузка (ждёт владельца, spec §13, п. 2)**

Нужно от владельца:
- аккаунт Cloudflare и бакет `tabiat-data`;
- ключи R2 API в переменных окружения;
- поддомен для данных, подключённый в панели Cloudflare;
- список доменов сайта для `R2_ALLOWED_ORIGINS`.

Ключи в чат и в файлы репозитория не просите и не записывайте.

После этого:
Run: `pipeline/.venv/Scripts/python -m tabiat_pipeline run r2_cors r2_upload`, затем `curl -sI -H "Range: bytes=0-15" https://<поддомен>/2026-10-07/tiles/firms_modis.pmtiles`
Expected: в ответе `HTTP/1.1 206`, `Content-Range: bytes 0-15/…` и `Access-Control-Allow-Origin` для домена сайта (с заголовком `Origin` в запросе).

---

### Task 14: Слой данных во фронтенде и проверка чисел в текстах

**Files:**
- Create: `src/data/config.js`, `src/data/numbers.js`, `src/data/useNumbers.js`
- Create: `scripts/lib/copy-numbers.mjs`, `scripts/check-copy-numbers.mjs`, `scripts/lib/netlify-headers.mjs`, `scripts/write-netlify-headers.mjs`
- Modify: `src/i18n/LocaleProvider.jsx` (передать `formatToken`), `vite.config.js` (`VITE_DATA_ORIGIN` в `CONNECT_ORIGINS`), `package.json` (скрипты `check:numbers` и `build`), `.github/workflows/ci.yml` (шаг `pnpm check:numbers`)
- Test: `src/data/numbers.test.js`, `scripts/lib/copy-numbers.test.mjs`, `scripts/lib/netlify-headers.test.mjs`

**Interfaces:**
- Consumes: `src/data/version.json` (Task 12); `createTranslator({ formatToken })`, `INTL_LOCALE`, `LocaleProvider` (M0, Task 6–7).
- Produces (`config.js`):
  - `DATA_VERSION` (из `version.json`);
  - `SITE_DATA_BASE = '/data/' + DATA_VERSION`;
  - `R2_DATA_BASE = import.meta.env.VITE_DATA_BASE_URL + '/' + DATA_VERSION`;
  - `dataUrl(relpath: string, location: 'site' | 'r2'): string`.
- Produces (`numbers.js`):
  - `formatNumber(entry: { value, decimals }, locale: string): string` — `Intl.NumberFormat(INTL_LOCALE[locale], { minimumFractionDigits: decimals, maximumFractionDigits: decimals })`; строковые значения возвращаются как есть;
  - `createNumberToken(numbers: object, locale: string, { strict = import.meta.env.DEV } = {}): (kind, id) => string` — для неизвестного `id` при `strict` бросает `Error('Unknown number id: <id>')`, иначе возвращает `'—'`.
- Produces: `useNumbers(): { numbers: object | null, status: 'loading' | 'ready' | 'error' }` — один `fetch` на всё приложение (кеш на уровне модуля).
- Produces: `checkCopyNumbers(dicts, numbers) -> string[]`.
  - Ошибки: `"ru/story: intro.lead uses unknown number 'foo'"` и `"ru/story: intro.lead has raw number '917 686'"`.
  - Разрешены: годы 1900–2099, даты (`21.09.2026`, `2026-09-21`), диапазоны лет через тире, цифры внутри `{{…}}`, а также термины `CO₂`, `CH₄`, `PM2.5`, `MCD64A1`, `MCD12Q1`, `ERA5`, `Sentinel-2`, `NOAA-20`, `NOAA-21`, `S-NPP`, `1080×1350`.
- Produces: `renderHeaders(csp: string): string` → `"/*\n  Content-Security-Policy: <csp>\n"`. Скрипт `write-netlify-headers.mjs` пишет `dist/_headers` из `PROD_CSP` (`vite.config.js`). `"build": "vite build && node scripts/write-netlify-headers.mjs"`.

- [ ] **Step 1: Написать тесты**

```js
// numbers.test.js
it('formats per locale', () => {
  expect(formatNumber({ value: 2.674, decimals: 1 }, 'ru')).toBe('2,7');
  expect(formatNumber({ value: 917686.222, decimals: 0 }, 'kk')).toMatch(/^917\s686$/u);
  expect(formatNumber({ value: 917686.222, decimals: 0 }, 'en')).toBe('917,686');
  expect(formatNumber({ value: '2026-09-21', decimals: null }, 'en')).toBe('2026-09-21');
});
it('fails loudly on unknown ids in strict mode', () => {
  expect(() => createNumberToken({}, 'ru', { strict: true })('n', 'nope')).toThrow('Unknown number id: nope');
  expect(createNumberToken({}, 'ru', { strict: false })('n', 'nope')).toBe('—');
});
it('plugs into the translator', () => {
  const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: 'в {{n:r}} раза' } } }, formatToken: createNumberToken({ r: { value: 2.674, decimals: 1 } }, 'ru') });
  expect(t('s.a')).toBe('в 2,7 раза');
});

// copy-numbers.test.mjs
it('accepts tokens, years and allowed terms', () => {
  expect(checkCopyNumbers({ ru: { story: { a: 'С 2001 года сгорело {{n:ever_burned_km2}} км², данные MCD64A1, CO₂' } } }, { ever_burned_km2: {} })).toEqual([]);
});
it('rejects raw numbers and unknown ids', () => {
  const errs = checkCopyNumbers({ ru: { story: { a: 'сгорело 917 686 км²', b: '{{n:foo}}' } } }, {});
  expect(errs).toEqual(["ru/story: a has raw number '917 686'", "ru/story: b uses unknown number 'foo'"]);
});

// netlify-headers.test.mjs
it('renders a CSP header for all paths', () => expect(renderHeaders("default-src 'self'")).toBe("/*\n  Content-Security-Policy: default-src 'self'\n"));
```

- [ ] **Step 2: Запустить тесты**

Run: `pnpm test src/data scripts/lib/copy-numbers.test.mjs scripts/lib/netlify-headers.test.mjs`
Expected: FAIL

- [ ] **Step 3: Реализовать модули, скрипты и подключить `formatToken` в `LocaleProvider`**

Пока `useNumbers` возвращает `loading`, переводчик работает без `formatToken`. Токены в этот момент остаются нераскрытыми, поэтому страницы, которые выводят числа, ждут статуса `ready` (это забота этапов M3–M4).

- [ ] **Step 4: Запустить тесты и проверки**

Run: `pnpm test && pnpm check:numbers && VITE_DATA_ORIGIN=https://data.example.test pnpm build && grep -c "data.example.test" dist/_headers`
Expected: все тесты проходят, `check:numbers` печатает `numbers OK`, `grep` находит одно совпадение.

- [ ] **Step 5: Commit**

```bash
git add src/data src/i18n/LocaleProvider.jsx scripts vite.config.js package.json .github/workflows/ci.yml
git commit -m "feat(data): number tokens in copy, data URLs and production CSP headers"
```
