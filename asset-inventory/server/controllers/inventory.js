import db from '../db/database.js';
import { addDays, addYears, format } from 'date-fns';
import { assetSchema, maintenanceSchema, parse, fail } from '../utils/validation.js';
import { requestContext } from '../utils/requestContext.js';
export const today = () => format(new Date(), 'yyyy-MM-dd');
const future = days => format(addDays(new Date(), days), 'yyyy-MM-dd');
export const event = (id,type,title,old=null,value=null,description=null) => db.prepare('INSERT INTO asset_events (asset_id,event_type,title,old_value,new_value,description,performed_by) VALUES (?,?,?,?,?,?,?)').run(id,type,title,old == null ? null : String(old),value == null ? null : String(value),description,requestContext.getStore()?.user?.email || 'System');
export function asset(id) { return db.prepare('SELECT * FROM assets WHERE id = ?').get(id) || fail('Asset not found',404); }
export function estimatedEol(a) { return a.purchase_date && a.expected_life_years ? format(addYears(new Date(`${a.purchase_date}T00:00:00`),a.expected_life_years),'yyyy-MM-dd') : null; }
export function listAssets(query = {}) {
 const clauses=[], values=[];
 if(query.search) { clauses.push('(' + ['asset_code','name','serial_number','manufacturer','model','location','custodian'].map(k=>`${k} LIKE ?`).join(' OR ') + ')'); values.push(...Array(7).fill(`%${query.search}%`)); }
 for(const [key,column] of Object.entries({category:'category',stage:'lifecycle_stage',condition:'condition',criticality:'criticality',location:'location'})) if(query[key]) { clauses.push(`${column} = ?`); values.push(query[key]); }
 return db.prepare(`SELECT * FROM assets ${clauses.length ? 'WHERE '+clauses.join(' AND ') : ''} ORDER BY id DESC`).all(...values).map(a=>({...a,estimated_eol:estimatedEol(a)}));
}
export function maintenance(assetId) {
 return db.prepare(`SELECT m.*,a.name AS asset_name,a.asset_code,a.criticality FROM maintenance_records m JOIN assets a ON a.id=m.asset_id ${assetId ? 'WHERE m.asset_id = ?' : ''} ORDER BY CASE WHEN m.status='COMPLETED' THEN 1 ELSE 0 END, CASE WHEN m.status='COMPLETED' THEN m.completed_date END DESC, m.scheduled_date ASC,m.id DESC`).all(...(assetId?[assetId]:[]));
}
export function detail(id) { const a=asset(id); return {...a,estimated_eol:estimatedEol(a),maintenance:maintenance(id),events:db.prepare('SELECT * FROM asset_events WHERE asset_id = ? ORDER BY created_at DESC,id DESC').all(id)}; }
export const createAsset = db.transaction(body => {
 const data=parse(assetSchema,body);
 if(!data.asset_code) { let n=Math.max(db.prepare("SELECT seq FROM sqlite_sequence WHERE name='assets'").get()?.seq || 0, db.prepare('SELECT COALESCE(MAX(id),0) AS n FROM assets').get().n)+1; do { data.asset_code=`AST-${String(n++).padStart(4,'0')}`; } while(db.prepare('SELECT id FROM assets WHERE asset_code=?').get(data.asset_code)); }
 if(data.lifecycle_stage==='RETIRED' && !data.retirement_date) data.retirement_date=today();
 const keys=Object.keys(data); const id=db.prepare(`INSERT INTO assets (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...Object.values(data)).lastInsertRowid;
 event(id,'CREATED','Asset registered',null,data.asset_code); return detail(id);
});
export const updateAsset = db.transaction((id,body) => {
 const previous=asset(id), data=parse(assetSchema.partial(),body);
 if(data.lifecycle_stage && data.lifecycle_stage!==previous.lifecycle_stage) data.retirement_date=data.lifecycle_stage==='RETIRED' ? today() : null;
 const keys=Object.keys(data).filter(k=>data[k]!==previous[k]);
 if(!keys.length) return detail(id);
 db.prepare(`UPDATE assets SET ${keys.map(k=>`${k}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...keys.map(k=>data[k]),id);
 const tracked={lifecycle_stage:['STATUS_CHANGED','Lifecycle'],condition:['CONDITION_CHANGED','Condition'],location:['LOCATION_CHANGED','Location'],custodian:['ASSIGNED','Custodian']};
 for(const key of keys) if(tracked[key]) { const [type,label]=tracked[key]; event(id,key==='lifecycle_stage' && data[key]==='RETIRED'?'RETIRED':type,`${label} changed from ${previous[key] || 'Unassigned'} to ${data[key] || 'Unassigned'}`,previous[key],data[key]); }
 const others=keys.filter(k=>!tracked[k]); if(others.length) event(id,'UPDATED','Asset information updated',JSON.stringify(Object.fromEntries(others.map(k=>[k,previous[k]]))),JSON.stringify(Object.fromEntries(others.map(k=>[k,data[k]]))));
 return detail(id);
});
export const deleteAsset=db.transaction(id=>{asset(id);db.prepare('DELETE FROM maintenance_records WHERE asset_id=?').run(id);db.prepare('DELETE FROM asset_events WHERE asset_id=?').run(id);db.prepare('DELETE FROM assets WHERE id=?').run(id);});
export const createMaintenance=db.transaction((id,body)=>{
 const a=asset(id); if(a.lifecycle_stage==='RETIRED') fail('Cannot schedule maintenance for a retired asset');
 const data=parse(maintenanceSchema,body); if(!data.scheduled_date) fail('Scheduled date is required');
 if(data.status && data.status!=='SCHEDULED') fail('New maintenance must be scheduled');
 data.asset_id=Number(id); const keys=Object.keys(data); const result=db.prepare(`INSERT INTO maintenance_records (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...Object.values(data));
 event(id,'MAINTENANCE_SCHEDULED',`Maintenance scheduled: ${data.title}`,null,data.scheduled_date);
 return db.prepare('SELECT * FROM maintenance_records WHERE id=?').get(result.lastInsertRowid);
});
export const updateMaintenance=db.transaction((id,body)=>{
 const old=db.prepare('SELECT * FROM maintenance_records WHERE id=?').get(id); if(!old) fail('Maintenance record not found',404);
 const data=parse(maintenanceSchema.partial(),body); if(data.scheduled_date==='') fail('Scheduled date is required');
 if(old.status==='COMPLETED' && data.status && data.status!=='COMPLETED') fail('Completed maintenance cannot be reopened');
 if(old.status==='CANCELLED' && data.status==='COMPLETED') fail('Cancelled maintenance cannot be completed');
 if(data.status==='COMPLETED') data.completed_date=data.completed_date || old.completed_date || today();
 const keys=Object.keys(data).filter(k=>old[k]!==data[k]);
 if(keys.length) { db.prepare(`UPDATE maintenance_records SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k=>data[k]),id); event(old.asset_id,data.status==='COMPLETED'&&old.status!=='COMPLETED'?'MAINTENANCE_COMPLETED':'UPDATED',`${data.status==='COMPLETED'&&old.status!=='COMPLETED'?'Maintenance completed':'Maintenance updated'}: ${data.title || old.title}`,JSON.stringify(old),JSON.stringify(data)); }
 return db.prepare('SELECT * FROM maintenance_records WHERE id=?').get(id);
});
export const deleteMaintenance=db.transaction(id=>{const m=db.prepare('SELECT * FROM maintenance_records WHERE id=?').get(id);if(!m) fail('Maintenance record not found',404);event(m.asset_id,'UPDATED',`Maintenance record deleted: ${m.title}`,JSON.stringify(m));db.prepare('DELETE FROM maintenance_records WHERE id=?').run(id);});
export function dashboard() {
 const assets=listAssets(), jobs=maintenance(), active=assets.filter(a=>a.lifecycle_stage!=='RETIRED');
 const due=jobs.filter(m=>!['COMPLETED','CANCELLED'].includes(m.status)&&m.scheduled_date&&m.scheduled_date<=future(30));
 const distribution=key=>Object.entries(assets.reduce((acc,a)=>{acc[a[key]]=(acc[a[key]]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));
 return {summary:{totalAssets:assets.length,totalAssetValue:assets.reduce((s,a)=>s+a.purchase_cost,0),operationalAssets:assets.filter(a=>a.lifecycle_stage==='OPERATIONAL').length,maintenanceAssets:assets.filter(a=>a.lifecycle_stage==='MAINTENANCE').length,criticalAssets:active.filter(a=>a.criticality==='CRITICAL'||a.condition==='CRITICAL').length,maintenanceDue:due.length},stageDistribution:distribution('lifecycle_stage'),categoryDistribution:distribution('category'),conditionDistribution:distribution('condition'),recentEvents:db.prepare('SELECT e.*,a.name AS asset_name,a.asset_code FROM asset_events e JOIN assets a ON a.id=e.asset_id ORDER BY e.created_at DESC,e.id DESC LIMIT 12').all(),maintenanceDue:due,warrantyExpiring:active.filter(a=>a.warranty_expiry>=today()&&a.warranty_expiry<=future(90)),endOfLifeAssets:active.filter(a=>a.estimated_eol&&a.estimated_eol<=format(addYears(new Date(),1),'yyyy-MM-dd')).map(a=>({...a,eol_status:a.estimated_eol<today()?'End of Life':'Approaching End of Life'}))};
}
