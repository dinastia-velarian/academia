(()=>{
'use strict';
const $=id=>document.getElementById(id);
const list=$('commentList');if(!list)return;
const create=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el};
async function load(){
 try{const r=await fetch('/api/comments',{credentials:'same-origin'}),d=await r.json();if(!r.ok)throw Error(d.error||'Erro ao carregar');list.replaceChildren();
  if(!d.items.length){list.append(create('p','comment-empty','Seja o primeiro a comentar!'));return}
  for(const c of d.items){const card=create('article','comment-card'),header=create('div','comment-card-head');header.append(create('strong','',c.username),create('time','',new Date(c.createdAt).toLocaleDateString('pt-BR')));card.append(header,create('p','',c.body));list.append(card)}
 }catch(e){list.replaceChildren(create('p','comment-empty',e.message))}
}
async function refreshLogin(){
 try{const [student,admin]=await Promise.all([fetch('/api/student/me',{credentials:'same-origin'}).then(r=>r.json()),fetch('/api/me',{credentials:'same-origin'}).then(r=>r.json()).catch(()=>({}))]);const logged=student.user||admin.user;$('commentLoginHint').hidden=!!logged;if(logged)$('commentLoginStatus').textContent='';return !!logged}catch{return false}
}
$('commentLoginForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,d=Object.fromEntries(new FormData(form)),status=$('commentLoginStatus');status.textContent='Entrando...';
 try{const r=await fetch('/api/student/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(d)});const data=await r.json();if(!r.ok)throw Error(data.error||'Falha no login');form.reset();status.textContent='Login realizado!';await refreshLogin();$('commentBody').focus()}
 catch(err){status.textContent=err.message}
});
window.addEventListener('focus',refreshLogin);
$('commentForm').addEventListener('submit',async e=>{
 e.preventDefault();const input=$('commentBody'),body=input.value.trim(),msg=$('commentMessage');if(body.length<3){msg.textContent='Escreva pelo menos 3 caracteres.';return}
 const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
 try{let r=await fetch('/api/student/comments',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({body})});let d=await r.json();if(r.status===401){r=await fetch('/api/comments',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({body})});d=await r.json()}if(!r.ok)throw Error(d.error||'Não foi possível publicar');input.value='';msg.textContent='Comentário publicado com sucesso!';await load()}
 catch(err){msg.textContent=err.message}finally{button.disabled=false}
});
$('commentRefresh').addEventListener('click',load);load();refreshLogin();
})();