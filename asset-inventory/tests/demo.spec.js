const {test,expect}=require('@playwright/test');
const {login}=require('./helpers');
test.beforeEach(async({context})=>{await login(context.request);});
test('dashboard, inventory, CRUD, lifecycle, maintenance and history demo',async({page,request})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Every asset. A clearer picture.'})).toBeVisible();await expect(page.getByText('Total assets',{exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
 await page.getByRole('link',{name:'Asset inventory',exact:true}).click();await page.getByRole('textbox',{name:'Search assets',exact:true}).fill('Generator');await expect(page.getByRole('link',{name:'Diesel Generator DG-01',exact:true})).toBeVisible();
 await page.getByLabel('Lifecycle',{exact:true}).selectOption('OPERATIONAL');await expect(page.getByRole('link',{name:'Backup Generator DG-02',exact:true})).toHaveCount(0);
 await page.getByRole('link',{name:'Diesel Generator DG-01',exact:true}).click();await expect(page.getByRole('heading',{name:'Asset timeline'})).toBeVisible();
 await page.getByRole('link',{name:'Add asset',exact:true}).click();await page.getByLabel('Asset name').fill('Browser demo pump');await page.getByLabel('Category',{exact:true}).selectOption('Pump');await page.getByLabel('Purchase cost').fill('125000');await page.getByLabel('Location',{exact:true}).selectOption('Pump House');await page.getByLabel('Lifecycle stage').selectOption('OPERATIONAL');await page.getByRole('button',{name:'Save asset',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Browser demo pump',exact:true})).toBeVisible();const id=page.url().split('/').pop();
 try{
 await page.getByRole('link',{name:'Edit asset',exact:true}).click();await page.getByLabel('Custodian',{exact:true}).fill('Demo operator');await page.getByRole('button',{name:'Save asset',exact:true}).click();await expect(page.getByText('Custodian changed from Unassigned to Demo operator')).toBeVisible();
 await page.getByLabel('Change lifecycle',{exact:true}).selectOption('MAINTENANCE');await expect(page.getByText('Lifecycle changed from OPERATIONAL to MAINTENANCE')).toBeVisible();await page.getByLabel('Change lifecycle',{exact:true}).selectOption('OPERATIONAL');await expect(page.getByText('Lifecycle changed from MAINTENANCE to OPERATIONAL')).toBeVisible();
 await page.getByRole('button',{name:'Schedule maintenance',exact:true}).click();await page.getByLabel('Title',{exact:false}).fill('Browser preventive inspection');await page.getByLabel('Technician',{exact:true}).fill('Demo technician');await page.getByRole('dialog').getByRole('button',{name:'Schedule maintenance',exact:true}).click();await expect(page.getByText('Maintenance scheduled: Browser preventive inspection')).toBeVisible();
 await page.getByRole('link',{name:'Maintenance',exact:true}).click();const row=page.getByRole('row').filter({hasText:'Browser preventive inspection'});await row.getByRole('button',{name:'Mark complete'}).click();await page.getByLabel('Findings',{exact:true}).fill('Pressure is normal');await page.getByLabel('Action taken').fill('Inspected and lubricated');await page.getByRole('dialog').getByRole('button',{name:'Complete maintenance',exact:true}).click();await expect(row.getByText('Completed',{exact:true})).toBeVisible();
 await page.goto(`/assets/${id}`);await expect(page.getByText('Maintenance completed: Browser preventive inspection')).toBeVisible();await expect(page.getByText('Findings: Pressure is normal')).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'Browser demo pump',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Retire asset',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByLabel('Change lifecycle')).toHaveValue('RETIRED');
 await page.getByRole('button',{name:'Delete asset',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page).toHaveURL(/\/assets$/);
 }finally{const session=await request.get('/api/auth/me');const auth=await session.json();await request.delete(`/api/assets/${id}`,{headers:{'X-Requested-With':'InfraTrack','X-CSRF-Token':auth.csrfToken}});}
 expect(errors).toEqual([]);
});
test('reports, locations, assistant and tablet/mobile layouts',async({page})=>{
 await page.goto('/locations');await expect(page.getByRole('heading',{name:'Campus locations'})).toBeVisible();await page.getByRole('heading',{name:'Pump House',exact:true}).click();await expect(page.getByLabel('Location',{exact:true})).toHaveValue('Pump House');
 await page.goto('/reports');await expect(page.getByRole('heading',{name:'Replacement planning',exact:true})).toBeVisible();
 await page.goto('/assistant');await page.getByRole('button',{name:'What maintenance is overdue?'}).click();await expect(page.locator('.message.assistant')).toBeVisible({timeout:45000});await expect(page.locator('.message.assistant')).toContainText(/overdue/i);
 await page.screenshot({path:'test-results/assistant.png',fullPage:true});
 await page.setViewportSize({width:768,height:1024});await page.goto('/');await expect(page.getByRole('heading',{name:'Lifecycle distribution'})).toBeVisible();await page.screenshot({path:'test-results/dashboard-tablet.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('link',{name:'Asset inventory',exact:true}).click();await expect(page.getByRole('heading',{name:'Asset inventory',exact:true})).toBeVisible();
});

