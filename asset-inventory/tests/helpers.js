const credentials={email:'admin@example.test',password:'e2e-workspace-passphrase'};
async function login(request){const response=await request.post('/api/auth/login',{headers:{'X-Requested-With':'InfraTrack'},data:credentials});if(!response.ok())throw new Error(`Test sign-in failed: ${response.status()}`);return response.json();}
module.exports={credentials,login};
