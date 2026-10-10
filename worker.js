const enc=new TextEncoder();
const json=(x,status=200,extra={})=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
const fail=(msg,status=400)=>json({error:msg},status);
const hex=a=>[...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>crypto.randomUUID();
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const normalize=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ');
const usernameKey=s=>normalize(s).toLocaleLowerCase('pt-BR');
const validName=s=>s.length>=3&&s.length<=48&&!/[<>\u0000-\u001f]/.test(s);
const iter=100000;
async function derive(password,salt,iterations=iter){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations},key,256));}
async function body(request){if(Number(request.headers.get('content-length')||0)>120000)return null;try{return await request.json()}catch{return null}}
function safeUrl(s){if(!s)return '';try{const u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}}
function imageUrl(s){if(!s)return '';if(/^\/(?:media|assets)\/[\w.\-\/]+$/.test(s))return s;return safeUrl(s)}
function videoUrl(s){if(!s)return '';try{const u=new URL(s);return u.protocol==='https:'&&['www.youtube.com','youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname)?u.href:''}catch{return ''}}
function originOK(req){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin}
async function current(req,env){const cookie=req.headers.get('cookie')||'';const m=cookie.match(/(?:^|;\s*)av_session=([a-f0-9]{64})(?:;|$)/);if(!m)return null;const hash=await sha(m[1]);return env.DB.prepare('SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at>?').bind(hash,Date.now()).first()}
function setCookie(t,maxAge){return `av_session=${t}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
async function makeSession(env,u){const t=token();await env.DB.prepare('INSERT INTO sessions(id_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sha(t),u.id,Date.now()+7*86400000).run();return {t, user:{id:u.id,username:u.username,role:u.role}}}
async function rateLimit(env,key){const now=Date.now(),start=now-15*60000;const r=await env.DB.prepare('SELECT count,window_start FROM login_attempts WHERE key=?').bind(key).first();if(r&&r.window_start>start&&r.count>=12)return true;await env.DB.prepare('INSERT INTO login_attempts(key,count,window_start) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_start<? THEN 1 ELSE count+1 END,window_start=CASE WHEN window_start<? THEN ? ELSE window_start END').bind(key,now,start,start,now).run();return false}
async function api(req,env,url){const path=url.pathname,method=req.method;
 if(method!=='GET'&&!originOK(req))return fail('Origem não autorizada.',403);
 if(path==='/api/bootstrap'&&method==='POST'){
  if(!env.ADMIN_SETUP_TOKEN)return fail('Configure o segredo ADMIN_SETUP_TOKEN antes.',503);
  const b=await body(req);if(!b||b.setupToken!==env.ADMIN_SETUP_TOKEN)return fail('Token de configuração inválido.',403);
  const exists=await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();if(exists)return fail('Administrador já configurado.',409);
  const name='Victor Velarian';if(typeof b.password!=='string'||b.password.length<6||b.password.length>12)return fail('Use senha de 6 a 12 caracteres.');
  const salt=token(),id=random();
  let passwordHash;
  try {
    passwordHash=await derive(b.password,salt);
  } catch(error) {
    console.error('ADMIN_BOOTSTRAP_HASH_ERROR', error?.message, error?.stack);
    return fail('Falha ao preparar a senha. Consulte os logs do Worker.',500);
  }
  try {
    await env.DB.prepare('INSERT INTO users(id,username,username_key,password_hash,salt,iterations,role) VALUES(?,?,?,?,?,?,?)')
      .bind(id,name,usernameKey(name),passwordHash,salt,iter,'admin').run();
  } catch(error) {
    console.error('ADMIN_BOOTSTRAP_DB_ERROR', error?.message, error?.cause?.message);
    const message=String(error?.message||'');
    if (/UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|SQLITE_CONSTRAINT_PRIMARYKEY/i.test(message)) {
      return fail('Nome já cadastrado.',409);
    }
    return fail('Falha ao gravar administrador no banco. Consulte os logs do Worker.',500);
  }
  return json({ok:true,message:'Administrador Victor Velarian criado. Remova ADMIN_SETUP_TOKEN após configurar.'},201);
 }
 // Cadastro público desativado: a Academia é aberta, sem contas de alunos.
 if(path==='/api/register')return fail('Cadastro de alunos desativado. O conteúdo é público.',403);
 if(path==='/api/login'&&method==='POST'){
  const b=await body(req);if(!b)return fail('Dados inválidos.');const name=usernameKey(b.username),ip=req.headers.get('cf-connecting-ip')||'unknown';try{if(await rateLimit(env,'login:'+ip+':'+name))return fail('Muitas tentativas. Aguarde 15 minutos.',429)}catch(error){console.error('ADMIN_LOGIN_RATE_LIMIT_ERROR',error?.message);return fail('Falha no controle de tentativas de login. Consulte os logs do Worker.',500)}
  const u=await env.DB.prepare("SELECT * FROM users WHERE username_key=? AND role='admin'").bind(name).first();if(!u||typeof b.password!=='string')return fail('Usuário ou senha inválidos.',401);
  let candidate;try{candidate=await derive(b.password,u.salt,u.iterations)}catch(error){console.error('ADMIN_LOGIN_HASH_ERROR',error?.message);return fail('Erro na verificação da senha.',500)}if(candidate!==u.password_hash)return fail('Usuário ou senha inválidos.',401);
  let session;try{session=await makeSession(env,u)}catch(error){console.error('ADMIN_LOGIN_SESSION_ERROR',error?.message);return fail('Erro ao iniciar a sessão administrativa.',500)}return json({user:session.user},200, {'set-cookie':setCookie(session.t,7*86400)});
 }
 if(path==='/api/me'&&method==='GET'){const u=await current(req,env);return json({user:u?.role==='admin'?u:null})}
 if(path==='/api/logout'&&method==='POST'){const m=(req.headers.get('cookie')||'').match(/av_session=([a-f0-9]{64})/);if(m)await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha(m[1])).run();return json({ok:true},200,{'set-cookie':setCookie('',0)})}
 if(path==='/api/public'&&method==='GET'){const s=await env.DB.prepare('SELECT key,value FROM settings').all();const c=await env.DB.prepare("SELECT id,kind,title,summary,body,video_url AS videoUrl,image_url AS imageUrl FROM content WHERE status='published' ORDER BY updated_at DESC").all();return json({settings:Object.fromEntries((s.results||[]).map(x=>[x.key,x.value])),content:c.results||[]})}
 const user=await current(req,env);if(!user||user.role!=='admin')return fail('Acesso restrito ao administrador.',403);
 if(path==='/api/admin/all'&&method==='GET'){const s=await env.DB.prepare('SELECT key,value FROM settings').all();const c=await env.DB.prepare('SELECT * FROM content ORDER BY updated_at DESC').all();const m=await env.DB.prepare('SELECT id,mime,created_at FROM media ORDER BY created_at DESC LIMIT 100').all();return json({settings:Object.fromEntries((s.results||[]).map(x=>[x.key,x.value])),content:c.results||[],media:m.results||[]})}
 if(path==='/api/admin/settings'&&method==='PUT'){const b=await body(req);if(!b||typeof b!=='object')return fail('Dados inválidos.');const allowed=['heroTitle','heroText','aboutText','donationAccountUrl','certificateFee','heroImage','supportImage'];for(const k of allowed){if(!(k in b))continue;let v=String(b[k]||'').slice(0,4000);if(k==='donationAccountUrl'&&v&&!safeUrl(v))return fail('Link de doação deve começar com https://');if(['heroImage','supportImage'].includes(k)&&v&&!imageUrl(v))return fail('Imagem precisa ter URL https:// ou caminho /media/ ou /assets/');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,v).run()}return json({ok:true})}
 if(path==='/api/admin/content'&&method==='POST'){const b=await body(req);if(!b||!['guide','topic'].includes(b.kind))return fail('Tipo inválido.');const id=typeof b.id==='string'&&/^[a-f0-9-]{36}$/.test(b.id)?b.id:random();const title=String(b.title||'').trim().slice(0,140);if(!title)return fail('Título obrigatório.');const summary=String(b.summary||'').slice(0,1000),txt=String(b.body||'').slice(0,50000),status=b.status==='published'?'published':'draft',video=videoUrl(b.videoUrl),img=imageUrl(b.imageUrl);if(b.videoUrl&&!video)return fail('Use URL válida do YouTube.');if(b.imageUrl&&!img)return fail('URL de imagem inválida.');await env.DB.prepare('INSERT INTO content(id,kind,title,summary,body,video_url,image_url,status) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,title=excluded.title,summary=excluded.summary,body=excluded.body,video_url=excluded.video_url,image_url=excluded.image_url,status=excluded.status,updated_at=CURRENT_TIMESTAMP').bind(id,b.kind,title,summary,txt,video,img,status).run();return json({ok:true,id})}
 if(path.startsWith('/api/admin/content/')&&method==='DELETE'){const id=path.split('/').pop();await env.DB.prepare('DELETE FROM content WHERE id=?').bind(id).run();return json({ok:true})}
 if(path==='/api/admin/media'&&method==='POST'){const ct=req.headers.get('content-type')||'';if(!ct.includes('multipart/form-data'))return fail('Envie um arquivo de imagem.');const form=await req.formData(),f=form.get('image');if(!(f instanceof File))return fail('Arquivo ausente.');if(f.size>2*1024*1024||f.size<1)return fail('Imagem deve ter no máximo 2 MB.');const mime=f.type;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(mime))return fail('Formato não permitido.');const id=random(),data=await f.arrayBuffer();await env.DB.prepare('INSERT INTO media(id,mime,data) VALUES(?,?,?)').bind(id,mime,data).run();return json({url:'/media/'+id,id},201)}
 return fail('Rota não encontrada.',404)
}
export default {async fetch(req,env){try{const url=new URL(req.url);if(url.pathname.startsWith('/api/'))return await api(req,env,url);if(url.pathname.startsWith('/media/')){const id=url.pathname.split('/')[2];if(!/^[a-f0-9-]{36}$/.test(id||''))return new Response('Not found',{status:404});const m=await env.DB.prepare('SELECT mime,data FROM media WHERE id=?').bind(id).first();if(!m)return new Response('Not found',{status:404});return new Response(m.data,{headers:{'content-type':m.mime,'cache-control':'public, max-age=86400','x-content-type-options':'nosniff'}})}return env.ASSETS.fetch(req)}catch(e){console.error(e);return fail('Erro interno. Verifique o banco D1 e os logs do Worker.',500)}}};
