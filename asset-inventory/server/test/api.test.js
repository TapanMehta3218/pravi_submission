import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH=':memory:';
process.env.JWT_SECRET='test-only-secret-at-least-thirty-two-bytes-long';
process.env.SETUP_TOKEN='test-only-setup-token';
const {default:app}=await import('../app.js');
const {default:db}=await import('../db/database.js');
const {seed}=await import('../db/seed.js');
let server,base,cookie='',csrfToken='';
before(async()=>{seed();server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api`;const r=await request('/auth/setup','POST',{name:'Test Admin',email:'admin@example.test',password:'test-password-long-enough',setupToken:process.env.SETUP_TOKEN});assert.equal(r.status,201);});
after(()=>{server.close();db.close();});
async function request(path,method='GET',body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'InfraTrack',Cookie:cookie,'X-CSRF-Token':csrfToken},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const data=r.status===204?null:await r.json();if(data?.csrfToken)csrfToken=data.csrfToken;return {status:r.status,data};}
test('seed, dashboard, search and metadata are backed by SQLite',async()=>{
 assert.deepEqual((await request('/health')).data,{status:'ok'});
 assert.equal((await request('/assets')).data.length,24);
 assert.equal((await request('/assets?search=generator')).data.length,2);
 assert.equal((await request('/assets?search=generator&stage=OPERATIONAL')).data.length,1);
 for(const query of ['category=Server','condition=POOR','criticality=CRITICAL','location=Server%20Room']) assert.ok((await request('/assets?'+query)).data.length);
 const d=(await request('/dashboard')).data;assert.equal(d.summary.totalAssets,24);assert.ok(d.maintenanceDue.length>=5);assert.equal(d.warrantyExpiring.length,2);assert.ok(d.endOfLifeAssets.length>=2);assert.ok((await request('/metadata')).data.categories.length===16);
});
test('complete asset and maintenance flow writes audit events atomically',async()=>{
 const created=await request('/assets','POST',{name:'Test pump',category:'Pump',purchase_cost:12345,lifecycle_stage:'OPERATIONAL'});assert.equal(created.status,201);const id=created.data.id;
 assert.match(created.data.asset_code,/^AST-\d{4}$/);assert.equal(created.data.events[0].event_type,'CREATED');assert.equal(created.data.events[0].performed_by,'admin@example.test');
 const changed=await request(`/assets/${id}`,'PUT',{custodian:'Test owner',location:'Pump House',condition:'FAIR'});assert.equal(changed.data.events.length,4);
 await request(`/assets/${id}/lifecycle`,'PATCH',{stage:'MAINTENANCE'});await request(`/assets/${id}/lifecycle`,'PATCH',{stage:'OPERATIONAL'});
 const job=await request(`/assets/${id}/maintenance`,'POST',{title:'Inspect',maintenance_type:'INSPECTION',scheduled_date:'2026-10-01'});assert.equal(job.status,201);
 assert.equal((await request(`/assets/${id}/maintenance`)).data.length,1);
 await request(`/maintenance/${job.data.id}`,'PUT',{technician:'Test technician'});
 assert.equal((await request(`/maintenance/${job.data.id}/complete`,'PATCH',{})).data.status,'COMPLETED');
 await request(`/maintenance/${job.data.id}/complete`,'PATCH',{});
 const detail=(await request(`/assets/${id}`)).data;assert.equal(detail.events.filter(e=>e.event_type==='MAINTENANCE_COMPLETED').length,1);assert.ok(detail.events.some(e=>e.event_type==='STATUS_CHANGED'));
 await request(`/assets/${id}/lifecycle`,'PATCH',{stage:'RETIRED'});assert.ok((await request(`/assets/${id}`)).data.retirement_date);
 assert.equal((await request(`/assets/${id}/maintenance`,'POST',{title:'No',maintenance_type:'INSPECTION',scheduled_date:'2026-10-01'})).status,400);
 assert.equal((await request(`/maintenance/${job.data.id}`,'DELETE')).status,204);
 assert.equal((await request(`/assets/${id}`,'DELETE')).status,204);assert.equal((await request(`/assets/${id}`)).status,404);
});
test('validation rejects malformed requests and SQL injection remains literal',async()=>{
 for(const body of [{name:'',category:'Pump'},{name:'X',category:'Wrong'},{name:'X',category:'Pump',purchase_cost:-1},{name:'X',category:'Pump',purchase_date:'2026-02-31'}]) assert.equal((await request('/assets','POST',body)).status,400);
 assert.equal((await request('/assets/1/lifecycle','PATCH',{stage:'INVALID'})).status,400);
 assert.equal((await request('/assets?search='+encodeURIComponent("' OR 1=1 --"))).data.length,0);
 assert.equal((await request('/assets/99999')).status,404);assert.equal((await request('/maintenance/99999/complete','PATCH',{})).status,404);
 assert.equal((await request('/assets','POST',{name:'Duplicate',category:'Pump',asset_code:'AST-0001'})).status,400);
});
test('local assistant uses live filters and refuses mutation requests',async()=>{
 process.env.AI_ENABLED='false';
 const a=(await request('/assistant','POST',{question:'Show pumps in poor condition.'})).data;assert.equal(a.mode,'local');assert.ok(a.assets.length);assert.ok(a.link.includes('category=Pump'));assert.ok(a.link.includes('condition=POOR'));
 const overdue=(await request('/assistant','POST',{question:'What maintenance is overdue?'})).data;assert.match(overdue.text,/2 overdue/);
 const refusal=(await request('/assistant','POST',{question:'Delete all assets'})).data;assert.match(refusal.text,/modify/);assert.equal((await request('/assets')).data.length,24);
 assert.equal((await request('/assistant','POST',{question:''})).status,400);
});
