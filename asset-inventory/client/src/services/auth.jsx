import { createContext, useContext, useEffect, useState } from 'react';
import { api, setCsrfToken } from './api';
const AuthContext=createContext(null);
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}) {
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[setupRequired,setSetupRequired]=useState(false),[expired,setExpired]=useState(false);
 function acceptSession(data){setCsrfToken(data.csrfToken);setUser(data.user);setSetupRequired(false);setExpired(false);}
 async function restore(){setLoading(true);setError('');try{const status=await api('/auth/status');setSetupRequired(status.setupRequired);if(!status.setupRequired){try{acceptSession(await api('/auth/me'));}catch(e){if(e.status!==401)throw e;setUser(null);setCsrfToken('');}}}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{restore();const expire=()=>{setUser(null);setExpired(true);setCsrfToken('');};window.addEventListener('auth-expired',expire);return()=>window.removeEventListener('auth-expired',expire);},[]);
 async function signIn(values){acceptSession(await api('/auth/login','POST',values));}
 async function setup(values){try{acceptSession(await api('/auth/setup','POST',values));}catch(e){if(e.status===409)await restore();throw e;}}
 async function signOut(){try{await api('/auth/logout','POST',{});}catch(e){if(e.status!==401)throw e;}setUser(null);setCsrfToken('');setExpired(false);}
 async function changePassword(values){acceptSession(await api('/auth/password','POST',values));}
 return <AuthContext.Provider value={{user,loading,error,setupRequired,expired,signIn,setup,signOut,restore,changePassword}}>{children}</AuthContext.Provider>;
}
