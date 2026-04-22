import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

test("BSS-38: Pre-flight script rejects missing environment", () => {
  try {
    // Run preflight without necessary env vars
    execSync("bash scripts/preflight.sh true", { 
      env: { ...process.env, RPC_ENDPOINT: "" },
      stdio: 'pipe' 
    });
    assert.fail("Should have exited with error");
  } catch (err: any) {
    assert.equal(err.status, 1);
    assert.match(err.stderr.toString(), /Missing critical environment variable/);
  }
});

test("BSS-38: Pre-flight script rejects port collision", () => {
  try {
    // Run preflight with conflicting ports
    execSync("bash scripts/preflight.sh true", { 
      env: { ...process.env, PORT: "4000", INTERNAL_BRIDGE_PORT: "4000" },
      stdio: 'pipe' 
    });
    assert.fail("Should have exited with error");
  } catch (err: any) {
    assert.equal(err.status, 1);
    assert.match(err.stderr.toString(), /Port conflict detected/);
  }
});

test("BSS-37: Dockerfile multi-stage existence", () => {
  const fs = require('fs');
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  
  assert.ok(dockerfile.includes("FROM rust"), "Missing Rust stage");
  assert.ok(dockerfile.includes("FROM node"), "Missing Node stage");
  assert.ok(dockerfile.includes("COPY --from=rust-builder"), "Missing Rust binary copy");
  assert.ok(dockerfile.includes("ENTRYPOINT"), "Missing pre-flight entrypoint");
});