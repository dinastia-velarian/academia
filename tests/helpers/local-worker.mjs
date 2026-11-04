import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const source=readFileSync(new URL('../../worker.js',import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;

// All identities, sessions and mutations in these tests are confined to memory.
export function localWorker(){
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync(new URL('../../schema.sql',import.meta.url),'utf8'));
 class Statement{
  constructor(query){this.query=query;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return db.prepare(this.query).get(...this.args)||null}
  async all(){return {results:db.prepare(this.query).all(...this.args)}}
  async run(){return {meta:{changes:db.prepare(this.query).run(...this.args).changes}}}
 }
 const env={DB:{prepare:q=>new Statement(q),batch:async statements=>{
  db.exec('BEGIN');try{const results=await Promise.all(statements.map(s=>s.run()));db.exec('COMMIT');return results}
  catch(error){db.exec('ROLLBACK');throw error}
 }},ASSETS:{fetch:async request=>{
  let path=decodeURIComponent(new URL(request.url).pathname);
  if(path==='/')path='/index.html';
  if(path.includes('..'))return new Response('Not found',{status:404});
  const type={js:'application/javascript',css:'text/css',html:'text/html',asset:'text/html',json:'application/json',webp:'image/webp',svg:'image/svg+xml'};
  try{return new Response(readFileSync(new URL('../../public'+path,import.meta.url)),{headers:{'content-type':type[path.split('.').pop()]||'application/octet-stream'}})}
  catch{return new Response('Not found',{status:404})}
 }}};
 const fetch=request=>worker.fetch(request,env);
 const request=(path,{cookie='',method='GET',data,origin}={})=>fetch(new Request('https://academy.test'+path,{
  method,headers:{cookie,...(data!==undefined?{'content-type':'application/json'}:{}),...(origin?{origin}:{})},body:data===undefined?undefined:JSON.stringify(data)
 }));
 const setting=(key,value)=>db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run(key,value);
 async function account({name='QA student',role='student',permissions}={}){
  const id=crypto.randomUUID(),token=crypto.randomUUID().replaceAll('-','').repeat(2);
  const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
  db.prepare('INSERT INTO users(id,username,username_key,password_hash,salt,iterations,role) VALUES(?,?,?,?,?,?,?)').run(id,name,name.toLowerCase(),'not-a-real-password','test-only',100000,role);
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,Date.now()+86400000);
  if(permissions!==undefined)setting('admin_permissions:'+id,JSON.stringify(permissions));
  return {id,name,token,cookie:(role==='admin'?'av_session=':'av_student=')+token};
 }
 return {db,env,fetch,request,setting,account};
}
