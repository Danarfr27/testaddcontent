import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';

function base64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(b) {
  // add padding
  const pad = 4 - (b.length % 4);
  const base64 = b.replace(/-/g, '+').replace(/_/g, '/') + (pad < 4 ? '='.repeat(pad) : '');
  return Buffer.from(base64, 'base64').toString();
}

export function sign(payload) {
  const json = JSON.stringify(payload);
  const b = base64urlEncode(json);
  const sig = crypto.createHmac('sha256', SECRET).update(b).digest('hex');
  return `${b}.${sig}`;
}

export function verify(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(b).digest('hex');
  try {
    const a = Buffer.from(expected, 'hex');
    const c = Buffer.from(sig, 'hex');
    if (a.length !== c.length) return null;
    if (!crypto.timingSafeEqual(a, c)) return null;
  } catch (e) {
    return null;
  }
  try {
    const json = base64urlDecode(b);
    const payload = JSON.parse(json);

    // Enforce 8 hours expiration
    const MAX_AGE = 8 * 60 * 60 * 1000;
    if (Date.now() - (payload.ts || 0) > MAX_AGE) return null;

    return payload;
  } catch (e) {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').map(c => c.trim()).reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return acc;
    const name = pair.slice(0, idx);
    const val = pair.slice(idx + 1);
    acc[name] = val;
    return acc;
  }, {});
}
