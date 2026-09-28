import { useCallback, useEffect, useState } from 'react';
const API_BASE_URL=import.meta.env.VITE_API_URL || '/api';
let csrfToken='';
export function setCsrfToken(value){csrfToken=value||'';}
export async function api(path,method='GET',body,signal) {
 let response;
 try {response=await fetch(API_BASE_URL+path,{method,credentials:'include',headers:{'Content-Type':'application/json','X-Requested-With':'InfraTrack',...(csrfToken?{'X-CSRF-Token':csrfToken}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});}
 catch(e){if(e.name==='AbortError') throw e;throw new Error('Cannot reach the server. Check that the API is running on port 3001.');}
 if(response.status===204)return null;
 const result=await response.json();if(!response.ok){if(response.status===401&&!['/auth/login','/auth/me','/auth/setup'].includes(path)){setCsrfToken('');window.dispatchEvent(new Event('auth-expired'));}const error=new Error(result.error||'Request failed');error.status=response.status;throw error;}return result;
}
export function useApi(path) {
 const [state,setState]=useState({data:null,loading:true,error:null});const [version,setVersion]=useState(0);
 const refresh=useCallback(()=>setVersion(v=>v+1),[]);
 useEffect(()=>{const controller=new AbortController();setState(s=>({...s,loading:true,error:null}));api(path,'GET',undefined,controller.signal).then(data=>setState({data,loading:false,error:null})).catch(e=>{if(e.name!=='AbortError')setState({data:null,loading:false,error:e.message});});return()=>controller.abort();},[path,version]);
 return {...state,refresh};
}
