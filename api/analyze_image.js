// Simple serverless image analysis using Google Cloud Vision REST API
// Supports multiple API keys via VISION_API_KEYS (comma/semicolon separated)
// Expects POST JSON: { image: '<base64 string>', filename: 'optional' }

// In-memory round-robin index (module-level so it persists across invocations when possible)
let __vision_key_index = 0;

function parseVisionKeys() {
  const raw = process.env.VISION_API_KEYS || process.env.VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY || '';
  if (!raw) return [];
  // Split by comma or semicolon and clean
  const parts = raw.split(/[;,\s]+/).map(s => (s||'').trim()).filter(Boolean);
  // If VISION_API_KEY provided separately (not in VISION_API_KEYS), ensure it's included
  const single = process.env.VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (single && parts.indexOf(single) === -1) parts.push(single);
  return parts;
}

async function tryRequestWithRotation(requestBody) {
  const keys = parseVisionKeys();
  if (!keys || keys.length === 0) throw new Error('no-vision-keys');

  const errors = [];
  const attempts = keys.length;

  for (let i = 0; i < attempts; i++) {
    const idx = (__vision_key_index++ % keys.length + keys.length) % keys.length;
    const key = keys[idx];
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`;

    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => 'Vision API error');
        errors.push({ keyIndex: idx, status: r.status, body: txt });
        // Retry for server/quota errors (429, 500, 502, 503). For other errors, stop and return.
        if ([429, 500, 502, 503].includes(r.status)) {
          // try next key
          continue;
        } else {
          // Non-retriable - return this error immediately
          const err = new Error('vision-error');
          err.status = r.status;
          err.body = txt;
          throw err;
        }
      }

      const data = await r.json();
      return { data, usedKeyIndex: idx, errors };
    } catch (err) {
      // Network or thrown error - record and try next key
      errors.push({ keyIndex: idx, error: String(err) });
      // continue to next key
      continue;
    }
  }

  // if we get here, all keys failed
  const e = new Error('all-vision-keys-failed');
  e.details = errors;
  throw e;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { image, filename } = body;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Field "image" (base64) is required' });
  }

  // Build request body for Vision API
  const requestBody = {
    requests: [
      {
        image: { content: image },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'TEXT_DETECTION', maxResults: 5 },
          { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }
        ]
      }
    ]
  };

  try {
    const result = await tryRequestWithRotation(requestBody);
    const data = result && result.data ? result.data : null;
    const resp = data && data.responses && data.responses[0] ? data.responses[0] : {};

    // Build human friendly summary
    let summary = '';

    if (resp.labelAnnotations && resp.labelAnnotations.length) {
      summary += 'Label terdeteksi:\n';
      const labels = resp.labelAnnotations.map(l => `${l.description} (${Math.round((l.score||0)*100)}%)`);
      summary += labels.join(', ') + '\n\n';
    }

    if (resp.localizedObjectAnnotations && resp.localizedObjectAnnotations.length) {
      summary += 'Objek yang dikenali:\n';
      const objs = resp.localizedObjectAnnotations.map(o => `${o.name} (${Math.round((o.score||0)*100)}%)`);
      summary += objs.join(', ') + '\n\n';
    }

    if (resp.textAnnotations && resp.textAnnotations.length) {
      const txt = resp.textAnnotations[0].description || '';
      summary += 'Teks terdeteksi:\n' + (txt.slice(0, 2000) || '-') + '\n\n';
    }

    if (resp.safeSearchAnnotation) {
      const s = resp.safeSearchAnnotation;
      summary += 'Analisis konten (SafeSearch):\n';
      summary += `Adult: ${s.adult || 'UNKNOWN'}, Violence: ${s.violence || 'UNKNOWN'}, Racy: ${s.racy || 'UNKNOWN'}\n\n`;
    }

    if (!summary) summary = 'Tidak ada label/objek/teks yang berhasil dideteksi.';

    return res.status(200).json({ filename: filename || null, summaryText: summary, raw: resp, usedKeyIndex: result.usedKeyIndex });
  } catch (err) {
    console.error('Vision API request failed', err);
    if (err && err.message === 'no-vision-keys') {
      return res.status(500).json({ error: 'Server not configured. Set VISION_API_KEYS or VISION_API_KEY environment variable.' });
    }
    if (err && err.details) {
      return res.status(502).json({ error: 'All vision keys failed', details: err.details });
    }
    const msg = String(err && (err.body || err.message || err) );
    return res.status(500).json({ error: 'Vision request failed', message: msg });
  }
}
