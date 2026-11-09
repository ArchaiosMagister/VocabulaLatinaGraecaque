'use strict';
// Prueba real en Chromium: navegación, generación, autocorrección y repetición de errores.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png'};

const server=http.createServer((req,res)=>{
 let url;
 try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}
 catch{res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,data)=>{
  if(err){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  res.writeHead(200);res.end(data);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/gramatica.html',{waitUntil:'load'});
  await page.waitForFunction(()=>!document.querySelector('#start')?.disabled);
  assert.equal(await page.locator('#category').inputValue(),'Morfología','La modalidad inicial debe centrarse en morfología');

  await page.selectOption('#subject','gr1');
  await page.locator('#none').click();
  await page.locator('#units input[value="UD 11"]').check();
  await page.selectOption('#category','Morfología verbal');
  await page.selectOption('#answer-mode','write');
  await page.selectOption('#topic','UD 11|El futuro y el imperfecto');
  await page.selectOption('#length','10');
  await page.locator('#start').click();
  for(let i=0;i<10;i++){
   const prompt=await page.locator('.grammar-question').textContent();
   const expected=await page.evaluate(text=>{
    const q=window.GrammarPracticeDebug.exercises.find(q=>
     q.subject==='gr1'&&q.unit==='UD 11'&&q.mode==='write'&&q.prompt===text);
    return q?.answer.split(' / ')[0].replaceAll('(ν)','');
   },prompt);
   assert.ok(expected,'No se encontró respuesta para '+prompt);
   await page.locator('#grammar-input').fill(i===1?'FORMA-INEXISTENTE':expected);
   await page.locator('#grammar-form button[type="submit"]').click();
   const feedback=await page.locator('#grammar-feedback').textContent();
   assert.match(feedback,i===1?/Revisa esta forma/:/Correcto/);
   assert.match(feedback,/Respuesta:/,'Debe mostrarse la solución al corregir');
   await page.locator('#grammar-next-btn').click();
  }
  assert.match(await page.locator('#practice').textContent(),/9 de 10 aciertos/);
  await page.locator('#grammar-retry').click();
  const prompt=await page.locator('.grammar-question').textContent();
  const answer=await page.evaluate(text=>{
   const q=window.GrammarPracticeDebug.exercises.find(q=>
    q.subject==='gr1'&&q.unit==='UD 11'&&q.mode==='write'&&q.prompt===text);
   return q?.answer.split(' / ')[0].replaceAll('(ν)','');
  },prompt);
  assert.ok(answer,'Fallo sin pregunta recuperable');
  await page.locator('#grammar-input').fill(answer);
  await page.locator('#grammar-form button[type="submit"]').click();
  assert.match(await page.locator('#grammar-feedback').textContent(),/Correcto/);
  await page.locator('#grammar-next-btn').click();
  assert.match(await page.locator('#practice').textContent(),/1 de 1 aciertos/);

  await page.setViewportSize({width:375,height:812});
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!document.querySelector('#start')?.disabled);
  assert.equal(await page.locator('#category').inputValue(),'Morfología');
  assert.deepEqual(errors,[],'Errores JavaScript del navegador');
  console.log('OK navegador: 10 ejercicios griegos, corrección, repetición de errores y carga móvil.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
