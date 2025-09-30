# Universal Best Practices

These principles apply to ALL specification work, regardless of type.

## Always DO ✅

- **Research extensively** before creating any specification
- **Validate with tools** - Use `guidance` tool to check quality
- **Cite your sources** - Reference research, articles, standards
- **Ask clarifying questions** - Never assume, be explicit
- **Use specific language** - Avoid vague terms ("fast", "easy", "user-friendly")
- **Ensure traceability** - Link requirements → components → plans
- **Follow schemas exactly** - Use correct ID formats and required fields
- **Provide context** - Explain WHY, not just WHAT
- **Keep focused** - One concern per specification
- **Document constraints** - Be explicit about limitations

## Never DO ❌

- **Skip validation** - Always run quality checks
- **Make assumptions** - Verify with user or research
- **Mix concerns** - Keep specifications atomic and focused
- **Use implementation details** (in requirements) - Focus on outcomes
- **Leave specifications orphaned** - Ensure proper linkage
- **Ignore dependencies** - Map and validate all relationships
- **Use ambiguous language** - Be specific and measurable
- **Forget stakeholders** - Consider all perspectives
- **Skip research phase** - Deep research is critical
- **Rush the process** - Quality over speed

## Research Best Practices

### Before Creating Any Specification

1. **Understand existing work**:
   - List all related specifications
   - Read and analyze similar examples
   - Identify patterns and conventions

2. **Research domain best practices**:
   - WebSearch for industry standards
   - WebFetch articles from authoritative sources
   - Study frameworks (NIST, OWASP, ISO, etc.)
   - Look for case studies and patterns

3. **Research technical context** (if applicable):
   - Use context7 to get library documentation
   - Understand technical capabilities
   - Research implementation patterns
   - Study performance benchmarks

4. **Validate understanding**:
   - Ask clarifying questions
   - Confirm assumptions with user
   - Cross-reference multiple sources

## Tool Usage

### MCP Tools

**Entity Management:**
- `requirement` (operation: create|get|update|delete|list)
- `component` (operation: create|get|update|delete|list)
- `plan` (operation: create|get|update|delete|list)

**Quality Validation:**
- `guidance` (spec_type: requirement|component|plan) - Validates against reasoning process
- `analyze` (analysis_type: dependencies|coverage|orphans|cycles|health|references|full-report)

**Search:**
- `search-specs` - Full-text search across all specifications

### Research Tools

- **WebSearch**: Find recent best practices, standards, benchmarks
- **WebFetch**: Deep dive into specific articles and documentation
- **context7**: Get up-to-date library documentation
- **Read/Glob/Grep**: Understand existing codebase patterns

### Quality Assurance Workflow

1. Create or update specification
2. Run `guidance` tool to validate quality
3. Review issues and suggestions
4. Refine specification
5. Run `analyze` (analysis_type: "dependencies") to check relationships
6. Fix any broken references or cycles
7. Present to user with rationale

## Remember

- **Quality over speed** - Take time to research and validate
- **Clarity over cleverness** - Simple, explicit specifications are best
- **Traceability over isolation** - Everything connects to everything
- **Measurable over vague** - If you can't test it, rewrite it
- **Research over assumptions** - Deep understanding prevents rework
