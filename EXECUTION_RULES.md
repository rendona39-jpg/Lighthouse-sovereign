# EXECUTION RULES (Ralph Pattern)

## Core Constraints
1. ONE task at a time
2. Restate task before implementation
3. Implement
4. Test/validate
5. Verify against spec
6. Self-approve or self-reject
7. Report completion explicitly
8. Wait for next task

## No Batching
- Do not implement multiple files simultaneously
- Do not skip verification steps
- Do not assume missing requirements

## Verification Required
- Every file must match LIGHTHOUSE_SPEC.md exactly
- Every function must have error handling
- Every API endpoint must have rate limiting
- Every database operation must use correct schema

## Failure Protocol
If uncertain:
1. Stop
2. State what is unclear
3. Request clarification
4. Do not guess
5. Do not proceed

## Success Criteria
- File exists at correct path
- Code matches spec exactly
- No TypeScript errors
- Explicit confirmation: "Task N complete. Ready for Task N+1."
```