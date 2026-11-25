import { pathToFileURL } from "node:url";
import { openDb, verifyProductionDbUrl } from "./db.mjs";

export async function openReports(db){
  return (await db.query("SELECT id,reporter,target,reason,created_at FROM hp_reports WHERE handled_at IS NULL ORDER BY created_at,id LIMIT 100")).rows;
}
export async function decideReport(db,id,action){
  if(typeof id!=="string"||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))||!["dismissed","suspended"].includes(action)) throw new Error("Invalid moderation action");
  return db.transaction(async tx=>{
    const report=(await tx.query("SELECT id,target FROM hp_reports WHERE id=$1 AND handled_at IS NULL FOR UPDATE",[id])).rows[0];
    if(!report || (action==="suspended"&&!report.target)) return false;
    if(action==="suspended"){
      await tx.query("UPDATE hp_users SET suspended_at=now() WHERE id=$1",[report.target]);
      await tx.query("DELETE FROM hp_sessions WHERE user_id=$1",[report.target]);
      await tx.query("DELETE FROM hp_account_tokens WHERE user_id=$1",[report.target]);
    }
    await tx.query("UPDATE hp_reports SET handled_at=now(),resolution=$2 WHERE id=$1",[id,action]);
    return true;
  });
}
async function cli(){
  const [command,id,confirmation]=process.argv.slice(2);
  if(!["queue","dismiss","suspend"].includes(command)||(command==="suspend"&&confirmation!=="--confirm")){
    console.error("Usage: npm run moderate -- queue | dismiss REPORT_ID | suspend REPORT_ID --confirm");
    process.exitCode=2;return;
  }
  const url=process.env.DATABASE_URL,dir=process.env.HEARTPULSE_DB_DIR;
  if(!url&&!dir) throw new Error("Explicit DATABASE_URL or HEARTPULSE_DB_DIR required");
  if(process.env.NODE_ENV==="production") verifyProductionDbUrl(url);
  if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==="0") throw new Error("TLS verification must remain enabled");
  const db=await openDb({url,dir});
  try {
    if(command==="queue"){console.log(JSON.stringify(await openReports(db),null,2));return;}
    if(!await decideReport(db,id,command==="dismiss"?"dismissed":"suspended")){console.error("Open report not found.");process.exitCode=1;return;}
    console.log("Moderation decision saved.");
  } finally {await db.close();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  cli().catch(()=>{console.error("Moderation command failed.");process.exitCode=1;});
}
