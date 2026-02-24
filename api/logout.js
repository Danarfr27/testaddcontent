import { parseCookies, verify } from './_session.js';
import { getDeviceForUser, clearDeviceForUser } from './device_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // attempt to clear device binding if provided and matching
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.ai_session;
    const payload = verify(token);
    const body = req.body || {};
    const deviceId = body.deviceId || null;
    if (payload && payload.username) {
      const assigned = getDeviceForUser(payload.username);
      if (deviceId && assigned && assigned === deviceId) {
        clearDeviceForUser(payload.username);
      }
    }
  } catch (e) {
    // ignore
  }

  // Clear cookie
  res.setHeader('Set-Cookie', `ai_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  return res.status(200).json({ ok: true });
}
