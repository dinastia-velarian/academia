import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={};vm.runInNewContext(fs.readFileSync('public/calculator-engine.js','utf8'),scope);const calc=scope.VelarianMath.factoryEarnings;
const base={health:7,mode:'hours',amount:24,type:'diamantes',payMode:'salary',wage:50000,unitsPerJob:12,unitPrice:250,hasMarket:false,hasBonus:false,bonusXp:1000,bonusMoney:5000000,hasConversion:false,conversionRate:5};
let count=0;function test(name,fn){fn();count++;console.log('PASS',name)}function near(a,b){assert.ok(Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-12),`${a} != ${b}`)}
for(const [name,change,expected]of [
 ['reference 24h',{}, {jobs:144,ep:14400,regen:1680,spent:2544,earned:2880,netDiamonds:336,netMoney:7200000}],
 ['reference 1h',{amount:1},{jobs:6,regen:70,spent:106,netDiamonds:14,netMoney:300000}],
 ['reference production bonus',{amount:1,health:3,type:'ouro',payMode:'production',hasMarket:true,hasBonus:true,hasConversion:true},{produced:72,marketValue:18000,bonusPay:3000000,netMoney:3018000,spent:114,convertedValue:15.09}],
 ['reference 550EP',{mode:'ep',amount:550,health:3,type:'ouro',payMode:'production',hasMarket:true,hasBonus:true},{jobs:5.5,regen:27.5,spent:104.5,produced:66,netMoney:2766500}],
 ['reference budget100',{mode:'diamonds',amount:100,health:3,type:'ouro',payMode:'production',hasMarket:true,hasBonus:true},{jobs:100/19,spent:100,netMoney:2647368.4210526315}],
 ['reference fraction hours',{amount:.25,type:'ouro',hasBonus:true},{jobs:1.5,regen:17.5,spent:26.5,netMoney:825000}],
 ['reference bonus24',{hasBonus:true,bonusXp:100,bonusMoney:10000,hasConversion:true},{netMoney:8640000,convertedValue:43.2}],
 ['zero',{amount:0},{jobs:0,spent:0,netMoney:0,moneyPerJob:0}],
 ['unquoted production',{type:'couro',payMode:'production',hasConversion:true},{produced:1728,netMoney:0,convertedValue:null}],
 ['ignore inactive',{bonusXp:'',bonusMoney:'',unitsPerJob:'',unitPrice:'',conversionRate:''},{netMoney:7200000}],
])test(name,()=>{const r=calc({...base,...change});for(const [k,v]of Object.entries(expected))v===null?assert.equal(r[k],null):near(r[k],v)});
for(const hp of [3,4,5,6,7])for(const type of ['diamantes','ouro','petroleo','nte','couro'])test(`roundtrip ${hp} ${type}`,()=>{const r=calc({...base,health:hp,type,amount:168});const b=calc({...base,health:hp,type,mode:'diamonds',amount:r.spent});near(r.jobs,b.jobs);near(r.netMoney,b.netMoney)});
for(const [key,value]of [['amount',''],['amount',-1],['amount',Infinity],['amount',NaN],['amount',true],['amount',1e8],['health',2],['health',7.5],['mode','bad'],['type','bad'],['payMode','bad'],['hasBonus','false'],['hasMarket',1],['hasConversion',null],['wage',''],['wage',-1]])test(`invalid ${key} ${String(value)}`,()=>assert.throws(()=>calc({...base,[key]:value})));
test('invalid active bonus',()=>assert.throws(()=>calc({...base,hasBonus:true,bonusXp:0})));
test('invalid active price',()=>assert.throws(()=>calc({...base,type:'nte',payMode:'production',hasMarket:true,unitPrice:''})));
test('overflow',()=>assert.throws(()=>calc({...base,amount:1e7,wage:1e12})));
test('extreme bounded',()=>assert.ok(Number.isFinite(calc({...base,amount:1e7}).netMoney)));
console.log(`${count} tests passed`);
