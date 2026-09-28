const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests',timeout:60000,workers:1,
 use:{baseURL:'http://127.0.0.1:5175',headless:true,viewport:{width:1440,height:1000},screenshot:'only-on-failure'},
 projects:[{name:'setup',testMatch:/auth\.setup\.js/},{name:'chromium',testIgnore:/auth\.setup\.js/,dependencies:['setup']}],
 webServer:[
  {command:'node server/server.js',url:'http://127.0.0.1:3002/api/health',reuseExistingServer:false,env:{PORT:'3002',DB_PATH:':memory:',JWT_SECRET:'e2e-only-jwt-secret-at-least-thirty-two-bytes',SETUP_TOKEN:'e2e-only-setup-key',CLIENT_ORIGINS:'http://127.0.0.1:5175',AI_ENABLED:'false'}},
  {command:'npm run dev --prefix client -- --port 5175',url:'http://127.0.0.1:5175',reuseExistingServer:false,env:{VITE_API_URL:'/api',API_PROXY_TARGET:'http://127.0.0.1:3002'}}
 ],reporter:'list'
});
