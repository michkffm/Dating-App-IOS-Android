import { createHash, randomBytes, randomUUID, timingSafeEqual, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const scrypt = promisify(scryptCb);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const ids = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const publicFields = "id, nickname, birthdate::text AS birthdate, bio, photo_id";
const ageOn = (birthdate, today = new Date().toISOString().slice(0,10)) => {
  const years = Number(today.slice(0,4)) - Number(birthdate.slice(0,4));
  return years - Number(today.slice(5) < birthdate.slice(5));
};
const publicUser = (row) => ({ id:row.id, nickname:row.nickname, age:ageOn(row.birthdate), bio:row.bio, photo:row.photo_id?"/api/photos/"+row.photo_id:null });
const rows = async (db, sql, values = []) => (await db.query(sql,values)).rows;
const one = async (db, sql, values) => (await rows(db,sql,values))[0];
const blockExists = "EXISTS(SELECT 1 FROM hp_blocks b WHERE (b.actor=$1 AND b.target=$2) OR (b.actor=$2 AND b.target=$1))";
class Problem extends Error { constructor(status, text) { super(text); this.status = status; } }
const deny = (status,msg) => { throw new Problem(status,msg); };
const field = (value,min,max,msg) => {
  if(typeof value!=="string" || value.trim().length<min || value.trim().length>max || value.includes("\0")) deny(400,msg);
  return value.trim();
};
const uuid = (value) => {
  if (typeof value!=="string" || !ids.test(value)) deny(400,"Ungültige ID.");
  return value;
};
const normalizeMail = (value) => {
  const mail=field(value,5,254,"Ungültige E-Mail-Adresse.").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) deny(400,"Ungültige E-Mail-Adresse.");
  return mail;
};
let activePasswordChecks = 0;
async function hashPassword(value, salt = randomBytes(16).toString("hex")) {
  if(activePasswordChecks>=3) deny(429,"Bitte später erneut versuchen.");
  activePasswordChecks++;
  try {
    const hash=await scrypt(value,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});
    return salt+":"+Buffer.from(hash).toString("hex");
  } finally { activePasswordChecks--; }
}
const DUMMY = "0".repeat(32)+":"+"0".repeat(128);
async function passwordOk(value, existing) {
  if(typeof value!=="string" || value.length>128) return false;
  const encoded=existing||DUMMY;
  const computed=await hashPassword(value,encoded.split(":")[0]);
  return timingSafeEqual(Buffer.from(computed),Buffer.from(encoded)) && !!existing;
}
function dob(value){
  if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) deny(400,"Bitte ein gültiges Geburtsdatum eingeben.");
  const parsed = new Date(value+"T00:00:00Z");
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0,10)!==value) deny(400,"Bitte ein gültiges Geburtsdatum eingeben.");
  const age=ageOn(value);
  if (age<18 || age>120) deny(400,"HeartPulse ist nur für Erwachsene ab 18.");
  return value;
}
async function body(req,limit){
  if(Number(req.headers["content-length"])>limit) deny(413,"Datei oder Anfrage ist zu groß.");
  if(req.headers["content-encoding"]) deny(415,"Komprimierte Anfragen sind nicht zulässig.");
  const pieces=[]; let length=0;
  for await(const chunk of req){length+=chunk.length; if(length>limit) deny(413,"Datei oder Anfrage ist zu groß."); pieces.push(chunk);}
  return Buffer.concat(pieces,length);
}
async function json(req){
  if(req.headers["content-type"]?.split(";")[0]!=="application/json") deny(415,"JSON erwartet.");
  let value;
  try { value=JSON.parse((await body(req,8192)).toString("utf8")); } catch(e) { if(e instanceof Problem) throw e; deny(400,"Ungültiges JSON."); }
  if(!value || typeof value!=="object" || Array.isArray(value)) deny(400,"Ungültiges JSON.");
  return value;
}
function send(res, status, value){
  if(value===undefined){res.writeHead(status);res.end();return;}
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.writeHead(status);
  res.end(JSON.stringify(value));
}
const invalidLink="Der Link ist abgelaufen oder ungültig.";
function requirePassword(value){
  if(typeof value!=="string" || value.length<12 || value.length>128) deny(400,"Passwort muss 12 bis 128 Zeichen haben.");
  return value;
}
const badAuth = "E-Mail-Adresse oder Passwort ist falsch.";
const noTarget = "Profil nicht verfügbar.";
function cookie(name, value, production, maxAge) {
  return name+"="+value+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+maxAge+(production?"; Secure":"");
}
export function createApp({db, media=null, accountMail=null, dailyMailLimit=100, origins=[], production=false, registration=!production, staticHandler, log=console.error}){
  if(!Number.isInteger(dailyMailLimit)||dailyMailLimit<1||dailyMailLimit>300) throw new Error("Invalid daily account mail limit");
  const allowed=new Set(origins);
  let lastAccountActivity=0;
  const cookieName=production?"__Host-heartpulse":"heartpulse_local";
  const limiters=new Map();
  let pendingMail=0;
  function scheduleAccountMail(purpose,email){
    if(!accountMail || pendingMail>=30) return;
    pendingMail++;
    setImmediate(async ()=>{
      try {
        const user=await one(db,"SELECT id,verified_at FROM hp_users WHERE email=$1 AND suspended_at IS NULL",[email]);
        if(!user || (purpose==="verify"?!!user.verified_at:!user.verified_at)) return;
        const validFor=purpose==="verify"?"24 hours":"30 minutes";
        const token=randomBytes(32).toString("hex");
        const reserved=await db.transaction(async tx=>{
          const slot=await one(tx,"INSERT INTO hp_mail_daily_usage(day,count) VALUES((now() AT TIME ZONE 'UTC')::date,1) ON CONFLICT(day) DO UPDATE SET count=hp_mail_daily_usage.count+1 WHERE hp_mail_daily_usage.count<$1 RETURNING day",[dailyMailLimit]);
          if(!slot) return false;
          await tx.query("INSERT INTO hp_account_tokens(token_hash,purpose,user_id,expires_at) VALUES($1,$2,$3,now()+$4::interval)",[digest(token),purpose,user.id,validFor]);
          return true;
        });
        if(!reserved) return;
        await accountMail.send({purpose,recipient:email,token});
      } catch { log("Account mail not sent"); }
      finally { pendingMail--; }
    });
  }
  function checkRate(key,max,window){
    const time=Date.now();
    if(limiters.size>4096) for(const [id,v] of limiters) if(v.until<time) limiters.delete(id);
    if(limiters.size>8192 && !limiters.has(key)) deny(429,"Bitte später erneut versuchen.");
    const previous=limiters.get(key);
    const bucket=previous&&previous.until>time?previous:{until:time+window,count:0};
    bucket.count++;
    limiters.set(key,bucket);
    if(bucket.count>max) deny(429,"Bitte später erneut versuchen.");
  }
  async function session(req,res,user,native){
    const token=randomBytes(32).toString("hex");
    await db.query("INSERT INTO hp_sessions(key_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[digest(token),user.id]);
    if(!native) res.setHeader("Set-Cookie",cookie(cookieName,token,production,604800));
    return { user: publicUser(user), ...(native?{token}:{}) };
  }
  const blockPair=async (conn,a,b) => !!(await one(conn,"SELECT "+blockExists+" AS blocked",[a,b])).blocked;
  async function lockPair(conn,a,b){
    const locked=await rows(conn,"SELECT id FROM hp_users WHERE id IN ($1,$2) AND suspended_at IS NULL ORDER BY id FOR UPDATE",[a,b]);
    if(locked.length!==2) deny(404,noTarget);
  }
  async function conversation(conn,id,user,lock=false){
    const convo=await one(conn,"SELECT * FROM hp_matches WHERE id=$1 AND (first_user=$2 OR second_user=$2)",[id,user]);
    if(!convo) deny(404,"Match nicht verfügbar.");
    if(lock) await lockPair(conn,convo.first_user,convo.second_user);
    else if(await one(conn,"SELECT id FROM hp_users WHERE id IN ($1,$2) AND suspended_at IS NOT NULL LIMIT 1",[convo.first_user,convo.second_user])) deny(404,"Match nicht verfügbar.");
    if(await blockPair(conn,convo.first_user,convo.second_user)) deny(404,"Match nicht verfügbar.");
    return convo;
  }
  async function collectMedia(){
    if(!media) return;
    const tasks=await rows(db,"SELECT id FROM hp_media_gc WHERE enqueued_at <= now() ORDER BY enqueued_at LIMIT 20");
    for(const {id} of tasks){
      try { await media.remove(id); await db.query("DELETE FROM hp_media_gc WHERE id=$1",[id]); } catch { log("Media cleanup pending"); }
    }
  }
  async function route(req,res){
    const path = new URL(req.url,"http://local.invalid").pathname;
    if (path==="/healthz" && ["GET","HEAD"].includes(req.method)) {
      res.setHeader("Cache-Control","no-store");
      return send(res,204);
    }
    if(!path.startsWith("/api/")) return staticHandler ? await staticHandler(req,res,path) : send(res,404,{error:"Nicht gefunden."});
    const origin=req.headers.origin;
    const native=!origin && req.headers["x-heartpulse-native"]==="1";
    const method=req.method;
    const ip=req.socket.remoteAddress||"unknown";
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-Content-Type-Options","nosniff");
    res.setHeader("Referrer-Policy","no-referrer");
    if(origin && !allowed.has(origin)) deny(403,"Ursprung nicht erlaubt.");
    if(origin) {
      res.setHeader("Access-Control-Allow-Origin",origin);
      res.setHeader("Access-Control-Allow-Credentials","true");
      res.setHeader("Vary","Origin");
    }
    if(method==="OPTIONS"){
      if(!origin) deny(403,"Ursprung nicht erlaubt.");
      res.setHeader("Access-Control-Allow-Methods","GET, POST, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers","Content-Type");
      return send(res,204);
    }
    if(!["GET","HEAD"].includes(method) && !native && !origin) deny(403,"Ursprung nicht erlaubt.");
    if(path==="/api/health" && method==="GET"){ await db.query("SELECT 1"); return send(res,200,{status:"ok",media:!!media,accountEmail:!!accountMail}); }
    if(method==="POST" && ["/api/resend-verification","/api/forgot-password"].includes(path)){
      if(!accountMail) deny(503,"E-Mail-Versand ist noch nicht verfügbar.");
      checkRate("email-ip:"+ip,30,3600000);
      const email=normalizeMail((await json(req)).email);
      checkRate("email-to:"+path+":"+email,5,3600000);
      scheduleAccountMail(path==="/api/resend-verification"?"verify":"reset",email);
      return send(res,202,{accepted:true});
    }
    if(method==="POST" && ["/api/verify-email","/api/reset-password"].includes(path)){
      if(!accountMail) deny(503,"E-Mail-Versand ist noch nicht verfügbar.");
      checkRate("consume:"+ip,40,3600000);
      const input=await json(req);
      const purpose=path==="/api/verify-email"?"verify":"reset";
      if(typeof input.token!=="string" || !/^[0-9a-f]{64}$/.test(input.token)) deny(400,invalidLink);
      if(purpose==="reset") requirePassword(input.password);
      const tokenHash=digest(input.token);
      const pending=await one(db,"SELECT user_id FROM hp_account_tokens WHERE token_hash=$1 AND purpose=$2 AND expires_at>now()",[tokenHash,purpose]);
      if(!pending) deny(400,invalidLink);
      const newHash=purpose==="reset"?await hashPassword(input.password):null;
      await db.transaction(async tx=>{
        const user=await one(tx,"SELECT id,verified_at FROM hp_users WHERE id=$1 FOR UPDATE",[pending.user_id]);
        if(!user) deny(400,invalidLink);
        const claimed=await one(tx,"DELETE FROM hp_account_tokens WHERE token_hash=$1 AND purpose=$2 AND user_id=$3 AND expires_at>now() RETURNING user_id",[tokenHash,purpose,user.id]);
        if(!claimed) deny(400,invalidLink);
        if(purpose==="verify"){
          if(user.verified_at) deny(400,invalidLink);
          await tx.query("UPDATE hp_users SET verified_at=now() WHERE id=$1",[user.id]);
        } else {
          if(!user.verified_at) deny(400,invalidLink);
          await tx.query("UPDATE hp_users SET password_hash=$2 WHERE id=$1",[user.id,newHash]);
          await tx.query("DELETE FROM hp_sessions WHERE user_id=$1",[user.id]);
        }
        await tx.query("DELETE FROM hp_account_tokens WHERE user_id=$1 AND purpose=$2",[user.id,purpose]);
      });
      return send(res,204);
    }
    if(method==="POST" && ["/api/register","/api/login"].includes(path)){
      checkRate("authip:"+ip,60,600000);
      const input=await json(req), email=normalizeMail(input.email);
      checkRate("authaccount:"+email,10,600000);
      if(path==="/api/register"){
        if(!registration) deny(403,"Registrierung ist noch nicht freigegeben.");
        requirePassword(input.password);
        const nickname=field(input.nickname,2,24,"Spitzname muss 2 bis 24 Zeichen haben."), birth=dob(input.birthdate);
        let created;
        try {
          const hash=await hashPassword(input.password);
          created=await one(db,"INSERT INTO hp_users(id,email,password_hash,nickname,birthdate,verified_at) VALUES($1,$2,$3,$4,$5,CASE WHEN $6::boolean THEN NULL ELSE now() END) RETURNING "+publicFields,[randomUUID(),email,hash,nickname,birth,!!accountMail]);
        } catch(error) {
          if(error.code==="23505" && accountMail) return send(res,202,{verificationRequired:true});
          if(error.code==="23505") deny(409,"Registrierung nicht möglich. Versuchen Sie es mit der Anmeldung.");
          throw error;
        }
        if(accountMail){scheduleAccountMail("verify",email);return send(res,202,{verificationRequired:true});}
        return send(res,201,await session(req,res,created,native));
      }
      const candidate=await one(db,"SELECT "+publicFields+",password_hash,verified_at FROM hp_users WHERE email=$1 AND suspended_at IS NULL",[email]);
      if(!await passwordOk(input.password,candidate?.password_hash)) deny(401,badAuth);
      if(accountMail&&!candidate.verified_at) deny(403,"Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.");
      return send(res,200,await session(req,res,candidate,native));
    }
    const raw = native ? (/^Bearer ([0-9a-f]{64})$/i.exec(req.headers.authorization||"")?.[1]) :
      ((req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(cookieName+"="))?.slice(cookieName.length+1));
    if(!raw || !/^[0-9a-f]{64}$/.test(raw)) deny(401,"Bitte anmelden.");
    const key=digest(raw);
    const actor=await one(db,"SELECT s.user_id FROM hp_sessions s JOIN hp_users u ON u.id=s.user_id WHERE s.key_hash=$1 AND s.expires_at>now() AND u.suspended_at IS NULL",[key]);
    if(!actor) deny(401,"Bitte anmelden.");
    const me=actor.user_id;
    lastAccountActivity=Date.now();
    checkRate("api:"+me,200,60000);

    if(path==="/api/logout" && method==="POST"){
      await db.query("DELETE FROM hp_sessions WHERE key_hash=$1",[key]);
      if(!native) res.setHeader("Set-Cookie",cookie(cookieName,"",production,0));
      return send(res,204);
    }
    if(path==="/api/me" && method==="GET"){
      const user=await one(db,"SELECT "+publicFields+" FROM hp_users WHERE id=$1",[me]);
      if(!user) deny(401,"Bitte anmelden.");
      return send(res,200,{user:publicUser(user)});
    }
    if(path==="/api/me" && method==="PATCH"){
      const input=await json(req);
      const nickname=field(input.nickname,2,24,"Spitzname muss 2 bis 24 Zeichen haben."),bio=field(input.bio,0,500,"Beschreibung darf maximal 500 Zeichen haben.");
      const user=await one(db,"UPDATE hp_users SET nickname=$2,bio=$3 WHERE id=$1 RETURNING "+publicFields,[me,nickname,bio]);
      return send(res,200,{user:publicUser(user)});
    }
    if(path==="/api/me" && method==="DELETE"){
      const input=await json(req);
      checkRate("delete:"+me,6,600000);
      const old=await one(db,"SELECT password_hash FROM hp_users WHERE id=$1",[me]);
      if(!await passwordOk(input.password,old?.password_hash)) deny(401,"Passwort ist falsch.");
      await db.transaction(async (tx)=>{
        const user=await one(tx,"DELETE FROM hp_users WHERE id=$1 RETURNING photo_id",[me]);
        if(user?.photo_id) await tx.query("INSERT INTO hp_media_gc(id) VALUES($1) ON CONFLICT DO NOTHING",[user.photo_id]);
      });
      if(!native) res.setHeader("Set-Cookie",cookie(cookieName,"",production,0));
      return send(res,204);
    }
    if(path==="/api/discover" && method==="GET"){
      const profiles=await rows(db,"SELECT "+publicFields+" FROM hp_users u WHERE id<>$1 AND u.suspended_at IS NULL AND u.verified_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM hp_choices c WHERE c.actor=$1 AND c.target=u.id) AND NOT EXISTS(SELECT 1 FROM hp_blocks b WHERE (b.actor=$1 AND b.target=u.id) OR (b.actor=u.id AND b.target=$1)) ORDER BY created_at DESC,id LIMIT 30",[me]);
      return send(res,200,{profiles:profiles.map(publicUser)});
    }
    if(path==="/api/decisions" && method==="POST"){
      const input=await json(req), target=uuid(input.targetId);
      if(target===me || !["like","pass"].includes(input.decision)) deny(400,"Ungültige Auswahl.");
      const matched=await db.transaction(async (tx)=>{
        await lockPair(tx,me,target);
        if(await blockPair(tx,me,target)) deny(404,noTarget);
        await tx.query("INSERT INTO hp_choices(actor,target,decision) VALUES($1,$2,$3) ON CONFLICT(actor,target) DO UPDATE SET decision=excluded.decision",[me,target,input.decision]);
        const reverse=await one(tx,"SELECT decision FROM hp_choices WHERE actor=$1 AND target=$2",[target,me]);
        const [a,b]=[me,target].sort();
        if(input.decision==="pass"){ await tx.query("DELETE FROM hp_matches WHERE first_user=$1 AND second_user=$2",[a,b]); return false; }
        if(reverse?.decision!=="like") return false;
        await tx.query("INSERT INTO hp_matches(id,first_user,second_user) VALUES($1,$2,$3) ON CONFLICT(first_user,second_user) DO NOTHING",[randomUUID(),a,b]);
        return true;
      });
      return send(res,200,{matched});
    }
    if(path==="/api/matches" && method==="GET"){
      const data=await rows(db,"SELECT u.id,u.nickname,u.birthdate::text AS birthdate,u.bio,u.photo_id,m.id AS match_id FROM hp_matches m JOIN hp_users u ON u.id=CASE WHEN m.first_user=$1 THEN m.second_user ELSE m.first_user END WHERE (m.first_user=$1 OR m.second_user=$1) AND u.suspended_at IS NULL AND NOT EXISTS(SELECT 1 FROM hp_blocks b WHERE (b.actor=$1 AND b.target=u.id) OR (b.actor=u.id AND b.target=$1)) ORDER BY m.id LIMIT 100",[me]);
      return send(res,200,{matches:data.map(row=>({id:row.match_id,user:publicUser(row)}))});
    }
    const chat=/^\/api\/matches\/([0-9a-f-]+)\/messages$/i.exec(path);
    if(chat && ["GET","POST"].includes(method)){
      const id=uuid(chat[1]);
      const msg=(v)=>({id:v.id,senderId:v.sender_id,body:v.body,createdAt:v.created_at});
      if(method==="GET"){
        await conversation(db,id,me);
        const data=await rows(db,"SELECT id,sender_id,body,created_at FROM hp_messages WHERE match_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100",[id]);
        return send(res,200,{messages:data.reverse().map(msg)});
      }
      checkRate("chat:"+me,40,60000);
      const input=await json(req), value=field(input.body,1,1000,"Nachricht muss 1 bis 1.000 Zeichen haben.");
      const out=await db.transaction(async(tx)=>{
        await conversation(tx,id,me,true);
        return one(tx,"INSERT INTO hp_messages(id,match_id,sender_id,body) VALUES($1,$2,$3,$4) RETURNING id,sender_id,body,created_at",[randomUUID(),id,me,value]);
      });
      return send(res,201,{message:msg(out)});
    }
    if(["/api/block","/api/report"].includes(path) && method==="POST"){
      const input=await json(req), target=uuid(input.targetId);
      if(target===me) deny(400,"Ungültiges Profil.");
      if(path==="/api/report"){
        checkRate("report:"+me,20,3600000);
        const reason=field(input.reason,2,1000,"Bitte einen Meldegrund eingeben.");
        const exists=await one(db,"SELECT id FROM hp_users WHERE id=$1",[target]);
        if(!exists) deny(404,noTarget);
        await db.query("INSERT INTO hp_reports(id,reporter,target,reason) VALUES($1,$2,$3,$4) ON CONFLICT(reporter,target) DO NOTHING",[randomUUID(),me,target,reason]);
      } else {
        await db.transaction(async(tx)=>{
          await lockPair(tx,me,target);
          await tx.query("INSERT INTO hp_blocks(actor,target) VALUES($1,$2) ON CONFLICT DO NOTHING",[me,target]);
          const [a,b]=[me,target].sort();
          await tx.query("DELETE FROM hp_matches WHERE first_user=$1 AND second_user=$2",[a,b]);
          await tx.query("DELETE FROM hp_choices WHERE (actor=$1 AND target=$2) OR (actor=$2 AND target=$1)",[a,b]);
        });
      }
      return send(res,204);
    }
    if(path==="/api/photos"&&method==="POST"){
      if(!media) deny(503,"Fotos sind noch nicht verfügbar.");
      if(!["image/jpeg","image/png","image/webp"].includes(req.headers["content-type"])) deny(415,"JPEG, PNG oder WebP erwartet.");
      checkRate("photos:"+me,10,3600000);
      const bytes=await body(req,5*1024*1024), id=randomUUID();
      if(!bytes.length) deny(400,"Bitte ein Bild auswählen.");
      await db.query("INSERT INTO hp_media_gc(id,enqueued_at) VALUES($1,now()+interval '5 minutes')",[id]);
      try { await media.put(id,bytes); } catch { deny(422,"Bild konnte nicht verarbeitet oder gespeichert werden."); }
      const user=await db.transaction(async(tx)=>{
        const old=await one(tx,"SELECT photo_id FROM hp_users WHERE id=$1 FOR UPDATE",[me]);
        if(!old) deny(401,"Bitte anmelden.");
        const changed=await one(tx,"UPDATE hp_users SET photo_id=$2 WHERE id=$1 RETURNING "+publicFields,[me,id]);
        await tx.query("DELETE FROM hp_media_gc WHERE id=$1",[id]);
        if(old.photo_id) await tx.query("INSERT INTO hp_media_gc(id) VALUES($1) ON CONFLICT DO NOTHING",[old.photo_id]);
        return changed;
      });
      return send(res,200,{user:publicUser(user)});
    }
    const image=/^\/api\/photos\/([0-9a-f-]+)$/i.exec(path);
    if(image && method==="GET"){
      if(!media) deny(404,"Bild nicht verfügbar.");
      const id=uuid(image[1]);
      const photo=await one(db,"SELECT u.id FROM hp_users u WHERE u.photo_id=$1 AND u.suspended_at IS NULL AND NOT EXISTS(SELECT 1 FROM hp_blocks b WHERE (b.actor=$2 AND b.target=u.id) OR (b.actor=u.id AND b.target=$2))",[id,me]);
      if(!photo) deny(404,"Bild nicht verfügbar.");
      const stream=await media.get(id).catch(()=>null);
      if(!stream) deny(404,"Bild nicht verfügbar.");
      res.writeHead(200,{"Content-Type":"image/jpeg","Cache-Control":"private, no-store"});
      return pipeline(Readable.fromWeb(stream),res);
    }
    return send(res,404,{error:"Nicht gefunden."});
  }
  return {
    async handler(req,res){
      try { return await route(req,res); }
      catch(error){
        if(res.headersSent) { res.destroy(); return; }
        if(error instanceof Problem){send(res,error.status,{error:error.message});return;}
        log("HeartPulse request failed");
        send(res,500,{error:"Interner Fehler. Bitte erneut versuchen."});
      }
    },
    collectMedia,
    hasRecentAccountActivity: (time=Date.now()) => lastAccountActivity>0 && time-lastAccountActivity<180000,
  };
}
