(function(){
const tab=document.getElementById('manageAdministratorsTab');
const panel=document.getElementById('adminAdministrators');
const status=document.getElementById('adminManageStatus');
const list=document.getElementById('adminAccountsList');
if(!tab||!panel)return;
async function request(path,method,data){
 const res=await fetch(path,{method:method||'GET',credentials:'same-origin',headers:{'content-type':'application/json'},body:data?JSON.stringify(data):undefined});
 const result=await res.json();
 if(!res.ok)throw new Error(result.error||'Falha na solicitação');
 return result;
}
async function refresh(){
 try{
 const me=await request('/api/me');
 const owner=me.user?.username?.toLowerCase()==='victor velarian';
 tab.hidden=!owner;
 if(!owner){panel.hidden=true;return}
 const data=await request('/api/admin/administrators');
 list.replaceChildren();
 for(const account of data.items){
 const row=document.createElement('div');
 row.className='admin-list-item';
 const name=document.createElement('strong');
 name.textContent=account.username;
 row.append(name);
 if(!account.owner){
 const names={content:'Tópicos, aulas e conteúdo',students:'Alunos',certificates:'Certificados',comments:'Comentários',notices:'Avisos',suggestions:'Sugestões',reports:'Relatórios e histórico',settings:'Configurações',media:'Biblioteca de imagens'};
 const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-wrap:wrap;gap:12px;margin:12px 0';
 const checks={};
 for(const [key,label] of Object.entries(names)){
 const option=document.createElement('label');option.style.cssText='display:flex;gap:6px;align-items:center;min-width:190px';
 const check=document.createElement('input');check.type='checkbox';check.checked=account.permissions?.[key]===true;checks[key]=check;
 option.append(check,document.createTextNode(label));wrap.append(option);
 }
 const save=document.createElement('button');save.type='button';save.textContent='Salvar permissões';
 save.addEventListener('click',async()=>{save.disabled=true;try{await request('/api/admin/administrators/'+account.id,'PUT',{permissions:Object.fromEntries(Object.entries(checks).map(([key,check])=>[key,check.checked]))});status.textContent='Permissões de '+account.username+' atualizadas.'}catch(e){status.textContent=e.message}finally{save.disabled=false}});
 row.append(wrap,save);
 }
 if(account.username.toLowerCase()!=='victor velarian'){
 const button=document.createElement('button');
 button.type='button';button.textContent='Revogar acesso';
 button.addEventListener('click',async()=>{
 if(!confirm('Revogar acesso de '+account.username+'?'))return;
 try{await request('/api/admin/administrators/'+account.id,'DELETE');status.textContent='Acesso revogado.';await refresh()}
 catch(e){status.textContent=e.message}
 });
 row.append(button);
 }
 list.append(row);
 }
 }catch(e){status.textContent=e.message}
}
tab.addEventListener('click',()=>{
 document.querySelectorAll('.admin-section').forEach(el=>el.hidden=true);
 panel.hidden=false;
 document.querySelectorAll('[data-tab]').forEach(el=>el.classList.remove('active'));
 tab.classList.add('active');
 document.getElementById('adminPageTitle').textContent='Administradores';
 document.getElementById('adminPageDescription').textContent='Controle de acesso e permissões por administrador.';
 refresh();
});
document.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>{panel.hidden=true;tab.classList.remove('active')}));
document.getElementById('adminCreateForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget;
 try{
 await request('/api/admin/administrators','POST',Object.fromEntries(new FormData(form)));
 form.reset();status.textContent='Administrador criado.';await refresh();
 }catch(err){status.textContent=err.message}
});
refresh();
})();