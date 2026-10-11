(function(){
'use strict';
const api=async(path,method='GET',data)=>{const r=await fetch(path,{method,credentials:'same-origin',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await r.json();if(!r.ok)throw Error(result.error||'Erro ao salvar');return result};
const admin=document.getElementById('adminContent');if(!admin||typeof courses==='undefined')return;
const topicSection=document.createElement('section');topicSection.className='admin-form-card original-lessons-admin';
const topicHeading=document.createElement('h3');topicHeading.textContent='VÍDEO GERAL DO TÓPICO E CONFIGURAÇÕES';
const topicHelp=document.createElement('p');topicHelp.textContent='Cole aqui o vídeo que aparecerá acima de todas as aulas do tópico. Você também pode alterar o nome, a descrição, a dificuldade e o símbolo.';
const topicForm=document.createElement('form');topicForm.className='admin-form';
const topicSelect=document.createElement('select');const topicTitle=document.createElement('input');topicTitle.required=true;topicTitle.maxLength=140;
const topicDesc=document.createElement('textarea');topicDesc.rows=3;topicDesc.required=true;
const topicLevel=document.createElement('select');for(const value of ['Iniciante','Intermediário','Avançado']){const opt=document.createElement('option');opt.value=value;opt.textContent=value;topicLevel.append(opt)}
const topicIcon=document.createElement('input');topicIcon.maxLength=8;
for(const [label,field] of [['Escolher tópico',topicSelect],['Nome do tópico',topicTitle],['Descrição',topicDesc],['Dificuldade',topicLevel],['Símbolo',topicIcon]]){const wrap=document.createElement('label');wrap.append(document.createTextNode(label),field);topicForm.append(wrap)}
const videoLabel=document.createElement('label');videoLabel.textContent='VÍDEO DO TÓPICO (YouTube) — aparece acima da lista de aulas';const topicVideo=document.createElement('input');topicVideo.type='url';topicVideo.placeholder='https://www.youtube.com/watch?v=...';videoLabel.append(topicVideo);topicForm.append(videoLabel);
const videoHelp=document.createElement('p');videoHelp.textContent='Um único vídeo por tópico, exibido acima da lista de subtópicos. Deixe em branco para remover.';topicForm.append(videoHelp);
let topicVideos={};fetch('/api/topic-videos').then(r=>r.json()).then(d=>{topicVideos=Object.fromEntries((d.items||[]).map(x=>[x.topic,x.videoUrl]));topicVideo.value=topicVideos[Number(topicSelect.value)]||''}).catch(()=>{});
const topicSave=document.createElement('button');topicSave.className='primary';topicSave.type='submit';topicSave.textContent='Salvar alterações do tópico';
const topicStatus=document.createElement('p');topicStatus.setAttribute('role','status');topicForm.append(topicSave,topicStatus);
topicSection.append(topicHeading,topicHelp,topicForm);admin.prepend(topicSection);
courses.forEach((c,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=c.title;topicSelect.append(opt)});
function fillTopic(){const c=courses[Number(topicSelect.value)];topicTitle.value=c.title;topicDesc.value=c.desc;topicLevel.value=c.level;topicIcon.value=c.icon;topicVideo.value=topicVideos[Number(topicSelect.value)]||''}
topicSelect.onchange=fillTopic;fillTopic();
topicForm.onsubmit=async e=>{e.preventDefault();topicSave.disabled=true;try{const index=Number(topicSelect.value);await api('/api/admin/topic','POST',{index,title:topicTitle.value,desc:topicDesc.value,level:topicLevel.value,icon:topicIcon.value});await api('/api/admin/topic-video','POST',{topic:index,videoUrl:topicVideo.value.trim()});topicVideos[index]=topicVideo.value.trim();Object.assign(courses[index],{title:topicTitle.value,desc:topicDesc.value,level:topicLevel.value,icon:topicIcon.value});topicSelect.options[index].textContent=topicTitle.value;topic.options[index].textContent=topicTitle.value;render();topicStatus.textContent='Tópico atualizado com sucesso.'}catch(err){topicStatus.textContent=err.message}finally{topicSave.disabled=false}};
const section=document.createElement('section');section.className='admin-form-card original-lessons-admin';
const heading=document.createElement('h3');heading.textContent='Editar os tópicos já existentes';
const explanation=document.createElement('p');explanation.textContent='Edite os textos individuais das aulas abaixo. O vídeo geral do tópico é configurado na seção acima.';
const form=document.createElement('form');form.className='admin-form';
function field(label,element){const wrapper=document.createElement('label');wrapper.append(document.createTextNode(label),element);form.append(wrapper);return element}
function select(){return document.createElement('select')}
const topic=field('Tópico existente',select()),lesson=field('Subtópico',select());
const title=field('Nome do subtópico (você pode alterar)',document.createElement('input'));title.required=true;
const body=field('Texto completo da aula',document.createElement('textarea'));body.rows=12;
const video=field('Vídeo desta aula (opcional, diferente do vídeo geral do tópico)',document.createElement('input'));video.type='url';video.placeholder='https://www.youtube.com/watch?v=...';
const image=field('Imagem da aula (opcional)',document.createElement('input'));image.placeholder='/media/...';
const pick=document.createElement('button');pick.type='button';pick.className='secondary';pick.textContent='Escolher imagem da biblioteca';pick.onclick=()=>{const original=document.querySelector('[data-image-target="imageUrl"]');if(original){const input=document.getElementById('contentForm').elements.namedItem('imageUrl');original.click();const dialog=document.getElementById('imagePicker');if(dialog){const observer=new MutationObserver(()=>{if(!dialog.open){image.value=input.value;observer.disconnect()}});observer.observe(dialog,{attributes:true,attributeFilter:['open']})}}};form.append(pick);
const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Salvar aula neste subtópico';form.append(save);
const status=document.createElement('p');status.setAttribute('role','status');form.append(status);
section.append(heading,explanation,form);topicSection.insertAdjacentElement('afterend',section);
courses.forEach((c,i)=>{const option=document.createElement('option');option.value=i;option.textContent=c.title;topic.append(option)});
let orders={};
const manage=document.createElement('div');manage.className='admin-form-card';
const manageHeading=document.createElement('h4');manageHeading.textContent='Gerenciar subtópicos';
const manageHelp=document.createElement('p');manageHelp.textContent='Adicione aulas, mude a ordem ou retire um subtópico da lista. Ao retirar, o conteúdo fica guardado para possível recuperação.';
const addButton=document.createElement('button');addButton.type='button';addButton.className='secondary';addButton.textContent='+ Adicionar subtópico';
const upButton=document.createElement('button');upButton.type='button';upButton.className='secondary';upButton.textContent='↑ Subir';
const downButton=document.createElement('button');downButton.type='button';downButton.className='secondary';downButton.textContent='↓ Descer';
const removeButton=document.createElement('button');removeButton.type='button';removeButton.className='secondary';removeButton.textContent='Retirar da lista';
const manageStatus=document.createElement('p');manageStatus.setAttribute('role','status');
manage.append(manageHeading,manageHelp,addButton,upButton,downButton,removeButton,manageStatus);section.append(manage);
function currentOrder(){const i=Number(topic.value);return orders[i]||courses[i].lessons.map((_,j)=>j)}
async function saveOrder(order){const i=Number(topic.value);await api('/api/admin/lesson-order','POST',{topic:i,order});orders[i]=order;fillLessons();render()}
addButton.onclick=async()=>{const name=prompt('Nome do novo subtópico:');if(!name?.trim())return;const i=Number(topic.value);const used=new Set([...currentOrder(),...items.filter(x=>x.topic===i).map(x=>x.index),...approvedItems.filter(x=>x.topic===i).map(x=>x.index)]);let index=courses[i].lessons.length;while(used.has(index))index++;if(index>199){manageStatus.textContent='Limite de subtópicos atingido.';return}addButton.disabled=true;try{await api('/api/admin/lesson','POST',{topic:i,index,title:name.trim(),body:'',videoUrl:'',imageUrl:''});items=(await api('/api/lessons')).items||[];await saveOrder([...currentOrder(),index]);lesson.value=String(index);fill();manageStatus.textContent='Subtópico criado. Agora você pode preencher a aula.'}catch(e){manageStatus.textContent=e.message}finally{addButton.disabled=false}};
async function move(direction){const order=[...currentOrder()],pos=order.indexOf(Number(lesson.value)),next=pos+direction;if(pos<0||next<0||next>=order.length)return;[order[pos],order[next]]=[order[next],order[pos]];const selected=lesson.value;try{await saveOrder(order);lesson.value=selected;fill();manageStatus.textContent='Ordem atualizada.'}catch(e){manageStatus.textContent=e.message}}
upButton.onclick=()=>move(-1);downButton.onclick=()=>move(1);
removeButton.onclick=async()=>{const selected=Number(lesson.value);if(!confirm('Retirar este subtópico da lista pública? O conteúdo ficará guardado.'))return;try{await saveOrder(currentOrder().filter(x=>x!==selected));manageStatus.textContent='Subtópico retirado da lista pública.'}catch(e){manageStatus.textContent=e.message}};
let items=[];let approvedItems=[];
async function load(){try{const [lessons,ordering,approved]=await Promise.all([api('/api/lessons'),api('/api/lesson-order'),fetch('/approved-lessons.json').then(r=>r.json()).catch(()=>({items:[]}))]);approvedItems=approved.items||[];items=lessons.items||[];orders=Object.fromEntries((ordering.items||[]).map(x=>[x.topic,x.order]));orders[2]=courses[2].lessons.map((_,i)=>i);orders[1]=courses[1].lessons.map((_,i)=>i);orders[0]=courses[0].lessons.map((_,i)=>i);orders[4]=courses[4].lessons.map((_,i)=>i);orders[5]=courses[5].lessons.map((_,i)=>i);orders[6]=courses[6].lessons.map((_,i)=>i);orders[7]=courses[7].lessons.map((_,i)=>i);orders[8]=courses[8].lessons.map((_,i)=>i);fillLessons()}catch(e){status.textContent=e.message}}
function fillLessons(){lesson.replaceChildren();currentOrder().forEach(i=>{const option=document.createElement('option');option.value=i;option.textContent=items.find(x=>x.topic===Number(topic.value)&&x.index===i)?.title||approvedItems.find(x=>x.topic===Number(topic.value)&&x.index===i)?.title||courses[Number(topic.value)].lessons[i]||'Novo subtópico';lesson.append(option)});fill()}
function fill(){const i=Number(topic.value),j=Number(lesson.value),record=items.find(x=>x.topic===i&&x.index===j)||approvedItems.find(x=>x.topic===i&&x.index===j);title.value=record?.title||courses[i].lessons[j]||'';body.value=record?.body||'';video.value=record?.videoUrl||'';image.value=record?.imageUrl||'';status.textContent=record?'Aula já cadastrada: você pode atualizar o conteúdo.':'Este subtópico ainda não possui aula publicada.'}
topic.onchange=fillLessons;lesson.onchange=fill;
form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{await api('/api/admin/lesson','POST',{topic:Number(topic.value),index:Number(lesson.value),title:title.value,body:body.value,videoUrl:video.value,imageUrl:image.value});status.textContent='Nome e conteúdo do subtópico salvos! A alteração aparecerá na lista pública.';items=(await api('/api/lessons')).items||[];lesson.selectedOptions[0].textContent=title.value;if(Number(lesson.value)<courses[Number(topic.value)].lessons.length)courses[Number(topic.value)].lessons[Number(lesson.value)]=title.value}catch(e){status.textContent=e.message}finally{save.disabled=false}};
fillLessons();load();
const nav=document.querySelector('[data-tab="topics"]');nav?.addEventListener('click',()=>{load();topicSection.scrollIntoView({block:'nearest'})});
})();