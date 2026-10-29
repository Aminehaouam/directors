const serve=require('../serve');const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const s=await serve(8125);const b=await chromium.launch();const p=await b.newPage();p.on('pageerror',e=>console.log('err',e.message));
await p.goto('http://localhost:8125/tools/test/coco.html');await p.waitForFunction(()=>window.run);const r=await p.evaluate(st=>window.run(st),process.argv[2]||'style-a-journal');
fs.writeFileSync(process.argv[3]||'/tmp/coco.png',Buffer.from(r.split(',')[1],'base64'));await b.close();s.close();})();
