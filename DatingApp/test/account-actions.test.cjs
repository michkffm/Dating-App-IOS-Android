const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isAccountToken, consumeAccountFragment } = require("../src/account-actions.cjs");

const token = "a1".repeat(32);
function tryUrl(value) {
  const state = { navigation: true };
  const calls = [];
  const history = { state, replaceState: (...args) => calls.push(args) };
  return { result: consumeAccountFragment(new URL(value, "https://example.test"), history), calls };
}

test("extracts and immediately strips valid verification and reset fragments", () => {
  for (const kind of ["verify", "reset"]) {
    const { result, calls } = tryUrl("/live?theme=pale#" + kind + "=" + token.toUpperCase());
    assert.deepEqual(result, { kind, token });
    assert.deepEqual(calls, [[{ navigation: true }, "", "/live?theme=pale"]]);
  }
});

test("malformed and repeated tokens are not accepted and recognized hashes are stripped", () => {
  for (const input of ["#verify", "#verify=abcd", "#reset=" + token + "&reset=" + token, "#reset=%61" + token]) {
    const { result, calls } = tryUrl("/live" + input);
    assert.equal(result.token, "");
    assert.equal(calls.length, 1);
    assert.equal(calls[0][2], "/live");
  }
});

test("does not consume query parameters, unrelated fragments or other paths", () => {
  for (const input of ["/live?verify=" + token, "/live#ignored=" + token, "/#verify=" + token, "/else#reset=" + token]) {
    const { result, calls } = tryUrl(input);
    assert.equal(result, null);
    assert.deepEqual(calls, []);
  }
});

test("manual code must be exactly 64 ASCII hex characters", () => {
  assert.equal(isAccountToken(token), true);
  assert.equal(isAccountToken("z".repeat(64)), false);
  assert.equal(isAccountToken(" " + token), false);
  assert.equal(isAccountToken(token.slice(1)), false);
});
