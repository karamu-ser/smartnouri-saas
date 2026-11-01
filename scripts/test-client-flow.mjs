import fs from 'node:fs/promises';
// Run against an isolated Chrome profile and a local production preview. API calls are mocked.
const siteUrl = process.env.SITE_URL || 'http://127.0.0.1:4173';
const debuggerUrl = process.env.BROWSER_DEBUG_URL || 'http://127.0.0.1:9222';
const tabs = await (await fetch(`${debuggerUrl}/json`)).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let sequence=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error){p.reject(m.error);}else{p.resolve(m.result);}}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw Error('Timeout '+expression);}
const bootstrap=()=>{
 const account={id:42,name:'Café Test',slug:'cafe-test',client_identifier:'cafe-test',client_password:'test-password-12345',client_recovery_code:'offline-recovery-secret-1234567890',menus:[{id:2,categories:[{id:3,name:'Plats',items:[{id:4,name:'Tajine',price:60,is_available:true}]}]}]};
 window.calls=[];window.failUpload=true;window.files=[];window.blobs=new Map();const originalObjectURL=URL.createObjectURL;URL.createObjectURL=blob=>{const url=originalObjectURL(blob);blobs.set(url,blob);return url;};
 window.turnstile={render:(_element,options)=>{queueMicrotask(()=>options.callback('XXXX.DUMMY.TOKEN.XXXX'));return 'test-widget';},reset:()=>{},remove:()=>{}};
 const fetchOriginal=window.fetch;
 window.fetch=async(url,options={})=>{
  const path=new URL(url,location.origin).pathname;
  if(!path.startsWith('/api/v1'))return fetchOriginal(url,options);
  window.calls.push({path,body:typeof options.body==='string'?JSON.parse(options.body):null});
  const respond=(body,status=200)=>Promise.resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}}));
  if(path==='/api/v1/restaurants')return respond(account);
  if(path.endsWith('/menu/upload')){if(window.failUpload){window.failUpload=false;return respond({detail:'Analyse indisponible. Réessayez.'},502);}return respond(account.menus[0]);}
  if(path.endsWith('/client/login'))return respond({access_token:'test-token'});
  if(path.endsWith('/client/restaurant'))return respond(account);
  if(path.endsWith('/client/forgot-password'))return respond({message:'Modifié'});
  return respond(account);
 };
 const click=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){if(this.download){window.files.push({name:this.download,url:this.href});return;}click.call(this);};
 window.fill=(selector,value)=>{const el=document.querySelector(selector);Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 window.press=text=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text));if(!button)throw Error('Missing '+text);button.click();};
};
try{
 await call('Page.enable');await call('Runtime.enable');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`(${bootstrap})();`});
 await call('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});
 await call('Page.navigate',{url:siteUrl});
 await wait('!!document.querySelector("#menu-upload")');
 await evaluate(`localStorage.clear();fill('#contact input[placeholder="Nom de l\\'établissement"]','Café Test');fill('#contact input[placeholder="Votre nom"]','Client');fill('#contact input[type="tel"]','612345678');fill('#contact input[placeholder="Casablanca, Rabat..."]','Rabat');fill('#contact select','cafe');const dt=new DataTransfer();dt.items.add(new File(['image'],'menu.jpg',{type:'image/jpeg'}));const input=document.querySelector('#menu-upload');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));`);
 await pause(100);
 await evaluate('document.querySelector("#contact form").requestSubmit()');
 await wait('document.querySelector("#contact").innerText.includes("Réessayer l’analyse")');
 if(!await evaluate('document.querySelector("#contact").innerText.includes("offline-recovery-secret")'))throw Error('Credentials lost on failure');
 await evaluate('press("Réessayer l’analyse")');
 await wait('document.querySelector("#contact").innerText.includes("Votre menu est prêt")');
 const calls=await evaluate('window.calls');
 if(calls.filter(c=>c.path==='/api/v1/restaurants').length!==1)throw Error('Duplicate account');
 if(calls[0].body.contact_email!==null)throw Error('Email still required');
 if(calls[0].body.contact_phone!=='+212612345678'||!calls[0].body.captcha_token)throw Error('Phone or captcha missing');
 await evaluate('press("Télécharger PNG HD")');await wait('window.files.some(f=>f.name.endsWith(".png"))');
 const png=await evaluate(`(async()=>{const file=files.find(f=>f.name.endsWith('.png'));const blob=blobs.get(file.url);const img=await createImageBitmap(blob);return {width:img.width,height:img.height};})()`);
 if(png.width<1600||png.width!==png.height)throw Error('Invalid PNG dimensions');
 await evaluate('press("Télécharger SVG")');await wait('window.files.some(f=>f.name.endsWith(".svg"))');
 const svg=await evaluate(`blobs.get(files.find(f=>f.name.endsWith('.svg')).url).text()`);
 if(!svg.includes('<svg')||svg.includes('<image'))throw Error('Invalid SVG');
 await evaluate('press("Télécharger mes accès")');await wait('window.files.some(f=>f.name.endsWith(".txt"))');
 const access=await evaluate(`blobs.get(files.find(f=>f.name.endsWith('.txt')).url).text()`);
 if(!access.includes('offline-recovery-secret'))throw Error('Missing recovery in download');
 const layout=await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,qr:document.querySelector('#contact svg[role="img"]').getBoundingClientRect().width})`);
 if(layout.width>layout.viewport||layout.qr<200)throw Error('Mobile layout '+JSON.stringify(layout));
 await evaluate('document.querySelector("#contact").scrollIntoView()');await pause(200);
 if(process.env.SCREENSHOT_PATH){const screenshot=await call('Page.captureScreenshot');await fs.writeFile(process.env.SCREENSHOT_PATH,Buffer.from(screenshot.data,'base64'));}
 await evaluate('press("Ouvrir mon espace client")');await wait('document.body.innerText.includes("Votre QR code")');
 await evaluate('press("Déconnexion")');await wait('!!document.querySelector("#client-identifier")');
 await evaluate('fill("#client-identifier","cafe-test");press("Mot de passe oublié")');await wait('!!document.querySelector("#recovery-code")');
 await evaluate('fill("#recovery-code","offline-recovery-secret-1234567890");fill("#new-password","new-password-12345")');await pause(50);
 await evaluate('press("Changer mon mot de passe")');await wait('document.body.innerText.includes("Votre mot de passe a été modifié")');
 const reset=await evaluate('calls.find(c=>c.path.endsWith("forgot-password"))');
 if(reset.body.identifier!=='cafe-test'||!reset.body.recovery_code||reset.body.email)throw Error('Invalid reset request');
 console.log(JSON.stringify({result:'PASS',checks:['moroccan-phone','captcha-token','optional-email','upload-retry-no-duplicate','credentials-retained','private-access-download','png-export','svg-export','mobile-layout','direct-login','recovery-without-email'],png,layout}));
}catch(e){console.error(e);console.error(await evaluate('document.body.innerText'));process.exitCode=1;}finally{ws.close();}
