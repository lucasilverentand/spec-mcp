---
description: Create a new specification (requirement, component, or plan)
---

Type: {{input[0]}}
Context: {{input[1:]}}

Use the appropriate agent based on the type:

**If type is "requirement":**
Use the requirement-planner agent to create a new requirement specification following the 7-step reasoning process.

**If type is "component":**
Use the component-planner agent to design a new component specification following the 10-step reasoning process.

**If type is "plan":**
Use the implementation-planner agent to create a detailed implementation plan following the 12-step reasoning process. Ensure the plan includes:
- criteria_id linkage (which acceptance criteria does this fulfill?)
- 0.5-3 day task breakdown
- 20% buffer in estimates
- Dependencies and critical path
- Testing strategy
- Risk mitigation

Context: {{input[1:]}}