# Plan Best Practices

## Core Principles

Break work into atomic tasks, define clear acceptance criteria, and establish proper traceability to requirements.

## ✅ DO

- Break down into atomic, actionable tasks (0.5-3 days each)
- Define clear acceptance criteria for completion
- Map task dependencies explicitly
- Include test cases and validation
- Document user/system flows
- Add 20% buffer for complex plans (5+ tasks)
- Link to requirement criteria (criteria_id)
- Consider risks and contingencies
- Define rollback strategies

## ❌ DON'T

- Create single-task plans (too granular)
- Skip dependency mapping
- Forget test cases
- Ignore edge cases and errors
- Over-estimate or under-estimate effort
- Skip consideration notes on tasks
- Forget traceability to requirements
- Plan without understanding component architecture

## Common Anti-Patterns

### No Task Dependencies
❌ **Bad:** All tasks appear independent when they're not  
✅ **Good:** Clear dependency graph showing order

### Vague Tasks
❌ **Bad:** "Implement feature"  
✅ **Good:** "Create User model with email/password fields, add validation"

### Missing Test Cases
❌ **Bad:** No validation strategy  
✅ **Good:** Test cases defined for each critical path

### No Acceptance Criteria
❌ **Bad:** Unclear when "done"  
✅ **Good:** "All tests pass, API responds <100ms, documented"

### Unrealistic Estimates
❌ **Bad:** No buffer, assumes perfect conditions  
✅ **Good:** 20% buffer included for unexpected issues

### Poor Traceability
❌ **Bad:** Plan not linked to requirement criteria  
✅ **Good:** criteria_id links to specific requirement criterion

### Missing Flows
❌ **Bad:** Complex interactions not documented  
✅ **Good:** User flows, system flows, data flows documented

## Success Patterns

- Research project management patterns
- Use `guidance` tool (12-step process) to validate
- Check dependencies with `analyze` (analysis_type: "dependencies")
- Detect cycles with `analyze` (analysis_type: "cycles")
- Link every plan to a requirement criterion
- Include test cases for validation
