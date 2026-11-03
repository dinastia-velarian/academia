/* Execute: node tests/admin-permissions-regression.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8');
const prefix=source.slice(0,source.indexOf('function permissionFor'));
const context={};vm.createContext(context);
vm.runInContext(`const normalize=s=>String(s||'').normalize('NFKC').trim().replace(/\\s+/g,' ');const usernameKey=s=>normalize(s).toLocaleLowerCase('pt-BR');${prefix};globalThis.checkAdminPermissions=adminPermissions;`,context);
const check=context.checkAdminPermissions;
const env=value=>({DB:{prepare(){return {bind(){return {first:async()=>value}}}}}});
(async()=>{
 const regular={id:'secondary',username:'Admin Secundário'};
 const owner={id:'owner',username:'Victor Velarian'};
 const missing=await check(env(null),regular);
 assert.ok(Object.values(missing).every(x=>x===false),'Administrador sem configuração não deve receber privilégios');
 const main=await check(env(null),owner);
 assert.ok(Object.values(main).every(x=>x===true),'Administrador principal deve manter acesso');
 const configured=await check(env({value:JSON.stringify({content:true,students:false})}),regular);
 assert.equal(configured.content,true);assert.equal(configured.students,false);assert.equal(configured.reports,false);
 const invalid=await check(env({value:'{invalid'}),regular);
 assert.ok(Object.values(invalid).every(x=>x===false),'Configuração inválida deve negar acesso');
 console.log('4 verificações de permissões aprovadas.');
})().catch(e=>{console.error(e);process.exitCode=1});
