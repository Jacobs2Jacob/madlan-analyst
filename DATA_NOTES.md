# Data notes

The supplied CSV contains 530 rows and 19 columns. It is intentionally messy.

Observed issues handled by normalization:
- `rooms` can be numeric or strings such as `2 חדרים` / `4 חדרים`.
- `price_nis` can contain commas or a `₪` prefix.
- booleans use multiple representations: yes/no, TRUE/FALSE, 1/0, כן/לא.
- dates appear in ISO, slash, dot, month-name and mixed formats.
- some fields are missing, including year_built, floor, size_sqm and price_per_sqm.
- city names include transliteration/spacing variants.
- at least one transaction has a suspicious zero price-per-sqm and some prices are extreme; non-positive price metrics are excluded from price analysis.

Deterministic normalization is intentionally conservative. Missing values are not invented. `price_per_sqm` is derived only when the source value is missing/invalid and both positive price and size are available; provenance is retained with `pricePerSqmDerived`.

The `source` field is retained but source-level comparisons are outside this MVP.
