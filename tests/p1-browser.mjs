// Requires Playwright (see the P1 CI workflow). Requests are intercepted locally;
// the browser and Worker never connect to production or a remote database.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {localWorker} from './helpers/local-worker.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const h=localWorker();
h.setting('heroTitle','Academia QA pública');
h.setting('supportImage','https://example.test/unused.webp');
h.setting('financeSales','123.456');
h.db.prepare("INSERT INTO content(id,kind,title,summary,status) VALUES('qa-topic','topic','Tópico QA publicado','Conteúdo de compatibilidade','published')").run();
const admin=await h.account({name:'Victor Velarian',role:'admin'});
const student=await h.account({name:'Aluno QA certificado'});
const curriculum=await(await h.request('/api/curriculum')).json();
for(const key of curriculum.keys.slice(0,curriculum.required))h.db.prepare('INSERT INTO student_progress VALUES(?,?,?)').run(student.id,key,Date.now());
assert.equal((await h.request('/api/student/hub',{cookie:student.cookie,method:'POST',data:{kind:'certificate'}})).status,201);
const certificate=h.db.prepare('SELECT * FROM academy_certificates WHERE user_id=?').get(student.id);
const browser=await chromium.launch({headless:true,...(process.env.P1_CHROMIUM_PATH?{executablePath:process.env.P1_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
let checks=0;
const passed=name=>{checks++;console.log('PASS',name)};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',async route=>{
  const request=route.request();
  if(!request.url().startsWith('https://academy.test/'))return route.abort();
  const response=await h.fetch(new Request(request.url(),{method:request.method(),headers:request.headers(),body:['GET','HEAD'].includes(request.method())?undefined:request.postData()}));
  await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
 });
 const page=await context.newPage();const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.text().includes('Conteúdo público indisponível'))errors.push(message.text())});
 await page.goto('https://academy.test/');
 await page.locator('#publishedTopics').waitFor();
 assert.equal(await page.locator('.hero-content h1').innerText(),'Academia QA pública');
 assert.match(await page.locator('#publishedTopics').innerText(),/Tópico QA publicado/);
 assert.equal(await page.locator('#donationLink').count(),0);
 assert.deepEqual(errors,[]);passed('P1 public content renders without removed donation/support elements');
 // The same script must keep working in the older administrative preview DOM.
 await page.evaluate(()=>{
  const a=document.createElement('a');a.id='donationLink';const p=document.createElement('p');p.id='donationAccount';document.body.append(a,p);
  updatePublic({settings:{donationAccountUrl:'https://example.test/account'},content:[]});
 });
 assert.equal(await page.locator('#donationLink').getAttribute('href'),'https://example.test/account');
 assert.equal(await page.locator('#donationAccount').innerText(),'example.test');
 await page.evaluate(()=>updatePublic({settings:{},content:[]}));assert.equal(await page.locator('#donationLink').isHidden(),true);
 passed('P1 legacy donation DOM stays compatible without restoring it in public HTML');

 await context.addCookies([{name:'av_session',value:admin.token,url:'https://academy.test'}]);
 await page.goto('https://academy.test/admin#admin');
 await page.waitForFunction(()=>document.getElementById('admin').hidden===false);
 await page.evaluate(()=>selectTab('certificates'));
 assert.equal(await page.locator('#adminStudents').isVisible(),true);
 assert.equal(await page.locator('#adminHub').isHidden(),true);
 await page.locator('.admin-student-row').filter({hasText:student.name}).getByRole('button',{name:'Ver progresso e senha'}).click();
 await page.locator('#studentProfileContent').getByRole('button',{name:'Aprovar certificado',exact:true}).waitFor();
 passed('P1 legacy certificate navigation uses the existing student management layout');
 const reviews=[];
 page.on('request',request=>{if(request.url().endsWith('/api/admin/hub-action')&&request.method()==='POST')reviews.push(request.postDataJSON())});
 const approve=()=>page.locator('#studentProfileContent').getByRole('button',{name:'Aprovar certificado',exact:true}).click();
 page.once('dialog',dialog=>dialog.dismiss());await approve();
 assert.equal(reviews.length,0);assert.equal(h.db.prepare('SELECT status FROM academy_certificates WHERE id=?').get(certificate.id).status,'pending');
 passed('P1 cancelling certificate confirmation sends no mutation');
 page.once('dialog',dialog=>dialog.accept());await approve();
 await page.waitForFunction(()=>document.getElementById('studentProfileContent').textContent.includes('Aprovado'));
 assert.deepEqual(reviews[0],{kind:'certificate',id:certificate.id,status:'approved',levelVerified:true,skillsVerified:true,feeVerified:true});
 assert.equal(h.db.prepare('SELECT status FROM academy_certificates WHERE id=?').get(certificate.id).status,'approved');
 passed('P1 profile approval sends all confirmations and succeeds against the real Worker');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#studentProfileContent').getByRole('button',{name:'Rejeitar solicitação',exact:true}).click();
 await page.waitForFunction(()=>document.getElementById('studentProfileContent').textContent.includes('Rejeitado'));
 assert.equal(reviews[1].status,'rejected');assert.ok(!('levelVerified'in reviews[1]));
 passed('P1 rejection preserves its existing contract');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#studentProfileContent').getByRole('button',{name:'Reabrir análise',exact:true}).click();
 await page.waitForFunction(()=>document.getElementById('studentProfileContent').textContent.includes('Aguardando análise'));
 passed('P1 reopening preserves its existing contract');

 await page.evaluate(()=>selectTab('reports'));
 await page.locator('#adminHubContent [name=financeSales]').waitFor();
 await page.locator('#adminHubContent [name=financeSales]').fill('456.125');
 const form=page.locator('#adminHubContent form').filter({has:page.locator('[name=financeSales]')});
 await form.getByRole('button',{name:'Salvar valores'}).click();
 await page.waitForFunction(()=>document.getElementById('adminHubStatus').textContent.includes('sucesso'));
 assert.equal(h.db.prepare("SELECT value FROM settings WHERE key='financeSales'").get().value,'456.125');
 const publicData=await(await h.request('/api/public')).json();assert.ok(!('financeSales'in publicData.settings));
 passed('P1 finance form saves decimals without exposing them publicly');
 assert.deepEqual(errors,[]);
 console.log(`${checks} browser checks passed`);
}finally{await browser.close();h.db.close()}
