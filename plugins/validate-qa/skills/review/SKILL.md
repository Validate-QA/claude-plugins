---
name: review
description: Validate.QA free review. Reviews this whole repository for real user-facing bugs (broken flows, wrong states, missing error handling, auth and permission gaps a user can hit), proves each one with a failing test, writes VALIDATE-QA-REVIEW.md and the tests on a new branch, and uploads proven browser bugs to a linked Validate.QA project. Use when asked for a Validate.QA review, a QA review of the repo, or to find and prove bugs.
---

# Validate.QA review

You are running a QA review of the repository in the current directory for its owner. It runs in their own Claude Code on their own login: Validate.QA supplies these instructions and, when the repo is linked, turns your proven bugs into scheduled tests. Work in this order and do not skip the proof step.

**What counts as a finding:** something a real user of this app or library would hit: a flow that breaks, a wrong state or value shown, data lost or saved wrong, an error that is swallowed or shown as success, a page or API a user can reach without the right sign-in or role, an input that crashes or corrupts. **Not a finding:** style, naming, formatting, refactors, missing comments, performance without a user-visible effect, "could be cleaner", dependency versions, theoretical issues you cannot connect to a user action.

**Fewer, proven bugs beat a long list.** Report at most 10 findings. A finding with a failing test is worth more than five without one. Never invent a bug to fill the report; "no proven bugs" is a valid result.

## 0. Before you start

1. Run `git status --short` and `git rev-parse --abbrev-ref HEAD`.
   - Not a git repo: work as below, but write the report and tests in place and say so at the end.
   - Uncommitted changes present: ask the user before touching anything. Offer to continue on a new branch that carries their changes, or to stop so they can commit first. Never stash, reset, discard or commit their changes.
2. Create the review branch: `git switch -c validate-qa/review-<YYYY-MM-DD>` (add `-2`, `-3` if it exists). All your files go on this branch. Never push it and never open a pull request; the user decides.
3. Check whether the repo is linked to a Validate.QA project: look for Validate.QA MCP tools in this session (their names contain `validate` and include `start_here`, `save_regression_test`, `collect_verdicts`). If they are present, call `start_here` once now (no arguments) and note the features, the base URL and the code rules it returns. If not, the review is local only; do not ask the user to link it. (A session that only has the hosted `validate-qa` connection from this plugin has no `start_here`, `save_regression_test` or `collect_verdicts`: treat the review as local only and say in the summary that linking with `npx @validate.qa/mcp init` lets the review upload its proven bugs.)

## 1. Map the app (read, do not run yet)

Read enough to know what a user can do:

- README, package manifests (`package.json`, `pyproject.toml`, `go.mod`, ...), how it starts, how its tests run (the test command, the framework, where tests live, an existing Playwright config).
- Routes and pages, API handlers, auth and role checks (middleware, guards, decorators), forms and their validation, the data layer.
- For a library or CLI: its public API or commands are the "flows".

Write down the 5-15 user flows that matter most (sign up, sign in, the core create/edit/delete, checkout, settings, permissions). Spend your effort there.

## 2. Hunt

For each flow, trace the code path end to end and look for where it breaks for a user:

- Error paths: a failed request, a 4xx/5xx, a rejected promise, an empty or null result. Is it shown to the user, or does the UI show success / spin forever / show stale data?
- State: is the UI updated after a mutation? Is loading/disabled state reset on failure? Are lists, counts and totals right after add/remove/filter/paginate?
- Validation: client and server agree? Empty, too long, whitespace-only, unicode, negative, zero, duplicate inputs.
- Auth and permissions: every route and API handler a signed-out user or a lower role can reach; object access by id without an owner check (IDOR); actions hidden in the UI but allowed by the API.
- Edges: time zones and dates, money and rounding, off-by-one in pagination, race on double-submit, back/refresh after submit.

Keep a candidate list with file:line and the exact user action that triggers each one. Drop a candidate as soon as the code shows it is handled.

## 3. Prove

For each candidate, in order of severity, write a test that **asserts the correct behaviour** and therefore **fails now** because of the bug. Run it and see it fail for the right reason (the bug, not a typo, missing setup or a timeout). Then you have a proven finding.

- UI flows: a Playwright test, in the repo's existing Playwright setup if it has one, otherwise in `tests/validate-qa/<short-name>.spec.ts` with relative URLs (`page.goto('/login')`). Run it against the app started locally the way the repo documents (only start what the README or scripts start; ask the user if it needs secrets or services you do not have). Browsers run headless.
- Everything else (API handlers, logic, libraries, CLIs): a test in the repo's own framework and style (Vitest, Jest, node:test, pytest, go test, ...), next to the existing tests, named `validate-qa-<short-name>`.
- Use only the repo's existing test dependencies. Do not add packages or change lockfiles without asking.
- Selectors: `getByRole(role, { name, exact: true })`, `getByLabel`, `getByText(..., { exact: true })`; assert the exact text or value a correct app shows.
- Each assertion must be able to fail; a test that passes now does not prove the bug: fix the test or drop the finding.
- If you cannot make a failing test in reasonable time (needs third-party accounts, real payments, hardware), keep the finding only if the evidence in the code is unambiguous, and mark it **Unproven** with the reason.

Do not fix the bugs. The deliverable is the proof.

## 4. Report

Write `VALIDATE-QA-REVIEW.md` at the repo root:

```markdown
# Validate.QA review - <repo name> - <date>

Model: <model you are running as>. Reviewed at <commit sha> on <branch>.
Result: <N> proven, <M> unproven. Flows reviewed: <list>.

## 1. <What breaks for the user, in one line>
- Severity: Critical | High | Medium | Low
- Where: path/to/file.ts:123
- What the user does: <steps>
- What happens: <observed behaviour>
- What should happen: <expected behaviour>
- Proof: `path/to/test` - run with `<exact command>`; fails with: `<one line of the failure>`
  (or: Unproven - <why no test>)
- Validate.QA: <saved as test <id>, reproduces> (linked projects only)
```

Severity: **Critical** = data loss, security or auth bypass, payment or core flow fully broken for everyone. **High** = a core flow broken for some users or inputs, or a wrong result shown as right. **Medium** = a secondary flow broken or an error swallowed with a workaround. **Low** = a minor wrong state a user notices.

Order findings by severity. End with a short "Not reviewed" list (areas you skipped and why) so the owner knows the coverage.

Commit the report and the tests on the review branch: `git add VALIDATE-QA-REVIEW.md <test files>` (only your files) and `git commit -m "Validate.QA review: <N> proven bugs"`.

## 5. Linked project: upload the proven browser bugs

Only when the Validate.QA tools are present (step 0):

1. Skip findings that only exist in unreleased local code: the saved test runs in the Validate.QA cloud against the project's base URL from `start_here`. If the base URL is a deployed site, the bug must be in what is deployed (the default branch).
2. For each proven UI finding, call `save_regression_test` with: `name` (what should happen), `feature` (an existing feature name from `start_here`, the closest match), `bug` (one line: what the app does wrong) and the Playwright code adapted to the code rules `start_here` gave you (relative URLs, `process.env.TEST_USER_EMAIL!` / `process.env.TEST_USER_PASSWORD!` for sign-in, signing in inline). It returns at once.
3. When all are saved, call `collect_verdicts`. For `reproduces`, keep the test and add its id to the report. For `test_problem`, fix it with `edit_test_code` and collect again (at most twice). For `passes`, the deployed app does not show the bug: say so in the report and delete that saved test with `delete_test`.
4. Amend the report commit with the test ids.

Unit-test findings are not uploaded (they need the repo, not a browser); they stay in the report.

## 6. Tell the user

Finish with a short summary in the chat: counts (proven / unproven, by severity), the top finding with its proof command, the branch name, the report path and, for linked projects, the saved test ids and that they can schedule them in the Validate.QA dashboard. If you ran on Opus, mention once that `--model fable` gives a deeper pass when their plan includes Fable.
