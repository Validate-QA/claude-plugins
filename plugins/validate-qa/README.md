# Validate.QA plugin for Claude Code

Connects Claude Code to [Validate.QA](https://validate.qa): AI-generated browser tests for your app, run in the cloud, with Claude able to set them up, run the ones your change affects, and triage failures.

## Install

```
/plugin marketplace add Validate-QA/claude-plugins
/plugin install validate-qa@validate-qa-plugins
```

Then run `/mcp`, select `validate-qa` and sign in. You pick one Validate.QA project on the consent screen; Claude is scoped to it. No token is copied anywhere.

## What you get

| | |
|---|---|
| `/validate-qa:vq-setup` (`/vq-setup`) | Connect this app, map its features with discovery, generate and verify the first tests. |
| `/vq-test [feature]` | Run the Validate.QA tests that cover your latest change and read the failures. |
| `/vq-status` | Read-only: tests, pass rate, runner, failing features. |
| skills `setup`, `test-after-change`, `triage` | What the commands call; Claude also uses them on its own when the request fits. |
| skill `review` | The free whole-repo QA review (`/validate-qa:review`): finds and proves user-facing bugs, writes `VALIDATE-QA-REVIEW.md` on a new branch. |
| MCP server `validate-qa` | The hosted Validate.QA MCP server (about 60 tools) over OAuth. |

Nothing runs on its own: there are no hooks unless you add the optional one below.

## Plans

The hosted MCP server and the skills are free (MCP Army: bring your own AI; Claude writes and edits tests through the tools). Tools that run Validate.QA's own AI, such as discovery, test generation and `heal_test`, need the Solo Dev plan and return `PLAN_FEATURE_LOCKED` until then. Pricing: https://validate.qa/pricing.

## Fallback: stdio instead of OAuth

If your host cannot open a browser for OAuth, use a personal access token with the stdio package. Run `npx @validate.qa/mcp init` in your project (it writes the config), or add it yourself to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "validate-qa-stdio": {
      "command": "npx",
      "args": ["-y", "@validate.qa/mcp@latest"],
      "env": {
        "VALIDATEQA_API_URL": "https://shared.validate.qa",
        "VALIDATEQA_TOKEN": "pat_...",
        "VALIDATEQA_PROJECT_ID": "<project id>"
      }
    }
  }
}
```

Create the `pat_` token in your Validate.QA profile. Keep it out of git (put it in your shell environment and reference `${VALIDATEQA_TOKEN}` instead of pasting it). Disable the plugin's OAuth server with `/mcp` if you use this, so Claude has one connection, not two.

## Optional hook: remind Claude to run the tests

Off by default. `examples/vq-stop-hook.mjs` is a `Stop` hook: when Claude finishes a turn with uncommitted changes to app files (not docs), it asks Claude once per set of changes to run `/vq-test`. To turn it on, copy it into your project:

```
mkdir -p .claude && cp <plugin dir>/examples/vq-stop-hook.mjs .claude/
```

and merge `examples/hooks.settings.json` into `.claude/settings.json`. Remove the entry to turn it off.

## Links

Docs: https://validate.qa/docs/claude-code · Privacy: https://validate.qa/privacy · Terms: https://validate.qa/terms
