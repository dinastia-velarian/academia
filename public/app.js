const $=id=>document.getElementById(id);
let adminData={settings:{},content:[],media:[]},currentKind='guide';
async function api(path,method='GET',data){const opt={method,credentials:'same-origin',headers:{}};if(data instanceof FormData)opt.body=data;else if(data!==undefined){opt.headers['content-type']='application/json';opt.body=JSON.stringify(data)}const res=await fetch(path,opt);const body=await res.json().catch(()=>({error:'Erro de comunicação.'}));if(!res.ok)throw Error(body.error||'Erro de conexão');return body}
function text(node,value){if(node)node.textContent=value||''}
function make(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el}
function validImage(url){try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)}catch{return false}}
function updatePublic(data){const s=data.settings||{};applyPageSettings(s);if(s.heroTitle)text(document.querySelector('.hero-content h1'),s.heroTitle);if(s.heroText)text(document.querySelector('.hero-content > p'),s.heroText);if(s.aboutText)text(document.querySelector('.about-copy > p'),s.aboutText);if(s.heroImage&&validImage(s.heroImage))document.querySelector('.hero-art').style.backgroundImage=`url(${JSON.stringify(s.heroImage)})`;if(s.supportImage&&validImage(s.supportImage))document.querySelector('.support-illustration img').src=s.supportImage;
const link=$('donationLink'),account=$('donationAccount');if(s.donationAccountUrl){try{const u=new URL(s.donationAccountUrl);if(u.protocol==='https:'){link.href=u.href;link.hidden=false;text(account,u.hostname)}}catch{}}else if(window.ACADEMIA_CONFIG?.donationAccountUrl){/* configuração estática */}else{link.hidden=true;text(account,'Aguardando link da conta')}
if(s.certificateFee!==undefined)text($('certificateFee'),s.certificateFee?s.certificateFee+' (moeda do jogo)':'A definir pelo administrador');
const guideCards=$('guideCards');if(guideCards){guideCards.replaceChildren();const guides=(data.content||[]).filter(x=>x.kind==='guide');if(!guides.length){const e=make('article','guide');e.append(make('h3','', 'Guias em preparação'),make('p','', 'Em breve, dicas iniciais escritas pela Academia.'));guideCards.append(e)}for(const g of guides)guideCards.append(contentCard(g))}
const dynamicTopics=(data.content||[]).filter(x=>x.kind==='topic');const old=$('publishedTopics');if(old)old.remove();if(dynamicTopics.length){const container=make('div','cards');container.id='publishedTopics';for(const g of dynamicTopics)container.append(contentCard(g));$('courseCards').before(container)}
}
function contentCard(g){const card=make('article','guide public-content');if(g.imageUrl&&validImage(g.imageUrl)){const img=make('img','content-cover');img.src=g.imageUrl;img.loading='lazy';img.alt='';card.append(img)}card.append(make('div','guide-kicker',g.kind==='guide'?'GUIA PUBLICADO':'TÓPICO PUBLICADO'),make('h3','',g.title),make('p','',g.summary||''));const btn=make('button','text-link','Ler conteúdo ↗');btn.addEventListener('click',()=>openPublished(g));card.append(btn);return card}
function openPublished(g){const area=$('courseDetail');area.replaceChildren();area.append(make('h2','',g.title),make('p','',g.summary));if(g.imageUrl&&validImage(g.imageUrl)){const img=make('img','article-image');img.src=g.imageUrl;img.alt='Imagem ilustrativa';area.append(img)}if(g.videoUrl){let u;try{u=new URL(g.videoUrl)}catch{}let id='';if(u){if(u.hostname==='youtu.be')id=u.pathname.slice(1);else id=u.searchParams.get('v')||u.pathname.split('/embed/')[1]||''}if(/^[\w-]{11}$/.test(id)){const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id;frame.title='Videoaula';frame.loading='lazy';frame.allowFullscreen=true;frame.className='video-frame';area.append(frame)}}const body=make('div','article-body');body.textContent=g.body||'Conteúdo em preparação.';area.append(body);$('courseDialog').showModal()}
async function refreshPublic(){try{updatePublic(await api('/api/public'))}catch(e){text($('authStatus'),'O conteúdo público está temporariamente indisponível. Tente novamente em instantes.')}}
async function refreshUser(){try{const {user}=await api('/api/me');const admin=user?.role==='admin';$('authForms').hidden=admin;$('accountPanel').hidden=!admin;text($('accountName'),admin?`Conectado como ${user.username} (administrador)`:'');$('adminEntry').hidden=!admin;$('admin').hidden=!admin;text($('authStatus'),admin?'Sessão administrativa ativa.':'Área restrita ao administrador.');if(admin)await refreshAdmin();syncPrivateArea()}catch(e){text($('authStatus'),'Não foi possível verificar a sessão administrativa: '+e.message)}}
async function authenticate(form){const data=Object.fromEntries(new FormData(form));try{await api('/api/login','POST',data);form.reset();await refreshUser()}catch(e){text($('authStatus'),e.message)}}
$('loginForm').addEventListener('submit',e=>{e.preventDefault();authenticate(e.currentTarget)});
$('logoutButton').addEventListener('click',async()=>{try{await api('/api/logout','POST');$('admin').hidden=true;await refreshUser()}catch(e){text($('authStatus'),e.message)}});
function selectTab(tab){const pages={pages:['Editar páginas','Altere textos, imagens, botões e informações de cada página do site.'],overview:['Visão geral','Tudo o que você precisa para administrar a Academia, em um só lugar.'],guides:['Guias','Publique aulas e dicas para quem está começando.'],topics:['Tópicos','Organize os materiais avançados do Diplomacia.'],media:['Biblioteca de imagens','Envie e reutilize imagens sem precisar mexer no código.'],general:['Configurações','Altere textos, doações e imagens do site.']};const info=pages[tab]||pages.overview;text($('adminPageTitle'),info[0]);text($('adminPageDescription'),info[1]);$('adminOverview').hidden=tab!=='overview';$('adminPages').hidden=tab!=='pages';if(tab==='pages')renderPageEditor();$('adminGeneral').hidden=tab!=='general';$('adminContent').hidden=!['guides','topics'].includes(tab);$('adminMedia').hidden=tab!=='media';currentKind=tab==='topics'?'topic':'guide';text($('contentEditorTitle'),currentKind==='guide'?'Gerenciar guias':'Gerenciar tópicos');text($('adminContentHint'),currentKind==='guide'?'Crie conteúdos curtos e objetivos para jogadores iniciantes.':'Publique análises e aulas aprofundadas.');for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab===tab);if(!$('adminContent').hidden){clearContent();listContent()}}
for(const btn of document.querySelectorAll('[data-tab]'))btn.addEventListener('click',()=>selectTab(btn.dataset.tab));for(const btn of document.querySelectorAll('[data-go]'))btn.addEventListener('click',()=>selectTab(btn.dataset.go));$('adminSignOut').addEventListener('click',()=> $('logoutButton').click());
async function refreshAdmin(){try{adminData=await api('/api/admin/all');for(const [k,v]of Object.entries(adminData.settings))if($('generalForm').elements.namedItem(k))$('generalForm').elements.namedItem(k).value=v;listContent();listMedia();if(!$('adminPages').hidden)renderPageEditor();text($('adminGuideCount'),adminData.content.filter(x=>x.kind==='guide').length);text($('adminTopicCount'),adminData.content.filter(x=>x.kind==='topic').length);text($('adminMediaCount'),adminData.media.length)}catch(e){text($('adminMessage'),e.message)}}
$('generalForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/settings','PUT',Object.fromEntries(new FormData(e.currentTarget)));text($('adminMessage'),'Configurações salvas e publicadas.');await refreshAdmin();await refreshPublic()}catch(err){text($('adminMessage'),err.message)}});
function clearContent(){const form=$('contentForm');form.reset();form.elements.namedItem('id').value='';form.elements.namedItem('kind').value=currentKind;text($('adminEditingTitle'),'Criar novo '+(currentKind==='guide'?'guia':'tópico'))}
$('newContent').addEventListener('click',clearContent);
function listContent(){const root=$('adminContentList');root.replaceChildren();for(const item of adminData.content.filter(x=>x.kind===currentKind)){const row=make('div','admin-list-item');row.append(make('strong','',item.title),make('small','',item.status==='published'?'Publicado':'Rascunho'));const edit=make('button','secondary','Editar');edit.addEventListener('click',()=>{for(const [k,v]of Object.entries({id:item.id,kind:item.kind,title:item.title,summary:item.summary,body:item.body,videoUrl:item.video_url,imageUrl:item.image_url,status:item.status})){const input=$('contentForm').elements.namedItem(k);if(input)input.value=v||''}text($('adminEditingTitle'),'Editando: '+item.title);window.location.hash='#admin';$('contentForm').scrollIntoView({behavior:'smooth',block:'start'})});const del=make('button','secondary','Excluir');del.addEventListener('click',async()=>{if(!confirm('Excluir definitivamente este conteúdo?'))return;try{await api('/api/admin/content/'+item.id,'DELETE');await refreshAdmin();await refreshPublic()}catch(e){text($('adminMessage'),e.message)}});row.append(edit,del);root.append(row)}}
$('contentForm').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));data.kind=currentKind;try{await api('/api/admin/content','POST',data);text($('adminMessage'),'Conteúdo salvo. Rascunhos não aparecem ao público.');clearContent();await refreshAdmin();await refreshPublic()}catch(err){text($('adminMessage'),err.message)}});
function listMedia(){const root=$('mediaList');root.replaceChildren();if(!adminData.media.length){root.append(make('p','admin-empty','Sua biblioteca está vazia. Envie sua primeira imagem acima.'));return}for(const m of adminData.media){const row=make('div','admin-image-tile');const img=make('img','media-thumb');img.src='/media/'+m.id;img.alt='Imagem enviada';const btn=make('button','secondary','Copiar endereço');btn.type='button';btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('/media/'+m.id);text($('adminMessage'),'Endereço da imagem copiado.')}catch(e){text($('adminMessage'),'Não foi possível copiar automaticamente.')}});row.append(img,btn);root.append(row)}}
$('mediaForm').addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('/api/admin/media','POST',new FormData(e.currentTarget));text($('adminMessage'),'Imagem enviada: '+r.url);e.currentTarget.reset();await refreshAdmin()}catch(err){text($('adminMessage'),err.message)}});
function syncPrivateArea(){const allowed=location.hash==='#login'||location.hash==='#admin';$('login').hidden=!allowed;if(!allowed)$('admin').hidden=true;else if(location.hash==='#admin'&&$('accountPanel').hidden===false)$('admin').hidden=false;document.body.classList.toggle('admin-mode',location.hash==='#admin'&&!$('admin').hidden);}
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
const pageNames={inicio:'Página inicial',guias:'Guias',topicos:'Tópicos',certificados:'Certificados',sobre:'Sobre',doacoes:'Doações',rodape:'Rodapé'};
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
  input.value=adminData.settings[key]??originalPageValues[key]??'';
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
