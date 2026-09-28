import { createContext, useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Inbox, X, Check, ArrowUpRight } from 'lucide-react';
import { date, label } from '../utils/format';
export const AppContext=createContext({});
export const useApp=()=>useContext(AppContext);
export function StatusBadge({value}) {return <span className={`badge badge-${value?.toLowerCase()}`}><span className="badge-dot"/>{label(value)}</span>;}
export const ConditionBadge=StatusBadge;
export const CriticalityBadge=StatusBadge;
export function PageHeading({eyebrow='WORKSPACE',title,description,children}) {return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="actions">{children}</div></div>;}
export function EmptyState({title='Nothing here yet',description='Try adjusting your filters or add a new record.'}){return <div className="empty"><Inbox size={32}/><h3>{title}</h3><p>{description}</p></div>;}
export function LoadState({loading,error,retry}) {if(error)return <div role="alert" className="error"><AlertTriangle size={20}/><span>{error}</span>{retry&&<button onClick={retry}>Try again</button>}</div>;if(loading)return <div aria-label="Loading" className="loading-grid">{[1,2,3,4].map(i=><div className="skeleton" key={i}/>)}</div>;return null;}
export function StatCard({title,value,note,icon:Icon,tone='blue'}){return <div className="card stat"><div className="stat-top"><span>{title}</span><span className={`icon-box ${tone}`}><Icon size={19}/></span></div><strong>{value}</strong><small>{note}</small></div>;}
export function DataTable({headers,children}){return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;}
export function Timeline({events}) {return <div className="timeline">{events.length?events.map(e=><div className="timeline-item" key={e.id}><span className="timeline-dot"><Check size={11}/></span><div><strong>{e.title}</strong>{e.asset_name&&<Link to={`/assets/${e.asset_id}`}>{e.asset_code} · {e.asset_name}</Link>}<small>{date(e.created_at)} · {e.performed_by}</small></div></div>):<EmptyState title="No activity yet"/>}</div>;}
export function AlertCard({title,count,children,link}) {return <section className="card"><div className="card-heading"><h2>{title}</h2><span className="count">{count}</span>{link&&<Link to={link} aria-label={`View ${title}`}><ArrowUpRight size={18}/></Link>}</div>{children}</section>;}
export function Modal({title,onClose,children}) {
 const ref=useRef(null);
 useEffect(()=>{const node=ref.current;node.showModal();return()=>node.close();},[]);
 return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</dialog>;
}
export function ConfirmDialog({title,description,onClose,onConfirm,busy}){return <Modal title={title} onClose={onClose}><p>{description}</p><div className="form-actions"><button className="button" onClick={onClose}>Cancel</button><button disabled={busy} className="button danger" onClick={onConfirm}>{busy?'Working…':'Confirm'}</button></div></Modal>;}
