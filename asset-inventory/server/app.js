import express from 'express';
import cors from 'cors';
import router from './routes/api.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import { requireAuth, requireCsrf } from './utils/auth.js';
const app=express();
app.disable('x-powered-by');
const origins=(process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174').split(',').map(x=>x.trim());
app.use(cors({origin:origins,credentials:true}));
app.use(express.json({limit:'64kb'}));
app.use(cookieParser());
app.use((req,res,next)=>{
 res.set('Cache-Control','no-store');
 if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
  if (req.get('Origin') && !origins.includes(req.get('Origin'))) return res.status(403).json({error:'Origin not allowed'});
  if (req.get('X-Requested-With')!=='InfraTrack') return res.status(403).json({error:'Missing request security header'});
 }
 next();
});
app.get('/api/health',(req,res)=>res.json({status:'ok'}));
app.use('/api/auth',authRouter);
app.use('/api',requireAuth,requireCsrf,router);
app.use((req,res)=>res.status(404).json({error:'Endpoint not found'}));
app.use((err,req,res,next)=>{
 const status=err.status || (err.code?.startsWith('SQLITE_CONSTRAINT')?400:500);
 res.status(status).json({error:status===500?'An unexpected server error occurred':err.code?.startsWith('SQLITE_CONSTRAINT')?'Asset code already exists or data violates a database constraint':err.message});
 if(status===500) console.error('Request failed:',err.name);
});
export default app;
