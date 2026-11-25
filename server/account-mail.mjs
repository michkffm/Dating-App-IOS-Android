import nodemailer from "nodemailer";

const messages = Object.freeze({
  verify:{subject:"HeartPulse: E-Mail-Adresse bestätigen",text:"Bestätigen Sie Ihre E-Mail-Adresse über diesen Link. Er ist 24 Stunden gültig."},
  reset:{subject:"HeartPulse: Passwort zurücksetzen",text:"Setzen Sie Ihr Passwort über diesen Link zurück. Er ist 30 Minuten gültig."}
});
const emailPattern = /^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/;
function messageBuilder(from,publicOrigin,production){
  if(!emailPattern.test(from||"")) throw new Error("Invalid mail sender");
  const origin=new URL(publicOrigin);
  if(publicOrigin!==origin.origin || !["http:","https:"].includes(origin.protocol) || (production && origin.protocol!=="https:")) throw new Error("Invalid public app origin");
  return ({purpose,recipient,token})=>{
    if(!Object.hasOwn(messages,purpose)||!emailPattern.test(recipient)||!(/^[0-9a-f]{64}$/.test(token))) throw new Error("Invalid mail recipient or token");
    const link=new URL("/live",origin);
    link.hash=purpose+"="+token;
    return {from,to:recipient,subject:messages[purpose].subject,text:messages[purpose].text+"\n\n"+link.href+"\n\nFalls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail."};
  };
}

export function smtpAccountMail({smtpUrl, from, publicOrigin, production=false}){
  if(!smtpUrl&&!from&&!publicOrigin) return null;
  if(!smtpUrl||!from||!publicOrigin) throw new Error("Set all account email settings");
  const makeMessage=messageBuilder(from,publicOrigin,production);
  const smtp=new URL(smtpUrl);
  if(!["smtps:","smtp:"].includes(smtp.protocol) || !smtp.username || !smtp.password || (smtp.pathname && smtp.pathname!=="/") || smtp.search || smtp.hash) throw new Error("Invalid SMTP URL");
  const secure=smtp.protocol==="smtps:";
  const transport=nodemailer.createTransport({
    host:smtp.hostname,port:smtp.port?Number(smtp.port):secure?465:587,secure,requireTLS:!secure,
    auth:{user:decodeURIComponent(smtp.username),pass:decodeURIComponent(smtp.password)},
    connectionTimeout:7000,greetingTimeout:7000,socketTimeout:10000,
    disableFileAccess:true,disableUrlAccess:true
  });
  return {async send(options){await transport.sendMail(makeMessage(options));}};
}

// Render Free doesn't allow standard outbound SMTP. Use the provider's HTTPS mail API.
export function brevoAccountMail({apiKey,from,publicOrigin,production=false,fetchFn=fetch}){
  if(typeof apiKey !== "string" || !/^[\x21-\x7e]{12,512}$/.test(apiKey)) throw new Error("Invalid Brevo credential configuration");
  const makeMessage=messageBuilder(from,publicOrigin,production);
  return {
    async send(options){
      const message=makeMessage(options);
      const response=await fetchFn("https://api.brevo.com/v3/smtp/email",{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json","api-key":apiKey},
        body:JSON.stringify({sender:{name:"HeartPulse",email:message.from},to:[{email:message.to}],subject:message.subject,textContent:message.text}),
        redirect:"error",
        signal:AbortSignal.timeout(10000)
      });
      if(response.body) await response.body.cancel().catch(()=>{});
      if(response.status!==201) throw new Error("Account email not accepted by provider");
    }
  };
}

export function resendAccountMail({apiKey,from,publicOrigin,production=false,fetchFn=fetch}){
  if(typeof apiKey!=="string"||!/^re_[A-Za-z0-9_-]{8,200}$/.test(apiKey)) throw new Error("Invalid Resend credential configuration");
  const makeMessage=messageBuilder(from,publicOrigin,production);
  if(production&&from.toLowerCase().endsWith("@resend.dev")) throw new Error("Configure a verified sender domain for production");
  return {
    async send(options){
      const message=makeMessage(options);
      const response=await fetchFn("https://api.resend.com/emails",{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":"Bearer "+apiKey},
        body:JSON.stringify({from:"HeartPulse <"+message.from+">",to:[message.to],subject:message.subject,text:message.text}),
        redirect:"error",
        signal:AbortSignal.timeout(10000)
      });
      if(response.body) await response.body.cancel().catch(()=>{});
      if(!response.ok) throw new Error("Account email not accepted by provider");
    }
  };
}

export function configureAccountMail(options){
  if([options.resendKey,options.brevoKey,options.smtpUrl].filter(Boolean).length>1) throw new Error("Configure one account email transport");
  if(options.resendKey) return resendAccountMail({...options,apiKey:options.resendKey});
  if(options.brevoKey) return brevoAccountMail({...options,apiKey:options.brevoKey});
  return smtpAccountMail(options);
}
