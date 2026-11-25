const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
// Build with EXPO_PUBLIC_LIVE_ENABLED=true. Then run with a local
// Playwright installation and Chrome (or run playwright install chromium):
// node test/live-browser.cjs /absolute/path/to/web-export
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright");
if (!process.argv[2]) throw new Error("Pass the Expo web export directory.");
const root = path.resolve(process.argv[2]);
(async () => {
  const server = http.createServer((req,res) => {
    const pathname = new URL(req.url,"http://localhost").pathname;
    let f = path.resolve(root, "." + pathname);
    if (pathname === "/" || ["/live", "/home", "/profile", "/matches", "/welcome"].includes(pathname)) f = root+"/index.html";
    if (!f.startsWith(root+"/") || !fs.existsSync(f) || !fs.statSync(f).isFile()) {res.writeHead(404);res.end();return;}
    const types={".html":"text/html; charset=utf-8",".js":"application/javascript",".png":"image/png",".ttf":"font/ttf",".ico":"image/x-icon"};
    res.setHeader("Content-Type", types[path.extname(f)]||"application/octet-stream");
    res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'");
    fs.createReadStream(f).pipe(res);
  });
  let browser;
  try {
    await new Promise((ok,err) => server.on('error',err).listen(0,"127.0.0.1",ok));
    const base="http://127.0.0.1:"+server.address().port;
    browser=await chromium.launch({...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),chromiumSandbox:true,headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    page.setDefaultTimeout(5000);
    const errors=[];const requests=[];
    page.on("pageerror", e=>errors.push(String(e)));
    await page.route(/^https?:\/\//, route => {
      if(!route.request().url().startsWith(base+"/")) {errors.push("external request");return route.abort();}
      return route.fallback();
    });
    const user={id:"u1",nickname:"Probekonto",age:29,bio:"",photo:null};
    const partner={id:"u2",nickname:"Testpartner",age:31,bio:"Nur Test",photo:null};
    const match={id:"m1",user:partner}; const messages=[];
    let logged=false, liked=false, blocked=false, reported=false, deleted=false;
    await page.route("**/api/**",async route=>{
      const req=route.request(), url=new URL(req.url()), method=req.method(), p=url.pathname;
      assert.equal(url.origin,base);
      assert.equal(req.headers()["x-heartpulse-native"],undefined);
      assert.equal(req.headers().authorization,undefined);
      requests.push(method+" "+p);
      const body=()=>req.postDataJSON();
      const send=(data,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});
      if(p==="/api/health")return send({status:"ok",media:true});
      if(p==="/api/register"){
        assert.deepEqual(body(),{email:"tester@example.test",password:"Password.12345",nickname:"Probekonto",birthdate:"1995-04-12"}); logged=true; return send({user},201);
      }
      if(p==="/api/login"){
        assert.deepEqual(body(),{email:"tester@example.test",password:"Password.12345"}); logged=true; return send({user});
      }
      if(!logged)return send({},401);
      if(p==="/api/me" && method==="GET")return send({user});
      if(p==="/api/me" && method==="PATCH"){Object.assign(user,body());return send({user});}
      if(p==="/api/me" && method==="DELETE"){
        assert.equal(body().password,"Password.12345"); deleted=true; logged=false;return send({ok:true});
      }
      if(p==="/api/discover")return send({profiles:liked||blocked?[]:[partner]});
      if(p==="/api/decisions"){
        assert.deepEqual(body(),{targetId:"u2",decision:"like"});liked=true;return send({matched:true});
      }
      if(p==="/api/matches")return send({matches:liked&&!blocked?[match]:[]});
      if(p==="/api/matches/m1/messages"&&method==="GET")return send({messages});
      if(p==="/api/matches/m1/messages"&&method==="POST"){
        const message={id:"msg1",senderId:"u1",body:body().body,createdAt:"2026-11-25T22:00:00Z"};
        messages.push(message);return send({message},201);
      }
      if(p==="/api/report"){assert.equal(body().targetId,"u2");assert.equal(body().reason,"Nur ein Test");reported=true;return send({ok:true});}
      if(p==="/api/block"){assert.equal(body().targetId,"u2");blocked=true;return send({ok:true});}
      if(p==="/api/photos"&&method==="POST"){
        assert.equal(req.headers()["content-type"],"image/png");assert.ok(req.postDataBuffer().length>8);user.photo="/api/photos/test-photo";return send({user});
      }
      if(p==="/api/photos/test-photo") return route.fulfill({status:200,contentType:"image/png",body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aNwAAAAASUVORK5CYII=","base64")});
      if(p==="/api/logout"){logged=false;return send({ok:true});}
      throw Error("Unexpected API request:"+method+" "+p);
    });
    const btn=(name)=>page.getByRole("button",{name,exact:true});
    const loc=(name)=>page.getByLabel(name,{exact:true});
    const shown=(value)=>page.getByText(value,{exact:true}).first().waitFor();
    await page.goto(base);
    await btn("Zur Anmeldung").click();
    await btn("Konto erstellen").click();
    await loc("E-Mail-Adresse").fill("tester@example.test");
    await loc("Passwort").fill("Password.12345");
    await loc("Spitzname").fill("Probekonto");
    await loc("Geburtsdatum (JJJJ-MM-TT)").fill("1995-04-12");
    await btn("Registrieren").click();
    await shown("Testpartner, 31");
    await btn("Gefällt mir").click();
    await shown("Sie haben ein Match!");
    await btn("Matches").click();
    await btn("Chat mit Testpartner").click();
    await loc("Nachricht").fill("Hallo vom Browsertest");
    await btn("Senden").click();
    await shown("Hallo vom Browsertest");
    await btn("Profil melden").click();
    await loc("Grund für die Meldung").fill("Nur ein Test");
    await btn("Meldung abschicken").click();
    await shown("Meldung gesendet.");
    await btn("Profil blockieren").click();
    await btn("Jetzt blockieren").click();
    await shown("Profil blockiert.");
    await shown("Noch keine Matches.");
    await btn("Mein Profil").click();
    await loc("Über mich").fill("Bio vom Browsertest");
    await btn("Profil speichern").click();
    await shown("Profil gespeichert.");
    await shown("Bio vom Browsertest");
    const chooser=page.waitForEvent("filechooser");
    await btn("Profilfoto auswählen").click();
    await (await chooser).setFiles({name:"test.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aNwAAAAASUVORK5CYII=","base64")});
    await shown("Profilfoto gespeichert.");
    await page.getByLabel("Profilfoto von Probekonto", { exact: true }).waitFor();
    assert.ok(requests.includes("GET /api/photos/test-photo"));
    await btn("Abmelden").click();
    await shown("Bei HeartPulse anmelden");
    await loc("E-Mail-Adresse").fill("tester@example.test");
    await loc("Passwort").fill("Password.12345");
    await btn("Anmelden").click();
    await btn("Mein Profil").click();
    await btn("Konto löschen").click();
    await loc("Passwort zur Löschung").fill("Password.12345");
    await btn("Konto endgültig löschen").click();
    await shown("Ihr Konto wurde gelöscht.");
    assert.deepEqual(errors,[]);
    assert.ok(reported&&blocked&&deleted);
    console.log("PASS Browser with an API-contract fixture:",requests.length,"requests, register/login, matches/chat, reporting/blocking, update/photos, login/logout/delete, no off-site requests");
  } finally { if(browser)await browser.close();server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
