import jwt from 'jsonwebtoken';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import db from '../db/database.js';
import { fail } from './validation.js';
import { requestContext } from './requestContext.js';

const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret) < 32 || secret.startsWith('replace-')) throw new Error('JWT_SECRET must contain at least 32 random bytes. Run npm run configure in server before starting.');
export const COOKIE_NAME = 'infratrack_session';
const ttl = 8 * 60 * 60;
const issuer = 'infratrack-api';
const audience = 'infratrack-web';
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api' };
export const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role });
export function equalSecret(a, b) {
 if (typeof a !== 'string' || typeof b !== 'string') return false;
 const left = Buffer.from(a), right = Buffer.from(b);
 return left.length === right.length && timingSafeEqual(left, right);
}
export function issueSession(user, res) {
 const id = randomBytes(32).toString('hex'), csrfToken = randomBytes(32).toString('hex');
 db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(Math.floor(Date.now() / 1000));
 db.prepare('INSERT INTO auth_sessions (id,user_id,csrf_token,expires_at) VALUES (?,?,?,?)').run(id, user.id, csrfToken, Math.floor(Date.now() / 1000) + ttl);
 const token = jwt.sign({}, secret, { algorithm: 'HS256', issuer, audience, subject: String(user.id), jwtid: id, expiresIn: ttl });
 res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ttl * 1000 });
 return { user: publicUser(user), csrfToken };
}
export function clearSession(res) { res.clearCookie(COOKIE_NAME, cookieOptions); }
export function requireAuth(req, res, next) {
 try {
  const claims = jwt.verify(req.cookies?.[COOKIE_NAME], secret, { algorithms: ['HS256'], issuer, audience });
  if (typeof claims.sub !== 'string' || typeof claims.jti !== 'string') throw new Error('Invalid claims');
  const session = db.prepare('SELECT * FROM auth_sessions WHERE id=? AND user_id=? AND expires_at>?').get(claims.jti, claims.sub, Math.floor(Date.now()/1000));
  if (!session) throw new Error('Expired session');
  const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(session.user_id);
  if (!user) throw new Error('Missing user');
  req.user = user; req.authSession = session;
 } catch {
  clearSession(res);
  return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
 }
 requestContext.run({ user: req.user }, next);
}
export function requireCsrf(req, res, next) {
 if (!['GET','HEAD','OPTIONS'].includes(req.method) && !equalSecret(req.get('X-CSRF-Token'), req.authSession.csrf_token)) fail('Security check failed. Refresh the page and try again.', 403);
 next();
}
