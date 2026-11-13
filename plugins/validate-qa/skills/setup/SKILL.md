---
name: setup
description: Connect this app to Validate.QA and get its first tests. Checks the Validate.QA connection, sets the project's base URL, app brief and test login, runs discovery to map the app's features, generates tests for the important ones, and verifies the drafts. Use when the user asks to set up Validate.QA, add QA coverage, or create the first tests for their app.
---

# Set up Validate.QA for this app

Goal: a connected project with a mapped app, a handful of verified tests, and the user told what to do next. Work in this order. Ask the user only where a step says to.

## 1. Check the connection

Call `get_project_overview`.

- It works: the connection is live and scoped to one Validate.QA project (chosen on the consent screen at sign-in). Note the test counts, runner readiness and features it returns.
- No `validate-qa` tools, or the call says it needs authentication: tell the user to run `/mcp`, pick `validate-qa`, and sign in. They choose one project on the consent screen. Do not try to work around it, and never ask for or print a token. Stop until they confirm.
- The user has no Validate.QA account: they sign up at https://validate.qa. Do not create an account for them.
- The user prefers a token over browser sign-in, or the host cannot open a browser: the stdio fallback is in this plugin's README (`npx @validate.qa/mcp init`).

## 2. Tell Validate.QA about the app

Read the repo (README, package manifest, routes, auth code) for what the app does, its public URL, and how a test user signs in. Then:

1. The base URL must be a public http(s) address. An app on localhost or a private address is refused: tell the user it needs the Local runner (Project Settings), or a deployed preview URL.
2. Ask the user for a **test account** (email and password) for the app. Use a dedicated test user on a staging or preview environment, never a real customer or admin login, and never invent credentials. If the app needs no sign-in, skip this.
3. Call `setup_project` once with `appBrief` (2-4 sentences: what the app does, key flows, stack), `baseUrl`, `testCredentials` and `features` (the 3-8 most important user-facing features, each with its `pages` routes and a `criticality`). Prefer fewer, accurate features over a long guessed list.
4. Optional: `add_api_endpoints` for the main routes you read in the code, so API checks and security audit have something to start from.

## 3. Discovery

Call `get_runner_health`. If no runner is online, say so and stop: nothing can run until one is.

Call `run_discovery` with `mode: "survey"` (maps features and screens, generates no tests). Then wait: `get_discovery_status` at most every 30-60 seconds, and report progress in one line each time, not a log. A survey can take several minutes. Pass the `jobId` from `run_discovery` and wait until `phase` is `completed` or `failed` (the row `status` can read COMPLETED while follow-up runs are still going), then call `list_features`.

If a call returns `PLAN_FEATURE_LOCKED`: the call uses Validate.QA's own AI, which needs the Solo Dev plan. MCP Army (free) is for bring-your-own-AI: Claude can write tests itself with `create_test`. Tell the user, point them to https://validate.qa/pricing, and offer the `create_test` route for one or two flows instead.

## 4. Generate and verify tests

1. For each critical or high feature, call `generate_tests_for_feature` (pass `focus` with the scenarios the user cares about, in plain words). One at a time; check `list_tests` with `status: "DRAFT"` between calls.
2. Call `run_draft_tests` (optionally with `featureName`), then `wait_for_batch`. A draft becomes ACTIVE after two clean passes, so repeat once.
3. Read the result with `list_tests`. For a failure, do not edit anything: hand it to the `triage` skill.

## 5. Finish

End with a short summary: the project, the features mapped, tests ACTIVE vs DRAFT vs failing, and the two next steps: `/vq-test` after the next code change, and scheduling the suite with `create_schedule` if they want it nightly (offer, do not create it unasked).

Never delete or disable tests, never change project settings beyond step 2, and never paste credentials into chat output.
