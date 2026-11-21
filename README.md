# Madlan Data Explorer

Hebrew RTL real-estate transaction explorer and grounded natural-language analyst.

## Architecture

The frontend follows **Feature-Sliced Design (FSD)** and deliberately keeps the application as a **single page with two child sections**, rather than introducing routing for only two views.

```text
src/
├── app/                 # application shell and global styles
├── pages/               # page composition
│   └── home/
├── features/            # product capabilities and independently meaningful UI
│   ├── app-header/
│   ├── data-explorer/
│   ├── explorer-filter/
│   ├── explorer-sort/
│   ├── question-suggestions/
│   └── analyze-question/
├── entities/             # domain models and reusable entity UI
│   ├── transaction/
│   └── analysis/
└── shared/                # reusable primitives and utilities
```

### Component design

Components are split by responsibility: filters, sorting, summary metrics, transaction table, query composer, suggestions, analysis result, evidence and limitations are independent pieces. Hooks own stateful behavior and derived state; API calls do not live inside presentational components.

Memoization is intentional rather than blanket:
- `useMemo` is used for expensive filtered/sorted/option-derived transaction collections.
- `useCallback` is used for the analysis request function passed through the component tree.
- `React.memo` is used for transaction rows/table where repeated rows make stable props valuable.
- Simple components are not memoized without a measured or structural reason.

## Product

### חקר הנתונים
Direct exploration of the normalized transactions: filters, sorting, summary metrics and a scrollable evidence table.

### ניתוח ושאלות
Suggested questions populate the same editable natural-language input. Submitting a question sends it through the constrained LLM planner, deterministic analysis engine and grounded explanation step.

The core rule is: **the LLM interprets intent and communicates evidence; code calculates the numbers.**

## No router

There is intentionally no React Router. This is one application surface with two child sections, so local UI state is simpler and avoids unnecessary navigation infrastructure.

## Data and deployment

The normalized dataset is bundled with the application. The API key remains server-side. The analysis endpoint validates the LLM plan with Zod and only executes constrained operations.

See `DATA_NOTES.md` and `AI_LOG.md` for data-handling and AI-development notes.
