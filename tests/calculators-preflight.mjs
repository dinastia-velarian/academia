// Targeted PR #2 review: no rerun of the 407 mathematical/regression cases.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/calculators.js'),end=ui.indexOf('\nconst labels=');
const context={document:{getElementById:()=>({})},Intl};
vm.runInNewContext(ui.slice(0,end)+'\nglobalThis.reviewTools=tools;})();',context);
const tools=Array.from(context.reviewTools,t=>({id:t.id,name:t.name,category:t.category}));
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS',name)};
const expected={
 'Evolução da conta':['skills','xp','account'],
 'Indústria':['factory'],
 'Trabalho e economia':['work','profit'],
 'Governo e militar':['construction','army']};
check('Exactly eight unique tools, three removed calculators',()=>{assert.equal(tools.length,8);assert.equal(new Set(tools.map(t=>t.id)).size,8)});
check('Exactly four remaining categories',()=>assert.deepEqual([...new Set(tools.map(t=>t.category))].sort(),Object.keys(expected).sort()));
for(const [category,ids]of Object.entries(expected))check('Category membership: '+category,()=>assert.deepEqual(tools.filter(t=>t.category===category).map(t=>t.id),ids));
check('Calculator HTML has no student track section or track script',()=>{const s=read('public/ferramentas.asset');assert.ok(!/trackChoices|trackResult|gestao-trilhas|ferramentas\.js/.test(s));assert.match(s,/BETA PÚBLICO/)});
check('Student tracks retain authenticated student API scope',()=>{const s=read('public/student-hub.js');assert.match(s,/request\('\/api\/student\/tracks'\)/);assert.match(s,/request\('\/api\/student\/tracks\/request'/)});
check('Public beta route is available without authentication and internal assets remain blocked',()=>{const w=read('worker.js');assert.ok(w.includes("const isPage=['/ferramentas'"));assert.ok(!w.includes("if(u?.role!=='admin')return new Response('Acesso restrito aos administradores.'"));assert.ok(w.includes("if(decodeURIComponent(url.pathname)==='/ferramentas.asset')return new Response('Not found'"))});
check('Static requests still go through Worker',()=>assert.equal(JSON.parse(read('wrangler.jsonc')).assets.run_worker_first,true));
check('Changed frontend assets use review-version query strings',()=>{const s=read('public/ferramentas.asset');for(const path of ['calculator-engine.js?v=2-audit','calculators.js?v=2-audit','ferramentas.css?v=3-audit'])assert.ok(s.includes(path))});
console.log(`${count} preflight checks passed`);
