// Tiny static server (wasm needs http, not file://).
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.riv':'application/octet-stream','.png':'image/png','.json':'application/json','.mp4':'video/mp4','.css':'text/css'};
module.exports=function serve(port=8123){return new Promise(r=>{const s=http.createServer((q,res)=>{const p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(!p.startsWith(root)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res);}).listen(port,()=>r(s));});};
if(require.main===module)module.exports(+process.argv[2]||8123).then(()=>console.log('serving'));
