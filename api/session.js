import { verify, parseCookies } from './_session.js';
import { getDeviceForUser } from './device_store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.ai_session;
  const payload = verify(token);
  if (!payload) return res.status(200).json({ authenticated: false });

  // ensure token's deviceId matches server-side mapping (single-device enforcement)
  try {
    const assigned = getDeviceForUser(payload.username);
    if (assigned && payload.deviceId && assigned !== payload.deviceId) {
      // token device does not match assigned device -> not authenticated
      return res.status(200).json({ authenticated: false });
    }
  } catch (e) {}

  return res.status(200).json({ authenticated: true, user: { username: payload.username, role: payload.role } });
}
