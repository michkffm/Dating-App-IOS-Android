// Export first with EXPO_PUBLIC_LIVE_ENABLED=true. This optional browser test
// uses Playwright (or PLAYWRIGHT_CORE_PATH) and only a local protocol fixture.
const assert = require("node:assert/strict");
const { readFileSync, existsSync, statSync } = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright");

async function main() {
  assert.ok(process.argv[2], "Pass the Expo web export directory.");
  const root = path.resolve(process.argv[2]);
  const mediaTypes = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".ico": "image/x-icon", ".ttf": "font/ttf" };
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const file = ["/", "/live"].includes(pathname) ? path.join(root, "index.html") : path.resolve(root, "." + pathname);
    if (!file.startsWith(root + "/") || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", mediaTypes[path.extname(file)] || "application/octet-stream");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'");
    res.end(readFileSync(file));
  });
  let browser;
  try {
    await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
    const origin = "http://127.0.0.1:" + server.address().port;
    browser = await chromium.launch({
      ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
      chromiumSandbox: true, headless: true,
    });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(8000);
    const errors = [], observed = [];
    const email = "test@example.test", person = { id: "profile-id", nickname: "Testprofil", age: 30, bio: "", photo: null };
    const verify = "a1".repeat(32), reset = "b2".repeat(32), manual = "c3".repeat(32), expired = "d4".repeat(32);
    const initial = "Passwort.testkonto.123", changed = "Geaendertes.Testpasswort.789";
    let registered = false, verified = false, loggedIn = false, currentPassword = initial;
    page.on("pageerror", error => errors.push(String(error)));
    await page.route(/^https?:\/\//, async route => {
      const request = route.request();
      const url = new URL(request.url());
      assert.equal(url.origin, origin);
      for (const token of [verify, reset, manual, expired]) {
        assert.ok(!request.url().includes(token));
        assert.ok(!Object.values(request.headers()).some(value => value.includes(token)));
      }
      if (!url.pathname.startsWith("/api/")) return route.continue();
      const key = request.method() + " " + url.pathname;
      observed.push(key);
      const data = () => request.postDataJSON();
      const json = (body, status = 200) => route.fulfill({ status, json: body });
      switch (key) {
        case "GET /api/health": return json({ status: "ok", media: false, accountEmail: true, registration: true });
        case "GET /api/me": return loggedIn ? json({ user: person }) : json({}, 401);
        case "POST /api/register":
          assert.equal(data().email, email); assert.equal(data().password, initial); assert.equal(data().birthdate, "1995-04-12");
          registered = true; return json({ verificationRequired: true }, 202);
        case "POST /api/resend-verification":
        case "POST /api/forgot-password":
          assert.equal(data().email, email); return json({}, 202);
        case "POST /api/verify-email":
          assert.equal(data().password, initial);
          if (data().token === expired) return json({ error: "Der Link ist abgelaufen oder ungültig." }, 400);
          assert.ok(registered); assert.ok([verify, manual].includes(data().token));
          verified = true; return route.fulfill({ status: 204 });
        case "POST /api/reset-password":
          assert.equal(data().token, reset); assert.equal(data().password, changed);
          currentPassword = changed; loggedIn = false; return route.fulfill({ status: 204 });
        case "POST /api/login":
          assert.equal(data().email, email);
          if (data().password !== currentPassword) return json({}, 401);
          if (!verified) return json({}, 403);
          loggedIn = true; return json({ user: person });
        case "GET /api/discover": return json({ profiles: [] });
        default: throw Error("Unexpected route: " + key);
      }
    });

    const button = name => page.getByRole("button", { name, exact: true });
    const fill = (name, value) => page.getByLabel(name, { exact: true }).fill(value);
    const shown = value => page.getByText(value, { exact: true }).first().waitFor();
    const login = async password => {
      await fill("E-Mail-Adresse", email);
      await fill("Passwort", password);
      await button("Anmelden").click();
    };
    async function emailLink(kind, value, heading) {
      await page.goto(origin + "/live#" + kind + "=" + value);
      await shown(heading);
      assert.equal(await page.evaluate(() => window.location.hash), "");
      assert.ok(!(await page.evaluate(() => JSON.stringify(history.state) || "")).includes(value));
    }

    await page.goto(origin + "/live");
    await shown("Bei HeartPulse anmelden");
    assert.deepEqual(await page.getByRole("button").allTextContents(), ["Anmelden", "Passwort vergessen", "Konto erstellen"]);
    await button("Konto erstellen").click();
    await fill("E-Mail-Adresse", email);
    await fill("Passwort", initial);
    await fill("Nickname", "Testprofil");
    await fill("Geburtsdatum (TT.MM.JJJJ)", "12.04.1995");
    await button("Registrieren").click();
    await shown("E-Mail-Adresse bestätigen");
    await shown("Bestätigung angefordert. Wenn die Registrierung möglich ist, erhalten Sie einen Bestätigungslink per E-Mail.");
    await button("Bestätigungslink erneut senden").click();
    await shown("Wenn eine Bestätigung aussteht, erhalten Sie einen neuen Link per E-Mail.");
    await button("Zum Login").click();
    await login(initial);
    await shown("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.");

    await emailLink("verify", expired, "E-Mail-Bestätigung abschließen");
    await fill("Passwort aus der Registrierung", initial);
    await button("E-Mail-Adresse jetzt bestätigen").click();
    await shown("Der Link oder Code ist ungültig oder abgelaufen. Sie können einen neuen anfordern.");

    await button("Neuen Link anfordern").click();
    await button("Code eingeben").click();
    await fill("Code aus dem Link", manual);
    await fill("Passwort aus der Registrierung", initial);
    await button("E-Mail-Adresse jetzt bestätigen").click();
    await shown("Ihre E-Mail-Adresse wurde bestätigt. Sie können sich jetzt anmelden.");
    assert.equal(await button("E-Mail-Bestätigung öffnen").count(), 0);
    await emailLink("verify", verify, "E-Mail-Bestätigung abschließen");
    await fill("Passwort aus der Registrierung", initial);
    await button("E-Mail-Adresse jetzt bestätigen").click();
    await shown("Ihre E-Mail-Adresse wurde bestätigt. Sie können sich jetzt anmelden.");

    await button("Passwort vergessen").click();
    await fill("E-Mail-Adresse", email);
    await button("Link zum Zurücksetzen anfordern").click();
    await shown("Wenn diese Adresse zu einem Konto gehört, erhalten Sie einen Link per E-Mail.");

    // Navigate from another document to also exercise a cold email-link load.
    await page.goto("about:blank");
    await emailLink("reset", reset, "Neues Passwort setzen");
    await fill("Neues Passwort (mindestens 12 Zeichen)", changed);
    await button("Neues Passwort speichern").click();
    await shown("Ihr Passwort wurde geändert. Melden Sie sich mit dem neuen Passwort an.");
    await login(initial);
    await shown("Die Anmeldung ist fehlgeschlagen oder abgelaufen.");
    await login(changed);
    await button("Mein Profil").waitFor();

    for (const endpoint of ["resend-verification", "forgot-password", "verify-email", "reset-password"]) assert.ok(observed.includes("POST /api/" + endpoint));
    assert.deepEqual(errors, []);
    console.log("PASS email-account browser fixture:", observed.length, "requests, generic resend/reset, unverified login, fragment clearing, expired recovery, manual code, password reset and login");
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
