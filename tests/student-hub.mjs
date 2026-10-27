import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
class Element {
 constructor(){this.hidden=false;this.children=[];this.className='secondary';this.disabled=false;this.textContent=''}
 addEventListener(){} append(...xs){this.children.push(...xs)} replaceChildren(...xs){this.children=xs} insertAdjacentElement(_,el){nodes.set(el.id,el)} removeAttribute(k){delete this[k]}
}
const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
let user={id:'A',username:'QA Student A'},certificate={status:'approved',code:'AV-QATEST1234',hasImage:true,updatedAt:Date.now()},eligible=true,posts=0;
const window={addEventListener(){}};
const context={window,document:{getElementById:el,createElement:()=>new Element()},location:{hash:'#minha-academia'},URL,Date,confirm:()=>true,fetch:async(url,options={})=>{
 let data={};if(url==='/api/student/me')data={user};
 else if(url==='/api/academy/notices')data={items:[]};
 else if(url==='/api/student/certificate-eligibility')data={eligible,required:4,total:5};
 else if(url==='/api/student/hub'){if(options.method==='POST'){posts++;certificate={status:'pending',code:'AV-QATEST1234'}}data={certificate,messages:[]}}
 return {ok:true,json:async()=>data};
}};
vm.runInNewContext(readFileSync(new URL('../public/student-hub.js',import.meta.url),'utf8'),context);
await new Promise(r=>setImmediate(r));
assert.equal(el('studentIssuedCertificate').hidden,false);
assert.equal(el('studentIssuedCertificateName').textContent,'QA Student A');
assert.equal(el('studentCertificatePdfDownload').href,'/api/student/certificate-pdf');
console.log('PASS Approved student sees personalized PDF download');
user={id:'B',username:'QA Student B'};certificate=null;await window.academiaRefreshStudentHub();
assert.equal(el('studentIssuedCertificate').hidden,true);assert.equal(el('studentCertificatePdfDownload').hidden,true);
console.log('PASS Account switch hides previous student certificate');
certificate={status:'rejected',code:'AV-QATEST1234'};await window.academiaRefreshStudentHub();assert.equal(el('studentHubCertificate').disabled,false);
el('studentCertificatePercent').textContent='80%';eligible=false;await window.academiaSendCertificateRequest();assert.equal(posts,0);
console.log('PASS Rounded display cannot override server eligibility');
eligible=true;await window.academiaSendCertificateRequest();assert.equal(posts,1);assert.equal(el('studentHubCertificate').disabled,true);
console.log('PASS Rejected request can resume and pending button stays disabled');
const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.match(index,/<script src="student-hub\.js\?v=/);
assert.ok(!index.includes('src="academy-hub.js'));
console.log('PASS Public page loads student certificate logic without administrative hub');
