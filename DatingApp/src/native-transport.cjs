function transportHeaders(web, token) {
  if (web) return {};
  return {
    "X-HeartPulse-Native": "1",
    ...(token ? { Authorization: "Bearer " + token } : {})
  };
}
module.exports = { transportHeaders };
