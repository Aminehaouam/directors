const fs=require('fs'),path=require('path');
const root=process.argv[2];const gen=path.join(root,'include/rive/generated');
const files=[];(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())walk(p);else if(f.endsWith('_base.hpp'))files.push(p);}})(gen);
const classes={};
for(const f of files){const s=fs.readFileSync(f,'utf8');
 const m=s.match(/class (\w+)Base : public ([\w:]+)/);if(!m)continue;
 const name=m[1];let sup=m[2].replace('rive::','');
 const tk=s.match(/static const uint16_t typeKey = (\d+);/);
 const props={};for(const pm of s.matchAll(/static const uint16_t (\w+)PropertyKey = (\d+);/g))props[pm[1]]=+pm[2];
 classes[name]={typeKey:tk?+tk[1]:null,super:sup,props};}
// field types
const reg=fs.readFileSync(path.join(gen,'core_registry.hpp'),'utf8');
const fi=reg.indexOf('static int propertyFieldId');const body=reg.slice(fi,reg.indexOf('\n  }\n',fi));
const types={};let pending=[];
for(const line of body.split('\n')){const c=line.match(/case (\w+)Base::(\w+)PropertyKey:/);if(c){pending.push([c[1],c[2]]);continue;}
 const r=line.match(/return (Core\w+Type)::id;/);if(r){for(const [cl,p] of pending){types[cl+'.'+p]=r[1];}pending=[];}}
for(const [n,c] of Object.entries(classes))for(const p of Object.keys(c.props))c.props[p]={key:c.props[p],type:types[n+'.'+p]||'?'};
fs.writeFileSync(process.argv[3],JSON.stringify(classes,null,1));
console.log(Object.keys(classes).length,'classes');
