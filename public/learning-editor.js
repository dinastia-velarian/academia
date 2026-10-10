(function(){
'use strict';
function escapeText(value){return String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function inline(value){
 return escapeText(value).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,function(_,label,url){return '<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+label+'</a>';});
}
function render(source){
 const lines=String(source||'').split(/\r?\n/),parts=[],list=[];
 function closeList(){if(list.length){parts.push('<ul>'+list.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>');list.length=0;}}
 for(const line of lines){
  if(line.startsWith('- ')){list.push(line.slice(2));continue;}closeList();
  if(line.startsWith('### '))parts.push('<h3>'+inline(line.slice(4))+'</h3>');
  else if(line.startsWith('## '))parts.push('<h2>'+inline(line.slice(3))+'</h2>');
  else if(line.startsWith('# '))parts.push('<h2>'+inline(line.slice(2))+'</h2>');
  else if(line.startsWith('> '))parts.push('<blockquote>'+inline(line.slice(2))+'</blockquote>');
  else if(line.trim())parts.push('<p>'+inline(line)+'</p>');
 }closeList();return parts.join('');
}
function upgradeArticle(){
 const el=document.querySelector('#courseDetail .article-body');if(!el||el.dataset.formatted)return;
 const original=el.textContent;el.innerHTML=render(original);el.dataset.formatted='1';
}
document.addEventListener('click',function(event){if(event.target.closest('.public-content .text-link'))setTimeout(upgradeArticle,0);});
const form=document.getElementById('contentForm');if(!form)return;
const body=form.elements.namedItem('body');
const bar=document.createElement('div');bar.className='lesson-format-bar';
const actions=[['Título','## ',''],['Negrito','**','**'],['Itálico','*','*'],['Lista','- ',''],['Citação','> ','']];
for(const [label,before,after]of actions){
 const button=document.createElement('button');button.type='button';button.textContent=label;
 button.addEventListener('click',function(){
  const a=body.selectionStart,b=body.selectionEnd,selected=body.value.slice(a,b)||'seu texto';
  body.setRangeText(before+selected+after,a,b,'select');body.focus();
 });bar.append(button);
}
const preview=document.createElement('button');preview.type='button';preview.textContent='Prévia da aula';
preview.addEventListener('click',function(){
 const dialog=document.getElementById('lessonPreviewDialog');dialog.querySelector('.lesson-preview-content').innerHTML=render(body.value);dialog.showModal();
});bar.append(preview);
body.closest('label').before(bar);
const hint=document.createElement('p');hint.className='lesson-format-hint';hint.textContent='Selecione uma parte do texto e use os botões. Clique em Prévia da aula para conferir antes de publicar.';bar.after(hint);
const dialog=document.createElement('dialog');dialog.id='lessonPreviewDialog';dialog.className='lesson-preview-dialog';
const close=document.createElement('button');close.type='button';close.textContent='Fechar prévia';close.addEventListener('click',()=>dialog.close());
const content=document.createElement('div');content.className='lesson-preview-content article-body';dialog.append(close,content);document.body.append(dialog);
})();