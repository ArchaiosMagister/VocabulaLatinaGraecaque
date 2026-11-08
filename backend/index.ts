// Supabase Edge Function. No teacher code or database secret belongs in this file.
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
class Failure extends Error { constructor(public status:number,message:string){super(message)} }
const hex = (bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))));
const secret=()=>Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}'))[0] as string;
async function db(path:string,method='GET',body?:unknown){
 const key=secret();if(!key)throw new Failure(503,'El servicio aún no está configurado.');
 const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json().catch(()=>null);if(!r.ok){if(data?.code==='23505')throw new Failure(409,'Esa palabra ya está añadida en esta asignatura. Edítala desde la lista.');console.error('Database request failed',r.status,data?.code);throw new Failure(503,'No se ha podido guardar o cargar la información. Inténtalo de nuevo.')}return data;
}
function text(v:unknown,max:number,min=0){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)throw new Failure(400,'Revisa los campos y su longitud.');return v.trim()}
function strings(v:unknown,max=30){if(!Array.isArray(v)||v.length<1||v.length>max)throw new Failure(400,'Selecciona al menos una unidad o respuesta.');return [...new Set(v.map(x=>text(x,150,1)))];}
function choice(v:unknown,options:string[]){if(typeof v!=='string'||!options.includes(v))throw new Failure(400,'La selección no es válida.');return v;}
async function take(req:Request,kind:string,max:number,seconds=60){
 const ip=req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'unknown';
 const period=Math.floor(Date.now()/(seconds*1000));
 const bucket=await hash(secret()+':'+ip+':'+kind+':'+period);
 if(!await db('rpc/vocab_take_limit','POST',{bucket_key:bucket,bucket_expiry:new Date((period+1)*seconds*1000).toISOString(),maximum:max}))throw new Failure(429,'Se han enviado demasiadas solicitudes. Espera un momento y vuelve a intentarlo.');
}
async function teacher(req:Request){const token=req.headers.get('authorization')?.replace(/^Bearer /i,'')||'';if(token.length<32||token.length>200)throw new Failure(401,'Entra con el código de profesor.');const tokenHash=await hash(token);const rows=await db('vocab_sessions?token_hash=eq.'+tokenHash+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=token_hash');if(!rows.length)throw new Failure(401,'Tu sesión ha caducado. Vuelve a entrar.');return tokenHash;}
function uuid(v:unknown){return text(v,36,36).match(/^[0-9a-f-]{36}$/i)?v as string:(()=>{throw new Failure(400,'Identificador no válido.')})();}
async function listWords(activeOnly:boolean){let result:unknown[]=[];for(let offset=0;;offset+=500){const rows=await db('vocab_words?select=*&order=created_at.asc,id.asc&limit=500&offset='+offset+(activeOnly?'&active=eq.true':''));result.push(...rows);if(rows.length<500)break;if(offset>=10000)throw new Failure(503,'El vocabulario necesita una revisión del límite de carga.')}return result;}
export async function handler(req:Request){
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{headers:cors,status});
 try{
 if(req.method!=='POST')throw new Failure(405,'Método no permitido.');
 if(Number(req.headers.get('content-length')||0)>12000)throw new Failure(413,'El formulario es demasiado largo.');
 const raw=await req.text();if(raw.length>12000)throw new Failure(413,'El formulario es demasiado largo.');let b;try{b=JSON.parse(raw)}catch{throw new Failure(400,'Formulario no válido.')}
 if(!b||typeof b!=='object')throw new Failure(400,'Formulario no válido.');
 const action=b.action;
 if(action==='public_words'){await take(req,'read',120);return respond({words:await listWords(true)});}
 if(action==='login'){
 await take(req,'login',10);const code=text(b.code,150,20);const settings=await db('vocab_settings?id=eq.true&select=code_hash');
 const supplied=await hash(code),expected=settings[0]?.code_hash||'';let mismatch=supplied.length^expected.length;for(let i=0;i<supplied.length;i++)mismatch|=supplied.charCodeAt(i)^(expected.charCodeAt(i)||0);
 if(mismatch)throw new Failure(401,'El código de profesor no es correcto.');
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));const expires=new Date(Date.now()+8*3600*1000).toISOString();
 await db('vocab_sessions?expires_at=lt.'+encodeURIComponent(new Date().toISOString()),'DELETE');
 await db('vocab_sessions','POST',{token_hash:await hash(token),expires_at:expires});return respond({token,expires});
 }
 if(action==='report'){
 await take(req,'reports-minute',5);await take(req,'reports-day',50,86400);
 const message=text(b.message,2000,5);const entry=text(b.entry_form||'',300);
 await db('vocab_reports','POST',{kind:choice(b.kind,['translation','missing','units','other']),subject:choice(b.subject,['lat1','lat2','lat4','gr1']),mode:choice(b.mode,['general','examen']),units:b.units?.length?strings(b.units):[],entry_id:text(b.entry_id||'',100),entry_form:entry,message});
 return respond({ok:true});
 }
 const tokenHash=await teacher(req);
 if(action==='session')return respond({teacher:true});
 if(action==='logout'){await db('vocab_sessions?token_hash=eq.'+tokenHash,'DELETE');return respond({ok:true});}
 if(action==='teacher_words')return respond({words:await listWords(false)});
 if(action==='save_word'){
 const form=text(b.form,300,1);const payload={subject:choice(b.subject,['lat1','lat2','lat4','gr1']),form,form_key:form.normalize('NFC').toLowerCase(),meaning:text(b.meaning,1000,1),answers:strings(b.answers),units:strings(b.units),in_exam:b.in_exam===true,active:b.active!==false,updated_at:new Date().toISOString()};
 const rows=await db('vocab_words'+(b.id?'?id=eq.'+uuid(b.id):''),b.id?'PATCH':'POST',payload);if(!rows.length)throw new Failure(404,'No se encuentra esa palabra.');return respond({word:rows[0]});
 }
 if(action==='reports'){
 const offset=Number.isInteger(b.offset)&&b.offset>=0?Math.min(b.offset,100000):0;
 const status=b.status?choice(b.status,['pending','reviewing','resolved','dismissed']):'';
 const rows=await db('vocab_reports?select=*&order=created_at.desc,id.desc&limit=51&offset='+offset+(status?'&status=eq.'+status:''));return respond({reports:rows.slice(0,50),more:rows.length>50});
 }
 if(action==='update_report'){
 const rows=await db('vocab_reports?id=eq.'+uuid(b.id),'PATCH',{status:choice(b.status,['pending','reviewing','resolved','dismissed']),teacher_note:text(b.teacher_note||'',2000)});if(!rows.length)throw new Failure(404,'No se encuentra ese aviso.');return respond({ok:true});
 }
 throw new Failure(400,'Acción no válida.');
 }catch(e){if(e instanceof Failure)return respond({error:e.message},e.status);console.error('Unhandled vocabulary error');return respond({error:'No se ha podido conectar con el servicio. Inténtalo de nuevo.'},503)}
}
Deno.serve(handler);
