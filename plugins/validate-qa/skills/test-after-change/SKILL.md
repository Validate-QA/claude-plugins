---
name: test-after-change
description: After Claude changes the user's app, run the Validate.QA tests that cover what changed and read the failures. Maps the diff to features, runs only those tests, waits for the result, and reports pass or fail with the evidence. Use after editing app code when a Validate.QA project is connected, or when the user asks to run the tests for a change.
---

# Run the affected Validate.QA tests

Run the tests that cover what just changed, not the whole suite. The tests run in the Validate.QA cloud against the project's **deployed** base URL, so they only see a change once it is live there. Say so when it matters.

## 1. Know what changed and whether it is live

1. `git diff --stat` (and `git diff` of the app files) against the base. List the user-facing areas touched: pages, routes, forms, API handlers, shared components.
2. Call `get_project_overview` for the base URL. If the change is only in the working tree, the cloud run tests the old deployed app. Say that, and ask whether to continue anyway (useful as a regression check) or wait until it is deployed to that URL. Do not deploy anything yourself.

## 2. Pick the tests

1. Call `list_features`. Match each touched area to a feature by name and pages. Use `get_feature` for its pages if unsure.
2. For each matched feature, `list_tests` with `featureId` and `status: "ACTIVE"`. Add tests whose names or tags mention the touched flow (`search`).
3. If nothing matches, say so. Offer to run `generate_tests_for_feature` for the area (the `setup` skill covers this); do not invent a mapping.
4. Keep the set small and relevant. If it is more than about 25 tests, say how many and ask before running.

## 3. Run

- One test: `run_test` with `waitSeconds` (up to the maximum the tool allows).
- Several: `batch_run_tests` with `testIds`, then `wait_for_batch`. If it times out, call it again; do not loop `get_test_run`.

Never run the whole project's tests, never run a security audit, and never change a test just to make it pass.

## 4. Read the result

- All passed: report counts and the feature names in one or two lines.
- Any failed or errored: for each, `get_test_run` (it carries the error, console and failing step) and `get_test_screenshots` on the run to look at the page. Then hand over to the `triage` skill to decide: the app broke, or the test is stale. If the failure matches the change you just made, say so first: that is the likely cause, and fixing the app is your job.

## 5. Report

A short list: tests run, passed, failed, with the failing test name, the failing step and your read of it (app bug caused by the change / stale test / environment). Offer the next action (fix the code, heal the test, flag a bug); do not take it unasked.
