function isAccountToken(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

// Only read a single, unencoded, recognized fragment. Query parameters are
// deliberately not accepted since they appear in requests and server logs.
function consumeAccountFragment(location, history) {
  if (!location || !history || !/^\/live\/?$/.test(location.pathname)) return null;
  const hash = location.hash;
  const action = /^#(verify|reset)(?:=|$)/.exec(hash);
  if (!action) return null;
  history.replaceState(history.state, "", location.pathname + location.search);
  const value = hash.slice(action[1].length + 2);
  return { kind: action[1], token: isAccountToken(value) ? value.toLowerCase() : "" };
}

let started = false;
let pending = null;
let subscriber = null;

function startAccountLinks(browser) {
  if (started) return;
  started = true;
  function receive(event) {
    try {
      const entry = consumeAccountFragment(browser.location, browser.history);
      if (!entry) return;
      // Do not let the router turn this consumed input back into a URL.
      if (subscriber) {
        event?.stopImmediatePropagation();
        subscriber(entry);
      } else {
        pending = entry;
        browser.setTimeout(() => { if (pending === entry) pending = null; }, 15000);
      }
    } catch {
      // Never keep a token when we couldn't remove it from the URL.
      pending = null;
    }
  }
  receive();
  // Browsers can fire popstate first for a same-document fragment navigation.
  browser.addEventListener("popstate", receive, true);
  browser.addEventListener("hashchange", receive, true);
}

function subscribeToAccountLinks(callback) {
  subscriber = callback;
  if (pending) {
    const entry = pending;
    pending = null;
    callback(entry);
  }
  return () => {
    if (subscriber === callback) subscriber = null;
  };
}

module.exports = { isAccountToken, consumeAccountFragment, startAccountLinks, subscribeToAccountLinks };
