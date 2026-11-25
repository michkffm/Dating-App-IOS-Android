import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../db.mjs";
import { createApp } from "../app.mjs";

test("database/API: identity, mutual matches, protected chat and photos, blocking, reports, deletion", {timeout:45000}, async (t) => {
  const db=await openDb();
  const objects=new Map(), cleaned=[];
  const fakeMedia={
    async put(id,bytes){objects.set(id,bytes);},
    async get(id){
      if(!objects.has(id)) return null;
      const bytes=objects.get(id);
      return new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}});
    },
    async remove(id){objects.delete(id);cleaned.push(id);}
  };
  const origin="http://127.0.0.1:3407", failures=[];
  const app=createApp({db,media:fakeMedia,origins:[origin],log:(msg)=>failures.push(msg)});
  const srv=createServer(app.handler);
  await new Promise((resolve,reject)=>srv.once("error",reject).listen(0,"127.0.0.1",resolve));
  t.after(async()=>{await new Promise(resolve=>srv.close(resolve));await db.close();});
  const address="http://127.0.0.1:"+srv.address().port;
  const pw="example password with spaces";
  const draft=(name)=>({email:name.toLowerCase()+"@example.invalid",password:pw,nickname:name,birthdate:"1995-03-12"});
  const call=async(path,{method="GET",data,cookie,native,token,type,requestOrigin=origin,expected=200}={})=>{
    const headers={...(requestOrigin?{origin:requestOrigin}:{}),...(cookie?{cookie}:{}),...(native?{"x-heartpulse-native":"1"}:{}),...(token?{authorization:"Bearer "+token}:{})};
    if(data!==undefined) headers["Content-Type"]=type||"application/json";
    const r=await fetch(address+path,{method,headers,body:data===undefined?undefined:type?data:JSON.stringify(data)});
    let value=null;
    if(r.headers.get("content-type")?.includes("application/json")) value=await r.json(); else if(r.status===200) value=Buffer.from(await r.arrayBuffer());
    assert.equal(r.status,expected,`${method} ${path} ${JSON.stringify(value)}`);
    return {r,value,cookie:r.headers.get("set-cookie")?.split(";")[0]};
  };
  assert.deepEqual((await call("/api/health")).value,{status:"ok",media:true});
  await call("/api/register",{method:"POST",data:draft("Anon"),requestOrigin:"https://elsewhere.invalid",expected:403});
  await call("/api/register",{method:"POST",data:{...draft("Minor"),birthdate:new Date().toISOString().slice(0,10)},expected:400});
  const ana=await call("/api/register",{method:"POST",data:draft("Ana"),expected:201});
  const bob=await call("/api/register",{method:"POST",data:draft("Bob"),expected:201});
  const zoe=await call("/api/register",{method:"POST",data:draft("Zoe"),expected:201});
  for(const person of [ana,bob,zoe]){
    assert.match(person.r.headers.get("set-cookie"),/HttpOnly; SameSite=Strict/);
    assert.deepEqual(Object.keys(person.value.user).sort(),["age","bio","id","nickname","photo"]);
    assert.equal(person.value.token,undefined);
  }
  const A=ana.value.user.id,B=bob.value.user.id;
  await call("/api/me",{expected:401});
  await call("/api/login",{method:"POST",data:{email:draft("Ana").email,password:"wrong"},expected:401});
  const native=await call("/api/login",{method:"POST",data:draft("Ana"),requestOrigin:null,native:true});
  assert.equal(native.cookie,undefined);
  assert.match(native.value.token,/^[a-f0-9]{64}$/);
  await call("/api/me",{requestOrigin:null,native:true,token:native.value.token});
  const patched=await call("/api/me",{cookie:ana.cookie,method:"PATCH",data:{nickname:"Ana",bio:"Berge & Musik"}});
  assert.equal(patched.value.user.bio,"Berge & Musik");
  const data=(await call("/api/discover",{cookie:ana.cookie})).value.profiles;
  assert.equal(data.find(u=>u.id===B).email,undefined);
  assert.equal(data.some(u=>u.id===A),false);
  assert.equal((await call("/api/decisions",{cookie:ana.cookie,method:"POST",data:{targetId:B,decision:"like"}})).value.matched,false);
  assert.equal((await call("/api/decisions",{cookie:bob.cookie,method:"POST",data:{targetId:A,decision:"like"}})).value.matched,true);
  const match=(await call("/api/matches",{cookie:ana.cookie})).value.matches[0];
  const msgPath="/api/matches/"+match.id+"/messages";
  await call(msgPath,{method:"POST",cookie:ana.cookie,data:{body:"Hallo Bob"},expected:201});
  assert.equal((await call(msgPath,{cookie:bob.cookie})).value.messages[0].body,"Hallo Bob");
  await call(msgPath,{cookie:zoe.cookie,expected:404});
  await call(msgPath,{method:"POST",cookie:zoe.cookie,data:{body:"No"},expected:404});
  await call("/api/photos",{method:"POST",cookie:ana.cookie,type:"text/plain",data:"bad",expected:415});
  const photo=(await call("/api/photos",{method:"POST",cookie:ana.cookie,type:"image/png",data:Buffer.from("test image")})).value.user.photo;
  assert.match(photo,/^\/api\/photos\//);
  assert.equal((await call(photo,{cookie:bob.cookie})).value.toString(),"test image");
  await call(photo,{expected:401});
  await call("/api/report",{cookie:bob.cookie,method:"POST",data:{targetId:A,reason:"Test-Meldegrund"},expected:204});
  assert.equal((await db.query("SELECT count(*) AS count FROM hp_reports")).rows[0].count,1);
  await call("/api/block",{cookie:bob.cookie,method:"POST",data:{targetId:A},expected:204});
  for(const person of [ana,bob]) {
    assert.deepEqual((await call("/api/matches",{cookie:person.cookie})).value.matches,[]);
    await call(msgPath,{cookie:person.cookie,expected:404});
  }
  const other=(await call("/api/discover",{cookie:bob.cookie})).value.profiles;
  assert.equal(other.some(u=>u.id===A),false);
  await call(photo,{cookie:bob.cookie,expected:404});
  await call("/api/decisions",{cookie:ana.cookie,method:"POST",data:{targetId:B,decision:"like"},expected:404});
  await call("/api/me",{cookie:ana.cookie,method:"DELETE",data:{password:"wrong"},expected:401});
  await call("/api/me",{cookie:ana.cookie,method:"DELETE",data:{password:pw},expected:204});
  await call("/api/me",{cookie:ana.cookie,expected:401});
  await call("/api/me",{native:true,requestOrigin:null,token:native.value.token,expected:401});
  await call(photo,{cookie:zoe.cookie,expected:404});
  await app.collectMedia();
  assert.equal(cleaned.length,1);
  assert.equal(objects.size,0);
  await call("/api/logout",{method:"POST",cookie:zoe.cookie,expected:204});
  await call("/api/me",{cookie:zoe.cookie,expected:401});
  assert.deepEqual(failures,[]);
});

test("persistent local PostgreSQL survives reopening", {timeout:45000}, async()=>{
  const dir=await mkdtemp(join(tmpdir(),"heartpulse-test-"));
  try {
    let db=await openDb({dir});
    const id="2e089047-ac74-4b78-98ff-51635373a501";
    await db.query("INSERT INTO hp_users(id,email,password_hash,nickname,birthdate) VALUES($1,$2,$3,$4,$5)",[id,"dummy@example.invalid","fixture only","Dummy","1991-01-01"]);
    await db.close();
    db=await openDb({dir});
    try { assert.equal((await db.query("SELECT nickname FROM hp_users WHERE id=$1",[id])).rows[0].nickname,"Dummy"); }
    finally { await db.close(); }
  } finally {await rm(dir,{recursive:true,force:true});}
});
