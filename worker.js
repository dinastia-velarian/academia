const ADMIN_PERMISSION_KEYS=['content','students','certificates','comments','notices','suggestions','reports','settings','media'];
const adminOwner=u=>usernameKey(u?.username)==='victor velarian';
async function adminPermissions(env,u){
 if(adminOwner(u))return Object.fromEntries(ADMIN_PERMISSION_KEYS.map(k=>[k,true]));
 const row=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('admin_permissions:'+u.id).first();
 if(!row)return Object.fromEntries(ADMIN_PERMISSION_KEYS.map(k=>[k,true]));
 try{const saved=JSON.parse(row.value);return Object.fromEntries(ADMIN_PERMISSION_KEYS.map(k=>[k,saved[k]===true]))}catch{return Object.fromEntries(ADMIN_PERMISSION_KEYS.map(k=>[k,false]))}
}
function permissionFor(path,method){
 if(path==='/api/admin/administrators'||path.startsWith('/api/admin/administrators/'))return null;
 if(path==='/api/admin/hub')return null;
 if(path==='/api/admin/hub-action')return null;
 if(path.includes('certificate'))return 'certificates';
 if(path.includes('student'))return 'students';
 if(path.includes('comment'))return 'comments';
 if(path.includes('statistics')||path.includes('history')||path.includes('backup'))return 'reports';
 if(path.includes('media'))return 'media';
 if(path.includes('sponsors'))return 'content';
 if(path.includes('settings'))return 'settings';
 if(path.includes('topic')||path.includes('lesson')||path.includes('catalog')||path.includes('content'))return 'content';
 return null;
}
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
async function ensureHub(env){await env.DB.batch([
 env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_messages (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,kind TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',reply TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_notices (id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_certificates (id TEXT PRIMARY KEY,user_id TEXT NOT NULL UNIQUE,code TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_events (id TEXT PRIMARY KEY,user_id TEXT,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,created_at INTEGER NOT NULL)")
 ])}
async function certificateEligibility(env,userId){
 const asset=await env.ASSETS.fetch(new Request('https://academy.internal/approved-lessons.json'));
 if(!asset.ok)throw Error('Catálogo de aulas indisponível para certificação.');
 const approved=await asset.json();
 const lessonMap=new Map((approved.items||[]).filter(x=>[0,1,2,4,5,8].includes(x.topic)).map(x=>[x.topic+':'+x.index,x]));
 const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'lesson_v4:%' OR key LIKE 'lesson_v5:%' OR key LIKE 'lesson_v6:%' OR key LIKE 'lesson_v8:%' OR key LIKE 'lesson_v14:%'").all();
 for(const row of rows.results||[]){try{const x=JSON.parse(row.value);if([0,1,2,4,5,8].includes(x.topic))lessonMap.set(x.topic+':'+x.index,x)}catch{}}
 const orders=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'lesson_order_v2:%'").all();
 const defaultIndexes={0:[0,1,2,3],1:[0,1,2,3,4,5,6],2:[0,1,2,3,4,5],4:[0,1,2,3,4],5:Array.from({length:13},(_,i)=>i),8:Array.from({length:10},(_,i)=>i)};
 const visible=new Set();
 for(const topic of [0,1,2,4,5,8]){
  const row=(orders.results||[]).find(r=>r.key==='lesson_order_v2:'+topic);
  let order=defaultIndexes[topic];try{const parsed=JSON.parse(row?.value);if(Array.isArray(parsed))order=parsed}catch{}
  for(const index of order)if(Number.isInteger(index)&&lessonMap.has(topic+':'+index))visible.add('t'+topic+'-l'+index);
 }
 const progress=await env.DB.prepare('SELECT lesson_key FROM student_progress WHERE user_id=?').bind(userId).all();
 const completed=(progress.results||[]).filter(x=>visible.has(x.lesson_key)).length;
 return {total:visible.size,completed,required:Math.ceil(visible.size*0.8),eligible:visible.size>0&&completed>=Math.ceil(visible.size*0.8)};
}
const xmlEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function generatedCertificateSvg(username,code,issuedAt){
 const name=xmlEscape(username),registration=xmlEscape(code),date=xmlEscape(new Date(issuedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}));
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="990" viewBox="0 0 1400 990" role="img" aria-label="Certificado Academia Velarian"><rect width="1400" height="990" fill="#111015"/><rect x="35" y="35" width="1330" height="920" rx="10" fill="#19171b" stroke="#c7a565" stroke-width="5"/><rect x="56" y="56" width="1288" height="878" fill="none" stroke="#705b39" stroke-width="2"/><text x="700" y="190" fill="#d6b77a" text-anchor="middle" font-family="Georgia,serif" font-size="37" letter-spacing="9">ACADEMIA VELARIAN</text><text x="700" y="315" fill="#f6e9cd" text-anchor="middle" font-family="Georgia,serif" font-size="82">CERTIFICADO</text><text x="700" y="405" fill="#d8cbb4" text-anchor="middle" font-family="Georgia,serif" font-size="27">Certificamos a conclusão dos requisitos acadêmicos por</text><text x="700" y="535" fill="#e8c68b" text-anchor="middle" font-family="Georgia,serif" font-size="49" textLength="1080" lengthAdjust="spacingAndGlyphs">${name}</text><text x="700" y="618" fill="#d8cbb4" text-anchor="middle" font-family="Georgia,serif" font-size="27">com aprovação da administração da Academia Velarian.</text><path d="M330 690 H1070" stroke="#a98953" stroke-width="2"/><text x="700" y="765" fill="#e5d5b7" text-anchor="middle" font-family="Georgia,serif" font-size="25">Registro: ${registration}</text><text x="700" y="817" fill="#e5d5b7" text-anchor="middle" font-family="Georgia,serif" font-size="25">Data de emissão: ${date}</text><text x="700" y="892" fill="#b59a70" text-anchor="middle" font-family="Georgia,serif" font-size="19">Diplomacia • Formação e desenvolvimento de jogadores</text></svg>`;
}

const HELVETICA_WIDTHS=[761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
function generatedCertificatePdf(username,code,issuedAt){
 const clean=v=>String(v).normalize('NFC').replace(/[^\u0020-\u007e\u00a0-\u00ff]/g,'?');
 const esc=v=>clean(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
 const date=new Date(issuedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
 const line=(value,x,y,size)=>'BT /F1 '+size+' Tf 1 0 0 1 '+x+' '+y+' Tm ('+esc(value)+') Tj ET';
 const displayName=clean(username).slice(0,48);
 const nameUnits=[...displayName].reduce((sum,c)=>sum+HELVETICA_WIDTHS[c.charCodeAt(0)],0)/1000;
 const nameSize=Math.min(34,712/Math.max(1,nameUnits));
 const serif=(value,x,y,size)=>'BT /F2 '+size+' Tf 1 0 0 1 '+x+' '+y+' Tm ('+esc(value)+') Tj ET';
 const centered=(value,y,size,font='F1')=>{const units=[...clean(value)].reduce((sum,c)=>sum+(HELVETICA_WIDTHS[c.charCodeAt(0)]||556),0)/1000;return 'BT /'+font+' '+size+' Tf 1 0 0 1 '+Math.max(45,(842-units*size)/2)+' '+y+' Tm ('+esc(value)+') Tj ET'};
 const rays=[];for(let k=0;k<24;k++){const a=k*Math.PI/12;const x=421+Math.cos(a)*48,y=451+Math.sin(a)*48,xx=421+Math.cos(a)*58,yy=451+Math.sin(a)*58;rays.push(x.toFixed(2)+' '+y.toFixed(2)+' m '+xx.toFixed(2)+' '+yy.toFixed(2)+' l S')}
 const commands=[
 '0.055 0.051 0.068 rg 0 0 842 595 re f',
 '0.095 0.084 0.096 rg 18 18 806 559 re f',
 '0.73 0.56 0.31 RG 2.5 w 24 24 794 547 re S',
 '0.42 0.32 0.19 RG 0.8 w 34 34 774 527 re S',
 '0.27 0.21 0.15 RG 0.5 w 45 45 752 505 re S',
 '0.75 0.59 0.34 RG 1 w 50 530 m 126 530 l S 716 530 m 792 530 l S',
 '0.75 0.59 0.34 RG 1 w 50 65 m 126 65 l S 716 65 m 792 65 l S',
 '0.58 0.43 0.25 RG 0.8 w 465 451 m 465 475.3 445.3 495 421 495 c 396.7 495 377 475.3 377 451 c 377 426.7 396.7 407 421 407 c 445.3 407 465 426.7 465 451 c S',
 '0.82 0.65 0.36 RG 1.2 w',...rays,
 '0.72 0.56 0.30 rg',centered('V',439,39,'F2'),
 '0.86 0.71 0.46 rg',centered('ACADEMIA VELARIAN',377,21,'F2'),
 '0.54 0.44 0.31 rg',centered('VALOR NON MORITUR',353,10),
 '0.92 0.85 0.73 rg',centered('CERTIFICADO DE CONCLUSÃO',303,30,'F2'),
 '0.72 0.56 0.33 RG 1 w 240 284 m 602 284 l S',
 '0.86 0.81 0.74 rg',centered('A Academia Velarian certifica que',255,15),
 '0.95 0.79 0.50 rg',line(displayName,(842-nameUnits*nameSize)/2,202,nameSize),
 '0.86 0.81 0.74 rg',centered('cumpriu os requisitos de formação e conclusão acadêmica,',166,14),
 centered('com aprovação da administração da Academia.',145,14),
 '0.67 0.52 0.31 RG 0.8 w 146 119 m 696 119 l S',
 '0.82 0.71 0.53 rg',line('REGISTRO',149,99,10),line('EMISSÃO',536,99,10),
 '0.94 0.86 0.73 rg',line(code,149,80,13),line(date,536,80,13),
 '0.63 0.53 0.39 rg',centered('DIPLOMACIA  •  CONHECIMENTO, ESTRATÉGIA E LEGADO',49,10)
 ].join('\n')+'\n';
 const bytes=[];const append=t=>{for(let i=0;i<t.length;i++)bytes.push(t.charCodeAt(i)&255)};
 const offsets=[0];append('%PDF-1.4\n');
 const obj=(n,content)=>{offsets[n]=bytes.length;append(n+' 0 obj\n'+content+'\nendobj\n')};
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>');
 obj(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 obj(5,'<< /Length '+commands.length+' >>\nstream\n'+commands+'endstream');
 obj(6,'<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
 const xref=bytes.length;append('xref\n0 7\n0000000000 65535 f \n');for(let i=1;i<=6;i++)append(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 append('trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 return new Uint8Array(bytes);
}

async function ensureCertificateImages(env){await env.DB.prepare('CREATE TABLE IF NOT EXISTS academy_certificate_images (user_id TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL, updated_at INTEGER NOT NULL)').run()}
async function hubLog(env,userId,actor,action,detail){await ensureHub(env);await env.DB.prepare('INSERT INTO academy_events(id,user_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').bind(random(),userId||null,actor,action,String(detail).slice(0,500),Date.now()).run()}
async function recordLastLogin(env,u){if(u.role!=='student')return;await env.DB.prepare("CREATE TABLE IF NOT EXISTS student_last_login (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,logged_at INTEGER NOT NULL)").run();await env.DB.prepare("INSERT INTO student_last_login(user_id,logged_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET logged_at=excluded.logged_at").bind(u.id,Date.now()).run()}
async function ensureStudentBlocks(env){await env.DB.prepare("CREATE TABLE IF NOT EXISTS student_blocks (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, blocked_at INTEGER NOT NULL)").run()}
async function rateLimit(env,key){const now=Date.now(),start=now-60*1000;const r=await env.DB.prepare('SELECT count,window_start FROM login_attempts WHERE key=?').bind(key).first();if(r&&r.window_start>start&&r.count>=30)return true;await env.DB.prepare('INSERT INTO login_attempts(key,count,window_start) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_start<? THEN 1 ELSE count+1 END,window_start=CASE WHEN window_start<? THEN ? ELSE window_start END').bind(key,now,start,start,now).run();return false}
async function api(req,env,url){const path=url.pathname,method=req.method;
 if(method!=='GET'&&!originOK(req))return fail('Origem não autorizada.',403);
 if(path==='/api/visit'&&method==='POST'){const b=await body(req),id=String(b?.session||'');if(!/^[a-f0-9-]{36}$/.test(id))return fail('Sessão inválida.');await env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_site_visits (session_id TEXT PRIMARY KEY,created_at INTEGER NOT NULL)").run();await env.DB.prepare('INSERT OR IGNORE INTO academy_site_visits(session_id,created_at) VALUES(?,?)').bind(id,Date.now()).run();return json({ok:true})}
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
 // Entrada unica: identifica o papel no servidor sem tentar autenticar duas vezes.
 if(path==='/api/auth/login'&&method==='POST'){
  const b=await body(req),name=usernameKey(b?.username),password=b?.password;
  if(!name||typeof password!=='string')return fail('Informe seu usuário e sua senha.',400);
  const ip=req.headers.get('cf-connecting-ip')||'unknown';
  if(await rateLimit(env,'unified-login:'+ip+':'+name))return fail('Muitas tentativas de acesso. Tente novamente em instantes.',429);
  const u=await env.DB.prepare('SELECT * FROM users WHERE username_key=?').bind(name).first();
  if(!u||await derive(password,u.salt,u.iterations)!==u.password_hash)return fail('Usuário ou senha inválidos.',401);
  if(u.role==='student'){await ensureStudentBlocks(env);if(await env.DB.prepare('SELECT user_id FROM student_blocks WHERE user_id=?').bind(u.id).first())return fail('Seu cadastro está bloqueado. Entre em contato com a administração.',403)}
  const session=await makeSession(env,u);await recordLastLogin(env,u);
  const cookie=u.role==='admin'?setCookie(session.t,7*86400):`av_student=${session.t}; Path=/api/student; HttpOnly; Secure; SameSite=Strict; Max-Age=${7*86400}`;
  return json({user:session.user},200,{'set-cookie':cookie});
 }
 // Contas opcionais de alunos: sessão separada do administrador.
 if(path.startsWith('/api/student/')){
  const cookie=req.headers.get('cookie')||'';
  const sessionToken=cookie.match(/(?:^|;\s*)av_student=([a-f0-9]{64})(?:;|$)/)?.[1];
  const studentCookie=(t,age)=>`av_student=${t}; Path=/api/student; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
  await ensureStudentBlocks(env);
  const student=async()=>sessionToken?env.DB.prepare("SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN student_blocks b ON b.user_id=u.id WHERE s.id_hash=? AND s.expires_at>? AND u.role='student' AND b.user_id IS NULL").bind(await sha(sessionToken),Date.now()).first():null;
  if(path==='/api/student/register'&&method==='POST'){
   const b=await body(req);const name=normalize(b?.username),password=b?.password;
   if(!validName(name)||typeof password!=='string'||password.length<6||password.length>128)return fail('Informe nome válido e senha de 6 a 128 caracteres.');
   const ip=req.headers.get('cf-connecting-ip')||'unknown';
   if(await rateLimit(env,'student-register:'+ip))return fail('Muitas tentativas de acesso. Tente novamente em instantes.',429);
   const id=random(),salt=token(),hash=await derive(password,salt);
   try{await env.DB.prepare("INSERT INTO users(id,username,username_key,password_hash,salt,iterations,role) VALUES(?,?,?,?,?,?,'student')").bind(id,name,usernameKey(name),hash,salt,iter).run()}
   catch(e){if(/UNIQUE|CONSTRAINT/i.test(String(e)))return fail('Nome de jogador já cadastrado.',409);throw e}
   const session=await makeSession(env,{id,username:name,role:'student'});
   await recordLastLogin(env,{id,role:'student'});
   return json({user:session.user},201,{'set-cookie':studentCookie(session.t,7*86400)});
  }
  if(path==='/api/student/login'&&method==='POST'){
   const b=await body(req),name=usernameKey(b?.username),password=b?.password,ip=req.headers.get('cf-connecting-ip')||'unknown';
   if(!name||typeof password!=='string')return fail('Usuário ou senha inválidos.',401);
   if(await rateLimit(env,'student-login:'+ip+':'+name))return fail('Muitas tentativas de acesso. Tente novamente em instantes.',429);
   const u=await env.DB.prepare("SELECT * FROM users WHERE username_key=? AND role='student'").bind(name).first();
   if(!u||await derive(password,u.salt,u.iterations)!==u.password_hash)return fail('Usuário ou senha inválidos.',401);
   if(await env.DB.prepare('SELECT user_id FROM student_blocks WHERE user_id=?').bind(u.id).first())return fail('Seu cadastro está bloqueado. Entre em contato com a administração.',403);
   const session=await makeSession(env,u);await recordLastLogin(env,u);await hubLog(env,u.id,u.username,'login','Acesso ao painel do aluno');return json({user:session.user},200,{'set-cookie':studentCookie(session.t,7*86400)});
  }
  if(path==='/api/student/me'&&method==='GET'){const me=await student();if(me)await recordLastLogin(env,{id:me.id,role:'student'});return json({user:me})}
  if(path==='/api/student/certificate-pdf'&&method==='GET'){const me=await student();if(!me)return fail('Acesso não autorizado.',401);await ensureHub(env);const cert=await env.DB.prepare("SELECT code,status,updated_at FROM academy_certificates WHERE user_id=?").bind(me.id).first();if(cert?.status!=='approved')return fail('Certificado ainda não aprovado.',403);return new Response(generatedCertificatePdf(me.username,cert.code,cert.updated_at),{headers:{'content-type':'application/pdf','cache-control':'private, no-store','content-disposition':'attachment; filename="certificado-academia-velarian.pdf"','x-content-type-options':'nosniff'}})}
  if(path==='/api/student/certificate-image'&&method==='GET'){const me=await student();if(!me)return fail('Acesso não autorizado.',401);await ensureHub(env);await ensureCertificateImages(env);const cert=await env.DB.prepare("SELECT status,code,updated_at FROM academy_certificates WHERE user_id=?").bind(me.id).first();if(cert?.status!=='approved')return fail('Certificado ainda não aprovado.',403);const img=await env.DB.prepare('SELECT mime,data FROM academy_certificate_images WHERE user_id=?').bind(me.id).first();if(!img){const svg=generatedCertificateSvg(me.username,cert.code,cert.updated_at);return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'private, no-store','content-disposition':'inline; filename="certificado-velarian.svg"','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"}})}return new Response(img.data,{headers:{'content-type':img.mime,'cache-control':'private, no-store','content-disposition':'inline; filename="certificado-velarian.png"','x-content-type-options':'nosniff'}})}
  if(path==='/api/student/logout'&&method==='POST'){
   if(sessionToken)await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha(sessionToken)).run();
   return json({ok:true},200,{'set-cookie':studentCookie('',0)});
  }
  const u=await student();if(!u)return fail('Entre na sua conta para salvar o progresso.',401);
  if(path==='/api/student/certificate-eligibility'&&method==='GET'){await env.DB.prepare('CREATE TABLE IF NOT EXISTS student_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_key TEXT NOT NULL, completed_at INTEGER NOT NULL, PRIMARY KEY(user_id,lesson_key))').run();return json(await certificateEligibility(env,u.id))}
  if(path==='/api/student/hub'&&method==='GET'){await ensureHub(env);const messages=await env.DB.prepare('SELECT id,kind,body,status,reply,created_at AS createdAt FROM academy_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(u.id).all();const cert=await env.DB.prepare('SELECT code,status,created_at AS createdAt,updated_at AS updatedAt FROM academy_certificates WHERE user_id=?').bind(u.id).first();await ensureCertificateImages(env);const img=await env.DB.prepare('SELECT user_id FROM academy_certificate_images WHERE user_id=?').bind(u.id).first();return json({messages:messages.results||[],certificate:cert?{...cert,hasImage:!!img||cert.status==='approved',generated:!img&&cert.status==='approved'}:null})}
  if(path==='/api/student/hub'&&method==='POST'){
   const b=await body(req),kind=String(b?.kind||''),bodyText=String(b?.body||'').trim();
   if(!['suggestion','certificate'].includes(kind))return fail('Solicitação inválida.');
   if(kind==='suggestion'&&(bodyText.length<10||bodyText.length>1500))return fail('Escreva entre 10 e 1.500 caracteres.');
   await ensureHub(env);
   if(kind==='certificate'){
    const existing=await env.DB.prepare('SELECT id,status FROM academy_certificates WHERE user_id=?').bind(u.id).first();
    if(existing&&existing.status!=='rejected')return fail('Já existe uma solicitação de certificado: '+existing.status,409);
    const eligibility=await certificateEligibility(env,u.id);
    if(!eligibility.eligible)return fail('Conclua pelo menos '+eligibility.required+' das '+eligibility.total+' aulas disponíveis para solicitar o certificado.');
    const result=await env.DB.prepare("INSERT INTO academy_certificates(id,user_id,code,status,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status='pending',updated_at=excluded.updated_at WHERE academy_certificates.status='rejected'").bind(random(),u.id,'AV-'+token().slice(0,12).toUpperCase(),'pending',Date.now(),Date.now()).run();
    if(!result.meta?.changes)return fail('Já existe uma solicitação de certificado em análise ou aprovada.',409);
   }else{
    const recent=await env.DB.prepare("SELECT created_at FROM academy_messages WHERE user_id=? AND kind='suggestion' ORDER BY created_at DESC LIMIT 1").bind(u.id).first();
    if(recent&&Date.now()-Number(recent.created_at)<60000)return fail('Aguarde um minuto antes de enviar outra sugestão.',429);
    await env.DB.prepare('INSERT INTO academy_messages(id,user_id,kind,body,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(random(),u.id,kind,bodyText,Date.now(),Date.now()).run();
   }
   await hubLog(env,u.id,u.username,'student_'+kind,kind);return json({ok:true},201);
  }
  if(path==='/api/student/comments'&&method==='POST'){
   const b=await body(req),comment=String(b?.body||'').trim();
   if(comment.length<3||comment.length>1000)return fail('Escreva um comentário de 3 a 1.000 caracteres.');
   await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_comments (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at INTEGER NOT NULL)").run();
   const recent=await env.DB.prepare('SELECT created_at FROM site_comments WHERE user_id=? ORDER BY created_at DESC LIMIT 1').bind(u.id).first();
   if(recent&&Date.now()-Number(recent.created_at)<60000)return fail('Aguarde um minuto antes de comentar novamente.',429);
   await env.DB.prepare('INSERT INTO site_comments(id,user_id,body,created_at) VALUES(?,?,?,?)').bind(random(),u.id,comment,Date.now()).run();await hubLog(env,u.id,u.username,'comment_posted',comment.slice(0,120));
   return json({ok:true},201);
  }
  if(path==='/api/student/change-password'&&method==='POST'){
   const b=await body(req),old=b?.currentPassword,next=b?.newPassword;
   if(typeof old!=='string'||typeof next!=='string'||next.length<6||next.length>128)return fail('Use uma nova senha de 6 a 128 caracteres.');
   const account=await env.DB.prepare("SELECT password_hash,salt,iterations FROM users WHERE id=? AND role='student'").bind(u.id).first();
   if(!account||await derive(old,account.salt,account.iterations)!==account.password_hash)return fail('Senha atual incorreta.',401);
   const salt=token(),hash=await derive(next,salt);
   await env.DB.prepare("UPDATE users SET password_hash=?,salt=?,iterations=? WHERE id=? AND role='student'").bind(hash,salt,iter,u.id).run();
   return json({ok:true});
  }
  if(path==='/api/student/progress')await env.DB.prepare('CREATE TABLE IF NOT EXISTS student_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_key TEXT NOT NULL, completed_at INTEGER NOT NULL, PRIMARY KEY(user_id,lesson_key))').run();
  if(path==='/api/student/progress'&&method==='GET'){
   const rows=await env.DB.prepare('SELECT lesson_key,completed_at FROM student_progress WHERE user_id=?').bind(u.id).all();
   return json({items:rows.results||[]});
  }
  if(path==='/api/student/progress'&&method==='POST'){
   const b=await body(req),key=b?.lessonKey;
   if(typeof key!=='string'||!/^t[0-8]-l(?:0|[1-9]\d?|1\d\d)$/.test(key)||typeof b.completed!=='boolean')return fail('Aula inválida.');
   if(b.completed)await env.DB.prepare('INSERT INTO student_progress(user_id,lesson_key,completed_at) VALUES(?,?,?) ON CONFLICT(user_id,lesson_key) DO NOTHING').bind(u.id,key,Date.now()).run();
   else await env.DB.prepare('DELETE FROM student_progress WHERE user_id=? AND lesson_key=?').bind(u.id,key).run();
   await hubLog(env,u.id,u.username,b.completed?'lesson_completed':'lesson_unmarked',key);
   return json({ok:true});
  }
  return fail('Rota não encontrada.',404);
 }

 if(path==='/api/login'&&method==='POST'){
  const b=await body(req);if(!b)return fail('Dados inválidos.');const name=usernameKey(b.username),ip=req.headers.get('cf-connecting-ip')||'unknown';try{if(await rateLimit(env,'login:'+ip+':'+name))return fail('Muitas tentativas de acesso. Tente novamente em instantes.',429)}catch(error){console.error('ADMIN_LOGIN_RATE_LIMIT_ERROR',error?.message);return fail('Falha no controle de tentativas de login. Consulte os logs do Worker.',500)}
  const u=await env.DB.prepare("SELECT * FROM users WHERE username_key=? AND role='admin'").bind(name).first();if(!u||typeof b.password!=='string')return fail('Usuário ou senha inválidos.',401);
  let candidate;try{candidate=await derive(b.password,u.salt,u.iterations)}catch(error){console.error('ADMIN_LOGIN_HASH_ERROR',error?.message);return fail('Erro na verificação da senha.',500)}if(candidate!==u.password_hash)return fail('Usuário ou senha inválidos.',401);
  let session;try{session=await makeSession(env,u)}catch(error){console.error('ADMIN_LOGIN_SESSION_ERROR',error?.message);return fail('Erro ao iniciar a sessão administrativa.',500)}return json({user:session.user},200, {'set-cookie':setCookie(session.t,7*86400)});
 }
 if(path==='/api/me'&&method==='GET'){const u=await current(req,env);return json({user:u?.role==='admin'?u:null})}
 if(path==='/api/logout'&&method==='POST'){const m=(req.headers.get('cookie')||'').match(/av_session=([a-f0-9]{64})/);if(m)await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha(m[1])).run();return json({ok:true},200,{'set-cookie':setCookie('',0)})}
 if(path==='/api/topics'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'topic:%' OR key LIKE 'topic_v2:%'").all();const items=new Map();for(const x of rows.results||[]){try{const v=JSON.parse(x.value);if(x.key.startsWith('topic_v2:'))items.set(v.index,v);else if(v.index>=1&&v.index<=7)items.set(v.index+1,{...v,index:v.index+1})}catch{}}return json({items:[...items.values()]})}
 if(path==='/api/topic-videos'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'topic_video:%'").all();return json({items:(rows.results||[]).map(x=>{try{return {topic:Number(x.key.split(':')[1]),videoUrl:JSON.parse(x.value)}}catch{return null}}).filter(Boolean)})}
 if(path==='/api/topic-order'&&method==='GET'){const row=await env.DB.prepare("SELECT value FROM settings WHERE key='topic_display_order'").first();let order=[];try{order=JSON.parse(row?.value||'[]')}catch{}return json({order:Array.isArray(order)?order:[]})}
 if(path==='/api/lesson-order'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'lesson_order:%' OR key LIKE 'lesson_order_v2:%'").all();const items=new Map();for(const x of rows.results||[]){try{const old=x.key.startsWith('lesson_order:');const n=Number(x.key.split(':')[1]);if(old&&n===0)continue;const topic=old?n+1:n;if(old&&items.has(topic))continue;items.set(topic,{topic,order:JSON.parse(x.value)})}catch{}}return json({items:[...items.values()]})}
 if(path==='/api/lessons'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'lesson:%' OR key LIKE 'lesson_v2:%' OR key LIKE 'lesson_v3:%' OR key LIKE 'lesson_v4:%' OR key LIKE 'lesson_v5:%' OR key LIKE 'lesson_v6:%' OR key LIKE 'lesson_v7:%' OR key LIKE 'lesson_v8:%' OR key LIKE 'lesson_v9:%' OR key LIKE 'lesson_v10:%' OR key LIKE 'lesson_v11:%' OR key LIKE 'lesson_v12:%' OR key LIKE 'lesson_v13:%' OR key LIKE 'lesson_v14:%'").all();const items=new Map();for(const x of rows.results||[]){try{const v=JSON.parse(x.value);const old=x.key.startsWith('lesson:');if(old&&(v.topic===0||v.topic===1||v.topic===3))continue;if((x.key.startsWith('lesson_v2:')||x.key.startsWith('lesson_v3:'))&&v.topic===2)continue;if(x.key.startsWith('lesson_v9:')&&v.topic===5)continue;if((v.topic===5||v.topic===8)&&!x.key.startsWith('lesson_v14:'))continue;if(x.key.startsWith('lesson_v2:')&&(v.topic===1||v.topic===0||v.topic===3||v.topic===4||v.topic===5||v.topic===6||v.topic===7||v.topic===8))continue;const topic=old?v.topic+1:v.topic;items.set(topic+':'+v.index,{...v,topic})}catch{}}return json({items:[...items.values()]})}
 if(path==='/api/catalog'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'catalog:%'").all();return json({items:rows.results||[]})}
 if(path==='/api/public'&&method==='GET'){const s=await env.DB.prepare('SELECT key,value FROM settings').all();const c=await env.DB.prepare("SELECT id,kind,title,summary,body,video_url AS videoUrl,image_url AS imageUrl FROM content WHERE status='published' ORDER BY updated_at DESC").all();return json({settings:Object.fromEntries((s.results||[]).filter(x=>!x.key.includes(':')).map(x=>[x.key,x.value])),content:(c.results||[]).map(x=>{const m=(s.results||[]).find(z=>z.key==='content_meta:'+x.id);let meta={};try{meta=JSON.parse(m?.value||'{}')}catch{}return {...x,...meta}})})}
 if(path==='/api/academy/notices'&&method==='GET'){await ensureHub(env);const rows=await env.DB.prepare('SELECT id,title,body,created_at AS createdAt FROM academy_notices WHERE active=1 ORDER BY created_at DESC LIMIT 10').all();return json({items:rows.results||[]})}
 if(path==='/api/academy/certificate'&&method==='GET'){await ensureHub(env);const code=String(url.searchParams.get('code')||'').trim().toUpperCase();if(!/^[A-Z0-9-]{8,36}$/.test(code))return fail('Código inválido.',400);const row=await env.DB.prepare("SELECT c.code,c.status,u.username FROM academy_certificates c JOIN users u ON u.id=c.user_id WHERE c.code=? AND c.status='approved'").bind(code).first();return json({valid:!!row,certificate:row||null})}
 if(path==='/api/comments'&&method==='GET'){
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_comments (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at INTEGER NOT NULL)").run();
  const rows=await env.DB.prepare("SELECT c.id,c.body,c.created_at AS createdAt,u.username FROM site_comments c JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC LIMIT 100").all();
  const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM site_comments').first();
  return json({items:rows.results||[],total:Number(count?.total||0)});
 }
 if(path==='/api/comments'&&method==='POST'){
  const b=await body(req),comment=String(b?.body||'').trim();
  if(comment.length<3||comment.length>1000)return fail('Escreva um comentário de 3 a 1.000 caracteres.');
  const user=await current(req,env);
  let author=user;
  if(!author){
   const cookie=req.headers.get('cookie')||'',t=cookie.match(/(?:^|;\s*)av_student=([a-f0-9]{64})(?:;|$)/)?.[1];
   if(t){await ensureStudentBlocks(env);author=await env.DB.prepare("SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN student_blocks b ON b.user_id=u.id WHERE s.id_hash=? AND s.expires_at>? AND b.user_id IS NULL").bind(await sha(t),Date.now()).first()}
  }
  if(!author)return fail('Entre na sua conta para comentar.',401);
  const recent=await env.DB.prepare('SELECT created_at FROM site_comments WHERE user_id=? ORDER BY created_at DESC LIMIT 1').bind(author.id).first().catch(()=>null);
  if(recent&&Date.now()-recent.created_at<60000)return fail('Aguarde um minuto antes de comentar novamente.',429);
  await env.DB.prepare('INSERT INTO site_comments(id,user_id,body,created_at) VALUES(?,?,?,?)').bind(random(),author.id,comment,Date.now()).run();
  return json({ok:true},201);
 }
 if(path==='/api/sponsors'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'sponsor:%'").all();const now=Date.now();const items=(rows.results||[]).flatMap(x=>{try{const a=JSON.parse(x.value);return a.active!==false&&(!a.startAt||Date.parse(a.startAt)<=now)&&(!a.endAt||Date.parse(a.endAt)>=now)?[a]:[]}catch{return []}}).sort((a,b)=>(a.position??1)-(b.position??1));return json({items})}
 const user=await current(req,env);if(!user||user.role!=='admin')return fail('Acesso restrito ao administrador.',403);
 const permissions=await adminPermissions(env,user);
 if(path==='/api/admin/hub-action'&&method==='POST'){const action=await body(req.clone());const actionPermission=action?.kind==='certificate'?'certificates':action?.kind==='notice'||action?.kind==='notice-toggle'?'notices':action?.kind==='suggestion'?'suggestions':null;if(!actionPermission)return fail('Operação administrativa inválida.',400);if(actionPermission&&!permissions[actionPermission])return fail('Sua conta não possui permissão para esta operação.',403)}
 const requiredPermission=permissionFor(path,method);
 if(requiredPermission&&!permissions[requiredPermission])return fail('Sua conta não possui permissão para esta operação.',403);

 if(path==='/api/admin/administrators'&&method==='GET'){if(!adminOwner(user))return fail('Acesso exclusivo do administrador principal.',403);const rows=await env.DB.prepare("SELECT id,username FROM users WHERE role='admin' ORDER BY username").all();const items=await Promise.all((rows.results||[]).map(async u=>({...u,permissions:await adminPermissions(env,u),owner:adminOwner(u)})));return json({items,permissionKeys:ADMIN_PERMISSION_KEYS})}
 if(path==='/api/admin/administrators'&&method==='POST'){if(usernameKey(user.username)!==usernameKey('Victor Velarian'))return fail('Somente o administrador principal pode gerenciar administradores.',403);const b=await body(req);const name=normalize(b?.username),password=b?.password;if(!validName(name)||typeof password!=='string'||password.length<6||password.length>128)return fail('Informe nome válido e senha de 6 a 128 caracteres.');if(await env.DB.prepare('SELECT id FROM users WHERE username_key=?').bind(usernameKey(name)).first())return fail('Nome de usuário já cadastrado.',409);const salt=token(),hash=await derive(password,salt);try{await env.DB.prepare("INSERT INTO users(id,username,username_key,password_hash,salt,iterations,role) VALUES(?,?,?,?,?,?,'admin')").bind(random(),name,usernameKey(name),hash,salt,iter).run()}catch(e){if(/UNIQUE|CONSTRAINT/i.test(String(e.message)))return fail('Nome já cadastrado.',409);throw e}await hubLog(env,user.id,user.username,'admin_created',name);return json({ok:true},201)}
 if(path.startsWith('/api/admin/administrators/')&&method==='PUT'){if(!adminOwner(user))return fail('Acesso exclusivo do administrador principal.',403);const id=path.split('/').pop();const target=await env.DB.prepare("SELECT id,username FROM users WHERE id=? AND role='admin'").bind(id).first();if(!target)return fail('Administrador não encontrado.',404);if(adminOwner(target))return fail('Não é permitido restringir o administrador principal.',403);const b=await body(req);if(!b||typeof b.permissions!=='object'||!b.permissions||Array.isArray(b.permissions)||Object.keys(b.permissions).some(k=>!ADMIN_PERMISSION_KEYS.includes(k))||ADMIN_PERMISSION_KEYS.some(k=>typeof b.permissions[k]!=='boolean'))return fail('Permissões inválidas.',400);await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('admin_permissions:'+id,JSON.stringify(b.permissions)).run();await hubLog(env,user.id,user.username,'admin_permissions_updated',target.username);return json({ok:true,permissions:b.permissions})}
 if(path.startsWith('/api/admin/administrators/')&&method==='DELETE'){if(usernameKey(user.username)!==usernameKey('Victor Velarian'))return fail('Somente o administrador principal pode gerenciar administradores.',403);const id=path.split('/').pop();if(!/^[a-f0-9-]{36}$/.test(id))return fail('Identificador inválido.');const target=await env.DB.prepare("SELECT username FROM users WHERE id=? AND role='admin'").bind(id).first();if(!target)return fail('Administrador não encontrado.',404);if(usernameKey(target.username)===usernameKey('Victor Velarian')||id===user.id)return fail('Não é permitido remover o administrador principal.',403);await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),env.DB.prepare("DELETE FROM users WHERE id=? AND role='admin'").bind(id)]);await hubLog(env,user.id,user.username,'admin_removed',target.username);return json({ok:true})}
 if(path==='/api/admin/certificate-template'&&method==='GET'){await env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_certificate_template (id INTEGER PRIMARY KEY CHECK(id=1), mime TEXT NOT NULL, data BLOB NOT NULL, filename TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();const item=await env.DB.prepare('SELECT filename,updated_at FROM academy_certificate_template WHERE id=1').first();return json({template:item||null})}
 if(path==='/api/admin/certificate-template'&&method==='POST'){const form=await req.formData(),file=form.get('file');if(!(file instanceof File)||file.type!=='application/pdf'||file.size<1||file.size>5*1024*1024)return fail('Selecione um PDF de até 5 MB.');const bytes=await file.arrayBuffer();if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return fail('O arquivo não parece ser um PDF válido.');await env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_certificate_template (id INTEGER PRIMARY KEY CHECK(id=1), mime TEXT NOT NULL, data BLOB NOT NULL, filename TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();await env.DB.prepare('INSERT INTO academy_certificate_template(id,mime,data,filename,updated_at) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET mime=excluded.mime,data=excluded.data,filename=excluded.filename,updated_at=excluded.updated_at').bind('application/pdf',bytes,String(file.name).slice(0,120),Date.now()).run();return json({ok:true})}
 if(path==='/api/admin/certificate-template/download'&&method==='GET'){await env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_certificate_template (id INTEGER PRIMARY KEY CHECK(id=1), mime TEXT NOT NULL, data BLOB NOT NULL, filename TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();const item=await env.DB.prepare('SELECT data FROM academy_certificate_template WHERE id=1').first();if(!item)return fail('Nenhum modelo cadastrado.',404);return new Response(item.data,{headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="modelo-certificado-velarian.pdf"','cache-control':'private, no-store','x-content-type-options':'nosniff'}})}
 if(path==='/api/admin/certificate-image'&&method==='POST'){await ensureHub(env);await ensureCertificateImages(env);const form=await req.formData();const studentId=String(form.get('studentId')||'');const file=form.get('image');if(!(file instanceof File)||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024||file.size<1)return fail('Envie uma imagem PNG, JPG ou WebP de até 3 MB.');const cert=await env.DB.prepare('SELECT status FROM academy_certificates WHERE user_id=?').bind(studentId).first();if(!cert||cert.status!=='approved')return fail('Aprove o certificado do aluno antes de enviar a imagem.',409);await env.DB.prepare('INSERT INTO academy_certificate_images(user_id,mime,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET mime=excluded.mime,data=excluded.data,updated_at=excluded.updated_at').bind(studentId,file.type,await file.arrayBuffer(),Date.now()).run();await hubLog(env,studentId,user.username,'certificate_image_uploaded','Certificado enviado ao painel do aluno');return json({ok:true})}
 if(path==='/api/admin/hub'&&method==='GET'){
  if(!['reports','students','certificates','suggestions','notices'].some(k=>permissions[k]))return fail('Sem permissão para consultar o painel.',403);
  await ensureHub(env);
  const messages=await env.DB.prepare("SELECT m.id,m.user_id AS userId,u.username,m.kind,m.body,m.status,m.reply,m.created_at AS createdAt FROM academy_messages m JOIN users u ON u.id=m.user_id ORDER BY m.created_at DESC LIMIT 200").all();const students=await env.DB.prepare("SELECT username,created_at AS createdAt FROM users WHERE role='student' ORDER BY created_at DESC LIMIT 500").all();
  const certs=await env.DB.prepare("SELECT c.id,c.user_id AS userId,u.username,c.code,c.status,c.created_at AS createdAt FROM academy_certificates c JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC LIMIT 200").all();
  const notices=await env.DB.prepare('SELECT id,title,body,active,created_at AS createdAt FROM academy_notices ORDER BY created_at DESC LIMIT 40').all();
  const events=await env.DB.prepare('SELECT actor,action,detail,created_at AS createdAt FROM academy_events ORDER BY created_at DESC LIMIT 100').all();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_site_visits (session_id TEXT PRIMARY KEY,created_at INTEGER NOT NULL)").run();const visits=await env.DB.prepare('SELECT COUNT(*) AS total FROM academy_site_visits').first();const finances=await env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('financeDonations','financeCertificates','financeSales')").all();return json({messages:permissions.suggestions?messages.results||[]:[],certificates:permissions.certificates?certs.results||[]:[],notices:permissions.notices?notices.results||[]:[],events:permissions.reports?events.results||[]:[],students:permissions.students?students.results||[]:[],siteVisits:permissions.reports?visits?.total||0:0,finances:permissions.reports?Object.fromEntries((finances.results||[]).map(x=>[x.key,x.value])):{}});
 }
 if(path==='/api/admin/hub-action'&&method==='POST'){
  const b=await body(req),kind=String(b?.kind||''),id=String(b?.id||'');
  await ensureHub(env);
  if(kind==='notice'){
   const title=String(b?.title||'').trim(),bodyText=String(b?.body||'').trim();
   if(title.length<3||title.length>120||bodyText.length<3||bodyText.length>1000)return fail('Título ou aviso inválido.');
   await env.DB.prepare('INSERT INTO academy_notices(id,title,body,created_at,active) VALUES(?,?,?,?,1)').bind(random(),title,bodyText,Date.now()).run();
  }else if(kind==='notice-toggle'){
   await env.DB.prepare('UPDATE academy_notices SET active=CASE WHEN active=1 THEN 0 ELSE 1 END WHERE id=?').bind(id).run();
  }else if(kind==='suggestion'){
   if(!['resolved','rejected','pending'].includes(b?.status))return fail('Status inválido.');
   await env.DB.prepare("UPDATE academy_messages SET status=?,reply=?,updated_at=? WHERE id=? AND kind='suggestion'").bind(b.status,String(b.reply||'').slice(0,1500),Date.now(),id).run();
  }else if(kind==='certificate'){
   if(!['approved','rejected','pending'].includes(b?.status))return fail('Status inválido.');
   const target=await env.DB.prepare('SELECT user_id FROM academy_certificates WHERE id=?').bind(id).first();if(!target)return fail('Solicitação não encontrada.',404);
   if(b.status==='approved'){const eligibility=await certificateEligibility(env,target.user_id);if(!eligibility.eligible)return fail('Aluno não atende ao requisito de 80% das aulas disponíveis.',409)}
   await env.DB.prepare('UPDATE academy_certificates SET status=?,updated_at=? WHERE id=?').bind(b.status,Date.now(),id).run();
  }else return fail('Ação inválida.');
  await hubLog(env,null,user.username,'admin_'+kind,id||String(b.title||''));return json({ok:true});
 }
 if(path==='/api/admin/student-profile'&&method==='GET'){
  const id=String(url.searchParams.get('id')||'');const u=await env.DB.prepare("SELECT id,username,created_at AS createdAt FROM users WHERE id=? AND role='student'").bind(id).first();if(!u)return fail('Aluno não encontrado.',404);
  await ensureHub(env);
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_comments (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at INTEGER NOT NULL)").run();const comments=await env.DB.prepare('SELECT id,body,created_at AS createdAt FROM site_comments WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(id).all();
  const events=await env.DB.prepare('SELECT action,detail,created_at AS createdAt FROM academy_events WHERE user_id=? ORDER BY created_at DESC LIMIT 40').bind(id).all();
  const certificate=await env.DB.prepare('SELECT id,code,status,created_at AS createdAt,updated_at AS updatedAt FROM academy_certificates WHERE user_id=?').bind(id).first();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS student_last_login (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,logged_at INTEGER NOT NULL)").run();const login=await env.DB.prepare('SELECT logged_at AS lastLoginAt FROM student_last_login WHERE user_id=?').bind(id).first();const activity=await env.DB.prepare('SELECT MAX(completed_at) AS lastLesson FROM student_progress WHERE user_id=?').bind(id).first();
  return json({student:u,comments:comments.results||[],events:events.results||[],certificate:certificate||null,lastLesson:activity?.lastLesson||null,lastLoginAt:login?.lastLoginAt||null});
 }
 if(path==='/api/admin/statistics'&&method==='GET'){
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS student_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_key TEXT NOT NULL, completed_at INTEGER NOT NULL, PRIMARY KEY(user_id,lesson_key))').run();
  const overview=await env.DB.prepare("SELECT COUNT(*) AS students, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS new30d FROM users WHERE role='student'").bind(Date.now()-30*86400000).first();
  const progress=await env.DB.prepare("SELECT COUNT(*) AS completions, COUNT(DISTINCT user_id) AS learners, SUM(CASE WHEN completed_at >= ? THEN 1 ELSE 0 END) AS completions30d FROM student_progress").bind(Date.now()-30*86400000).first();
  const activity=await env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS active30d FROM student_progress WHERE completed_at >= ?").bind(Date.now()-30*86400000).first();
  const lessons=await env.DB.prepare("SELECT lesson_key AS lessonKey, COUNT(*) AS completions FROM student_progress GROUP BY lesson_key ORDER BY completions DESC,lesson_key ASC LIMIT 10").all();
  const studentTotals=await env.DB.prepare("SELECT u.id,COUNT(p.lesson_key) AS completed FROM users u LEFT JOIN student_progress p ON p.user_id=u.id WHERE u.role='student' GROUP BY u.id").all();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS academy_site_visits (session_id TEXT PRIMARY KEY,created_at INTEGER NOT NULL)").run();
  const visits=await env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last7d, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last30d FROM academy_site_visits").bind(Date.now()-7*86400000,Date.now()-30*86400000).first();

  return json({students:Number(overview?.students||0),new30d:Number(overview?.new30d||0),learners:Number(progress?.learners||0),active30d:Number(activity?.active30d||0),completions:Number(progress?.completions||0),completions30d:Number(progress?.completions30d||0),visits:{total:Number(visits?.total||0),last7d:Number(visits?.last7d||0),last30d:Number(visits?.last30d||0)},topLessons:lessons.results||[],studentTotals:(studentTotals.results||[]).map(x=>Number(x.completed||0))});
 }
 if(path==='/api/admin/students'&&method==='GET'){
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS student_last_login (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,logged_at INTEGER NOT NULL)").run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS student_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_key TEXT NOT NULL, completed_at INTEGER NOT NULL, PRIMARY KEY(user_id,lesson_key))').run();
  await ensureStudentBlocks(env);
  const students=await env.DB.prepare("SELECT u.id,u.username,u.created_at AS createdAt,CASE WHEN b.user_id IS NOT NULL THEN 1 ELSE 0 END AS blocked,COUNT(p.lesson_key) AS completedLessons,MAX(p.completed_at) AS lastProgressAt,MAX(l.logged_at) AS lastLoginAt FROM users u LEFT JOIN student_progress p ON p.user_id=u.id LEFT JOIN student_blocks b ON b.user_id=u.id LEFT JOIN student_last_login l ON l.user_id=u.id WHERE u.role='student' GROUP BY u.id,u.username,u.created_at,b.user_id ORDER BY u.created_at DESC LIMIT 500").all();
  const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM users WHERE role='student'").first();
  return json({total:count?.total||0,items:students.results||[]});
 }
 if(path==='/api/admin/student-detail'&&method==='GET'){
  const id=url.searchParams.get('id')||'';
  const u=await env.DB.prepare("SELECT id,username,created_at AS createdAt FROM users WHERE id=? AND role='student'").bind(id).first();
  if(!u)return fail('Aluno não encontrado.',404);
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS student_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_key TEXT NOT NULL, completed_at INTEGER NOT NULL, PRIMARY KEY(user_id,lesson_key))').run();
  const p=await env.DB.prepare('SELECT lesson_key AS lessonKey,completed_at AS completedAt FROM student_progress WHERE user_id=? ORDER BY completed_at DESC').bind(id).all();
  return json({student:u,progress:p.results||[]});
 }
 if(path==='/api/admin/comment-delete'&&method==='POST'){
  const b=await body(req),id=String(b?.id||'');
  if(!b||b.confirm!==true||!/^[a-f0-9-]{36}$/.test(id))return fail('Confirme a exclusão do comentário.');
  const result=await env.DB.prepare('DELETE FROM site_comments WHERE id=?').bind(id).run();
  return json({ok:true,deleted:result.meta?.changes||0});
 }
 if(path==='/api/admin/student-block'&&method==='POST'){
  const b=await body(req),id=String(b?.id||'');
  if(!b||b.confirm!==true||typeof b.blocked!=='boolean')return fail('Confirme a alteração de acesso.');
  const u=await env.DB.prepare("SELECT id,username FROM users WHERE id=? AND role='student'").bind(id).first();
  if(!u)return fail('Aluno não encontrado.',404);
  await ensureStudentBlocks(env);
  if(b.blocked){await env.DB.batch([env.DB.prepare('INSERT INTO student_blocks(user_id,blocked_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET blocked_at=excluded.blocked_at').bind(id,Date.now()),env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id)])}
  else await env.DB.prepare('DELETE FROM student_blocks WHERE user_id=?').bind(id).run();
  await hubLog(env,id,user.username,b.blocked?'student_blocked':'student_unblocked',u.username);return json({ok:true,blocked:b.blocked,username:u.username});
 }
 if(path==='/api/admin/student-delete'&&method==='POST'){
  const b=await body(req),id=String(b?.id||'');
  if(!b||b.confirm!==true||typeof b.username!=='string')return fail('Confirme a exclusão informando o nome do aluno.');
  const u=await env.DB.prepare("SELECT id,username FROM users WHERE id=? AND role='student'").bind(id).first();
  if(!u)return fail('Aluno não encontrado.',404);
  if(b.username!==u.username)return fail('Nome de confirmação incorreto.');
  await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id).run();
  await env.DB.prepare('DELETE FROM student_progress WHERE user_id=?').bind(id).run();
  const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('student_notes','student_suggestions','student_blocks','site_comments')").all();
  for(const table of tables.results||[])await env.DB.prepare('DELETE FROM '+table.name+' WHERE user_id=?').bind(id).run();
  await ensureHub(env);for(const table of ['academy_messages','academy_certificates','academy_events'])await env.DB.prepare('DELETE FROM '+table+' WHERE user_id=?').bind(id).run();
  await env.DB.prepare("DELETE FROM users WHERE id=? AND role='student'").bind(id).run();
  await hubLog(env,null,user.username,'student_deleted',u.username);
  return json({ok:true,username:u.username});
 }
 if(path==='/api/admin/student-reset'&&method==='POST'){
  const b=await body(req),id=String(b?.id||'');
  if(!b||b.confirm!==true)return fail('Confirme a redefinição da senha.');
  const u=await env.DB.prepare("SELECT id,username FROM users WHERE id=? AND role='student'").bind(id).first();
  if(!u)return fail('Aluno não encontrado.',404);
  const temporaryPassword=token().slice(0,16),salt=token(),hash=await derive(temporaryPassword,salt);
  await env.DB.batch([
   env.DB.prepare('UPDATE users SET password_hash=?,salt=?,iterations=? WHERE id=? AND role=\'student\'').bind(hash,salt,iter,id),
   env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id)
  ]);
  return json({ok:true,username:u.username,temporaryPassword,message:'Senha temporária gerada. Envie apenas ao titular após verificar sua identidade.'});
 }
 if(path==='/api/admin/all'&&method==='GET'){const s=await env.DB.prepare('SELECT key,value FROM settings').all();const c=await env.DB.prepare('SELECT * FROM content ORDER BY updated_at DESC').all();const m=await env.DB.prepare('SELECT id,mime,created_at FROM media ORDER BY created_at DESC LIMIT 100').all();return json({settings:Object.fromEntries((s.results||[]).map(x=>[x.key,x.value])),content:(c.results||[]).map(x=>{const m=(s.results||[]).find(z=>z.key==='content_meta:'+x.id);let meta={};try{meta=JSON.parse(m?.value||'{}')}catch{}return {...x,...meta}}),media:m.results||[]})}
 if(path==='/api/admin/history'&&method==='GET'){const rows=await env.DB.prepare("SELECT value FROM settings WHERE key LIKE 'history:%' LIMIT 200").all();return json({items:(rows.results||[]).map(x=>JSON.parse(x.value))})}
 if(path==='/api/admin/sponsors'&&method==='GET'){const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'sponsor:%'").all();return json({items:(rows.results||[]).flatMap(x=>{try{return [JSON.parse(x.value)]}catch{return []}}).sort((a,b)=>(a.position||1)-(b.position||1))})}
 if(path==='/api/admin/sponsors'&&method==='POST'){const b=await body(req);const id=String(b?.id||crypto.randomUUID());if(!/^[a-zA-Z0-9-]{1,64}$/.test(id))return fail('Identificador inválido.');const title=String(b?.title||'').trim().slice(0,100),description=String(b?.description||'').trim().slice(0,350),url=String(b?.url||'').trim().slice(0,500),image=String(b?.image||'').trim().slice(0,500);if(!title||!url)return fail('Informe título e link.');const safeUrl=x=>{if(!x)return true;try{const u=new URL(x, 'https://academia.velarian.workers.dev');return (u.protocol==='https:'||u.protocol==='http:')&&(x.startsWith('https://')||x.startsWith('http://')||x.startsWith('/media/')||x.startsWith('/assets/'))}catch{return false}};if(!safeUrl(url)||!safeUrl(image))return fail('Use links HTTPS/HTTP ou imagens da biblioteca.');const startAt=String(b?.startAt||'').slice(0,10),endAt=String(b?.endAt||'').slice(0,10);if(startAt&&!Number.isFinite(Date.parse(startAt))||endAt&&!Number.isFinite(Date.parse(endAt))||startAt&&endAt&&startAt>endAt)return fail('Datas inválidas.');const item={id,title,description,url,image,position:b?.position==='master'?0:b?.position==='patrocinador'?1:b?.position==='principal'?0:2,active:b?.active!==false,startAt:startAt||'',endAt:endAt?endAt+'T23:59:59':'',updatedAt:Date.now()};await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('sponsor:'+id,JSON.stringify(item)).run();return json({ok:true,item})}
 if(path==='/api/admin/sponsors'&&method==='DELETE'){const b=await body(req);const id=String(b?.id||'');if(!/^[a-zA-Z0-9-]{1,64}$/.test(id))return fail('Identificador inválido.');await env.DB.prepare('DELETE FROM settings WHERE key=?').bind('sponsor:'+id).run();return json({ok:true})}
 if(path==='/api/admin/topic'&&method==='POST'){const b=await body(req);const index=Number(b?.index);if(!Number.isInteger(index)||index<0||index>8)return fail('Topico invalido.');const item={index,title:String(b.title||'').trim().slice(0,140),desc:String(b.desc||'').trim().slice(0,900),level:String(b.level||'Iniciante'),icon:String(b.icon||'✦').slice(0,8)};if(!item.title||!['Iniciante','Intermediário','Avançado'].includes(item.level))return fail('Dados do topico invalidos.');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('topic_v2:'+index,JSON.stringify(item)).run();return json({ok:true})}
 if(path==='/api/admin/topic-video'&&method==='POST'){const b=await body(req),topic=Number(b?.topic),videoUrl=String(b?.videoUrl||'').trim();if(!Number.isInteger(topic)||topic<0||topic>8||videoUrl.length>400)return fail('Dados do vídeo inválidos.');if(videoUrl){try{const u=new URL(videoUrl),host=u.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');const id=host==='youtu.be'?u.pathname.split('/')[1]:['youtube.com','youtube-nocookie.com'].includes(host)?(u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]):null;if(u.protocol!=='https:'||!/^[A-Za-z0-9_-]{11}$/.test(id||''))return fail('Informe um link válido do YouTube.')}catch{return fail('Informe um link válido do YouTube.')}}await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('topic_video:'+topic,JSON.stringify(videoUrl)).run();return json({ok:true})}
 if(path==='/api/admin/topic-order'&&method==='POST'){const b=await body(req),order=b?.order;if(!Array.isArray(order)||order.length>9||order.some(x=>!Number.isInteger(x)||x<0||x>8)||new Set(order).size!==order.length)return fail('Ordem dos tópicos inválida.',400);await env.DB.prepare("INSERT INTO settings(key,value) VALUES('topic_display_order',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(order)).run();return json({ok:true})}
 if(path==='/api/admin/lesson-order'&&method==='POST'){const b=await body(req),topic=Number(b?.topic),order=b?.order;if(!Number.isInteger(topic)||topic<0||topic>8||!Array.isArray(order)||order.length>100||order.some(x=>!Number.isInteger(x)||x<0||x>199)||new Set(order).size!==order.length)return fail('Ordem invalida.');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('lesson_order_v2:'+topic,JSON.stringify(order)).run();return json({ok:true})}
 if(path==='/api/admin/lesson'&&method==='POST'){const b=await body(req);const topic=Number(b?.topic),index=Number(b?.index);if(!Number.isInteger(topic)||topic<0||topic>8||!Number.isInteger(index)||index<0||index>199)return fail('Subtopico invalido.');const item={topic,index,title:String(b.title||'').trim().slice(0,160),body:String(b.body||'').slice(0,30000),videoUrl:String(b.videoUrl||'').slice(0,400),imageUrl:String(b.imageUrl||'').slice(0,400)};if(!item.title)return fail('Informe o titulo.');if(item.videoUrl&&!videoUrl(item.videoUrl))return fail('Informe um link válido do YouTube.');if(item.imageUrl&&!imageUrl(item.imageUrl))return fail('Informe uma URL válida de imagem.');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind((topic===2?'lesson_v4:':topic===1?'lesson_v5:':topic===0?'lesson_v6:':topic===3?'lesson_v7:':topic===4?'lesson_v8:':topic===5?'lesson_v14:':topic===6?'lesson_v10:':topic===7?'lesson_v11:':topic===8?'lesson_v14:':'lesson_v2:')+topic+':'+index,JSON.stringify(item)).run();return json({ok:true})}
 if(path==='/api/admin/backup'&&method==='GET'){const settings=await env.DB.prepare('SELECT key,value FROM settings').all();const content=await env.DB.prepare('SELECT * FROM content').all();return json({exportedAt:new Date().toISOString(),version:1,settings:settings.results||[],content:content.results||[]})}
 if(path==='/api/admin/catalog'&&method==='POST'){const b=await body(req);if(!b||!['faq','glossary'].includes(b.kind))return fail('Tipo invalido.');const id=/^[a-f0-9-]{36}$/.test(b.id||'')?b.id:random();const item={id,kind:b.kind,title:String(b.title||'').trim().slice(0,150),body:String(b.body||'').slice(0,4000),category:String(b.category||'Geral').slice(0,80)};if(!item.title)return fail('Titulo obrigatorio.');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('catalog:'+id,JSON.stringify(item)).run();return json({ok:true,id})}
 if(path.startsWith('/api/admin/catalog/')&&method==='DELETE'){const id=path.split('/').pop();if(!/^[a-f0-9-]{36}$/.test(id))return fail('Identificador invalido.');await env.DB.prepare('DELETE FROM settings WHERE key=?').bind('catalog:'+id).run();return json({ok:true})}
 if(path==='/api/admin/settings'&&method==='PUT'){const b=await body(req);if(!b||typeof b!=='object')return fail('Dados inválidos.');const allowed=["heroTitle","heroText","aboutText","donationAccountUrl","certificateFee","heroImage","supportImage","brandName","brandMotto","heroEyebrow","heroPrimaryButton","heroSecondaryButton","heroFact1","heroFact2","heroFact3","introFact1","introFact2","introFact3","guidesEyebrow","guidesTitle","guidesDescription","topicsEyebrow","topicsTitle","topicsDescription","certEyebrow","certTitle","certDescription","certButton","certTelegramUrl","aboutEyebrow","aboutTitle","aboutText2","aboutButton","aboutImage","aboutMotto","supportEyebrow","supportTitle","supportDescription","supportNote","supportFinalNote","donationButton","footerMotto","footerDescription","footerSupport","footerTelegramLabel","footerTelegramUrl","brandImage","guidesImage","topicsImage","tradeEnabled","tradePremium1","tradePremium6","tradeDiamonds1k","tradeDiamonds5k","tradeDiamonds15k","tradeDiamonds50k","tradeTelegram","tradePromo","tradeAvailability","financeDonations","financeCertificates","financeSales"];for(const k of allowed){if(!(k in b))continue;let v=String(b[k]||'').slice(0,4000);if(['financeDonations','financeCertificates','financeSales'].includes(k)&&(!/^(?:0|[1-9]\\d*)(?:\\.\\d{1,3})?$/.test(v)||Number(v)>1000000000))return fail('Valor financeiro inválido. Use milhões de moedas, até três casas decimais.');if(['donationAccountUrl','certTelegramUrl','footerTelegramUrl','tradeTelegram'].includes(k)&&v&&!safeUrl(v))return fail('Link de doação deve começar com https://');if(['heroImage','supportImage','aboutImage','brandImage','guidesImage','topicsImage'].includes(k)&&v&&!imageUrl(v))return fail('Imagem precisa ter URL https:// ou caminho /media/ ou /assets/');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,v).run()}return json({ok:true})}
 if(path==='/api/admin/content'&&method==='POST'){const b=await body(req);if(!b||!['guide','topic'].includes(b.kind))return fail('Tipo inválido.');const id=typeof b.id==='string'&&/^[a-f0-9-]{36}$/.test(b.id)?b.id:random();const previous=await env.DB.prepare('SELECT * FROM content WHERE id=?').bind(id).first();if(previous){const historyId=random();await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind('history:'+historyId,JSON.stringify({id:historyId,contentId:id,savedAt:new Date().toISOString(),content:previous})).run();}const title=String(b.title||'').trim().slice(0,140);if(!title)return fail('Título obrigatório.');const summary=String(b.summary||'').slice(0,1000),txt=String(b.body||'').slice(0,50000),status=b.status==='published'?'published':'draft',video=videoUrl(b.videoUrl),img=imageUrl(b.imageUrl);if(b.videoUrl&&!video)return fail('Use URL válida do YouTube.');if(b.imageUrl&&!img)return fail('URL de imagem inválida.');await env.DB.prepare('INSERT INTO content(id,kind,title,summary,body,video_url,image_url,status) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,title=excluded.title,summary=excluded.summary,body=excluded.body,video_url=excluded.video_url,image_url=excluded.image_url,status=excluded.status,updated_at=CURRENT_TIMESTAMP').bind(id,b.kind,title,summary,txt,video,img,status).run();const metadata={category:String(b.category||'Geral').slice(0,60),sortOrder:Math.max(0,Math.min(9999,Number(b.sortOrder)||100))};await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('content_meta:'+id,JSON.stringify(metadata)).run();return json({ok:true,id})}
 if(path.startsWith('/api/admin/content/')&&method==='DELETE'){const id=path.split('/').pop();await env.DB.prepare('DELETE FROM content WHERE id=?').bind(id).run();return json({ok:true})}
 if(path.startsWith('/api/admin/media/')&&method==='DELETE'){
  const id=path.slice('/api/admin/media/'.length);
  if(!/^[a-f0-9-]{36}$/.test(id))return fail('Imagem inválida.',400);
  const found=await env.DB.prepare('SELECT id FROM media WHERE id=?').bind(id).first();
  if(!found)return fail('Imagem não encontrada.',404);
  await env.DB.prepare('DELETE FROM media WHERE id=?').bind(id).run();
  return json({ok:true});
 }
 if(path==='/api/admin/media'&&method==='POST'){const ct=req.headers.get('content-type')||'';if(!ct.includes('multipart/form-data'))return fail('Envie um arquivo de imagem.');const form=await req.formData(),f=form.get('image');if(!(f instanceof File))return fail('Arquivo ausente.');if(f.size>2*1024*1024||f.size<1)return fail('Imagem deve ter no máximo 2 MB.');const mime=f.type;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(mime))return fail('Formato não permitido.');const id=random(),data=await f.arrayBuffer();await env.DB.prepare('INSERT INTO media(id,mime,data) VALUES(?,?,?)').bind(id,mime,data).run();return json({url:'/media/'+id,id},201)}
 return fail('Rota não encontrada.',404)
}
export default {async fetch(req,env){try{const url=new URL(req.url);if(url.pathname.startsWith('/api/'))return await api(req,env,url);if(url.pathname==='/admin.html')return new Response('Not found',{status:404});if(url.pathname==='/admin'||url.pathname==='/admin/'){const u=await current(req,env);if(u?.role==='admin'){const assetUrl=new URL('/admin-panel.asset',url);const assetReq=new Request(assetUrl,{method:'GET',redirect:'manual'});const page=await env.ASSETS.fetch(assetReq);if(!page.ok||page.status>=300||page.status<200)return fail('Arquivo administrativo indisponível.',503);const headers=new Headers({'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','x-frame-options':'DENY','x-content-type-options':'nosniff'});return new Response(page.body,{status:200,headers})}const loginPage=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Administração — Academia Velarian</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101116;color:#f5e9d6;font:16px Arial,sans-serif}main{width:min(420px,90vw);padding:32px;background:#201b1a;border:1px solid #6e563c;border-radius:14px}h1{font-size:1.5rem;color:#e7bc75}label{display:block;margin:20px 0}input{display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:7px;border:1px solid #7d6951;border-radius:7px;background:#111;color:#fff}button{padding:13px 20px;background:#b9935d;border:0;border-radius:7px;cursor:pointer;font-weight:bold}a{color:#e7bc75}#status{min-height:1.5em}</style></head><body><main><h1>Administração Velarian</h1><p>Acesso exclusivo ao administrador.</p><form id="login"><label>Usuário<input name="username" autocomplete="username" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Entrar</button></form><p id="status" role="status"></p><a href="/">Voltar à Academia</a></main><script>document.getElementById('login').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const status=document.getElementById('status');status.textContent='Verificando...';try{const r=await fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(f)))});const b=await r.json();if(!r.ok)throw Error(b.error||'Acesso negado');location.replace('/admin#admin')}catch(err){status.textContent=err.message}})</script></body></html>`;return new Response(loginPage,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-frame-options':'DENY','x-content-type-options':'nosniff'}})};if(url.pathname.startsWith('/media/')){const id=url.pathname.split('/')[2];if(!/^[a-f0-9-]{36}$/.test(id||''))return new Response('Not found',{status:404});const m=await env.DB.prepare('SELECT mime,data FROM media WHERE id=?').bind(id).first();if(!m)return new Response('Not found',{status:404});return new Response(m.data instanceof ArrayBuffer||ArrayBuffer.isView(m.data)?m.data:new Uint8Array(m.data),{headers:{'content-type':m.mime,'cache-control':'public, max-age=86400','x-content-type-options':'nosniff'}})}return env.ASSETS.fetch(req)}catch(e){console.error(e);return fail('Erro interno. Verifique o banco D1 e os logs do Worker.',500)}}};
