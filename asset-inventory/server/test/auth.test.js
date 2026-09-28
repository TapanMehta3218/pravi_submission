import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
process.env.DB_PATH=':memory:';
process.env.JWT_SECRET='test-auth-secret-only-not-for-real-use-12345';
process.env.SETUP_TOKEN='test-setup-key';
const {default:app}=await import('../app.js');
const {default:db}=await import('../db/database.js');
let server,base,cookie,csrf;
const credentials={email:'admin@example.test',password:'a-unique-test-passphrase'};
before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api`;});
after(()=>{server.close();db.close();});
async function send(path,method='GET',body,headers={}){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'InfraTrack',...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,headers:res.headers,data:res.status===204?null:await res.json()};}
test('protected API cannot be accessed before setup or without a JWT',async()=>{
 assert.equal((await send('/assets')).status,401);assert.equal((await send('/dashboard')).status,401);assert.equal((await send('/assistant/status')).status,401);
 assert.equal((await send('/auth/status')).data.setupRequired,true);
 assert.equal((await send('/auth/setup','POST',{...credentials,name:'Admin',setupToken:'wrong'})).status,403);
 const setup=await send('/auth/setup','POST',{...credentials,name:'Admin',setupToken:process.env.SETUP_TOKEN});assert.equal(setup.status,201);cookie=setup.headers.get('set-cookie').split(';')[0];csrf=setup.data.csrfToken;
 assert.match(setup.headers.get('set-cookie'),/HttpOnly/);assert.match(setup.headers.get('set-cookie'),/SameSite=Strict/);assert.equal(setup.data.user.password_hash,undefined);
 assert.notEqual(db.prepare('SELECT password_hash FROM users').get().password_hash,credentials.password);
 assert.equal((await send('/auth/status')).data.setupRequired,false);
 assert.equal((await send('/auth/setup','POST',{...credentials,name:'Other',setupToken:process.env.SETUP_TOKEN})).status,409);
});
test('JWT signature, expiry, origin and CSRF are enforced',async()=>{
 assert.equal((await send('/assets','GET',undefined,{Cookie:cookie})).status,200);
 assert.equal((await send('/assets','POST',{name:'No',category:'Pump'},{Cookie:cookie})).status,403);
 assert.equal((await send('/assets','POST',{name:'No',category:'Pump'},{Cookie:cookie,'X-CSRF-Token':csrf,Origin:'https://attacker.example'})).status,403);
 assert.equal((await send('/assets','GET',undefined,{Cookie:'infratrack_session=bad.jwt.signature'})).status,401);
 const expired=jwt.sign({sub:'1',jti:'no-session'},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:-1,issuer:'infratrack-api',audience:'infratrack-web'});
 assert.equal((await send('/assets','GET',undefined,{Cookie:`infratrack_session=${expired}`})).status,401);
 const loginCsrf=await send('/auth/login','POST',credentials,{'X-Requested-With':''});assert.equal(loginCsrf.status,403);
});
test('login errors are generic and logout revokes even a copied token',async()=>{
 assert.equal((await send('/auth/login','POST',{...credentials,password:'wrong'})).data.error,'Email or password is incorrect.');
 assert.equal((await send('/auth/login','POST',{...credentials,email:'nobody@example.test'})).data.error,'Email or password is incorrect.');
 const login=await send('/auth/login','POST',credentials);assert.equal(login.status,200);const copied=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await send('/auth/logout','POST',{}, {Cookie:copied,'X-CSRF-Token':login.data.csrfToken})).status,204);
 assert.equal((await send('/assets','GET',undefined,{Cookie:copied})).status,401);
});
test('password change requires current password and invalidates other sessions',async()=>{
 const h={Cookie:cookie,'X-CSRF-Token':csrf};
 assert.equal((await send('/auth/password','POST',{currentPassword:'wrong',newPassword:'replacement-long-password'},h)).status,400);
 const changed=await send('/auth/password','POST',{currentPassword:credentials.password,newPassword:'replacement-long-password'},h);assert.equal(changed.status,200);
 assert.equal((await send('/auth/me','GET',undefined,{Cookie:cookie})).status,401);
 const fresh=changed.headers.get('set-cookie').split(';')[0];assert.equal((await send('/auth/me','GET',undefined,{Cookie:fresh})).status,200);
 assert.equal((await send('/auth/login','POST',credentials)).status,401);
 assert.equal((await send('/auth/login','POST',{...credentials,password:'replacement-long-password'})).status,200);
});
