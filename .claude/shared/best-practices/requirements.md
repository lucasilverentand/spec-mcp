# Requirement Best Practices

## Core Principles

Focus on **WHAT** needs to be achieved, not **HOW** to implement it. Requirements are implementation-agnostic and define business needs.

## ✅ DO

- Make requirements measurable and testable
- Use clear acceptance criteria (Given/When/Then format)
- Assign appropriate priority levels
- Include business value and rationale
- Define non-functional requirements (performance, security, etc.)
- Link to business objectives
- Consider all stakeholders
- Use specific, quantifiable terms

## ❌ DON'T

- Prescribe implementation details or technologies
- Use vague terms without quantification
- Combine multiple requirements into one
- Write requirements that can't be tested
- Mix functional and non-functional concerns
- Skip edge cases and error conditions
- Forget user research

## Common Anti-Patterns

### Too Implementation-Focused
❌ **Bad:** "System shall use Redis for caching"  
✅ **Good:** "System shall respond to queries within 100ms"

### Too Vague
❌ **Bad:** "System shall be fast"  
✅ **Good:** "System shall process transactions within 2 seconds"

### Missing Acceptance Criteria
❌ **Bad:** Just having a description  
✅ **Good:** Clear, testable criteria for each requirement

### No Traceability
❌ **Bad:** Requirements in isolation  
✅ **Good:** Requirements trace to business needs and forward to components/plans

### Conflicting Requirements
❌ **Bad:** REQ-001 requires <1s response, REQ-002 requires batch processing with no time limit  
✅ **Good:** Consistent, compatible requirements

### Mixing Multiple Concerns
❌ **Bad:** "System shall authenticate users and generate reports"  
✅ **Good:** Two separate requirements

### Using Technical Jargon Unnecessarily
❌ **Bad:** "System shall implement JWT-based authentication with RS256 signing"  
✅ **Good:** "System shall authenticate users securely using industry-standard tokens"

## Success Patterns

- Research industry standards before drafting
- Cite sources for requirements decisions
- Use Given/When/Then format for criteria
- Include both functional and non-functional requirements
- Link requirements to user stories or business objectives
- Validate with `guidance` tool (7-step process)
- Iterate based on feedback
