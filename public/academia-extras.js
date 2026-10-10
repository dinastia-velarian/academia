(function(){
'use strict';
const byId=id=>document.getElementById(id);
const create=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e};
const api=async(path,method='GET',data)=>{const r=await fetch(path,{method,credentials:'same-origin',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const x=await r.json();if(!r.ok)throw Error(x.error||'Falha');return x};
const form=byId('contentForm');
if(form){
 const category=create('label','Categoria da aula');const sel=create('select');sel.name='category';
 for(const value of ['Geral','Primeiros Passos','Economia','Militar','Política','Estratégia','Outros']){const opt=create('option',value);opt.value=value;sel.append(opt)}
 category.append(sel);
 const order=create('label','Ordem de exibição (menor aparece primeiro)');const num=create('input');num.name='sortOrder';num.type='number';num.min='0';num.max='9999';num.value='100';order.append(num);
 const video=form.elements.namedItem('videoUrl');video.closest('label').before(category,order);
 const list=byId('adminContentList');
 api('/api/admin/all').then(r=>{window.academiaItems=r.content||[]}).catch(()=>{});const observer=new MutationObserver(()=>{for(const row of list.querySelectorAll('.admin-list-item')){if(row.dataset.enhanced)return;row.dataset.enhanced='1';const title=row.querySelector('strong')?.textContent;const item=window.academiaItems?.find(x=>x.title===title);if(!item)continue;const tag=create('small','Categoria: '+(item.category||'Geral'));row.insertBefore(tag,row.querySelector('button'));const edit=[...row.querySelectorAll('button')].find(x=>x.textContent==='Editar');edit?.addEventListener('click',()=>{sel.value=item.category||'Geral';num.value=item.sortOrder??100})}});
 observer.observe(list,{childList:true});
}
const support=byId('certificados');
if(support){const note=create('p','Não é necessário realizar prova para estudar ou solicitar informações sobre certificados. A emissão é opcional e combinada pelo Telegram.');note.className='certificate-note';support.append(note)}
const host=create('section');host.id='consulta';host.className='section academia-knowledge';
host.innerHTML='<div class="section-heading"><div><div class="eyebrow">CENTRAL DE CONHECIMENTO</div><h2>Perguntas frequentes e glossário.</h2><p>Encontre respostas e conheça os termos usados no Diplomacia.</p></div></div>';
const filter=create('input');filter.type='search';filter.placeholder='Pesquisar pergunta ou termo...';filter.className='knowledge-search';filter.setAttribute('aria-label','Pesquisar na central de conhecimento');
const items=create('div');items.className='knowledge-list';host.append(filter,items);
const reference=byId('sobre');if(reference)reference.before(host);else document.querySelector('main')?.append(host);
let entries=[];
function show(){items.replaceChildren();const q=filter.value.toLocaleLowerCase('pt-BR');const filtered=entries.filter(x=>(x.title+' '+x.body+' '+x.category).toLocaleLowerCase('pt-BR').includes(q));if(!filtered.length){items.append(create('p',entries.length?'Nenhum resultado encontrado.':'Os materiais da central serão publicados em breve.'));return}
 for(const x of filtered){const d=create('details');const summary=create('summary',x.title);const p=create('p',x.body);const small=create('small',(x.kind==='faq'?'Pergunta frequente':'Glossário')+' · '+(x.category||'Geral'));d.append(summary,small,p);items.append(d)}}
filter.addEventListener('input',show);
async function reload(){try{const result=await api('/api/catalog');entries=result.items.map(x=>{try{return JSON.parse(x.value)}catch{return null}}).filter(Boolean);show()}catch{items.replaceChildren(create('p','Não foi possível carregar as perguntas no momento.'))}}
reload();
const nav=document.querySelector('.top nav');if(nav){const a=create('a','Dúvidas');a.href='#consulta';nav.append(a)}
const admin=byId('adminOverview');if(!admin)return;
const panel=create('div');panel.className='admin-form-card knowledge-admin';const heading=create('h3','Perguntas frequentes e glossário');
const desc=create('p','Cadastre perguntas e termos. Eles aparecerão automaticamente na central pública.');
const editor=create('form');editor.className='admin-form';
const kind=create('select');for(const [v,t] of [['faq','Pergunta frequente'],['glossary','Termo do glossário']]){const o=create('option',t);o.value=v;kind.append(o)}
const title=create('input');title.placeholder='Pergunta ou termo';title.required=true;title.maxLength=150;
const answer=create('textarea');answer.placeholder='Resposta ou explicação';answer.required=true;answer.rows=4;
const group=create('input');group.placeholder='Assunto (ex.: Economia)';group.value='Geral';
const save=create('button','Publicar na central');save.type='submit';save.className='primary';
const status=create('p');status.setAttribute('role','status');
for(const [name,input] of [['Tipo',kind],['Pergunta ou termo',title],['Explicação',answer],['Categoria',group]]){const l=create('label',name);l.append(input);editor.append(l)}
editor.append(save,status);const existing=create('div');existing.className='knowledge-admin-list';
panel.append(heading,desc,editor,existing);admin.append(panel);
let editingId='';
async function list(){const r=await api('/api/catalog');existing.replaceChildren();for(const item of r.items){let x;try{x=JSON.parse(item.value)}catch{continue}const row=create('div');row.className='admin-list-item';row.append(create('strong',x.title));const edit=create('button','Editar');edit.type='button';edit.className='secondary';edit.onclick=()=>{editingId=x.id;kind.value=x.kind;title.value=x.title;answer.value=x.body;group.value=x.category;title.focus()};const del=create('button','Excluir');del.type='button';del.className='secondary';del.onclick=async()=>{if(!confirm('Excluir esta entrada?'))return;await api('/api/admin/catalog/'+x.id,'DELETE');await list();await reload()};row.append(edit,del);existing.append(row)}}
editor.addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/catalog','POST',{id:editingId,kind:kind.value,title:title.value,body:answer.value,category:group.value});editingId='';editor.reset();status.textContent='Entrada salva e publicada.';await list();await reload()}catch(e){status.textContent=e.message}});
const tools=create('div');tools.className='admin-form-card knowledge-admin';tools.append(create('h3','Histórico e backups'),create('p','Baixe uma cópia dos textos e configurações. As versões anteriores de aulas editadas ficam disponíveis para consulta.'));
const backup=create('button','Baixar backup JSON');backup.className='secondary';backup.type='button';
backup.onclick=async()=>{try{const data=await api('/api/admin/backup');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=create('a');a.href=url;a.download='academia-velarian-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}catch(e){alert(e.message)}};
const history=create('button','Consultar versões anteriores');history.className='secondary';history.type='button';
const historyList=create('div');historyList.className='knowledge-admin-list';
history.onclick=async()=>{try{const data=await api('/api/admin/history');historyList.replaceChildren();const sorted=data.items.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));if(!sorted.length)historyList.append(create('p','Ainda não há versões anteriores.'));for(const entry of sorted.slice(0,50)){const details=create('details');details.append(create('summary',entry.content.title+' — '+new Date(entry.savedAt).toLocaleString('pt-BR')));const pre=create('pre',entry.content.body);pre.className='history-body';details.append(pre);historyList.append(details)}}catch(e){historyList.replaceChildren(create('p',e.message))}};
tools.append(backup,history,historyList);admin.append(tools);
document.querySelectorAll('[data-tab="guides"],[data-tab="topics"]').forEach(b=>b.addEventListener('click',()=>api('/api/admin/all').then(r=>{window.academiaItems=r.content||[]}).catch(()=>{})));const adminEntry=byId('adminEntry');if(adminEntry)adminEntry.addEventListener('click',()=>list().catch(()=>{}));
const tab=admin.querySelector('[data-tab="overview"]');if(tab)tab.addEventListener('click',()=>list().catch(()=>{}));
})();
