import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const mod=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {publishedCurriculum,certificateEligibility,generatedCertificatePdf};').toString('base64'));
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
class Stmt{constructor(q){this.q=q;this.args=[]}bind(...a){this.args=a;return this}async all(){return {results:db.prepare(this.q).all(...this.args)}}async first(){return db.prepare(this.q).get(...this.args)||null}async run(){return {meta:{changes:db.prepare(this.q).run(...this.args).changes}}}}
const approved={items:[{topic:0,index:0,title:'A'},{topic:0,index:1,title:'B'},{topic:1,index:0,title:'C'},{topic:8,index:0,title:'RP'}]};
let assetCalls=0;
const env={DB:{prepare:q=>new Stmt(q)},ASSETS:{fetch:async req=>{assetCalls++;if(new URL(req.url).pathname==='/approved-lessons.json')return Response.json(approved);return new Response('<main>admin</main>',{headers:{location:'/wrong'}})}}};
const req=path=>new Request('https://qa.test'+path);
const put=(key,value)=>db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run(key,JSON.stringify(value));
let count=0;const pass=n=>{count++;console.log('PASS',n)};
let catalog=await mod.publishedCurriculum(env,req('/api/curriculum'));assert.equal(catalog.total,4);assert.equal(catalog.topicCount,6);pass('Default curriculum counts available lessons only');
put('lesson_v5:1:7',{topic:1,index:7,title:'Extra'});put('lesson_order_v2:1',[0,7,7,199,-1,'0']);put('lesson_v11:7:0',{topic:7,index:0,title:'Hidden'});
catalog=await mod.publishedCurriculum(env,req('/api/curriculum'));assert.equal(catalog.total,5);assert.deepEqual(catalog.topics.find(t=>t.topic===1).lessons.map(l=>l.index),[0,7]);pass('Added lesson counted once; invalid, duplicate and unavailable indexes excluded');
put('topic_display_order',[0,1,7,8]);catalog=await mod.publishedCurriculum(env,req('/api/curriculum'));assert.equal(catalog.topicCount,3);assert.ok(!catalog.keys.includes('t7-l0'));pass('Hidden topics excluded consistently');
put('lesson_order_v2:0',[1]);catalog=await mod.publishedCurriculum(env,req('/api/curriculum'));assert.ok(!catalog.keys.includes('t0-l0'));pass('Removed lessons do not remain in totals');
db.prepare("INSERT INTO users(id,username,username_key,password_hash,salt,iterations) VALUES('qa','QA','qa','unused','unused',100000)").run();
for(const key of catalog.keys)db.prepare('INSERT INTO student_progress VALUES(?,?,?)').run('qa',key,1);
const eligibility=await mod.certificateEligibility(env,'qa');assert.equal(eligibility.total,catalog.total);assert.equal(eligibility.completed,catalog.total);assert.equal(eligibility.required,Math.ceil(catalog.total*.8));assert.ok(eligibility.eligible);pass('Certificate denominator matches canonical curriculum');
const response=await mod.default.fetch(req('/api/curriculum'),env);assert.deepEqual(await response.json(),catalog);pass('Public curriculum API returns same catalog');
for(const path of ['/admin','/admin/']){const r=await mod.default.fetch(req(path),env);assert.equal(r.status,200);assert.equal(r.headers.get('location'),null);assert.match(await r.text(),/id="login"/)}
const before=assetCalls;assert.equal((await mod.default.fetch(req('/admin-panel.asset'),env)).status,404);assert.equal(assetCalls,before);pass('Admin login routes do not redirect and raw asset is blocked');
mkdirSync('/tmp/academia-imperial',{recursive:true});
const bytes=mod.generatedCertificatePdf('QA Homologação Imperial','AV-QA-TESTE',Date.now());writeFileSync('/tmp/academia-imperial/imperial.pdf',bytes);assert.match(Buffer.from(bytes).toString('latin1'),/CERTIFICADO DE CONCLUSÃO/);assert.match(Buffer.from(bytes).toString('latin1'),/AV-QA-TESTE/);pass('Imperial PDF generated with student name and registration');
for(const file of ['script.js','student.js','academy-statistics.js','app.js'])assert.ok(readFileSync(new URL('../public/'+file,import.meta.url),'utf8').includes('/api/curriculum'));pass('Homepage, student and admin consumers use canonical API');
console.log(count+' targeted checks passed');
