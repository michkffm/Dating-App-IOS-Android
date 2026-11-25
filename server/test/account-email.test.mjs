import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { setTimeout as wait } from "node:timers/promises";
import { createHash } from "node:crypto";
import { createApp } from "../app.mjs";
import { openDb, verifyProductionDbUrl } from "../db.mjs";
import { smtpAccountMail,brevoAccountMail,configureAccountMail } from "../account-mail.mjs";

test("production requires certificate verification for PostgreSQL",()=>{
  const fixture="postgresql://fixture:test@database.example.invalid/heartpulse";
  assert.throws(()=>verifyProductionDbUrl(fixture));
  assert.throws(()=>verifyProductionDbUrl(fixture+"?sslmode=require"));
  assert.throws(()=>verifyProductionDbUrl(fixture+"?sslmode=verify-full&sslmode=disable"));
  assert.equal(verifyProductionDbUrl(fixture+"?sslmode=verify-full"),fixture+"?sslmode=verify-full");
});

test("SMTP configuration fails safely without credentials or a trusted origin",()=>{
  assert.equal(smtpAccountMail({}),null);
  assert.throws(()=>smtpAccountMail({smtpUrl:"https://mail.example.invalid",from:"help@example.invalid",publicOrigin:"https://test.example.invalid"}));
  assert.throws(()=>smtpAccountMail({smtpUrl:"smtps://test:fixture@mail.example.invalid",from:"help@example.invalid",publicOrigin:"http://test.example.invalid",production:true}));
});

test("Brevo uses the fixed HTTPS endpoint and retains the code only in the link fragment",async()=>{
  const bodyToken="0".repeat(64);
  const calls=[];
  const credentials={apiKey:"example-fixture-not-a-secret",from:"heartpulse@example.invalid",publicOrigin:"https://test.example.invalid",production:true};
  const client=brevoAccountMail({...credentials,fetchFn:async (url, options)=>{
    calls.push({url,options}); return new Response(null,{status:201});
  }});
  await client.send({purpose:"verify",recipient:"recipient@example.invalid",token:bodyToken});
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,"https://api.brevo.com/v3/smtp/email");
  assert.equal(calls[0].options.redirect,"error");
  const request=JSON.parse(calls[0].options.body);
  assert.equal(request.to[0].email,"recipient@example.invalid");
  assert.match(request.textContent,/https:\/\/test\.example\.invalid\/live#verify=/);
  assert.ok(!request.textContent.includes(credentials.apiKey)&&!request.htmlContent);
  await assert.rejects(()=>client.send({purpose:"toString",recipient:"recipient@example.invalid",token:bodyToken}));
  assert.throws(()=>configureAccountMail({...credentials,brevoKey:credentials.apiKey,smtpUrl:"smtps://example.invalid"}));
  const offline=brevoAccountMail({...credentials,fetchFn:async()=>new Response("opaque",{status:429})});
  await assert.rejects(()=>offline.send({purpose:"reset",recipient:"recipient@example.invalid",token:bodyToken}),/not accepted/);
});

test("account email confirmation, expiry, password reset, replay, session revocation", {timeout:45000}, async(t)=>{
  const db=await openDb();
  const queued=[], errors=[];
  const app=createApp({db,dailyMailLimit:3,origins:["http://localhost:3407"],accountMail:{async send(mail){queued.push(mail);}},log:x=>errors.push(x)});
  const server=createServer(app.handler);
  await new Promise((resolve,reject)=>server.once("error",reject).listen(0,"127.0.0.1",resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await db.close();});
  const base="http://127.0.0.1:"+server.address().port;
  const email="fake@example.invalid";
  const initial="test passphrase only";
  const replacement="another example password";
  const profile={email,password:initial,nickname:"Fixture",birthdate:"1990-01-01"};
  const call=async(path,{body,method=body?"POST":"GET",status=200,cookie}={})=>{
    const res=await fetch(base+path,{method,headers:{origin:"http://localhost:3407",...(cookie?{cookie}:{}),...(body?{"content-type":"application/json"}:{})},body:body&&JSON.stringify(body)});
    assert.equal(res.status,status,path);
    return {json:res.status===204?null:await res.json(),cookie:res.headers.get("set-cookie")?.split(";")[0]||null};
  };
  async function until(count){
    for(let i=0;i<50;i++){if(queued.length>=count)return;await wait(20);}
    assert.fail("No test email observed");
  }
  await call("/healthz",{status:204});
  assert.equal(app.hasRecentAccountActivity(),false);
  assert.deepEqual((await call("/api/health")).json,{status:"ok",media:false,accountEmail:true,registration:true});
  const signup=await call("/api/register",{body:profile,status:202});
  assert.deepEqual(signup.json,{verificationRequired:true});
  assert.equal(signup.cookie,null);
  await until(1);
  assert.match(queued[0].token,/^[0-9a-f]{64}$/);
  assert.equal(queued[0].purpose,"verify");
  const hash=createHash("sha256").update(queued[0].token).digest("hex");
  const tokens=(await db.query("SELECT token_hash FROM hp_account_tokens")).rows;
  assert.deepEqual(tokens,[{token_hash:hash}]);
  await call("/api/login",{body:{email,password:initial},status:403});
  await call("/api/login",{body:{email,password:"wrong"},status:401});
  const unknown=await call("/api/resend-verification",{body:{email:"other@example.invalid"},status:202});
  const known=await call("/api/resend-verification",{body:{email},status:202});
  assert.deepEqual(known.json,unknown.json);
  await until(2);
  await db.query("UPDATE hp_account_tokens SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[hash]);
  await call("/api/verify-email",{body:{token:queued[0].token},status:400});
  await call("/api/verify-email",{body:{token:queued[1].token},status:204});
  await call("/api/verify-email",{body:{token:queued[1].token},status:400});
  const session=await call("/api/login",{body:{email,password:initial}});
  assert.ok(session.cookie);
  await call("/api/me",{cookie:session.cookie});
  assert.deepEqual(
    (await call("/api/forgot-password",{body:{email:"other@example.invalid"},status:202})).json,
    (await call("/api/forgot-password",{body:{email},status:202})).json
  );
  await until(3);
  assert.equal(queued[2].purpose,"reset");
  await call("/api/verify-email",{body:{token:queued[2].token},status:400});
  await call("/api/reset-password",{body:{token:queued[2].token,password:replacement},status:204});
  await call("/api/reset-password",{body:{token:queued[2].token,password:initial},status:400});
  await call("/api/me",{cookie:session.cookie,status:401});
  await call("/api/login",{body:{email,password:initial},status:401});
  assert.ok((await call("/api/login",{body:{email,password:replacement}})).cookie);
  await call("/api/forgot-password",{body:{email},status:202});
  await wait(150);
  assert.equal(queued.length,3);
  assert.equal((await db.query("SELECT count FROM hp_mail_daily_usage")).rows[0].count,3);
  assert.equal(app.hasRecentAccountActivity(),true);
  assert.deepEqual(errors,[]);
});
