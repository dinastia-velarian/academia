// Independent regression matrix. A case is a named execution, not the number of assertions.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const path=new URL('../public/calculator-engine.js',import.meta.url);
const context={};vm.runInNewContext(readFileSync(path,'utf8'),context);const after=context.VelarianMath;
const old={};vm.runInNewContext(execFileSync('git',['show','056fa64b39c1e34bd8326e122ca8792f6992dcbb:public/calculator-engine.js'],{encoding:'utf8'}),old);const before=old.VelarianMath;
const clone=d=>structuredClone(d);const defs={
skills:{d:{skill:'quartel',class:'burocrata',current:1,target:2,education:0,engineering:0,premium:false},key:'current'},
xp:{d:{current:1,target:2,progress:0,daily:100},key:'current'},
account:{d:{class:'burocrata',education:0,engineering:0,premium:false,diamondPrice:10,quartelCurrent:1,quartelTarget:2,militarCurrent:1,militarTarget:2,cienciaCurrent:1,cienciaTarget:2,suprimentosCurrent:1,suprimentosTarget:2},key:'quartelCurrent'},
factory:{d:{type:'diamantes',current:1,target:3},key:'current'},
bonus:{d:{type:'diamantes',current:1,target:2,workers:10,salary:500000,bonusXp:1000,bonusMoney:5000000,mode:'bonus'},key:'workers'},
work:{d:{health:7,wage:50000,bonusXp:100,bonusMoney:0,tax:0,amount:1,mode:'hours',type:'diamantes',payMode:'salary'},key:'amount'},
construction:{d:{days:7,escolaCurrent:0,escolaTarget:2,baseCurrent:0,baseTarget:0,estradaCurrent:0,estradaTarget:0,hospitalCurrent:0,hospitalTarget:0},key:'days'},
army:{d:{supply:100,infantry:10,tank:0,ship:0,plane:0,missile:0,leatherPrice:0,goldPrice:0,ntePrice:0,oilPrice:0},key:'infantry'},
tax:{d:{gross:1000000,federal:5,province:8},key:'gross'},
profit:{d:{units:100,price:100,materials:40,wages:1000,other:0,rate:0},key:'units'},
resources:{d:{required:1000,stock:250,unitPrice:80},key:'required'}};
const cases=[];
function add(tool,name,edit,expected){const d={...clone(defs[tool].d),...edit};cases.push({tool,name,d,expected})}
function match(result,expected){for(const [k,v]of Object.entries(expected))if(v===null)assert.equal(result[k],null);else{assert.equal(typeof result[k],'number');assert.ok(Math.abs(result[k]-v)<=Math.max(1e-7,Math.abs(v)*1e-12),`${k}: ${result[k]} ≠ ${v}`)}}
const fixtures={skills:{money:250,diamonds:8,seconds:60,diamondSeconds:15},xp:{required:250,remaining:250,days:2.5},account:{money:1000,diamonds:32,diamondsValue:320,seconds:240},factory:{xp:1030,diamonds:35},bonus:{jobs:5,rounds:1,payroll:2500000,hours:1/6},work:{jobs:6,ep:600,regen:70,spent:106,netDiamonds:14,netMoney:300000},construction:{money:200000,leather:800,gold:880,nte:600,daily_money:6000,period_money:42000},army:{power:10,money:47500,leather:950,gold:475},tax:{federal:50000,province:80000,total:130000,net:870000},profit:{revenue:10000,cost:5000,profit:5000,margin:50,breakEven:50},resources:{missing:750,cost:60000}};
for(const [tool,{key}]of Object.entries(defs)){
 add(tool,'ordinary fixture',{},fixtures[tool]);
 for(const [i,value]of ['', ' ', -1,NaN,Infinity,-Infinity,true,false,[1],{},'abc','1e999'].entries())add(tool,`invalid primary input ${i}`,{[key]:value},'throws');
}
// Skills: measured modifiers, tariff boundaries, integer limits and exact time formula.
for(const [className,edu,eng,premium,seconds]of [['academico',0,0,true,3575],['academico',11,20,false,2628],['academico',11,20,true,1280],['burocrata',11,20,true,1558],['burocrata',5,10,false,4888],['burocrata',11,20,false,3055]])add('skills','measured reductions '+[className,edu,eng,premium].join('/'),{current:100,target:101,class:className,education:edu,engineering:eng,premium},{seconds});
for(const [n,diamond]of [[10,8],[11,15],[50,38],[51,45],[100,75],[200,150]])add('skills','tariff boundary '+n,{current:n,target:n+1},{money:250*n,diamonds:diamond});
add('skills','rounded-source timing corrected at150',{current:150,target:151,class:'academico'},{seconds:15152});
add('skills','zero range',{current:201,target:201},{money:0,diamonds:0,seconds:0});
for(const edit of [{current:0},{target:202},{current:1.5},{education:12},{engineering:4},{class:'unknown'},{skill:'unknown'},{premium:'true'},{target:1,current:2}])add('skills','invalid '+JSON.stringify(edit),edit,'throws');
for(const n of [1,16,50,100,150,200])add('skills','independent raw power law '+n,{current:n,target:n+1},{seconds:Math.ceil(Math.max(60,1080*Math.pow(n/50,2.5)))});
// XP fixtures are measured reference values, not independent game certification.
for(const [n,value]of [[2,271],[10,520],[20,1177],[50,13614],[75,104650],[80,157358],[81,204565],[90,2169297],[100,62747897]])add('xp','measured transition '+n,{current:n,target:n+1},{required:value});
add('xp','exact floor transition96',{current:96,target:97},{required:16333793});
add('xp','fractional partial XP',{progress:.5},'throws');
add('xp','measured level75',{target:75,progress:0,daily:0},{required:1228202,days:null});
add('xp','partial XP',{progress:100,daily:50},{remaining:150,days:3});add('xp','zero range',{target:1},{required:0,remaining:0});
for(const edit of [{progress:250},{progress:-1},{daily:-1},{current:1.1},{target:151},{target:1,current:2}])add('xp','invalid '+JSON.stringify(edit),edit,'throws');
add('xp','maximum supported level',{target:150},{required:3176442211396025});
// Aggregate account cost deliberately reuses the same single-skill tariff.
for(const n of [2,10,51,100,201]){let money=0,diamonds=0,raw=0;for(let i=1;i<n;i++){money+=250*i;diamonds+=Math.round(Math.ceil(i/10)*7.5);raw+=Math.max(60,1080*(i/50)**2.5)}const edit={};for(const k of ['quartel','militar','ciencia','suprimentos'])edit[k+'Target']=n;add('account','aggregate tariff '+n,edit,{money:4*money,diamonds:4*diamonds,seconds:4*Math.ceil(raw)});}
add('account','zero range',{quartelTarget:1,militarTarget:1,cienciaTarget:1,suprimentosTarget:1},{money:0,diamonds:0,seconds:0});add('account','invalid quote',{diamondPrice:-1},'throws');add('account','invalid endpoint',{militarTarget:202},'throws');
add('factory','reference 10→11',{current:10,target:11},{xp:844,diamonds:60,totalXp:6590,totalDiamonds:375});
for(const type of ['couro','ouro','petroleo','nte'])add('factory','resource reference '+type,{type,current:10,target:11},{xp:253,totalXp:1977});
add('factory','zero range',{current:3,target:3},{xp:0,diamonds:0});
for(const edit of [{current:1.5},{target:151},{type:'unknown'},{current:3,target:2}])add('factory','invalid '+JSON.stringify(edit),edit,'throws');
add('factory','exhaustive exact rational oracle:22350 intervals',{},(r,m)=>{for(const base of [150,500])for(let a=1;a<150;a++)for(let b=a+1;b<=150;b++){const aa=BigInt(a-1),bb=BigInt(b-1),expected=BigInt(base)*50n*(53n**bb*50n**aa-53n**aa*50n**bb)/(3n*50n**(aa+bb));assert.equal(m.factory({type:base===500?'diamantes':'couro',current:a,target:b}).xp,Number(expected))}});
add('factory','supported upper bound',{target:150},r=>{assert.ok(r.xp>1e7&&Number.isSafeInteger(r.xp));assert.equal(r.diamonds,57365)});
add('bonus','fixed wages',{mode:'fixed',workers:3,salary:10},{jobs:5,rounds:2,payroll:50});
add('bonus','inactive fields ignored fixed',{mode:'fixed',bonusXp:'',bonusMoney:'',salary:10},{payroll:50});
add('bonus','inactive salary ignored',{salary:''},{payroll:2500000});
add('bonus','zero range',{target:1},{jobs:0,payroll:0,hours:0});
for(const edit of [{workers:0},{workers:1.5},{bonusXp:0},{mode:'unknown'},{salary:-1,mode:'fixed'}])add('bonus','invalid '+JSON.stringify(edit),edit,'throws');
for(let health=3;health<=7;health++)for(const amount of [0,1,17,18,53,106,300,1000])add('work',`budget and maximal jobs h=${health} b=${amount}`,{mode:'diamonds',health,amount},r=>{assert.ok(r.spent<=amount);const j=r.jobs+1;assert.ok(Math.ceil((j*100-Math.floor(j*5/3)*health)/5)>amount)});
add('work','24h reference',{amount:24},{jobs:144,spent:2544,netDiamonds:336,netMoney:7200000});
add('work','energy mode',{mode:'ep',amount:600},{jobs:6,spent:106});
add('work','production valuation',{payMode:'production',unitsPerJob:100,unitPrice:50,wage:''},{salary:30000});
add('work','bonus tax',{bonusMoney:10000,tax:10},{bonusPay:60000,netMoney:324000});
add('work','inactive bonus divisor',{bonusXp:'',bonusMoney:0},{bonusPay:0});
add('work','zero jobs',{amount:0},{jobs:0,spent:0,netMoney:0});
for(const edit of [{mode:'unknown'},{payMode:'unknown'},{type:'unknown'},{health:8},{tax:101},{bonusXp:0,bonusMoney:1}])add('work','invalid '+JSON.stringify(edit),edit,'throws');
add('work','maximum supported hours',{amount:1e7,wage:0},r=>assert.equal(r.jobs,60000000));
add('construction','existing property no upgrade',{escolaCurrent:2},{money:0,daily_money:6000});
add('construction','all buildings one level',{escolaTarget:1,baseTarget:1,estradaTarget:1,hospitalTarget:1},{money:430000,leather:1200,gold:880,nte:1600,oil:1100});
add('construction','zero targets',{escolaTarget:0},{money:0,daily_money:0});
add('construction','upper level and days',{escolaTarget:1000,days:3650},{money:1e8,daily_money:3e6,period_money:10950000000});
for(const edit of [{days:1.5},{days:3651},{escolaCurrent:3},{baseTarget:1001},{hospitalTarget:-1}])add('construction','invalid '+JSON.stringify(edit),edit,'throws');
for(const [unit,power,money]of [['infantry',1,5000],['tank',2,10000],['ship',3,20000],['plane',4,40000],['missile',5,80000]])add('army','unit '+unit,{infantry:0,[unit]:1,supply:0},{power,money});
add('army','market valuation',{supply:0,infantry:1,leatherPrice:50,goldPrice:100},{market:15000});
add('army','zero quantities',{infantry:0},{power:0,market:0});
add('army','quantity upper bound',{infantry:1e9,supply:200},{power:1e9,money:4500000000000});
for(const edit of [{supply:201},{supply:1.5},{infantry:.1},{goldPrice:-1},{infantry:1e9,goldPrice:1e12}])add('army','invalid '+JSON.stringify(edit),edit,'throws');
// Exact arithmetic identities, independent of game assumptions, for existing accounting models.
for(const gross of [0,1,17,1000000,1e12])for(const rates of [[0,0],[5,8],[50,50]])add('tax','conservation '+gross+'/'+rates,{gross,federal:rates[0],province:rates[1]},r=>{assert.ok(Math.abs(r.total+r.net-gross)<=Math.max(1e-7,gross*1e-12));assert.equal(r.total,gross*(rates[0]+rates[1])/100)});
for(const edit of [{federal:101},{province:-1},{federal:99,province:2}])add('tax','invalid '+JSON.stringify(edit),edit,'throws');
for(const units of [0,1,100,1000000])for(const rate of [0,10,100])add('profit','independent ledger '+units+'/'+rate,{units,rate},r=>{assert.equal(r.revenue,units*100);assert.equal(r.cost,units*40+1000+units*rate);assert.equal(r.profit,r.revenue-r.cost)});
add('profit','legitimate loss',{price:1},{profit:-4900});add('profit','no denominator',{units:0},{margin:null,breakEven:null});
for(const edit of [{rate:101},{price:-1},{units:1e12,price:1e12}])add('profit','invalid '+JSON.stringify(edit),edit,'throws');
for(const required of [0,1,1000,1e12])for(const stock of [0,250,1e12])add('resources','independent shortage '+required+'/'+stock,{required,stock,unitPrice:2}, {missing:Math.max(0,required-stock),cost:Math.max(0,required-stock)*2});
for(const edit of [{unitPrice:-1},{stock:-1},{required:1e12,stock:0,unitPrice:1e12}])add('resources','invalid '+JSON.stringify(edit),edit,'throws');

for(const tool of Object.keys(defs))add(tool,'pure calculation and interleaved isolation',{},(r,m)=>{const d=clone(defs[tool].d),snapshot=clone(d),first=m[tool](d);m.resources({required:123,stock:1,unitPrice:5});const second=m[tool](d);assert.equal(JSON.stringify(first),JSON.stringify(second));assert.equal(JSON.stringify(d),JSON.stringify(snapshot))});

function run(engine){return cases.map(c=>{try{if(c.expected==='throws')assert.throws(()=>engine[c.tool](clone(c.d)));else{const r=engine[c.tool](clone(c.d));if(typeof c.expected==='function')c.expected(r,engine);else match(r,c.expected)}return {tool:c.tool,name:c.name,pass:true}}catch(e){return {tool:c.tool,name:c.name,pass:false,error:e.message}}})}
const pre=run(before),post=run(after);const summary=Object.fromEntries(Object.keys(defs).map(tool=>{const a=pre.filter(x=>x.tool===tool),b=post.filter(x=>x.tool===tool);return [tool,{tests:b.length,beforeFailed:a.filter(x=>!x.pass).length,passed:b.filter(x=>x.pass).length,failed:b.filter(x=>!x.pass).length}]}));
console.log(JSON.stringify(summary,null,2));for(const c of post.filter(x=>!x.pass))console.log('FAIL',c.tool,c.name,c.error);
mkdirSync(new URL('../docs/audit-calculators/',import.meta.url),{recursive:true});writeFileSync(new URL('../docs/audit-calculators/results.json',import.meta.url),JSON.stringify({base:'056fa64b39c1e34bd8326e122ca8792f6992dcbb',summary,before:pre,after:post},null,2)+'\n');
if(post.some(x=>!x.pass))process.exitCode=1;
