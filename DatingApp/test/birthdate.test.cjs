const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeBirthdate, displayBirthdate, monthDays } = require("../src/birthdate.cjs");

test("accepts German and ISO birthdates without a timezone shift", () => {
  assert.equal(normalizeBirthdate(" 4.2.1990 "), "1990-02-04");
  assert.equal(normalizeBirthdate("2000-02-29"), "2000-02-29");
  assert.equal(displayBirthdate("2000-02-29"), "29.02.2000");
});
test("rejects impossible dates or incomplete inputs", () => {
  for (const value of ["31.04.1998", "29.02.1900", "2001-02-29", "32.02.1998", "1998/04/23", "23.04.", ""]) {
    assert.equal(normalizeBirthdate(value), null, value);
  }
});
test("calendar starts on Monday and honors leap years", () => {
  assert.deepEqual(monthDays(2024, 1), {offset:3,count:29});
  assert.deepEqual(monthDays(2021, 1), {offset:0,count:28});
});
