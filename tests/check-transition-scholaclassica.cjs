'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const code=readFileSync(join(__dirname,'../theme.js'),'utf8');
const marker='/* SCHOLA_LEGACY_NOTICE_V1:';
assert.ok(code.includes(marker),'Falta aviso en tema compartido');
const script=code.slice(code.indexOf(marker));
const simulate=(path,search='')=>{
 let load,inserted;
 const header={insertAdjacentElement:(where,node)=>{assert.equal(where,'afterend');inserted=node;}};
 const doc={querySelector:q=>q==='header'?header:null,getElementById:()=>null,
  addEventListener:(event,fn)=>{assert.equal(event,'DOMContentLoaded');load=fn;},
  createElement:tag=>({tag,style:{fontWeight:'',cssText:''},
   setAttribute:function(key,val){this[key]=val;},
   append:function(...children){this.children=children;}})};
 vm.runInNewContext(script,{location:{pathname:path,search},document:doc});
 if(load)load();
 return inserted;
};
for(const [path,query,target] of [
 ['/VocabulaLatinaGraecaque/','','/ScholaClassica/apps/vocabulario/index.html'],
 ['/VocabulaLatinaGraecaque/index.html','?subject=gr1','/ScholaClassica/apps/vocabulario/index.html?subject=gr1'],
 ['/VocabulaLatinaGraecaque/gramatica.html','','/ScholaClassica/apps/repaso-gramatica/index.html'],
 ['/ScholaClassica/apps/vocabulario/index.html','',null]
]){
 const node=simulate(path,query);
 assert.equal(node?.id||null,target?'schola-legacy-notice':null);
 if(target){assert.equal(node.children[1].href,target);assert.match(node.children[0].textContent,/sigue|seguir/);}
}
assert.ok(!script.includes('location.replace')&&!script.includes('location.assign')&&!script.includes('localStorage.setItem'));
assert.match(readFileSync(join(__dirname,'../app.js'),'utf8'),/classics-progress-v1/);
console.log('Aviso de transición Vocabula: destino, gramática y progreso original conservados.');
