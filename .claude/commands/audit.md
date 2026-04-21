# /audit — Compile Context + Full Quality Gate

Runs the complete pre-ship audit for USA Spending Watch.

## Current Project State (live at invocation)

```
$(!node tools/compile-context.mjs 2>&1 | tail -3)
```

**Bootstrap.json last line:**
```
$(!tail -c 200 frontend/data/bootstrap.json 2>/dev/null | grep -o '"generatedAt":"[^"]*"' || echo "not found")
```

**Git status:**
```
$(!git status --short 2>/dev/null | head -20 || echo "not a git repo")
```

**Uncommitted docs/ingest files:**
```
$(!git status --short tools/ingest/ docs/ .github/ 2>/dev/null | head -10 || echo "none")
```

---

## Steps to run

### 1. JS syntax check
```bash
node --check frontend/assets/js/app.js && node --check frontend/assets/js/map.js && node --check tools/generate-nevada-demo.mjs && echo "JS OK"
```

### 2. Rust gate
```bash
cargo fmt --check --all && cargo clippy --workspace --all-targets --all-features -- -D warnings && cargo test --workspace
```
Fix any clippy errors before proceeding. Do not `#[allow(...)]` without a comment explaining why.

### 3. Data validation
```bash
cargo run -q -p spending-validate -- frontend/data/bootstrap.json
```
Hard gate — if this fails, do not commit.

### 4. Backend audit
```bash
pnpm --dir backend audit --prod
```
Flag critical/high CVEs. Low/info are informational.

### 5. Refresh context doc
```bash
node tools/compile-context.mjs
```
Read `docs/PROJECT_CONTEXT.md` and surface any new TODOs or status changes.

---

## Output format

After all steps, report:

```
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED

Quality gate:  ✅ pass | ❌ fail
Data sources:  X live, X verify, X pending
Open TODOs:    X
Bootstrap:     generated YYYY-MM-DD

Concerns (if any):
- ...

Next steps:
- ...
```

## When to run
- Before any commit to main
- Before `pnpm deploy:pages`
- After adding a new data source connector
- After changing `tools/generate-nevada-demo.mjs` or `bootstrap.json`
