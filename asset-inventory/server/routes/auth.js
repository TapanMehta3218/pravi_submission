import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import db from '../db/database.js';
import { parse, fail } from '../utils/validation.js';
import { publicUser, issueSession, requireAuth, requireCsrf, clearSession, equalSecret } from '../utils/auth.js';

const router = Router();
const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(12, 'Use at least 12 characters').refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be no more than 72 UTF-8 bytes');
const dummyHash = bcrypt.hashSync('timing-only-dummy-password-never-used', 12);
const loginLimit = rateLimit({ windowMs: 15*60*1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, skipSuccessfulRequests: true, message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' } });
const setupRequired = () => !db.prepare('SELECT id FROM users LIMIT 1').get();
router.use((req,res,next) => { res.set('Cache-Control','no-store'); next(); });
router.get('/status', (req,res) => res.json({ setupRequired: setupRequired() }));
router.post('/setup', loginLimit, async (req,res) => {
 if (!setupRequired()) fail('Workspace setup is already complete. Please sign in.', 409);
 const data = parse(z.object({ name: z.string().trim().min(2).max(100), email, password, setupToken: z.string().min(1).max(256) }), req.body);
 if (!process.env.SETUP_TOKEN || !equalSecret(data.setupToken,process.env.SETUP_TOKEN)) fail('The setup key is incorrect. Check the server configuration.', 403);
 const hash = await bcrypt.hash(data.password,12);
 const user = db.transaction(() => {
  if (!setupRequired()) fail('Workspace setup is already complete. Please sign in.',409);
  const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(data.name,data.email,hash);
  return db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
 })();
 res.status(201).json(issueSession(user,res));
});
router.post('/login', loginLimit, async (req,res) => {
 const data = parse(z.object({ email, password: z.string().min(1).max(256) }),req.body);
 const user = db.prepare('SELECT * FROM users WHERE email=?').get(data.email);
 const valid = await bcrypt.compare(data.password,user?.password_hash || dummyHash);
 if (!user || !valid) fail('Email or password is incorrect.',401);
 res.json(issueSession(user,res));
});
router.use(requireAuth,requireCsrf);
router.get('/me',(req,res) => res.json({user:publicUser(req.user),csrfToken:req.authSession.csrf_token}));
router.post('/logout',(req,res) => {
 db.prepare('DELETE FROM auth_sessions WHERE id=?').run(req.authSession.id);
 clearSession(res); res.status(204).end();
});
router.post('/password', loginLimit, async(req,res) => {
 const data = parse(z.object({currentPassword:z.string().min(1).max(256),newPassword:password}),req.body);
 const user=db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
 if (!await bcrypt.compare(data.currentPassword,user.password_hash)) fail('Current password is incorrect.',400);
 if (data.currentPassword===data.newPassword) fail('Choose a different password.');
 const hash=await bcrypt.hash(data.newPassword,12);
 db.transaction(() => { const updated=db.prepare('UPDATE users SET password_hash=? WHERE id=? AND password_hash=?').run(hash,user.id,user.password_hash);if(!updated.changes)fail('Password was changed in another session. Sign in again.',401);db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id); })();
 res.json(issueSession(user,res));
});
export default router;
