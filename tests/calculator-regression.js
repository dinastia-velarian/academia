/* Testes de regressão independentes: node tests/calculator-regression.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../public/calculator-engine.js'),'utf8'),context);
const math=context.VelarianMath;
const buildings=(current=0,target=0,multiplier=1)=>({escolaCurrent:0,escolaTarget:0,baseCurrent:0,baseTarget:0,estradaCurrent:0,estradaTarget:0,hospitalCurrent:current,hospitalTarget:target,days:1,costMultiplier:multiplier});
let count=0;
function check(name,fn){fn();count++;console.log('OK',name)}
check('Hospital base: cinco unidades',()=>{const r=math.construction(buildings(274,279));assert.equal(r.money,550000);assert.equal(r.gold,2200);assert.equal(r.nte,2500);assert.equal(r.oil,1500)});
check('Multiplicador informado: duas vezes',()=>{const r=math.construction(buildings(274,279,2));assert.equal(r.money,1100000);assert.equal(r.gold,4400);assert.equal(r.nte,5000);assert.equal(r.oil,3000)});
check('Sem novas construções: custo de compra zero',()=>{const r=math.construction(buildings(10,10));assert.equal(r.money,0);assert.ok(r.daily_money>0)});
check('Alvo inferior ao atual é inválido',()=>assert.throws(()=>math.construction(buildings(11,10)),/nível alvo/));
check('Multiplicador inferior a um é inválido',()=>assert.throws(()=>math.construction(buildings(0,1,0.9)),/Multiplicador/));
const army=supply=>({supply,infantry:1,tank:0,ship:0,plane:0,missile:0,leatherPrice:0,goldPrice:0,ntePrice:0,oilPrice:0});
check('Suprimentos 999 aceito',()=>assert.equal(math.army(army(999)).discount,49.95));
check('Suprimentos 1000 rejeitado',()=>assert.throws(()=>math.army(army(1000)),/999/));
console.log(count+' testes de regressão aprovados.');
