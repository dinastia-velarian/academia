const $=id=>document.getElementById(id);
let adminData={settings:{},content:[],media:[]},currentKind='guide';
async function api(path,method='GET',data){const opt={method,credentials:'same-origin',headers:{}};if(data instanceof FormData)opt.body=data;else if(data!==undefined){opt.headers['content-type']='application/json';opt.body=JSON.stringify(data)}const res=await fetch(path,opt);const body=await res.json().catch(()=>({error:'Erro de comunicação.'}));if(!res.ok)throw Error(body.error||'Erro de conexão');return body}
function text(node,value){if(node)node.textContent=value===null||value===undefined?'':String(value)}
function make(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el}
function validImage(url){try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)}catch{return false}}
function updatePublic(data){const s=data.settings||{};applyPageSettings(s);if(s.heroTitle)text(document.querySelector('.hero-content h1'),s.heroTitle);if(s.heroText)text(document.querySelector('.hero-content > p'),s.heroText);if(s.aboutText)text(document.querySelector('.about-copy > p'),s.aboutText);if(s.heroImage&&validImage(s.heroImage))document.querySelector('.hero-art').style.backgroundImage=`url(${JSON.stringify(s.heroImage)})`;if(s.supportImage&&validImage(s.supportImage))document.querySelector('.support-illustration img').src=s.supportImage;
const link=$('donationLink'),account=$('donationAccount');if(s.donationAccountUrl){try{const u=new URL(s.donationAccountUrl);if(u.protocol==='https:'){link.href=u.href;link.hidden=false;text(account,u.hostname)}}catch{}}else if(window.ACADEMIA_CONFIG?.donationAccountUrl){/* configuração estática */}else{link.hidden=true;text(account,'Aguardando link da conta')}
if(s.certificateFee!==undefined)text($('certificateFee'),s.certificateFee?s.certificateFee+' (moeda do jogo)':'A definir pelo administrador');
const guideCards=$('guideCards');if(guideCards){guideCards.replaceChildren();const guides=(data.content||[]).filter(x=>x.kind==='guide');if(!guides.length){const e=make('article','guide');e.append(make('h3','', 'Guias em preparação'),make('p','', 'Em breve, dicas iniciais escritas pela Academia.'));guideCards.append(e)}for(const g of guides.sort((a,b)=>(a.sortOrder??100)-(b.sortOrder??100)))guideCards.append(contentCard(g))}
const dynamicTopics=(data.content||[]).filter(x=>x.kind==='topic');const old=$('publishedTopics');if(old)old.remove();if(dynamicTopics.length){const container=make('div','cards');container.id='publishedTopics';for(const g of dynamicTopics.sort((a,b)=>(a.sortOrder??100)-(b.sortOrder??100)))container.append(contentCard(g));$('courseCards').before(container)}
}
function contentCard(g){const card=make('article','guide public-content');if(g.imageUrl&&validImage(g.imageUrl)){const img=make('img','content-cover');img.src=g.imageUrl;img.loading='lazy';img.alt='';card.append(img)}card.append(make('div','guide-kicker',(g.category|| (g.kind==='guide'?'GUIA PUBLICADO':'TÓPICO PUBLICADO')).toLocaleUpperCase('pt-BR')),make('h3','',g.title),make('p','',g.summary||''));const btn=make('button','text-link','Ler conteúdo ↗');btn.addEventListener('click',()=>openPublished(g));card.append(btn);return card}
function openPublished(g){const area=$('courseDetail');area.replaceChildren();area.append(make('h2','',g.title),make('p','',g.summary));if(g.imageUrl&&validImage(g.imageUrl)){const img=make('img','article-image');img.src=g.imageUrl;img.alt='Imagem ilustrativa';area.append(img)}if(g.videoUrl){let u;try{u=new URL(g.videoUrl)}catch{}let id='';if(u){if(u.hostname==='youtu.be')id=u.pathname.slice(1);else id=u.searchParams.get('v')||u.pathname.split('/embed/')[1]||''}if(/^[\w-]{11}$/.test(id)){const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id;frame.title='Videoaula';frame.loading='lazy';frame.allowFullscreen=true;frame.className='video-frame';area.append(frame)}}const body=make('div','article-body');body.textContent=g.body||'Conteúdo em preparação.';area.append(body);$('courseDialog').showModal()}
async function refreshPublic(){try{updatePublic(await api('/api/public'))}catch(e){text($('authStatus'),'O conteúdo público está temporariamente indisponível. Tente novamente em instantes.')}}
async function refreshUser(){try{const {user}=await api('/api/me');const admin=user?.role==='admin';adminSessionVerified=admin;document.querySelectorAll('.admin-profile-name').forEach(el=>{el.textContent=admin?user.username:'Administrador'});document.querySelectorAll('.admin-profile-chip').forEach(el=>{el.textContent=admin?user.username.trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('').toLocaleUpperCase('pt-BR'):'—'});$('authForms').hidden=admin;$('accountPanel').hidden=!admin;text($('accountName'),admin?`Conectado como ${user.username} (administrador)`:'');$('adminEntry').hidden=!admin;$('admin').hidden=!admin;text($('authStatus'),admin?'Sessão administrativa ativa.':'Área restrita ao administrador.');if(admin)await refreshAdmin();syncPrivateArea()}catch(e){adminSessionVerified=false;$('admin').hidden=true;syncPrivateArea();text($('authStatus'),'Não foi possível verificar a sessão administrativa: '+e.message)}}
async function authenticate(form){const data=Object.fromEntries(new FormData(form));try{await api('/api/login','POST',data);form.reset();await refreshUser()}catch(e){text($('authStatus'),e.message)}}
$('loginForm').addEventListener('submit',e=>{e.preventDefault();authenticate(e.currentTarget)});
$('logoutButton').addEventListener('click',async()=>{try{await api('/api/logout','POST');$('admin').hidden=true;await refreshUser()}catch(e){text($('authStatus'),e.message)}});
function selectTab(tab){const pages={pages:['Editar páginas','Altere textos, imagens, botões e informações de cada página do site.'],overview:['Visão geral','Tudo o que você precisa para administrar a Academia, em um só lugar.'],guides:['Guias','Publique aulas e dicas para quem está começando.'],topics:['Tópicos','Organize os materiais avançados do Diplomacia.'],media:['Biblioteca de imagens','Envie e reutilize imagens sem precisar mexer no código.'],certificateTemplate:['Modelo de certificado','Envie e baixe o PDF padrão da Academia.'],students:['Alunos','Acompanhe os jogadores cadastrados e o progresso de estudos.'],comments:['Comentários','Modere mensagens da página inicial.'],certificates:['Certificados','Aprove e acompanhe solicitações de certificados.'],notices:['Avisos','Publique comunicados no painel dos alunos.'],suggestions:['Sugestões','Responda às sugestões recebidas.'],trade:['Trade Velarian','Gerencie promoções e disponibilidade da loja.'],reports:['Relatórios','Exporte os dados acadêmicos.'],history:['Histórico','Consulte as atividades registradas.'],general:['Configurações','Altere textos, doações e imagens do site.']};const info=pages[tab]||pages.overview;text($('adminPageTitle'),info[0]);text($('adminPageDescription'),info[1]);$('adminOverview').hidden=tab!=='overview';$('adminPages').hidden=tab!=='pages';if(tab==='pages')renderPageEditor();$('adminGeneral').hidden=tab!=='general';$('adminContent').hidden=!['guides','topics'].includes(tab);$('adminMedia').hidden=tab!=='media';$('adminStudents').hidden=tab!=='students';$('adminCertificateTemplate').hidden=tab!=='certificateTemplate';if(tab==='certificateTemplate')window.academiaLoadCertificateTemplate?.();$('adminComments').hidden=tab!=='comments';$('adminHub').hidden=!['certificates','notices','suggestions','trade','reports','history'].includes(tab);if(!$('adminHub').hidden){const hub=$('adminHubContent');$('adminHubTitle').textContent=({certificates:'Certificados',notices:'Avisos aos alunos',suggestions:'Sugestões recebidas',trade:'Trade Velarian',reports:'Relatórios',history:'Histórico'})[tab];$('adminHubDescription').textContent='Carregando dados e ferramentas de gestão...';hub.textContent='Carregando informações...';if(typeof window.academiaHubTab==='function'){window.academiaHubTab(tab)}else{$('adminHubStatus').textContent='O módulo de gestão ainda não foi carregado. Atualize a página (Ctrl + Shift + R).';hub.textContent='Não foi possível iniciar as ferramentas desta seção.'}}if(tab==='comments')refreshAdminComments();if(tab==='students')refreshStudents();currentKind=tab==='topics'?'topic':'guide';text($('contentEditorTitle'),currentKind==='guide'?'Gerenciar guias':'Gerenciar tópicos');text($('adminContentHint'),currentKind==='guide'?'Crie conteúdos curtos e objetivos para jogadores iniciantes.':'Publique análises e aulas aprofundadas.');for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab===tab);if(!$('adminContent').hidden){clearContent();listContent()}}
const adminWorkspace=$('admin'),adminMobileMenu=$('adminMobileMenu');
function closeAdminNav(){adminWorkspace.classList.remove('admin-nav-open');adminMobileMenu.setAttribute('aria-expanded','false')}
adminMobileMenu.addEventListener('click',()=>{const open=adminWorkspace.classList.toggle('admin-nav-open');adminMobileMenu.setAttribute('aria-expanded',String(open))});
adminWorkspace.addEventListener('click',e=>{if(adminWorkspace.classList.contains('admin-nav-open')&&e.target===adminWorkspace)closeAdminNav()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAdminNav()});
for(const btn of document.querySelectorAll('[data-tab]'))btn.addEventListener('click',()=>{selectTab(btn.dataset.tab);closeAdminNav()});for(const btn of document.querySelectorAll('[data-go]'))btn.addEventListener('click',()=>selectTab(btn.dataset.go));$('adminSignOut').addEventListener('click',()=> $('logoutButton').click());
let studentAdminData=[];let selectedStudentId=null;window.academiaSelectedStudent=()=>selectedStudentId;
function courseLessonName(key){const m=/^t(\d+)-l(\d+)$/.exec(key);if(!m)return key;const topic=Number(m[1]),lesson=Number(m[2]);const c=typeof courses!=='undefined'?courses[topic]:null;return c?c.title+' — '+(c.lessons[lesson]||'Aula '+(lesson+1)):key}
async function showStudentDetail(id){selectedStudentId=id;window.academiaHubProfile?.();const panel=$('studentAdminDetail');panel.hidden=false;text($('studentDetailTitle'),'Carregando aluno...');text($('studentDetailStats'),'');$('studentDetailLessons').replaceChildren();text($('studentResetNotice'),'');text($('studentAccountNotice'),'');const current=studentAdminData.find(x=>x.id===id);text($('studentToggleBlock'),current?.blocked?'Desbloquear acesso':'Bloquear acesso');try{const d=await api('/api/admin/student-detail?id='+encodeURIComponent(id));if(selectedStudentId!==id)return;text($('studentDetailTitle'),d.student.username);text($('studentDetailStats'),d.progress.length+' aulas concluídas');const list=$('studentDetailLessons');if(!d.progress.length){list.append(make('p','', 'Este aluno ainda não marcou aulas como concluídas.'))}for(const x of d.progress){const row=make('div','student-detail-lesson');row.append(make('span','',courseLessonName(x.lessonKey)),make('small','',new Date(x.completedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})));list.append(row)}panel.scrollIntoView({behavior:'smooth',block:'nearest'})}catch(e){text($('studentDetailTitle'),e.message)}}
$('studentResetPassword').addEventListener('click',async()=>{const id=selectedStudentId;if(!id)return;const student=studentAdminData.find(x=>x.id===id);if(!student||!confirm('Gerar uma nova senha temporária para '+student.username+'? A senha anterior e as sessões atuais deixarão de funcionar. Confirme a identidade do aluno antes de enviar.'))return;try{const d=await api('/api/admin/student-reset','POST',{id,confirm:true});const notice=$('studentResetNotice');notice.replaceChildren();notice.append(make('strong','', 'Senha temporária (exibida somente agora): '));const secret=make('code','',d.temporaryPassword);notice.append(secret);const copy=make('button','secondary','Copiar senha');copy.type='button';copy.onclick=()=>navigator.clipboard.writeText(d.temporaryPassword);notice.append(copy);notice.append(make('p','', 'Envie ao aluno em conversa privada, após confirmar que é o titular. Peça para trocar a senha após entrar.'))}catch(e){text($('studentResetNotice'),e.message)}});

function renderStudents(){
 const term=$('studentAdminSearch').value.trim().toLocaleLowerCase('pt-BR'),list=$('studentAdminList');list.replaceChildren();
 const items=studentAdminData.filter(x=>x.username.toLocaleLowerCase('pt-BR').includes(term));
 if(!items.length){const p=document.createElement('p');p.textContent='Nenhum aluno encontrado.';list.append(p);return}
 for(const x of items){
  const row=document.createElement('article');row.className='admin-student-row';
  const name=document.createElement('strong');name.textContent=x.username;
  const date=document.createElement('span');date.textContent='Cadastro: '+(x.createdAt?new Date(x.createdAt.replace(' ','T')+'Z').toLocaleDateString('pt-BR'):'Não informado');
  const progress=document.createElement('span');progress.textContent=Number(x.completedLessons||0)+' aulas concluídas';const status=make('span',x.blocked?'student-blocked-status':'student-active-status',x.blocked?'● Acesso bloqueado':'● Acesso liberado');
  const details=make('button','secondary','Ver progresso e senha');details.type='button';details.addEventListener('click',()=>showStudentDetail(x.id));row.append(name,date,progress,status,details);list.append(row)
 }
}
$('studentToggleBlock').addEventListener('click',async()=>{
 const id=selectedStudentId,student=studentAdminData.find(x=>x.id===id);if(!student)return;
 const blocked=!Boolean(student.blocked),action=blocked?'bloquear':'desbloquear';
 if(!confirm('Deseja '+action+' o acesso de '+student.username+'?'+(blocked?' As sessões atuais serão encerradas.':'')))return;
 try{await api('/api/admin/student-block','POST',{id,blocked,confirm:true});text($('studentAccountNotice'),'Acesso '+(blocked?'bloqueado':'liberado')+' com sucesso.');await refreshStudents();text($('studentToggleBlock'),blocked?'Desbloquear acesso':'Bloquear acesso')}catch(e){text($('studentAccountNotice'),e.message)}
});
$('studentDeleteAccount').addEventListener('click',async()=>{
 const id=selectedStudentId,student=studentAdminData.find(x=>x.id===id);if(!student)return;
 const name=prompt('EXCLUSÃO DEFINITIVA: o cadastro, as sessões e o progresso serão apagados. Digite exatamente o nome do aluno para confirmar: '+student.username);
 if(name===null)return;if(name!==student.username){text($('studentAccountNotice'),'Nome incorreto. Exclusão cancelada.');return}
 if(!confirm('Confirmar exclusão IRREVERSÍVEL de '+student.username+'?'))return;
 try{await api('/api/admin/student-delete','POST',{id,username:name,confirm:true});selectedStudentId=null;$('studentAdminDetail').hidden=true;await refreshStudents();text($('studentAdminStatus'),'Cadastro de '+student.username+' excluído definitivamente.')}catch(e){text($('studentAccountNotice'),e.message)}
});
async function refreshAdminComments(){
 const root=$('adminCommentsList');text($('adminCommentsStatus'),'Carregando comentários...');
 try{const d=await api('/api/comments');root.replaceChildren();
  for(const c of d.items){const row=make('article','admin-comment-row');row.append(make('strong','',c.username),make('small','',new Date(c.createdAt).toLocaleDateString('pt-BR')),make('p','',c.body));const del=make('button','secondary','Excluir comentário');del.type='button';del.onclick=async()=>{if(!confirm('Excluir o comentário de '+c.username+'?'))return;try{await api('/api/admin/comment-delete','POST',{id:c.id,confirm:true});await refreshAdminComments()}catch(e){text($('adminCommentsStatus'),e.message)}};row.append(del);root.append(row)}
  if(!d.items.length)root.append(make('p','','Nenhum comentário publicado ainda.'));
  text($('adminCommentsStatus'),d.total+' comentários publicados · 100 mais recentes.');
 }catch(e){text($('adminCommentsStatus'),e.message)}
}
$('adminCommentsRefresh').addEventListener('click',refreshAdminComments);
async function refreshStudents(){
 try{const d=await api('/api/admin/students');studentAdminData=d.items||[];text($('adminStudentCount'),String(d.total||0));text($('studentAdminStatus'),d.total+' alunos cadastrados · exibindo até 500 contas recentes.');renderStudents()}
 catch(e){text($('studentAdminStatus'),'Erro ao carregar alunos: '+e.message)}
}
$('studentAdminSearch').addEventListener('input',renderStudents);
$('studentAdminRefresh').addEventListener('click',refreshStudents);
async function refreshAnalytics(){
 const status=$('analyticsStatus');if(!status)return;
 try{
  const d=await api('/api/admin/statistics');
  text($('analyticsActive'),d.active30d);text($('analyticsNew'),d.new30d);text($('analyticsCompletions'),d.completions);text($('analyticsLearners'),d.learners);text($('adminVisitCount'),d.visits?.total??'—');text($('adminVisit7d'),d.visits?.last7d??'—');text($('adminVisit30d'),d.visits?.last30d??'—');
  const available=typeof courses!=='undefined'?courses:window.courses;
  const visible=Array.isArray(available)?available.map((c,i)=>({c,i})).filter(x=>x.i!==7):[];
  const [publishedLessons,publishedOrders]=await Promise.all([api('/api/lessons'),api('/api/lesson-order')]);const curriculumKeys=new Set();for(const {c,i} of visible){const stored=(publishedOrders.items||[]).find(x=>x.topic===i)?.order;const indexes=Array.isArray(stored)?stored:c.lessons.map((_,j)=>j);for(const j of indexes)if(Number.isInteger(j)&&j>=0&&j<=199)curriculumKeys.add('t'+i+'-l'+j)}const totalLessons=curriculumKeys.size;
  const distribution=$('analyticsDistribution');distribution.replaceChildren();
  const groups=[['Ainda não iniciaram',0],['1–24%',0],['25–49%',0],['50–79%',0],['80–99%',0],['100%',0]];
  if(totalLessons){for(const count of d.studentTotals){const pct=100*Math.min(count,totalLessons)/totalLessons;const index=count===0?0:pct<25?1:pct<50?2:pct<80?3:pct<100?4:5;groups[index][1]++}}
  for(const [label,count] of groups){const row=make('div','analytics-bar-row');const header=make('div','analytics-bar-label');header.append(make('span','',label),make('strong','',String(count)));const track=make('div','analytics-bar-track');const fill=make('div','analytics-bar-fill');fill.style.width=(d.students?100*count/d.students:0)+'%';track.append(fill);row.append(header,track);distribution.append(row)}
  const ranking=$('analyticsTopLessons');ranking.replaceChildren();
  for(const [index,item] of d.topLessons.entries()){const match=/^t(\d+)-l(\d+)$/.exec(item.lessonKey);const topic=match?available?.[Number(match[1])]:null;const savedLesson=match?(publishedLessons.items||[]).find(x=>x.topic===Number(match[1])&&x.index===Number(match[2])):null;const lesson=savedLesson?.title||topic?.lessons?.[Number(match?.[2])];const row=make('div','analytics-rank-row');row.append(make('span','analytics-rank-number',String(index+1).padStart(2,'0')),make('span','analytics-rank-name',lesson?(topic.title+' · '+lesson):item.lessonKey),make('strong','',String(item.completions)));ranking.append(row)}
  if(!d.topLessons.length)ranking.append(make('p','analytics-empty','Nenhuma aula concluída até agora.'));
  text($('analyticsProgressHint'),totalLessons?'Progresso considerando '+totalLessons+' aulas públicas por aluno.':'Não foi possível calcular o total de aulas.');
  text(status,'Dados atualizados. Atividade considera somente marcações de conclusão, não visualizações.');
 }catch(e){text(status,'Não foi possível carregar as estatísticas: '+e.message)}
}
$('analyticsRefresh').addEventListener('click',refreshAnalytics);
async function refreshAdmin(){try{adminData=await api('/api/admin/all');for(const [k,v]of Object.entries(adminData.settings))if($('generalForm').elements.namedItem(k))$('generalForm').elements.namedItem(k).value=v;listContent();listMedia();if(!$('adminPages').hidden)renderPageEditor();const publishedCourses=typeof courses!=='undefined'&&Array.isArray(courses)?courses:[];const visibleTopics=publishedCourses.map((c,i)=>({c,i})).filter(x=>x.i!==7);const [lessonData,orderData]=await Promise.all([api('/api/lessons'),api('/api/lesson-order')]);const lessonKeys=new Set();for(const {c,i} of visibleTopics){const saved=(orderData.items||[]).find(x=>x.topic===i)?.order;const indexes=Array.isArray(saved)?saved:c.lessons.map((_,j)=>j);for(const j of indexes)if(Number.isInteger(j)&&j>=0&&j<=199)lessonKeys.add(i+':'+j)}const publishedExtra=adminData.content.filter(x=>x.status==='published');const addedTopics=publishedExtra.filter(x=>x.kind==='topic').length;const addedLessons=publishedExtra.filter(x=>x.kind==='guide').length;const imageAssets=new Set([...document.querySelectorAll('img[src]')].map(img=>img.getAttribute('src')).filter(Boolean));text($('adminGuideCount'),lessonKeys.size+addedLessons);text($('adminTopicCount'),visibleTopics.length+addedTopics);text($('adminMediaCount'),imageAssets.size+adminData.media.length);await refreshStudents();await refreshAnalytics()}catch(e){text($('adminMessage'),e.message)}}
$('generalForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/settings','PUT',Object.fromEntries(new FormData(e.currentTarget)));text($('adminMessage'),'Configurações salvas e publicadas.');await refreshAdmin();await refreshPublic()}catch(err){text($('adminMessage'),err.message)}});
function clearContent(){const form=$('contentForm');form.reset();form.elements.namedItem('id').value='';form.elements.namedItem('kind').value=currentKind;text($('adminEditingTitle'),'Criar novo '+(currentKind==='guide'?'guia':'tópico'))}
$('newContent').addEventListener('click',clearContent);
function listContent(){const root=$('adminContentList');root.replaceChildren();for(const item of adminData.content.filter(x=>x.kind===currentKind)){const row=make('div','admin-list-item');row.append(make('strong','',item.title),make('small','',item.status==='published'?'Publicado':'Rascunho'));const edit=make('button','secondary','Editar');edit.addEventListener('click',()=>{for(const [k,v]of Object.entries({id:item.id,kind:item.kind,title:item.title,summary:item.summary,body:item.body,videoUrl:item.video_url,imageUrl:item.image_url,status:item.status})){const input=$('contentForm').elements.namedItem(k);if(input)input.value=v||''}text($('adminEditingTitle'),'Editando: '+item.title);text($('adminMessage'),'Você está editando um conteúdo existente. Salve para atualizar esta publicação.');window.location.hash='#admin';$('contentForm').scrollIntoView({behavior:'smooth',block:'start'})});const del=make('button','secondary','Excluir');del.addEventListener('click',async()=>{if(!confirm('Excluir definitivamente este conteúdo?'))return;try{await api('/api/admin/content/'+item.id,'DELETE');await refreshAdmin();await refreshPublic()}catch(e){text($('adminMessage'),e.message)}});row.append(edit,del);root.append(row)}}
$('contentForm').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));data.kind=currentKind;try{await api('/api/admin/content','POST',data);text($('adminMessage'),'Conteúdo salvo. Rascunhos não aparecem ao público.');clearContent();await refreshAdmin();await refreshPublic()}catch(err){text($('adminMessage'),err.message)}});
function listMedia(){const root=$('mediaList');root.replaceChildren();if(!adminData.media.length){root.append(make('p','admin-empty','Sua biblioteca está vazia. Envie sua primeira imagem acima.'));return}for(const m of adminData.media){const row=make('div','admin-image-tile');const img=make('img','media-thumb');img.src='/media/'+m.id;img.alt='Imagem enviada';const btn=make('button','secondary','Copiar endereço');btn.type='button';btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('/media/'+m.id);text($('adminMessage'),'Endereço da imagem copiado.')}catch(e){text($('adminMessage'),'Não foi possível copiar automaticamente.')}});row.append(img,btn);root.append(row)}}
async function optimizeMediaImage(file){
 const limit=2*1024*1024;
 if(file.size<=limit)return file;
 if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw Error('Formato de imagem não permitido.');
 const image=await createImageBitmap(file);
 try{
  const maxSide=2400;
  const factor=Math.min(1,maxSide/Math.max(image.width,image.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*factor));
  canvas.height=Math.max(1,Math.round(image.height*factor));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Não foi possível preparar a imagem.');
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [0.86,0.76,0.64,0.52,0.40,0.28]){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
   if(blob&&blob.size<=limit)return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'});
  }
  throw Error('Não foi possível reduzir a imagem para 2 MB. Tente uma imagem com resolução menor.');
 }finally{image.close()}
}
$('mediaForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget;
 const submit=form.querySelector('[type="submit"]');
 try{
  const data=new FormData(form);
  const original=data.get('image');
  if(!(original instanceof File)||!original.size)throw Error('Selecione uma imagem.');
  if(submit)submit.disabled=true;
  if(original.size>2*1024*1024)text($('adminMessage'),'Otimizando imagem antes do envio...');
  const optimized=await optimizeMediaImage(original);
  data.set('image',optimized);
  const r=await api('/api/admin/media','POST',data);
  text($('adminMessage'),'Imagem enviada: '+r.url+(optimized!==original?' · Reduzida de '+(original.size/1048576).toFixed(1)+' MB para '+(optimized.size/1048576).toFixed(1)+' MB.':''));
  form.reset();await refreshAdmin();
 }catch(err){text($('adminMessage'),err.message)}finally{if(submit)submit.disabled=false}
});
let adminSessionVerified=false;
function syncPrivateArea(){const allowed=location.hash==='#login'||location.hash==='#admin';$('login').hidden=!allowed;const showAdmin=location.hash==='#admin'&&adminSessionVerified;$('admin').hidden=!showAdmin;document.body.classList.toggle('admin-mode',showAdmin);}
window.addEventListener('hashchange',syncPrivateArea);
refreshPublic();refreshUser().finally(syncPrivateArea);

let selectedImageField=null;
function openImagePicker(field){selectedImageField=field;const grid=$('imagePickerGrid');grid.replaceChildren();$('imagePickerEmpty').hidden=adminData.media.length>0;for(const m of adminData.media){const btn=make('button','admin-image-choice');btn.type='button';const img=make('img');img.src='/media/'+m.id;img.alt='Selecionar imagem';btn.append(img,make('span','','Usar esta imagem'));btn.addEventListener('click',()=>{selectedImageField.value='/media/'+m.id;$('imagePicker').close();selectedImageField=null});grid.append(btn)}$('imagePicker').showModal()}
for(const btn of document.querySelectorAll('[data-image-target]'))btn.addEventListener('click',()=>{const form=btn.closest('form');openImagePicker(form.elements.namedItem(btn.dataset.imageTarget))});
$('closeImagePicker').addEventListener('click',()=>$('imagePicker').close());


/* Editor completo de páginas: os valores são persistidos na tabela settings. */
const pageFields={
 inicio:[
  ['brandName','Nome exibido no cabeçalho','.brand strong'],['brandMotto','Frase sob o nome da Academia','.brand small'],
  ['brandImage','Brasão do cabeçalho','.brand img','image'],
  ['heroEyebrow','Frase pequena acima do título','.hero .eyebrow'],
  ['heroTitle','Título principal','.hero-content h1'],['heroText','Texto de apresentação','.hero-content > p','textarea'],
  ['heroImage','Imagem grande da página inicial','.hero-art','image'],
  ['heroPrimaryButton','Texto do botão principal','.hero .actions .primary'],['heroSecondaryButton','Texto do segundo botão','.hero .actions .secondary'],
  ['heroFact1','Primeira informação de destaque','.hero-facts > div:nth-child(1) small'],
  ['heroFact2','Segunda informação de destaque','.hero-facts > div:nth-child(2) small'],
  ['heroFact3','Terceira informação de destaque','.hero-facts > div:nth-child(3) small'],
  ['introFact1','Primeira frase da faixa informativa','.intro-strip span:nth-child(1)'],
  ['introFact2','Segunda frase da faixa informativa','.intro-strip span:nth-child(2)'],
  ['introFact3','Terceira frase da faixa informativa','.intro-strip span:nth-child(3)']
 ],
 guias:[
  ['guidesEyebrow','Texto pequeno acima do título','#guias .eyebrow'],
  ['guidesTitle','Título da seção Guias','#guias .section-heading h2'],
  ['guidesDescription','Descrição dos Guias','#guias .section-heading p','textarea'],
  ['guidesImage','Imagem decorativa dos cartões de guias','#guideCards','image']
 ],
 topicos:[
  ['topicsEyebrow','Texto pequeno acima do título','#topicos .eyebrow'],
  ['topicsTitle','Título da seção Tópicos','#topicos .section-heading h2'],
  ['topicsDescription','Descrição dos Tópicos','#topicos .section-heading p','textarea'],
  ['topicsImage','Imagem decorativa dos tópicos','#courseCards','image']
 ],
 certificados:[
  ['certEyebrow','Texto pequeno da seção Certificados','#certificados .eyebrow'],
  ['certTitle','Título da seção Certificados','#certificados h2'],
  ['certDescription','Explicação sobre certificados','#certificados .section-heading p','textarea'],
  ['certButton','Texto do botão do Telegram','#certificados .primary'],
  ['certTelegramUrl','Link do Telegram para certificados','#certificados .primary','url'],
  ['certificateFee','Taxa do certificado','#certificateFee']
 ],
 sobre:[
  ['aboutEyebrow','Texto pequeno da seção Sobre','#sobre .eyebrow'],
  ['aboutTitle','Título da seção Sobre','#sobre h2'],
  ['aboutText','Primeiro parágrafo','#sobre .about-copy > p:nth-of-type(1)','textarea'],
  ['aboutText2','Segundo parágrafo','#sobre .about-copy > p:nth-of-type(2)','textarea'],
  ['aboutButton','Texto do botão','#sobre .primary'],
  ['aboutImage','Brasão na seção Sobre','#sobre .about-seal img','image'],
  ['aboutMotto','Lema abaixo do brasão','#sobre .about-seal span']
 ],
 doacoes:[
  ['supportEyebrow','Texto pequeno de doações','#apoie .eyebrow'],
  ['supportTitle','Título da seção Apoie','#apoie h2'],
  ['supportDescription','Texto de apresentação das doações','#apoie > div:first-child > p:first-of-type','textarea'],
  ['donationAccountUrl','Link da conta para doações','#donationLink','url'],
  ['donationButton','Texto do botão de doações','#donationLink'],
  ['certificateFee','Taxa de emissão','#certificateFee'],
  ['supportNote','Aviso abaixo da taxa','#apoie .support-info .note','textarea'],
  ['supportFinalNote','Aviso final de doações','#apoie > div:first-child > p.note','textarea'],
  ['supportImage','Imagem de doações','#apoie .support-illustration img','image']
 ],
 rodape:[
  ['footerMotto','Frase da marca no rodapé','footer .footer-brand small'],
  ['footerDescription','Descrição institucional','footer > p','textarea'],
  ['footerSupport','Texto do link de apoio','footer > a[href="#apoie"]'],
  ['footerTelegramLabel','Texto do link do Telegram','footer > a[href^="https://t.me/"]'],
  ['footerTelegramUrl','Endereço do Telegram','footer > a[href^="https://t.me/"]','url']
 ]
};
const pageNames={inicio:'Página inicial',topicos:'Tópicos',certificados:'Certificados',sobre:'Sobre',doacoes:'Doações',rodape:'Rodapé'};
let selectedPage='inicio';
const originalPageValues={};
for(const fields of Object.values(pageFields))for(const [key,,selector,type]of fields){if(key in originalPageValues)continue;const el=document.querySelector(selector);if(!el)continue;if(type==='image'){if(key==='heroImage')originalPageValues[key]='/assets/academia-imperial.webp';else if(key==='guidesImage')originalPageValues[key]='/assets/guias-imperiais.webp';else if(key==='topicsImage')originalPageValues[key]='/assets/topicos-imperiais.webp';else originalPageValues[key]=(el.getAttribute('src')||'').replace(/^assets\//,'/assets/')}else if(type==='url')originalPageValues[key]=el.getAttribute('href')||'';else originalPageValues[key]=el.textContent.trim();}
function applyPageSettings(settings){
 for(const [key,value]of Object.entries(settings||{})){
  if(value===undefined||value===null||value==='')continue;
  const def=Object.values(pageFields).flat().find(x=>x[0]===key);if(!def)continue;
  const [,label,selector,type]=def;const el=document.querySelector(selector);if(!el)continue;
  if(type==='image'){
   if(!validImage(value))continue;
   if(key==='heroImage')el.style.backgroundImage='url('+JSON.stringify(value)+')';
   else if(key==='guidesImage'||key==='topicsImage'){
    const id='custom-'+key;let style=$(id);if(!style){style=make('style');style.id=id;document.head.append(style)}
    style.textContent=(key==='guidesImage'?'#guideCards .guide:before':'#courseCards .course-top')+'{background-image:url('+JSON.stringify(value)+')!important;background-size:cover!important}';
   }else el.src=value;
  }else if(type==='url'){try{const u=new URL(value,location.href);if(u.protocol==='https:')el.href=u.href}catch{}}
  else text(el,value);
 }
}
function renderPageEditor(){
 const nav=$('pageEditorNav');nav.replaceChildren();
 for(const [key,name]of Object.entries(pageNames)){const btn=make('button',key===selectedPage?'active':'',name);btn.type='button';btn.addEventListener('click',()=>{selectedPage=key;renderPageEditor()});nav.append(btn)}
 const fields=$('pageEditorFields');fields.replaceChildren();
 fields.append(make('h3','',pageNames[selectedPage]));
 fields.append(make('p','admin-field-help','Edite os campos abaixo. Use a prévia para conferir como ficará antes de publicar.'));
 for(const [key,label,selector,type]of pageFields[selectedPage]){
  const wrapper=make('label','admin-edit-field');const title=make('span','',label);const note=make('small','',type==='image'?'Escolha uma imagem da biblioteca ou mantenha a atual.':type==='url'?'Endereço completo começando com https://':'Este texto aparece diretamente na página pública.');
  const input=type==='textarea'?make('textarea'):make('input');input.name=key;if(type==='url')input.type='url';if(type==='image')input.type='text';if(type==='textarea')input.rows=4;
  const saved=adminData.settings?.[key];const live=document.querySelector(selector);const liveValue=live?(type==='image'?'':type==='url'?(live.getAttribute('href')||''):live.textContent.trim()):'';input.value=(saved!==undefined&&saved!==null&&String(saved).trim()!=='')?saved:(liveValue||originalPageValues[key]||'');
  wrapper.append(title,note,input);
  if(type==='image'){const pick=make('button','admin-pick-image','Escolher imagem');pick.type='button';pick.addEventListener('click',()=>openImagePicker(input));wrapper.append(pick);const preview=make('img','admin-current-image');preview.alt='Imagem atual';if(validImage(input.value))preview.src=input.value;else preview.hidden=true;input.addEventListener('input',()=>{preview.hidden=!validImage(input.value);if(!preview.hidden)preview.src=input.value});wrapper.append(preview)}
  fields.append(wrapper);
 }
}
$('pageEditorForm').addEventListener('submit',async e=>{
 e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));
 try{await api('/api/admin/settings','PUT',data);text($('adminMessage'),'Página "'+pageNames[selectedPage]+'" salva e publicada com sucesso.');await refreshAdmin();await refreshPublic()}catch(err){text($('adminMessage'),err.message)}
});
$('pageResetButton').addEventListener('click',renderPageEditor);
$('pagePreviewButton').addEventListener('click',()=>{
 const frame=$('pagePreviewFrame'),dialog=$('pagePreviewDialog'),values=Object.fromEntries(new FormData($('pageEditorForm')));
 frame.onload=()=>{frame.contentWindow.postMessage({type:'academia-page-preview',settings:values},location.origin);setTimeout(()=>{try{frame.contentDocument.querySelector(({'inicio':'#inicio','guias':'#guias','topicos':'#topicos','certificados':'#certificados','sobre':'#sobre','doacoes':'#apoie','rodape':'footer'})[selectedPage])?.scrollIntoView()}catch{}},250)};
 frame.src='/?preview='+Date.now();dialog.showModal();
});
$('pagePreviewClose').addEventListener('click',()=>$('pagePreviewDialog').close());
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='academia-page-preview'||window.top===window)return;applyPageSettings(event.data.settings)});
