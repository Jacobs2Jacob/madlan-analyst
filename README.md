AI Development Log

Intended use of AI

AI was used throughout development as a development assistant for brainstorming, implementation, debugging, and reviewing architectural decisions.

The final architecture was reviewed and adjusted manually rather than accepting AI-generated solutions blindly.

Bad AI answer caught

An early design direction suggested treating the LLM as a generic chatbot/summary layer over the CSV.

I rejected this approach because it would make the model responsible for calculations and increase the risk of hallucinated numbers.

The final design instead constrains the LLM to translate the user's question into a structured analysis plan. The actual filtering, aggregation, ranking, trend analysis, and anomaly detection are performed deterministically by the application.

The LLM-generated analysis plan is also validated against a strict schema before execution. The LLM cannot generate arbitrary SQL or code, and it does not directly calculate the numerical results shown to the user.

Analysis flow

User question
     v
LLM planner
     v
Schema validation
     v
Deterministic analysis engine
     v
LLM explanation
     v
User-facing analysis
When AI is disabled or unavailable, a deterministic fallback planner is used instead.

The LLM interprets and communicates. The application calculates and retrieves.