---
description: Refine an existing specification (auto-detects type from ID)
---

Spec ID: {{input}}

Based on the ID prefix, use the appropriate agent:

**If ID starts with "req-":**
Use the requirement-planner agent to analyze and refine this requirement specification. Research best practices, validate quality, and suggest improvements.

**If ID starts with "app-", "svc-", "lib-", or "tol-":**
Use the component-planner agent to analyze and refine this component specification. Research architectural patterns, validate design, and suggest improvements.

**If ID starts with "pln-":**
Use the implementation-planner agent to analyze and refine this plan specification. Research project management patterns, validate task breakdown, and suggest improvements.

Please provide specific recommendations based on the 7-step (requirements), 10-step (components), or 12-step (plans) reasoning process.