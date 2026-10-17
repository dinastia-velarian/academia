(()=>{'use strict';
const root=document.getElementById('studentArea');if(!root)return;
const $=id=>document.getElementById(id);
let user=null,completed=new Set();
async function api(path,method='GET',data){const r=await fetch('/api/student/'+path,{method,credentials:'same-origin',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const b=await r.json();if(!r.ok)throw Error(b.error||'Erro na solicitação');return b}
function message(t){$('studentMessage').textContent=t}
function safeText(el,value){el.textContent=value}
async function refresh(){try{const me=await api('me');user=me.user;completed=new Set();if(user){const p=await api('progress');completed=new Set((p.items||[]).map(x=>x.lesson_key))}}catch(e){message('Não foi possível carregar sua conta: '+e.message)}render()}
function visibleCourses(){return typeof courses==='undefined'?[]:courses.map((c,i)=>({c,i})).filter(x=>x.i!==7)}
function total(){return visibleCourses().reduce((n,x)=>n+x.c.lessons.length,0)}
function render(){ $('studentAuth').hidden=!!user;$('studentDashboard').hidden=!user;$('studentLogout').hidden=!user;if(!user)return;
safeText($('studentWelcome'),'Bem-vindo(a), '+user.username);
const count=visibleCourses().reduce((n,{c,i})=>n+c.lessons.filter((_,j)=>completed.has('t'+i+'-l'+j)).length,0);
safeText($('studentStats'),count+' de '+total()+' aulas concluídas · '+Math.round(100*count/Math.max(1,total()))+'% do conteúdo');
$('studentProgressBar').style.width=(100*count/Math.max(1,total()))+'%';
const list=$('studentCourseList');list.replaceChildren();
for(const {c,i} of visibleCourses()){const section=document.createElement('section');section.className='student-course';const heading=document.createElement('h3');heading.textContent=c.title;section.append(heading);for(let j=0;j<c.lessons.length;j++){const key='t'+i+'-l'+j;const label=document.createElement('label');label.className='student-lesson';const check=document.createElement('input');check.type='checkbox';check.checked=completed.has(key);check.addEventListener('change',async()=>{check.disabled=true;try{await mark(i,j,check.checked)}catch(e){check.checked=!check.checked;message(e.message)}finally{check.disabled=false}});const span=document.createElement('span');span.textContent=c.lessons[j];label.append(check,span);section.append(label)}list.append(section)}}
async function mark(i,j,value){if(!user)throw Error('Entre na sua conta para salvar o progresso.');const key='t'+i+'-l'+j;await api('progress','POST',{lessonKey:key,completed:value});if(value)completed.add(key);else completed.delete(key);render()}
window.AcademiaStudent={mark,isLogged:()=>!!user,isDone:(i,j)=>completed.has('t'+i+'-l'+j),open:()=>{root.hidden=false;root.scrollIntoView({behavior:'smooth'})}};
$('studentRegister').addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));if(d.password!==d.confirm){message('As senhas não coincidem.');return}try{await api('register','POST',{username:d.username,password:d.password});e.currentTarget.reset();message('Conta criada!');await refresh()}catch(err){message(err.message)}});
$('studentLogin').addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));try{await api('login','POST',d);e.currentTarget.reset();message('Login realizado.');await refresh()}catch(err){message(err.message)}});
$('studentLogout').addEventListener('click',async()=>{try{await api('logout','POST');message('Você saiu da sua conta.');await refresh()}catch(e){message(e.message)}});
refresh();
})();