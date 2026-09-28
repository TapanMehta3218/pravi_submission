import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, UserRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../services/auth';
export default function AccountMenu(){const {user,signOut}=useAuth();const [busy,setBusy]=useState(false),[error,setError]=useState('');async function logout(){setBusy(true);setError('');try{await signOut();}catch(e){setError(e.message);}finally{setBusy(false);}}
 const initials=user.name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
 return <details className="account-menu"><summary aria-label="Account menu"><span className="account-avatar">{initials}</span><ChevronDown size={13}/></summary><div className="account-popover"><strong>{user.name}</strong><small>{user.email}</small><Link to="/account" onClick={e=>e.currentTarget.closest('details').removeAttribute('open')}><UserRound size={16}/>Your account</Link><button disabled={busy} onClick={logout}><LogOut size={16}/>{busy?'Signing out…':'Sign out'}</button>{error&&<p role="alert">{error}</p>}</div></details>;
}
