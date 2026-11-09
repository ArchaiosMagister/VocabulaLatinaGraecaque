(function grammarAdmin(){
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const subjects={lat1:'Latín I',lat4:'Latín · 4.º ESO',gr1:'Griego I'};
 const statuses={pending:'Pendiente',reviewing:'En revisión',resolved:'Resuelto',dismissed:'Descartado'};
 const sessionKey='classics-teacher-session';
 let token='',reports=[],offset=0,more=false;
 try{token=sessionStorage.getItem(sessionKey)||''}catch{}
 function message(id,value,bad=false){
  const el=$(id);if(el){el.textContent=value;el.className='form-status '+(bad?'error':'success')}
 }
 function remember(value){
  token=value;
  try{if(value)sessionStorage.setItem(sessionKey,value);else sessionStorage.removeItem(sessionKey)}catch{}
 }
 async function api(action,payload={},privateAction=false){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(window.VOCAB_SERVICE,{
    method:'POST',headers:{'Content-Type':'application/json',...(privateAction?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify({action,...payload}),signal:controller.signal
   });
   const data=await response.json();
   if(!response.ok){
    if(response.status===401&&privateAction){remember('');showLogin()}
    throw new Error(data.error||'No se ha podido completar la solicitud.');
   }
   return data;
  }catch(error){
   if(error.name==='AbortError'||error instanceof TypeError)throw new Error('No se ha podido conectar con el servicio. Comprueba tu conexión.');
   throw error;
  }finally{clearTimeout(timer)}
 }
 function selectedUnits(){
  return [...$('units').querySelectorAll('input:checked')].map(input=>input.value);
 }
 function questionContext(){
  const q=window.GrammarPracticeDebug?.currentQuestion?.()||null;
  return {
   subject:q?.subject||$('subject').value,
   units:q?.unit?[q.unit]:selectedUnits().slice(0,30),
   entry_id:('grammar:'+(q?.id||'general')).slice(0,100),
   entry_form:('Gramática · '+(q?.prompt||'Aviso general')).slice(0,300),
   title:q?.prompt||'Aviso general de gramática',
   unit:q?.unit||selectedUnits().join(' · ')||'Sin unidad seleccionada'
  };
 }
 function openReport(){
  const context=questionContext();
  const dialog=$('report-dialog');
  dialog.innerHTML=`<div class="dialoghead"><h2 id="report-title">Avisar de un error de gramática</h2><button type="button" data-close="report-dialog" aria-label="Cerrar aviso">Cerrar</button></div>
   <p class="notice">El aviso lo recibirá el profesor. No incluyas nombres, correos ni datos personales.</p>
   <p><strong>${esc(subjects[context.subject])}</strong> · ${esc(context.unit)}</p>
   <p class="notice">${esc(context.title)}</p>
   <form id="grammar-report-form">
    <label for="grammar-report-message">¿Qué forma o respuesta habría que corregir?</label>
    <textarea id="grammar-report-message" required minlength="5" maxlength="2000" placeholder="Por ejemplo: esta forma también debería aceptarse…"></textarea>
    <label class="honeypot" aria-hidden="true">No rellenar<input id="grammar-report-website" tabindex="-1" autocomplete="off"></label>
    <p id="grammar-report-status" class="form-status" role="status"></p>
    <button id="grammar-report-send" class="primary" type="submit">Enviar aviso al profesor</button>
   </form>`;
  $('grammar-report-form').onsubmit=async event=>{
   event.preventDefault();
   if($('grammar-report-website').value)return;
   const send=$('grammar-report-send');
   send.disabled=true;
   message('grammar-report-status','Enviando aviso…');
   try{
    await api('report',{kind:'other',mode:'general',subject:context.subject,
     units:context.units,entry_id:context.entry_id,entry_form:context.entry_form,
     message:$('grammar-report-message').value});
    $('grammar-report-form').innerHTML='<p class="feedback" role="status">Aviso de gramática enviado al profesor.</p><button type="button" data-close="report-dialog">Cerrar</button>';
   }catch(error){message('grammar-report-status',error.message,true);send.disabled=false}
  };
  dialog.showModal();
  $('grammar-report-message').focus();
 }
 function showLogin(){
  if(!$('teacher-login'))return;
  $('teacher-login').hidden=false;
  $('teacher-content').hidden=true;
  $('teacher-content').innerHTML='';
 }
 function openTeacher(){
  const dialog=$('teacher-dialog');
  dialog.innerHTML=`<div class="dialoghead"><h2 id="teacher-title">Área de profesor · Gramática</h2><button type="button" data-close="teacher-dialog" aria-label="Cerrar área docente">Cerrar</button></div>
   <section id="teacher-login"><p>Entra como profesor para consultar los ejercicios y revisar los avisos de gramática.</p>
    <form id="login-form">
     <label for="teacher-username">Usuario</label>
     <input id="teacher-username" name="username" autocomplete="username" value="MagisterArchaios" maxlength="60" required>
     <label for="teacher-code">Código privado de profesor</label>
     <input id="teacher-code" name="password" type="password" autocomplete="current-password" minlength="20" maxlength="150" required>
     <p id="login-status" class="form-status" role="status"></p>
     <button id="login-button" class="primary" type="submit">Entrar</button>
    </form>
    <p class="notice">Es el mismo código privado que en Vocabulario. La sesión se mantiene en esta pestaña hasta ocho horas.</p>
   </section><section id="teacher-content" hidden></section>`;
  $('login-form').onsubmit=async event=>{
   event.preventDefault();
   if($('teacher-username').value.trim()!=='MagisterArchaios'){
    message('login-status','El nombre de usuario no es correcto.',true);return;
   }
   $('login-button').disabled=true;
   message('login-status','Comprobando credenciales…');
   try{
    const data=await api('login',{username:'MagisterArchaios',code:$('teacher-code').value});
    $('teacher-code').value='';
    remember(data.token);
    await dashboard();
   }catch(error){message('login-status',error.message,true)}
   finally{if($('login-button'))$('login-button').disabled=false}
  };
  dialog.showModal();
  if(token){
   $('teacher-login').hidden=true;
   api('session',{},true).then(()=>dashboard()).catch(error=>{
    showLogin();message('login-status',error.message,true)
   });
  }else $('teacher-username').focus();
 }
 function optionList(map,current){
  return Object.entries(map).map(([value,label])=>`<option value="${esc(value)}" ${current===value?'selected':''}>${esc(label)}</option>`).join('');
 }
 function showExercises(){
  const data=window.GrammarPracticeDebug?.exercises||[];
  const subject=$('grammar-teacher-subject').value;
  const query=$('grammar-teacher-search').value.trim().toLocaleLowerCase();
  const unit=$('grammar-teacher-unit').value;
  const items=data.filter(item=>item.subject===subject&&(!unit||item.unit===unit)
   &&(!query||(item.prompt+' '+item.answer+' '+item.topic).toLocaleLowerCase().includes(query)));
  $('grammar-exercise-count').textContent=items.length+' ejercicios encontrados en el banco inicial.';
  $('grammar-exercises').innerHTML=items.slice(0,25).map(item=>`<article class="cardrow">
   <p class="meta">${esc(item.unit)} · ${esc(item.topic)} · ${item.mode==='write'?'Escritura':'Test'}</p>
   <strong>${esc(item.prompt)}</strong>
   <p>Solución: <strong>${esc(item.answer)}</strong></p>
  </article>`).join('')||'<p class="notice">No hay ejercicios que coincidan con la búsqueda.</p>';
  if(items.length>25)$('grammar-exercises').insertAdjacentHTML('beforeend','<p class="notice">Se muestran los primeros 25 resultados. Acota la unidad o la búsqueda para ver otros ejercicios.</p>');
 }
 function updateExerciseUnits(){
  const subject=$('grammar-teacher-subject').value;
  const syllabus=window.GrammarPracticeDebug?.syllabi?.[subject]||[];
  $('grammar-teacher-unit').innerHTML='<option value="">Todas las unidades</option>'+syllabus.map(([unit])=>`<option value="${esc(unit)}">${esc(unit)}</option>`).join('');
  showExercises();
 }
 function grammarOnly(item){return String(item.entry_id||'').startsWith('grammar:')}
 function renderReports(){
  $('grammar-report-prev').disabled=offset===0;
  $('grammar-report-next').disabled=!more;
  const list=reports.filter(grammarOnly);
  $('grammar-report-list').innerHTML=list.map(report=>`<article class="cardrow">
   <div class="toolbar"><strong>${esc(subjects[report.subject]||report.subject)}</strong><span class="private-badge">${esc(statuses[report.status]||report.status)}</span></div>
   <p class="meta">${esc((report.units||[]).join(' · '))} · ${esc(new Date(report.created_at).toLocaleString('es-ES'))}</p>
   <p><strong>${esc(report.entry_form||'Aviso de gramática')}</strong></p>
   <p>${esc(report.message)}</p>
   <label for="grammar-report-status-${esc(report.id)}">Estado</label>
   <select id="grammar-report-status-${esc(report.id)}">${optionList(statuses,report.status)}</select>
   <label for="grammar-report-note-${esc(report.id)}">Nota privada</label>
   <textarea id="grammar-report-note-${esc(report.id)}" maxlength="2000">${esc(report.teacher_note||'')}</textarea>
   <p id="grammar-report-result-${esc(report.id)}" class="form-status" role="status"></p>
   <button class="primary" type="button" data-save-grammar-report="${esc(report.id)}">Guardar revisión</button>
  </article>`).join('')||'<p class="notice">No aparecen avisos de gramática en este grupo de resultados.</p>';
  message('grammar-reports-message',`Se muestran ${list.length} avisos de gramática entre las incidencias ${offset+1}–${offset+reports.length}. Usa «Siguientes» si quedan más registros.`);
 }
 async function loadReports(){
  if(!$('grammar-report-list'))return;
  message('grammar-reports-message','Cargando avisos de gramática…');
  try{
   const data=await api('reports',{status:$('grammar-report-filter').value,offset},true);
   reports=data.reports||[];
   more=data.more===true;
   renderReports();
  }catch(error){message('grammar-reports-message',error.message,true)}
 }
 async function loadCoverage(){
  const target=$('grammar-coverage');
  if(!target)return;
  try{
   const response=await fetch('data/morphology-coverage.json',{cache:'no-store'});
   if(!response.ok)throw Error('Informe aún no publicado');
   const data=await response.json();
   if(data.schema!==1||!data.subjects)throw Error('Formato del informe desconocido');
   const order=['lat1','lat4','gr1'];
   target.innerHTML='<p class="notice">Lemas con <strong>al menos una forma autocorregible</strong>; no equivale a una declinación o conjugación completa.</p>'+
    '<div class="grammar-teacher-totals">'+order.map(subject=>{
     const info=data.subjects[subject];
     if(!info)return '';
     return '<div class="cardrow"><strong>'+esc(subjects[subject])+'</strong><p>'+info.withExercises+' de '+info.lemmas+' lemas con ejercicios</p><p class="meta">'+info.withoutExercises+' sin ejercicios · '+info.importedLemmas+' con UniMorph · '+info.curatedLemmas+' con formas docentes</p></div>';
    }).join('')+'</div>'+
    '<p><a href="data/morphology-coverage.md" target="_blank" rel="noopener">Informe completo y lista de lagunas</a></p>';
  }catch(error){
   target.textContent='La auditoría todavía no se ha publicado. Los ejercicios actuales siguen disponibles.';
  }
 }
  async function dashboard(){
  if(!$('teacher-dialog')?.open)return;
  $('teacher-login').hidden=true;
  $('teacher-content').hidden=false;
  const all=window.GrammarPracticeDebug?.exercises||[];
  const totals=Object.entries(subjects).map(([subject,name])=>{
   const count=all.filter(q=>q.subject===subject).length;
   return `<div class="cardrow"><strong>${esc(name)}</strong><p>${count} ejercicios del banco inicial</p></div>`;
  }).join('');
  $('teacher-content').innerHTML=`<div class="toolbar"><span class="private-badge">MagisterArchaios · Sesión de profesor</span><button id="grammar-logout" type="button">Cerrar sesión</button></div>
   <section class="teacher-section"><h3>Cobertura morfológica del vocabulario</h3><div id="grammar-coverage" role="status">Consultando cobertura…</div></section>
   <section class="teacher-section"><h3>Banco de ejercicios de gramática</h3>
    <p class="notice">Consulta los ejercicios y sus soluciones. Los datos importados de UniMorph se consultan desde la práctica del alumnado; esta lista muestra el banco inicial.</p>
    <div class="grammar-teacher-totals">${totals}</div>
    <label for="grammar-teacher-subject">Asignatura</label><select id="grammar-teacher-subject">${optionList(subjects,$('subject').value)}</select>
    <label for="grammar-teacher-unit">Unidad</label><select id="grammar-teacher-unit"></select>
    <label for="grammar-teacher-search">Buscar enunciado, solución o contenido</label>
    <input id="grammar-teacher-search" placeholder="Por ejemplo: aoristo, λύω, genitivo…">
    <p id="grammar-exercise-count" class="notice"></p>
    <div id="grammar-exercises" class="list-scroll"></div>
   </section>
   <section class="teacher-section"><h3>Avisos sobre gramática</h3>
    <p class="notice">Aquí puedes leer los errores señalados por los alumnos, cambiar su estado y guardar una nota privada. La modificación de los ejercicios publicados se realiza en el repositorio, no desde esta pantalla.</p>
    <div class="toolbar"><label for="grammar-report-filter">Estado</label><select id="grammar-report-filter"><option value="pending">Pendientes</option><option value="reviewing">En revisión</option><option value="resolved">Resueltos</option><option value="dismissed">Descartados</option><option value="">Todos</option></select><button id="grammar-report-refresh" type="button">Actualizar avisos</button></div>
    <p id="grammar-reports-message" class="form-status" role="status"></p>
    <div id="grammar-report-list"></div>
    <div class="grammar-actions"><button id="grammar-report-prev" type="button">Anteriores</button><button id="grammar-report-next" type="button">Siguientes</button></div>
   </section>`;
  $('grammar-logout').onclick=async()=>{try{await api('logout',{},true)}catch{}remember('');showLogin();message('login-status','Sesión cerrada.')};
  $('grammar-teacher-subject').onchange=updateExerciseUnits;
  $('grammar-teacher-unit').onchange=showExercises;
  $('grammar-teacher-search').oninput=showExercises;
  $('grammar-report-filter').onchange=()=>{offset=0;loadReports()};
  $('grammar-report-refresh').onclick=()=>loadReports();
  $('grammar-report-prev').onclick=()=>{offset=Math.max(0,offset-50);loadReports()};
  $('grammar-report-next').onclick=()=>{offset+=50;loadReports()};
  updateExerciseUnits();
  await Promise.all([loadReports(),loadCoverage()]);
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.close){$(button.dataset.close)?.close();return}
  const id=button.dataset.saveGrammarReport;
  if(!id)return;
  const report=reports.find(item=>item.id===id&&grammarOnly(item));
  if(!report)return;
  button.disabled=true;
  try{
   await api('update_report',{id,status:$('grammar-report-status-'+id).value,
    teacher_note:$('grammar-report-note-'+id).value},true);
   await loadReports();
  }catch(error){
   message('grammar-report-result-'+id,error.message,true);
   button.disabled=false;
  }
 });
 $('open-report').addEventListener('click',openReport);
 $('open-teacher').addEventListener('click',openTeacher);
})();
