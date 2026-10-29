const serve=require('../serve');const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const s=await serve(8124);const b=await chromium.launch();const p=await b.newPage();p.on('console',m=>console.log('console:',m.text()));p.on('pageerror',e=>console.log('err',e.message));
await p.goto('http://localhost:8124/tools/test/'+(process.env.T||'test')+'.html');await p.waitForFunction(()=>window.run);const r=await p.evaluate(()=>window.run());
console.log(r.log);for(const k of ['a','b'])fs.writeFileSync(__dirname+`/out-${k}.png`,Buffer.from(r[k].split(',')[1],'base64'));await b.close();s.close();})();
