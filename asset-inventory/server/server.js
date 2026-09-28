import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({path:[fileURLToPath(new URL('./.env',import.meta.url)),fileURLToPath(new URL('../../.env',import.meta.url))],quiet:true});
const {default:app}=await import('./app.js');
const {seed}=await import('./db/seed.js');
seed();
const port=process.env.PORT || 3001;
app.listen(port,'127.0.0.1',()=>console.log(`Asset API ready at http://localhost:${port}/api`));
