const {test,expect}=require('@playwright/test');
const {credentials}=require('./helpers');
test('first-time administrator setup validates confirmation and enters the workspace',async({page})=>{
 await page.goto('/assets?category=Pump');
 await expect(page.getByRole('heading',{name:'Create your administrator account'})).toBeVisible();
 await page.getByLabel('Full name').fill('Test Workspace Admin');
 await page.getByLabel('Workspace setup key').fill('e2e-only-setup-key');
 await page.getByLabel('Email address').fill(credentials.email);
 await page.getByLabel('Password',{exact:true}).fill(credentials.password);
 await page.getByLabel('Confirm password',{exact:true}).fill('different-long-password');
 await page.getByRole('button',{name:'Create account & continue'}).click();
 await expect(page.getByRole('alert')).toContainText('Passwords do not match');
 await page.getByLabel('Confirm password',{exact:true}).fill(credentials.password);
 await page.screenshot({path:'test-results/workspace-setup.png',fullPage:true});
 await page.getByRole('button',{name:'Create account & continue'}).click();
 await expect(page).toHaveURL(/\/assets\?category=Pump$/);
 await expect(page.getByRole('heading',{name:'Asset inventory',exact:true})).toBeVisible();
});
