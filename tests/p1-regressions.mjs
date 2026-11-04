import test from 'node:test';
import assert from 'node:assert/strict';
import {localWorker} from './helpers/local-worker.mjs';

function fixtures(h){
 for(const [key,value]of Object.entries({heroTitle:'Academia QA',tradePremium1:'18M',tradeAvailability:'available',certificateFee:'10M',financeDonations:'12',financeCertificates:'23.5',financeSales:'34.123',internalFlag:'private',adminToken:'private','admin_permissions:someone':'private','history:entry':'private'}))h.setting(key,value);
 h.db.prepare("INSERT INTO content(id,kind,title,status) VALUES('published','topic','Public topic','published'),('draft','guide','Private draft','draft')").run();
 h.setting('content_meta:published',JSON.stringify({category:'Economia',sortOrder:3}));
 h.db.prepare("INSERT INTO media(id,mime,data) VALUES('image','image/png',X'01')").run();
}

test('P1 public API exposes only explicit public settings and published content',async()=>{
 const h=localWorker();fixtures(h);
 const r=await h.request('/api/public');assert.equal(r.status,200);const d=await r.json();
 assert.deepEqual(d.settings,{heroTitle:'Academia QA',tradePremium1:'18M',tradeAvailability:'available',certificateFee:'10M'});
 assert.deepEqual(d.content.map(x=>x.id),['published']);assert.equal(d.content[0].category,'Economia');assert.equal(d.content[0].sortOrder,3);
 assert.equal(h.db.prepare("SELECT value FROM settings WHERE key='financeSales'").get().value,'34.123');
});

test('P1 admin/all rejects anonymous, student and unconfigured/empty/invalid admin permissions',async()=>{
 const h=localWorker();fixtures(h);const student=await h.account();
 const admins=await Promise.all([h.account({name:'Unconfigured',role:'admin'}),h.account({name:'Empty',role:'admin',permissions:{}}),h.account({name:'Invalid',role:'admin',permissions:{}})]);
 h.setting('admin_permissions:'+admins[2].id,'{invalid');
 for(const cookie of ['',student.cookie,student.cookie.replace('av_student','av_session'),...admins.map(a=>a.cookie)])assert.equal((await h.request('/api/admin/all',{cookie})).status,403);
});

for(const permission of ['content','settings','media','reports','students','certificates','comments','notices','suggestions'])test('P1 admin/all isolates '+permission+' permission',async()=>{
 const h=localWorker();fixtures(h);const a=await h.account({name:'Scoped QA',role:'admin',permissions:{[permission]:true}});
 const r=await h.request('/api/admin/all',{cookie:a.cookie});assert.equal(r.status,200);const d=await r.json();
 assert.deepEqual(d.content.map(x=>x.id).sort(),permission==='content'?['draft','published']:[]);
 assert.equal(d.media.length,permission==='media'?1:0);
 const expected=permission==='settings'?['certificateFee','heroTitle','tradeAvailability','tradePremium1']:permission==='reports'?['financeCertificates','financeDonations','financeSales']:[];
 assert.deepEqual(Object.keys(d.settings).sort(),expected.sort());
 if(permission==='content')assert.equal(d.content.find(x=>x.id==='published').category,'Economia');
 if(permission!=='settings')assert.equal((await h.request('/api/admin/settings',{cookie:a.cookie,method:'PUT',data:{financeSales:'100'}})).status,403);
});

test('P1 owner retains access to public settings, financial reports, content and media',async()=>{
 const h=localWorker();fixtures(h);const a=await h.account({name:'Victor Velarian',role:'admin'});
 const d=await(await h.request('/api/admin/all',{cookie:a.cookie})).json();
 assert.equal(d.settings.heroTitle,'Academia QA');assert.equal(d.settings.financeSales,'34.123');assert.equal(d.content.length,2);assert.equal(d.media.length,1);
 assert.ok(!('adminToken'in d.settings));assert.ok(!Object.keys(d.settings).some(k=>k.startsWith('admin_permissions:')));
});

test('P1 finance values accept decimal strings and numbers and reject malformed values without partial writes',async()=>{
 const h=localWorker();fixtures(h);const a=await h.account({name:'Finance QA',role:'admin',permissions:{settings:true}});
 const put=data=>h.request('/api/admin/settings',{cookie:a.cookie,method:'PUT',data});
 for(const value of ['0','1','10','0.5','123.456','1000000000',0,1,0.125,1000000000]){
  assert.equal((await put({financeSales:value})).status,200,String(value));assert.equal(h.db.prepare("SELECT value FROM settings WHERE key='financeSales'").get().value,String(value));
 }
 for(const value of ['',null,true,false,[],[1],{},'-1',-1,'1.1234','1e3','NaN','Infinity','1,5',' 1','01','1000000000.001',1000000001]){
  const before=h.db.prepare('SELECT * FROM settings ORDER BY key').all();
  assert.equal((await put({heroTitle:'Must not save',financeDonations:'99',financeSales:value})).status,400,JSON.stringify(value));
  assert.deepEqual(h.db.prepare('SELECT * FROM settings ORDER BY key').all(),before);
 }
 for(const key of ['financeDonations','financeCertificates','financeSales'])assert.equal((await put({[key]:'42.125'})).status,200);
 assert.equal((await put({tradePremium1:'20M',tradeTelegram:'https://t.me/test'})).status,200);
 assert.equal((await put({heroTitle:'Must not save',tradeTelegram:'javascript:alert(1)'})).status,400);
 assert.equal((await h.request('/api/admin/settings',{cookie:a.cookie,method:'PUT',origin:'https://evil.test',data:{financeSales:'99'}})).status,403);
});

test('P1 certificate approval requires permission, all confirmations and current 80% eligibility; rejection/reopening/PDF remain compatible',async()=>{
 const h=localWorker();const student=await h.account();const other=await h.account({name:'Other student'});
 const admin=await h.account({name:'Certificate QA',role:'admin',permissions:{certificates:true}});
 const limited=await h.account({name:'No certificates',role:'admin',permissions:{students:true}});
 const catalog=await(await h.request('/api/curriculum')).json();
 for(const key of catalog.keys.slice(0,catalog.required))h.db.prepare('INSERT INTO student_progress VALUES(?,?,?)').run(student.id,key,Date.now());
 assert.equal((await h.request('/api/student/hub',{cookie:student.cookie,method:'POST',data:{kind:'certificate'}})).status,201);
 const cert=h.db.prepare('SELECT * FROM academy_certificates WHERE user_id=?').get(student.id);
 const data={kind:'certificate',id:cert.id,status:'approved',levelVerified:true,skillsVerified:true,feeVerified:true};
 const review=(body,cookie=admin.cookie)=>h.request('/api/admin/hub-action',{cookie,method:'POST',data:body});
 for(const cookie of ['',student.cookie,limited.cookie])assert.equal((await review(data,cookie)).status,403);
 for(const key of ['levelVerified','skillsVerified','feeVerified'])for(const value of [undefined,false,'true'])assert.equal((await review({...data,[key]:value})).status,400);
 h.db.prepare('DELETE FROM student_progress WHERE user_id=? AND lesson_key=?').run(student.id,catalog.keys[0]);assert.equal((await review(data)).status,409);
 h.db.prepare('INSERT INTO student_progress VALUES(?,?,?)').run(student.id,catalog.keys[0],Date.now());
 assert.equal((await review(data)).status,200);assert.equal((await h.request('/api/student/certificate-pdf',{cookie:student.cookie})).status,200);
 assert.equal((await h.request('/api/student/certificate-pdf',{cookie:other.cookie})).status,403);
 assert.equal((await review({kind:'certificate',id:cert.id,status:'rejected'})).status,200);
 assert.equal((await h.request('/api/student/certificate-pdf',{cookie:student.cookie})).status,403);
 assert.equal((await h.request('/api/student/hub',{cookie:student.cookie,method:'POST',data:{kind:'certificate'}})).status,201);
 assert.equal(h.db.prepare('SELECT code FROM academy_certificates WHERE id=?').get(cert.id).code,cert.code);
 assert.equal((await review({kind:'certificate',id:cert.id,status:'pending'})).status,200);
});
