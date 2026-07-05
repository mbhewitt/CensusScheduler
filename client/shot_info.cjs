const fs=require('fs'),crypto=require('crypto');const {chromium}=require('playwright');
const label=process.argv[2]||'after';
const env=fs.readFileSync('.env.local','utf8');
const secret=(env.match(/^SESSION_SECRET\s*=\s*(.+)$/m)||[])[1].trim().replace(/^["']|["']$/g,'');
const id=26302;
const b64=Buffer.from(JSON.stringify({shiftboardId:id,expires:Date.now()+3600*1000})).toString('base64url');
const hmac=crypto.createHmac('sha256',secret).update(b64).digest('base64url');
const session=JSON.stringify({settings:{isAuthenticated:true},user:{email:'x',emergencyContact:'',isCreated:true,location:'',notes:'',phone:'',playaName:'Eli',roleList:[{id:1000012,name:'B'}],shiftboardId:id,worldName:'Eli'}});
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:1200},deviceScaleFactor:2});
  await ctx.addCookies([{name:'census-session',value:`${b64}.${hmac}`,url:'http://localhost:3020',httpOnly:true,secure:false,sameSite:'Lax'}]);
  await ctx.addInitScript(s=>{try{sessionStorage.setItem('sessionState',s);}catch(e){}}, session);
  const pg=await ctx.newPage();
  await pg.goto('http://localhost:3020/volunteers/26302/info',{waitUntil:'domcontentloaded',timeout:90000});
  try{ await pg.getByText('Checklist',{exact:false}).first().waitFor({timeout:40000}); }catch(e){ console.log('wait miss'); }
  await pg.waitForTimeout(2500);
  const m=await pg.evaluate(()=>({docW:document.documentElement.scrollWidth,vw:window.innerWidth}));
  console.log('overflow:',JSON.stringify(m));
  await pg.screenshot({path:`/tmp/info_${label}.png`,fullPage:true});
  await b.close(); console.log('done',label);
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
