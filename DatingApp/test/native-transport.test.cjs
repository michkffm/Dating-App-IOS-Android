const assert = require("node:assert/strict");
const { test } = require("node:test");
const { transportHeaders } = require("../src/native-transport.cjs");

test("browser uses cookies and never claims to be a native client", () => {
  assert.deepEqual(transportHeaders(true, "fixture-only"), {});
  assert.deepEqual(transportHeaders(true), {});
});
test("every native API and image request identifies its transport", () => {
  assert.deepEqual(transportHeaders(false), { "X-HeartPulse-Native": "1" });
  assert.deepEqual(transportHeaders(false, "fixture-only"), {
    "X-HeartPulse-Native": "1",
    Authorization: "Bearer fixture-only"
  });
});
