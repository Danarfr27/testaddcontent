import { sign } from './_session.js';
import { getDeviceForUser, setDeviceForUser } from './device_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, deviceId } = req.body || {};

  // Perubahan anti bruteforce delay ms 500 - 1000 - versaagonon
  const delay = Math.floor(Math.random() * 500) + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  const userUser = process.env.USER_USER;
  const userPass = process.env.USER_PASS;
  const user2User = process.env.USER2_USER;
  const user2Pass = process.env.USER2_PASS;
  // Support additional users USER3..USER12 (10 more credentials)
  const additionalUsers = [];
  for (let i = 3; i <= 12; i++) {
    const u = process.env[`USER${i}_USER`];
    const p = process.env[`USER${i}_PASS`];
    if (u && p) additionalUsers.push({ user: u, pass: p });
  }

  let role = null;
  if (username === adminUser && password === adminPass) {
    role = 'admin';
  } else {
    const userCreds = [];
    if (userUser && userPass) userCreds.push({ user: userUser, pass: userPass });
    if (user2User && user2Pass) userCreds.push({ user: user2User, pass: user2Pass });
    userCreds.push(...additionalUsers);

    const matched = userCreds.find(c => c.user === username && c.pass === password);
    if (matched) role = 'user';
  }

  if (!role) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

  // enforce single-device per account
  if (!deviceId) return res.status(400).json({ ok: false, message: 'deviceId required' });
  const existing = getDeviceForUser(username);
  if (existing && existing !== deviceId) {
    return res.status(403).json({ ok: false, message: 'Account already in use on another device' });
  }

  // assign device to user
  setDeviceForUser(username, deviceId);

  const payload = { username, role, ts: Date.now(), deviceId };
  const token = sign(payload);

  // Set HttpOnly cookie
  const maxAge = 60 * 60 * 8; // 8 hours
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  res.setHeader('Set-Cookie', `ai_session=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; ${secure}SameSite=Lax`);

  return res.status(200).json({ ok: true, role });
}
