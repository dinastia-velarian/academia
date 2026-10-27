(()=>{
'use strict';
const $=id=>document.getElementById(id),el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
const request=async(path,method='GET',data)=>{const r=await fetch(path,{method,credentials:'same-origin',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const d=await r.json();if(!r.ok)throw Error(d.error||'Erro na solicitação');return d};
const date=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'—';
function panel(title){const box=el('article',undefined,'hub-card');box.append(el('h3',title));return box}
function line(box,headline,detail,actions=[]){const row=el('div',undefined,'hub-entry');row.append(el('strong',headline),el('p',detail));for(const b of actions)row.append(b);box.append(row)}
async function studentLoad(){
 try{const [me,notices]=await Promise.all([request('/api/student/me'),request('/api/academy/notices')]);const logged=!!me.user;const notice=$('studentNotices');notice.hidden=!logged||!notices.items.length;const list=$('studentNoticeList');list.replaceChildren();for(const n of notices.items){const card=panel(n.title);card.append(el('p',n.body));list.append(card)}
  if(!logged)return;
  const d=await request('/api/student/hub');$('studentHubCertificate').disabled=!!d.certificate&&d.certificate.status!=='rejected';const root=$('studentHubRequests');root.replaceChildren();for(const m of d.messages)line(root,'Sugestão · '+m.status,m.body+(m.reply?' · Resposta: '+m.reply:''));$('studentHubCertificateStatus').textContent=d.certificate?'Solicitação: '+({pending:'Aguardando análise',approved:'Aprovado',rejected:'Rejeitado'}[d.certificate.status]||d.certificate.status):'Nenhuma solicitação enviada.';const issued=$('studentIssuedCertificate');if(issued){issued.hidden=!(d.certificate?.status==='approved');if(!issued.hidden){$('studentIssuedCertificateName').textContent=me.user?.username||me.user?.name||'Aluno da Academia Velarian';$('studentIssuedCertificateCode').textContent='Registro: '+d.certificate.code+' · Aprovação: '+date(d.certificate.updatedAt);const image=$('studentCertificateImage'),download=$('studentCertificateDownload');image.hidden=!d.certificate.hasImage;download.hidden=!d.certificate.hasImage;if(d.certificate.hasImage){image.src='/api/student/certificate-image?v='+d.certificate.updatedAt;download.href='/api/student/certificate-image';download.download=d.certificate.generated?'certificado-velarian.svg':'certificado-velarian.png';let pdf=document.getElementById('studentCertificatePdfDownload');if(!pdf){pdf=document.createElement('a');pdf.id='studentCertificatePdfDownload';pdf.textContent='Baixar certificado em PDF';pdf.className=download.className||'secondary';download.insertAdjacentElement('afterend',pdf)}pdf.href='/api/student/certificate-pdf';pdf.download='certificado-academia-velarian.pdf';pdf.hidden=false;}else{image.removeAttribute('src');}}else{const pdf=document.getElementById('studentCertificatePdfDownload');if(pdf)pdf.hidden=true;}}
 }catch(e){$('studentHubSuggestionStatus').textContent=e.message}
}
$('studentHubSuggestionForm')?.addEventListener('submit',async e=>{e.preventDefault();try{await request('/api/student/hub','POST',{kind:'suggestion',body:$('studentHubSuggestion').value});$('studentHubSuggestion').value='';$('studentHubSuggestionStatus').textContent='Sugestão enviada!';studentLoad()}catch(err){$('studentHubSuggestionStatus').textContent=err.message}});
let certificateSending=false;
async function sendCertificateRequest(){
 const status=$('studentHubCertificateStatus'),button=$('studentHubCertificate');
 if(certificateSending)return;
 try{const eligibility=await request('/api/student/certificate-eligibility');if(!eligibility.eligible){status.textContent='Conclua pelo menos '+eligibility.required+' das '+eligibility.total+' aulas antes de solicitar.';return}}catch(e){status.textContent=e.message;return}
 if(!confirm('Enviar sua solicitação para análise da administração da Academia Velarian?'))return;
 certificateSending=true;if(button)button.disabled=true;status.textContent='Enviando solicitação...';
 try{await request('/api/student/hub','POST',{kind:'certificate'});status.textContent='Solicitação enviada ao ADM! Aguarde a análise e a verificação dos requisitos.';await studentLoad()}
 catch(e){status.textContent=e.message}
 finally{certificateSending=false;await studentLoad()}
}
window.academiaSendCertificateRequest=sendCertificateRequest;
$('studentHubCertificate')?.addEventListener('click',sendCertificateRequest);
$('academyVerifyForm')?.addEventListener('submit',async e=>{e.preventDefault();const output=$('academyVerifyResult');try{const code=$('academyVerifyCode').value.trim().toUpperCase();const d=await request('/api/academy/certificate?code='+encodeURIComponent(code));output.textContent=d.valid?'Certificado válido · '+d.certificate.username+' · Código '+d.certificate.code:'Nenhum certificado aprovado encontrado para este código.'}catch(err){output.textContent=err.message}});
window.academiaRefreshStudentHub=studentLoad;
window.addEventListener('hashchange',()=>{if(location.hash==='#minha-academia')studentLoad()});
studentLoad();
})();
