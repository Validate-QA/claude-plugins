# Validate.QA plugins for Claude Code

```
/plugin marketplace add Validate-QA/claude-plugins
/plugin install validate-qa@validate-qa-plugins
```

Then run `/mcp`, select `validate-qa` and sign in.

| Plugin | What it does |
|---|---|
| [`validate-qa`](plugins/validate-qa) | Connects Claude Code to [Validate.QA](https://validate.qa): set up AI-generated browser tests (`/vq-setup`), run the ones your change affects (`/vq-test`), check status (`/vq-status`), triage failures, and the free whole-repo QA review. |

Docs: https://validate.qa/docs/claude-code · Privacy: https://validate.qa/privacy · Terms: https://validate.qa/terms

The plugin sources are maintained in the Validate.QA product repository and copied here on each release. Report problems through https://validate.qa.
