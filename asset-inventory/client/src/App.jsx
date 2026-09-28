import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppContext, LoadState, EmptyState } from './components/UI';
import { Sidebar, TopBar } from './components/Layout';
import { useApi } from './services/api';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';
import Maintenance from './pages/Maintenance';
import { Locations, Reports } from './pages/Insights';
import Assistant from './pages/Assistant';
import Login from './pages/Login';
import Account from './pages/Account';
import { AuthProvider, useAuth } from './services/auth';
export default function App(){return <AuthProvider><AuthGate/></AuthProvider>;}
function AuthGate(){const auth=useAuth(),location=useLocation();if(auth.loading||auth.error)return <div className="auth-loading"><LoadState loading={auth.loading} error={auth.error} retry={auth.restore}/></div>;if(location.pathname==='/login')return <Login/>;if(!auth.user)return <Navigate to="/login" replace state={{from:location.pathname+location.search}}/>;return <Workspace key={auth.user.id}/>;}
function Workspace(){const {data:metadata,loading,error,refresh}=useApi('/metadata');const [toast,setToast]=useState(''),[open,setOpen]=useState(false);
 function notify(message){setToast(message);setTimeout(()=>setToast(''),4000);}
 return <AppContext.Provider value={{metadata,notify}}><Sidebar open={open} onClose={()=>setOpen(false)}/><div className="main-shell"><TopBar onMenu={()=>setOpen(!open)}/><main>{loading||error?<LoadState loading={loading} error={error} retry={refresh}/>:<Routes><Route path="/" element={<Dashboard/>}/><Route path="/assets" element={<Assets/>}/><Route path="/assets/new" element={<AssetForm/>}/><Route path="/assets/:id" element={<AssetDetail/>}/><Route path="/assets/:id/edit" element={<AssetForm/>}/><Route path="/maintenance" element={<Maintenance/>}/><Route path="/locations" element={<Locations/>}/><Route path="/reports" element={<Reports/>}/><Route path="/assistant" element={<Assistant/>}/><Route path="/account" element={<Account/>}/><Route path="*" element={<EmptyState title="Page not found" description="Choose a page from the sidebar."/>}/></Routes>}</main><footer className="page-footer">InfraTrack <span>One record. Every stage. Complete visibility.</span><span>Infrastructure operations workspace</span></footer></div>{toast&&<div className="toast" role="status">{toast}</div>}</AppContext.Provider>;
}
