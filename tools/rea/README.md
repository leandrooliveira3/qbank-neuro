# REA analysis tooling

Pinned development-only integration of [morluto/rea](https://github.com/morluto/rea), npm package `rea-agents@6.5.0` (MIT). Repository revision reviewed: `4f7b5fb6023ce2ec449561782d09e3c7e5ac7c7b`. README, package manifest, full upstream skill and JavaScript/artifact workflow guides were read. Node requirements follow the pinned package (22.19+ or 24.11+).

```bash
npm ci --prefix tools/rea --ignore-scripts
node tools/rea/analyze.mjs /absolute/path/to/compiled/application /absolute/path/to/new/report
```

The wrapper invokes static `analyze-javascript-application --format json`, records evidence and stderr separately, and never runs the target. `NEURO_REA_CLI` can point to an isolated installation's `scripts/rea.mjs`. No frontend dependency, global MCP registration, or `rea setup` is required. Full reports stay outside the repository. Read complete source repositories through ordinary source searches; use REA for shipped artifacts whose source is unavailable or insufficient.

For an explicitly supplied archive, the CLI also supports `rea inspect-artifact /absolute/path/to/archive --format json`. This inventories archive relationships; it does not recover application semantics, prove behavior, or validate medical/device physics. See the bounded audit in `docs/neuro3d-rea-integration.md`.

Environment check: archive/file inventory succeeded here. Semantic application analysis was blocked by REA process-ownership inspection because procps could not inspect itself in this runtime; the wrapper recorded exit code 1. See the integration audit for the precise boundary. Do not bypass that provider check or interpret an inventory as a semantic graph.
