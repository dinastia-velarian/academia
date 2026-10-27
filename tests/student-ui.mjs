import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
class Element {
 constructor(){this.hidden=false;this.attrs={};this.style={};this.children=[];this.classList={toggle(){}};this.textContent=''}
 addEventListener(){} setAttribute(k,v){this.attrs[k]=v} append(...xs){this.children.push(...xs)} replaceChildren(...xs){this.children=xs} querySelector(){return new Element()}
}
const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
let done=new Set(['t0-l0','t0-l1','t0-l2']);
const courses=[{title:'Test',lessons:['A','B','C','D','E']}];
const approved={items:courses[0].lessons.map((title,index)=>({topic:0,index,title}))};
const context={document:{getElementById:element,createElement:()=>new Element(),body:{classList:{toggle(){}}}},location:{hash:'#minha-academia'},window:{addEventListener(){},scrollTo(){}},courses,fetch:async(url,options={})=>{
 let data={};if(url.endsWith('/me'))data={user:{id:'A',username:'QA UI'}};
 else if(url.endsWith('/progress')){if(options.method==='POST'){const p=JSON.parse(options.body);if(p.completed)done.add(p.lessonKey);else done.delete(p.lessonKey)}data={items:[...done].map(lesson_key=>({lesson_key}))}}
 else if(url.endsWith('/certificate-eligibility'))data={total:5,required:4,completed:done.size,eligible:done.size>=4};
 else if(url==='/api/curriculum')data={topicCount:1,total:5,topics:[{topic:0,lessons:courses[0].lessons.map((title,index)=>({index,title}))}]};
 else if(url==='/approved-lessons.json')data=approved;else if(url==='/api/lessons')data=approved;
 else if(url==='/api/lesson-order')data={items:[{topic:0,order:[0,1,2,3,4]}]};
 return {ok:true,json:async()=>data};
}};
vm.runInNewContext(readFileSync(new URL('../public/student.js',import.meta.url),'utf8'),context);
await new Promise(r=>setImmediate(r));
assert.equal(element('studentCertificateRequest').attrs['aria-disabled'],'true');
await context.window.AcademiaStudent.mark(0,3,true);
assert.equal(element('studentCertificateRequest').attrs['aria-disabled'],'false');
assert.equal(element('studentCertificatePercent').textContent,'80%');
await context.window.AcademiaStudent.mark(0,3,false);
assert.equal(element('studentCertificateRequest').attrs['aria-disabled'],'true');
assert.equal(element('studentCertificatePercent').textContent,'60%');
console.log('PASS UI transitions 60% -> 80% -> 60% without reload');

const publicSource=readFileSync(new URL('../public/script.js',import.meta.url),'utf8');
const renderSource=publicSource.slice(publicSource.indexOf('function render()'),publicSource.indexOf('function topicYoutubeId('));
const cards={innerHTML:'',querySelectorAll:()=>[]};
const publicContext={document:{querySelectorAll:()=>[]},courses:[{title:'<img src=x onerror=alert(1)>',desc:'<script>alert(1)</script>',icon:'" onclick="alert(1)',lessons:['A']}],publicTopicOrder:[0],search:{value:''},cards,publicLessonOrders:{}};
vm.runInNewContext(publicSource.split('\n')[0]+'\n'+renderSource+'\nrender()',publicContext);
assert.ok(!cards.innerHTML.includes('<img'));
assert.ok(!cards.innerHTML.includes('<script>'));
assert.ok(cards.innerHTML.includes('&lt;img'));
assert.ok(cards.innerHTML.includes('&quot; onclick=&quot;'));
console.log('PASS Editable topic HTML is escaped in public cards');
