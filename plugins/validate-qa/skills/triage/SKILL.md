---
name: triage
description: Work out why a Validate.QA test run failed and act on it. Reads the failure evidence and screenshots, decides whether the app is broken or the test is stale, then heals the test, edits it, or flags the app bug. Use when a test failed, when the user asks why a run failed, or after test-after-change reports failures.
---

# Triage a failing Validate.QA test

A failure is either **the app is broken** (a real bug), **the test is stale** (the app changed on purpose, a selector or wording moved), or **the environment** (runner down, site down, timeout, expired test login). Decide which with evidence before you act.

## 1. Collect the evidence

- A specific run or test: `get_test_run` with `runId` or `testId`. It carries the error, console output, step-level failure and the Playwright code.
- No specific run: `get_test_failures` (default last 24 h; `suite` to scope to a feature, `sinceHours` to widen).
- Look at the page: `get_test_screenshots` for the run. Read what the user would have seen.
- Read the test: `get_test_code`. Compare the failing step to the app code in this repo when you have it (`git grep` for the text, route or selector).

## 2. Decide

| Evidence | Verdict | Action |
|---|---|---|
| The screenshot shows broken behaviour: an error page, a wrong value, a missing control that should be there, a request that fails with 4xx/5xx | **App bug** | step 3a |
| The selector or text moved, the app changed on purpose, the step looks outdated | **Stale test** | step 3b |
| Runner offline, 5xx from the whole site, a sign-in rejected, a timeout on a page that loads fine by hand | **Environment** | step 3c |
| You cannot tell | **Unclear** | say so; run once more with `run_test` (`waitSeconds`) before concluding. A flaky pass is not a fix |

Never call something an app bug from the error text alone: a selector timeout looks the same either way.

## 3. Act

**a. App bug.** Tell the user what is broken and where (file and line if the repo shows it). If the user wants the test kept as the proof of the bug, call `flag_as_bug` with `description` (what the app does wrong, in one sentence). That quarantines the test with `@bug-found` so it stops going red in schedules. Fixing the app is a separate step the user asks for; after the fix is deployed, set the test back with `update_test_status` to `ACTIVE`, which queues a verification run.

**b. Stale test.** Prefer `heal_test` (the AI replays the test in a real browser and fixes the code, or finds an app bug itself and quarantines it); then `wait_for_run` with the returned run id and report the verdict. If `heal_test` returns `PLAN_FEATURE_LOCKED`, healing uses Validate.QA's own AI and needs the Solo Dev plan (https://validate.qa/pricing): fix the test yourself instead: `get_test_code`, make the smallest change, `edit_test_code`, `run_test` with `waitSeconds`. Do not weaken an assertion to make it pass: the new code must still assert the correct behaviour.

**c. Environment.** Check `get_runner_health`, say what is down, and stop. Do not edit or flag anything.

## 4. Report

One short block per test: verdict, the evidence in one line (the screenshot or error that decided it), what you did, what is left for the user. Never delete a test, and never disable one without asking.
