import { format, parseISO } from 'date-fns';
export const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(v||0);
export const date=v=>v?format(parseISO(v.includes(' ')?v.replace(' ','T')+'Z':v),'dd MMM yyyy'):'—';
export const label=v=>v?v.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()):'—';
export const today=()=>format(new Date(),'yyyy-MM-dd');
export function exportCsv(rows,filename='assets.csv') {
 if(!rows.length)return;
 const keys=['asset_code','name','category','location','lifecycle_stage','condition','criticality','custodian','purchase_cost','warranty_expiry','estimated_eol','eol_status'];
 const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const blob=new Blob(['\ufeff'+[keys.join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
