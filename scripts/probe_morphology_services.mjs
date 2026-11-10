#!/usr/bin/env node
// Diagnostic only. Queries single documented examples; never stores or imports responses.
const checks=[
 ['latin-lookup','https://latindictionary.co/api/v1/lookup?q=amabam'],
 ['latin-entry','https://latindictionary.co/api/v1/entry/amo'],
 ['latin-alt','https://api.latindictionary.io/api/v1/lookup?word=amo'],
 ['collatinus','https://outils.biblissima.fr/fr/collatinus-web/'],
 ['eulexis','https://outils.biblissima.fr/en/eulexis-web/']
];
for(const [name,url] of checks){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(9000),redirect:'follow'});
  const type=response.headers.get('content-type')||'';
  const cors=response.headers.get('access-control-allow-origin')||'none';
  let sample='';
  if(type.includes('json')){
   const data=await response.json();
   sample=JSON.stringify(data).slice(0,1400);
   if(name==='latin-entry'){
    const summary=Object.entries(data).map(([key,value])=>[key,Array.isArray(value)?'array '+value.length:typeof value==='object'&&value?'object '+Object.keys(value).slice(0,20).join(','):typeof value]);
    const lemma=data.lemmas?.[0]||{};
    const candidates=Object.entries(lemma).filter(([k])=>/inflect|form|table|paradigm/i.test(k));
    console.log('latin-entry-structure: '+JSON.stringify({top:summary,lemmaKeys:Object.keys(lemma),candidates}).slice(0,3500));
   }

  }else{
   const text=await response.text();
   sample='HTML '+text.length+' characters';
  }
  console.log(name+': HTTP '+response.status+' type='+type+' cors='+cors+' sample='+sample);
 }catch(error){console.log(name+': INACCESIBLE '+String(error.message||error).slice(0,200))}
}
