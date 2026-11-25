import nodemailer from "nodemailer";

const messages = Object.freeze({
  verify:{subject:"HeartPulse: E-Mail-Adresse bestätigen",text:"Bestätigen Sie Ihre E-Mail-Adresse über diesen Link. Er ist 24 Stunden gültig."},
  reset:{subject:"HeartPulse: Passwort zurücksetzen",text:"Setzen Sie Ihr Passwort über diesen Link zurück. Er ist 30 Minuten gültig."}
});
const emailPattern = /^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/;
export function smtpAccountMail({smtpUrl, from, publicOrigin, production=false}){
  if(!smtpUrl&&!from&&!publicOrigin) return null;
  if(!smtpUrl||!from||!publicOrigin) throw new Error("Set all account email settings");
  const smtp=new URL(smtpUrl);
  if(!["smtps:","smtp:"].includes(smtp.protocol) || !smtp.username || !smtp.password || (smtp.pathname && smtp.pathname!=="/") || smtp.search || smtp.hash) throw new Error("Invalid SMTP URL");
  if(!emailPattern.test(from)) throw new Error("Invalid mail sender");
  const origin=new URL(publicOrigin);
  if(publicOrigin!==origin.origin || (production && origin.protocol!=="https:")) throw new Error("Invalid public app origin");
  const secure=smtp.protocol==="smtps:";
  const transport=nodemailer.createTransport({
    host:smtp.hostname,port:smtp.port?Number(smtp.port):secure?465:587,secure,requireTLS:!secure,
    auth:{user:decodeURIComponent(smtp.username),pass:decodeURIComponent(smtp.password)},
    connectionTimeout:7000,greetingTimeout:7000,socketTimeout:10000,
    disableFileAccess:true,disableUrlAccess:true
  });
  return {
    async send({purpose,recipient,token}){
      if(!messages[purpose]||!emailPattern.test(recipient)||!(/^[0-9a-f]{64}$/.test(token))) throw new Error("Invalid mail recipient or token");
      const link=new URL("/live",origin);
      link.hash=purpose+"="+token;
      await transport.sendMail({from,to:recipient,subject:messages[purpose].subject,text:messages[purpose].text+"\n\n"+link.href+"\n\nFalls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail."});
    }
  };
}
