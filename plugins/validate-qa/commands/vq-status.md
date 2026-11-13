---
description: Show the connected Validate.QA project's tests, recent runs and failures
---

Show the state of the connected Validate.QA project, read-only:

1. Call `get_project_overview` (test counts, pass rate, runner readiness, features, schedules). If the tool is missing or asks for authentication, tell the user to run `/mcp`, select `validate-qa` and sign in, then stop.
2. Call `list_features` and `get_test_failures` (last 24 h).

Answer in under 12 lines: project, tests (active / draft / quarantined), 7-day pass rate, runner online or not, the features with failing tests, and the failing test names. If anything is failing, offer to run the `triage` skill. Do not run, edit, heal or delete anything.
