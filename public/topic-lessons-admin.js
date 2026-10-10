(function(){
'use strict';
const api=async(path,method='GET',data)=>{const r=await fetch(path,{method,credentials:'same-origin',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await r.json();if(!r.ok)throw Error(result.error||'Erro ao salvar');return result};
const admin=document.getElementById('adminContent');if(!admin||typeof courses==='undefined')return;
const section=document.createElement('section');section.className='admin-form-card original-lessons-admin';
const heading=document.createElement('h3');heading.textContent='Editar os tópicos já existentes';
const explanation=document.createElement('p');explanation.textContent='Escolha um dos oito tópicos e um subtópico para publicar ou atualizar a aula dentro dele.';
const form=document.createElement('form');form.className='admin-form';
function field(label,element){const wrapper=document.createElement('label');wrapper.append(document.createTextNode(label),element);form.append(wrapper);return element}
function select(){return document.createElement('select')}
const topic=field('Tópico existente',select()),lesson=field('Subtópico',select());
const title=field('Título da aula',document.createElement('input'));title.required=true;
const body=field('Texto completo da aula',document.createElement('textarea'));body.rows=12;
const video=field('Vídeo do YouTube (opcional)',document.createElement('input'));video.type='url';video.placeholder='https://www.youtube.com/watch?v=...';
const image=field('Imagem da aula (opcional)',document.createElement('input'));image.placeholder='/media/...';
const pick=document.createElement('button');pick.type='button';pick.className='secondary';pick.textContent='Escolher imagem da biblioteca';pick.onclick=()=>{const original=document.querySelector('[data-image-target="imageUrl"]');if(original){const input=document.getElementById('contentForm').elements.namedItem('imageUrl');original.click();const dialog=document.getElementById('imagePicker');if(dialog){const observer=new MutationObserver(()=>{if(!dialog.open){image.value=input.value;observer.disconnect()}});observer.observe(dialog,{attributes:true,attributeFilter:['open']})}}};form.append(pick);
const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Salvar aula neste subtópico';form.append(save);
const status=document.createElement('p');status.setAttribute('role','status');form.append(status);
section.append(heading,explanation,form);admin.prepend(section);
courses.forEach((c,i)=>{const option=document.createElement('option');option.value=i;option.textContent=c.title;topic.append(option)});
let items=[];
async function load(){try{items=(await api('/api/lessons')).items||[];fill()}catch(e){status.textContent=e.message}}
function fillLessons(){lesson.replaceChildren();courses[Number(topic.value)].lessons.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.textContent=name;lesson.append(option)});fill()}
function fill(){const i=Number(topic.value),j=Number(lesson.value),record=items.find(x=>x.topic===i&&x.index===j);title.value=record?.title||courses[i].lessons[j];body.value=record?.body||'';video.value=record?.videoUrl||'';image.value=record?.imageUrl||'';status.textContent=record?'Aula já cadastrada: você pode atualizar o conteúdo.':'Este subtópico ainda não possui aula publicada.'}
topic.onchange=fillLessons;lesson.onchange=fill;
form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{await api('/api/admin/lesson','POST',{topic:Number(topic.value),index:Number(lesson.value),title:title.value,body:body.value,videoUrl:video.value,imageUrl:image.value});status.textContent='Aula salva! Ela já pode ser acessada dentro do tópico correspondente.';items=(await api('/api/lessons')).items||[]}catch(e){status.textContent=e.message}finally{save.disabled=false}};
fillLessons();load();
const nav=document.querySelector('[data-tab="topics"]');nav?.addEventListener('click',()=>{load();section.scrollIntoView({block:'nearest'})});
})();