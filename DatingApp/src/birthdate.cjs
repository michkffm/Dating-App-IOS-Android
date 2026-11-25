function normalizeBirthdate(input) {
  const value = input.trim();
  const local = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  const iso = local
    ? [local[3], local[2].padStart(2, "0"), local[1].padStart(2, "0")].join("-")
    : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(iso + "T00:00:00Z");
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}
function displayBirthdate(iso) {
  return iso.split("-").reverse().join(".");
}
function monthDays(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return { offset, count };
}

module.exports = { normalizeBirthdate, displayBirthdate, monthDays };
