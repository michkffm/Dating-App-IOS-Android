import { createServer } from "node:http";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createApp } from "./app.mjs";
import { openDb, verifyProductionDbUrl } from "./db.mjs";
import { cloudMedia } from "./media.mjs";
import { configureAccountMail } from "./account-mail.mjs";
import { staticWeb } from "./static.mjs";

const env=process.env, production=env.NODE_ENV==="production";
const port=Number(env.PORT||3407);
if(!Number.isInteger(port)||port<1||port>65535) throw new Error("Invalid PORT");
const localDir=resolve(env.HEARTPULSE_DB_DIR||".heartpulse-data/db");
const renderOrigin=env.RENDER==="true"?env.RENDER_EXTERNAL_URL:undefined;
const configured=env.APP_ORIGINS?env.APP_ORIGINS.split(",").map(x=>x.trim()):renderOrigin?[renderOrigin]:[];
const accountMailOrigin=env.PUBLIC_APP_ORIGIN||((env.BREVO_API_KEY||env.SMTP_URL)?renderOrigin:undefined);
for(const value of configured){
  const u=new URL(value);
  if(u.origin!==value || (production&&u.protocol!=="https:")) throw new Error("Invalid APP_ORIGINS");
}
if(production&&!configured.length) throw new Error("APP_ORIGINS required for production");
if(production) verifyProductionDbUrl(env.DATABASE_URL);
const accountMail=configureAccountMail({brevoKey:env.BREVO_API_KEY,smtpUrl:env.SMTP_URL,from:env.MAIL_FROM,publicOrigin:accountMailOrigin,production});
if(production && accountMailOrigin && !configured.includes(accountMailOrigin)) throw new Error("PUBLIC_APP_ORIGIN must be permitted");
const wantsPublicSignup=env.REGISTRATION_ENABLED==="true";
const registrationAllowlist=(env.REGISTRATION_TEST_EMAILS||"").split(",").map(x=>x.trim()).filter(Boolean);
const wantsSignup=wantsPublicSignup||registrationAllowlist.length>0;
if(production && wantsSignup && !accountMail) throw new Error("Production registration requires configured account email");
if(production && wantsSignup && (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)) throw new Error("Production registration requires the protected media provider");
if(production && env.NODE_TLS_REJECT_UNAUTHORIZED==="0") throw new Error("TLS verification must remain enabled");
if(!env.DATABASE_URL) await mkdir(dirname(localDir),{recursive:true,mode:0o700});
const db=await openDb({url:env.DATABASE_URL,dir:localDir});
const media=cloudMedia({cloudName:env.CLOUDINARY_CLOUD_NAME,apiKey:env.CLOUDINARY_API_KEY,apiSecret:env.CLOUDINARY_API_SECRET});
const app=createApp({
  db, media, accountMail, production, dailyMailLimit:Number(env.ACCOUNT_MAIL_DAILY_LIMIT||100),
  origins:[...configured,...(production?[]:["http://127.0.0.1:"+port,"http://localhost:"+port])],
  registration:production?wantsPublicSignup:env.REGISTRATION_ENABLED!=="false",
  registrationAllowlist,
  staticHandler:staticWeb(env.HEARTPULSE_WEB_DIR)
});
let collecting=false;
const housekeeping=setInterval(async()=>{
  if(collecting || !app.hasRecentAccountActivity()) return;
  collecting=true;
  try{
    await app.collectMedia();
    await db.query("DELETE FROM hp_sessions WHERE expires_at<=now()");
    await db.query("DELETE FROM hp_account_tokens WHERE expires_at<=now()");
    await db.query("DELETE FROM hp_mail_daily_usage WHERE day<(now() AT TIME ZONE 'UTC')::date-14");
  } catch { console.error("Housekeeping delayed"); }
  finally { collecting=false; }
},60000);
housekeeping.unref();
const server=createServer({requestTimeout:15000,headersTimeout:10000,maxHeaderSize:8192},app.handler);
server.keepAliveTimeout=3500;
server.listen(port,production?"0.0.0.0":"127.0.0.1",()=>console.log("HeartPulse listening on "+port));
for(const signal of ["SIGTERM","SIGINT"]) process.once(signal,()=>{
  clearInterval(housekeeping);
  server.close(async()=>{await db.close();process.exit(0);});
});
