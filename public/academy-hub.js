(()=>{
'use strict';
const $=id=>document.getElementById(id),el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
const request=async(path,method='GET',data)=>{const r=await fetch(path,{method,credentials:'same-origin',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const d=await r.json();if(!r.ok)throw Error(d.error||'Erro na solicitação');return d};
const date=v=>v?new Date(v).toLocaleDateString('pt-BR'):'—';
const hubTabs=['certificates','notices','suggestions','trade','reports','history'];
let active='',data=null;
function btn(label,callback){const b=el('button',label,'secondary');b.type='button';b.addEventListener('click',callback);return b}
function panel(title){const box=el('article',undefined,'hub-card');box.append(el('h3',title));return box}
function line(box,headline,detail,actions=[]){const row=el('div',undefined,'hub-entry');row.append(el('strong',headline),el('p',detail));for(const b of actions)row.append(b);box.append(row)}
async function action(body){try{await request('/api/admin/hub-action','POST',body);await loadAdmin()}catch(e){$('adminHubStatus').textContent=e.message}}
async function loadAdmin(){
 if(!active)return;const root=$('adminHubContent');root.replaceChildren();$('adminHubStatus').textContent='Carregando...';
 try{
  data=await request('/api/admin/hub');$('adminHubStatus').textContent='';
  const titles={certificates:'Certificados',notices:'Avisos aos alunos',suggestions:'Sugestões dos alunos',trade:'Trade Velarian',reports:'Relatórios acadêmicos',history:'Histórico administrativo'};
  $('adminHubTitle').textContent=titles[active];
  if(active==='notices'){
   const form=el('form',undefined,'hub-form');const title=el('input'),body=el('textarea');title.placeholder='Título do aviso';title.maxLength=120;title.required=true;body.placeholder='Mensagem para os alunos';body.maxLength=1000;body.required=true;form.append(title,body);const submit=el('button','Publicar aviso','primary');submit.type='submit';form.append(submit);form.onsubmit=async e=>{e.preventDefault();await action({kind:'notice',title:title.value,body:body.value})};root.append(form);
   const box=panel('Avisos publicados');for(const n of data.notices)line(box,n.title+(n.active?' · Visível':' · Oculto'),n.body+' · '+date(n.createdAt),[btn(n.active?'Ocultar':'Reativar',()=>action({kind:'notice-toggle',id:n.id}))]);if(!data.notices.length)box.append(el('p','Nenhum aviso publicado. Use o formulário acima para criar o primeiro comunicado; ele será exibido no painel dos alunos conectados.'));root.append(box);
  }
  if(active==='suggestions'){
   const box=panel('Sugestões recebidas');for(const m of data.messages.filter(x=>x.kind==='suggestion'))line(box,m.username+' · '+m.status,m.body+' · '+date(m.createdAt)+(m.reply?' · Resposta: '+m.reply:''),[btn('Responder',()=>{const reply=prompt('Resposta ao aluno:',m.reply||'');if(reply!==null)action({kind:'suggestion',id:m.id,status:'resolved',reply})}),btn('Rejeitar',()=>action({kind:'suggestion',id:m.id,status:'rejected',reply:m.reply}))]);if(!box.querySelector('.hub-entry'))box.append(el('p','Nenhuma sugestão recebida até agora. Quando um aluno enviar uma sugestão em Minha Academia, ela aparecerá aqui para você responder ou rejeitar.'));root.append(box);
  }
  if(active==='certificates'){
   const box=panel('Solicitações de certificado');for(const c of data.certificates)line(box,c.username+' · '+c.status,'Código: '+c.code+' · '+date(c.createdAt),[btn('Aprovar',()=>{if(confirm('Confirma que verificou os requisitos no jogo?'))action({kind:'certificate',id:c.id,status:'approved'})}),btn('Rejeitar',()=>action({kind:'certificate',id:c.id,status:'rejected'})]);if(!box.querySelector('.hub-entry'))box.append(el('p','Nenhum certificado solicitado ainda. Os alunos precisam concluir pelo menos 80% das aulas e enviar o pedido pelo painel. Depois você poderá aprovar ou rejeitar cada solicitação.'));root.append(box);
  }
  if(active==='history'){const box=panel('Últimas 100 ações registradas');for(const x of data.events)line(box,x.actor+' · '+x.action,x.detail+' · '+date(x.createdAt));if(!data.events.length)box.append(el('p','Ainda não há atividades registradas. Novos acessos, conclusões de aulas, sugestões e ações administrativas serão exibidos aqui.'));root.append(box)}
  if(active==='reports'){
   const stats=panel('Indicadores da Academia');const values=[['Alunos cadastrados',(data.students||[]).length],['Sugestões recebidas',data.messages.filter(x=>x.kind==='suggestion').length],['Certificados solicitados',data.certificates.length],['Certificados aprovados',data.certificates.filter(x=>x.status==='approved').length],['Avisos publicados',data.notices.length],['Atividades recentes',data.events.length]];const grid=el('div',undefined,'hub-metrics');for(const [name,value] of values){const item=el('div',undefined,'hub-metric');item.append(el('strong',String(value)),el('span',name));grid.append(item)}stats.append(grid);root.append(stats);const box=panel('Exportar dados');box.append(el('p','Baixe um arquivo CSV com alunos, sugestões, certificados e eventos registrados.'));box.append(btn('Exportar relatório CSV',exportCSV));root.append(box);
  }
  if(active==='trade'){
   const box=panel('Preços e disponibilidade');box.append(el('p','Atualize os preços exibidos no painel dos alunos. Valores em milhões de moedas do Diplomacia.'));const settings=(await request('/api/admin/all')).settings||{};const fields=[['tradePremium1','Premium · 1 mês'],['tradePremium6','Premium · 6 meses'],['tradeDiamonds1k','1.000 diamantes'],['tradeDiamonds5k','5.000 diamantes'],['tradeDiamonds15k','15.000 diamantes'],['tradeDiamonds50k','50.000 diamantes'],['tradePromo','Mensagem promocional'],['tradeTelegram','Contato Telegram']];const form=el('form',undefined,'hub-form');for(const [key,label] of fields){const wrapper=el('label',label),input=el('input');input.name=key;input.value=settings[key]||'';input.maxLength=key==='tradePromo'?160:250;wrapper.append(input);form.append(wrapper)}const availability=el('label','Disponibilidade geral'),select=el('select');select.name='tradeAvailability';for(const [value,label] of [['available','Vendas disponíveis'],['paused','Pedidos suspensos']]){const option=el('option',label);option.value=value;select.append(option)}select.value=settings.tradeAvailability||'available';availability.append(select);form.append(availability);const save=el('button','Salvar alterações da Trade','primary');save.type='submit';form.append(save);form.onsubmit=async e=>{e.preventDefault();try{await request('/api/admin/settings','PUT',Object.fromEntries(new FormData(form)));$('adminHubStatus').textContent='Preços e disponibilidade atualizados com sucesso.'}catch(err){$('adminHubStatus').textContent=err.message}};box.append(form);root.append(box);
  }
 }catch(e){$('adminHubStatus').textContent=e.message}
}
function exportCSV(){
 const rows=[['tipo','jogador','detalhe','status','data'],...(data.students||[]).map(x=>['aluno',x.username,'Cadastro','',''+date(x.createdAt)]),...data.messages.map(x=>['sugestao',x.username,x.body,x.status,date(x.createdAt)]),...data.certificates.map(x=>['certificado',x.username,x.code,x.status,date(x.createdAt)]),...data.events.map(x=>['evento',x.actor,x.action+' '+x.detail,'',date(x.createdAt)])];
 const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='academia-velarian-relatorio.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
window.academiaHubTab=tab=>{active=hubTabs.includes(tab)?tab:'';if(active)loadAdmin()};
async function studentLoad(){
 try{const [me,notices]=await Promise.all([request('/api/student/me'),request('/api/academy/notices')]);const logged=!!me.user;const notice=$('studentNotices');notice.hidden=!logged||!notices.items.length;const list=$('studentNoticeList');list.replaceChildren();for(const n of notices.items){const card=panel(n.title);card.append(el('p',n.body));list.append(card)}
  if(!logged)return;
  const d=await request('/api/student/hub');const root=$('studentHubRequests');root.replaceChildren();for(const m of d.messages)line(root,'Sugestão · '+m.status,m.body+(m.reply?' · Resposta: '+m.reply:''));$('studentHubCertificateStatus').textContent=d.certificate?'Solicitação: '+d.certificate.status+(d.certificate.status==='approved'?' · Código: '+d.certificate.code:''):'Nenhuma solicitação enviada.';
 }catch(e){$('studentHubSuggestionStatus').textContent=e.message}
}
$('studentHubSuggestionForm')?.addEventListener('submit',async e=>{e.preventDefault();try{await request('/api/student/hub','POST',{kind:'suggestion',body:$('studentHubSuggestion').value});$('studentHubSuggestion').value='';$('studentHubSuggestionStatus').textContent='Sugestão enviada!';studentLoad()}catch(err){$('studentHubSuggestionStatus').textContent=err.message}});
$('studentHubCertificate')?.addEventListener('click',async()=>{const percent=parseInt($('studentPercent')?.textContent||'0',10);if(percent<80){$('studentHubCertificateStatus').textContent='Conclua pelo menos 80% das aulas antes de solicitar.';return}try{await request('/api/student/hub','POST',{kind:'certificate'});studentLoad()}catch(e){$('studentHubCertificateStatus').textContent=e.message}});
async function profile(){
 const id=window.academiaSelectedStudent?.();if(!id)return;const root=$('studentProfileContent');root.replaceChildren();
 try{const d=await request('/api/admin/student-profile?id='+encodeURIComponent(id));root.append(el('p','Cadastro: '+date(d.student.createdAt)+' · Última conclusão: '+date(d.lastLesson)));root.append(el('p','Certificado: '+(d.certificate?.status||'Não solicitado')));
  const box=panel('Comentários publicados');for(const c of d.comments)line(box,date(c.createdAt),c.body,[btn('Excluir',async()=>{if(!confirm('Excluir comentário?'))return;try{await request('/api/admin/comment-delete','POST',{id:c.id,confirm:true});profile()}catch(e){alert(e.message)}})]);root.append(box);
  const events=panel('Atividades registradas');for(const x of d.events)line(events,x.action,x.detail+' · '+date(x.createdAt));root.append(events);
 }catch(e){root.append(el('p',e.message))}
}
$('academyVerifyForm')?.addEventListener('submit',async e=>{e.preventDefault();const output=$('academyVerifyResult');try{const code=$('academyVerifyCode').value.trim().toUpperCase();const d=await request('/api/academy/certificate?code='+encodeURIComponent(code));output.textContent=d.valid?'Certificado válido · '+d.certificate.username+' · Código '+d.certificate.code:'Nenhum certificado aprovado encontrado para este código.'}catch(err){output.textContent=err.message}});
window.academiaHubProfile=profile;
window.addEventListener('hashchange',()=>{if(location.hash==='#minha-academia')studentLoad()});
document.addEventListener('click',e=>{if(e.target.closest('#studentAdminList button'))setTimeout(profile,350)});
studentLoad();
})();