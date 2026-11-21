# AI assistance log

## Intended use
AI was used to explore product directions, challenge the initial idea of a generic deal-comparison UI, design the guided-question UX, draft code structure, and review edge cases.

## Bad AI answer caught
An early design direction suggested treating the LLM as a generic chatbot/summary layer over the CSV. That was rejected because it did not give the LLM a meaningful analytical responsibility and could encourage unsupported claims. The final design constrains the LLM to translating user intent into a small analysis-plan schema, while calculations remain deterministic.

## Additional guardrail
The LLM is never given authority to execute SQL/code or directly calculate transaction metrics. Its plan is validated and mapped to known operations.
