const { test } = require("node:test");
const assert = require("node:assert/strict");
const { empty, nickname, parseState, decide, matches } = require("../src/demo.cjs");

test("invalid and unknown versions fall back to a fresh demo", () => {
  for (const input of [null, "broken", '{"version":2,"nickname":"old"}']) assert.deepEqual(parseState(input), empty());
});
test("storage only restores a bounded nickname and recognized decisions", () => {
  assert.deepEqual(parseState('{"version":1,"nickname":" Wave ","decisions":{"gina":"like","sam":true,"unknown":"like","__proto__":"like"},"email":"discard"}'),
    { nickname: "Wave", decisions: { gina: "like" } });
  assert.equal(nickname("X".repeat(100)).length, 24);
});
test("choices advance without duplicate writes or unknown profiles", () => {
  const initial = empty();
  assert.equal(decide(initial, "unknown", "like"), initial);
  assert.equal(decide(initial, "gina", "other"), initial);
  const next = decide(initial, "gina", "pass");
  assert.equal(decide(next, "gina", "like"), next);
  assert.deepEqual(initial.decisions, {});
});
test("only liked profiles with reciprocated demo likes are matches", () => {
  let state = decide(empty(), "gina", "like");
  state = decide(state, "alex", "like");
  state = decide(state, "sam", "pass");
  assert.deepEqual(matches(state).map(({ id }) => id), ["gina"]);
});
