import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const path = fileURLToPath(new URL('../.env', import.meta.url));
let content = existsSync(path) ? readFileSync(path,'utf8') : '';
let changed=false;
for (const name of ['JWT_SECRET','SETUP_TOKEN']) {
 const pattern=new RegExp(`^${name}=([^\\r\\n]*)`,'m'),match=content.match(pattern);
 if(match&&match[1].trim().length>=32&&!match[1].startsWith('replace-'))continue;
 const line=`${name}=${randomBytes(48).toString('hex')}`;
 content=match?content.replace(pattern,line):`${content}${content&&!content.endsWith('\n')?'\n':''}${line}\n`;
 changed=true;
}
if(changed) writeFileSync(path,content,{mode:0o600});
console.log('Server secrets configured in server/.env. Existing values preserved. Use SETUP_TOKEN once in the workspace setup screen.');
