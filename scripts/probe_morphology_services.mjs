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
  }else{
   const text=await response.text();
   sample='HTML '+text.length+' characters';
  }
  console.log(name+': HTTP '+response.status+' type='+type+' cors='+cors+' sample='+sample);
 }catch(error){console.log(name+': INACCESIBLE '+String(error.message||error).slice(0,200))}
}
