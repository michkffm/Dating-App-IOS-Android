import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";

const rewrites = new Set(["/","/home","/welcome","/profile","/matches","/live"]);
const mime = new Map([[".html","text/html; charset=utf-8"],[".js","application/javascript; charset=utf-8"],[".png","image/png"],[".jpeg","image/jpeg"],[".jpg","image/jpeg"],[".ttf","font/ttf"],[".woff2","font/woff2"],[".ico","image/x-icon"],[".css","text/css; charset=utf-8"],[".woff","font/woff"],[".svg","image/svg+xml"],[".json","application/json"]]);
export function staticWeb(directory){
  if(!directory) return undefined;
  const root=resolve(directory);
  return async function handler(req,res,path){
    if(!["GET","HEAD"].includes(req.method)) { res.writeHead(405);res.end();return; }
    const file=resolve(root,"."+ (rewrites.has(path)?"/index.html":path));
    if(!file.startsWith(root+sep)) { res.writeHead(404);res.end();return; }
    const info=await stat(file).catch(()=>null);
    const type=mime.get(extname(file));
    if(!info?.isFile() || !type){res.writeHead(404);res.end();return;}
    res.writeHead(200,{
      "Content-Type":type,"Content-Length":info.size,"X-Content-Type-Options":"nosniff",
      "Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      "Referrer-Policy":"no-referrer","Permissions-Policy":"camera=(), microphone=(), geolocation=()",
      "Cache-Control":path.startsWith("/_expo/static/")?"public, max-age=31536000, immutable":"no-store"
    });
    if(req.method==="HEAD"){res.end();return;}
    await pipeline(createReadStream(file),res);
  };
}
