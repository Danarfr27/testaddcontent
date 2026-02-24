// Simple serverless image analysis using Google Cloud Vision REST API
// Expects POST JSON: { image: '<base64 string>', filename: 'optional' }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { image, filename } = body;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Field "image" (base64) is required' });
  }

  const VISION_KEY = process.env.VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!VISION_KEY) {
    return res.status(500).json({ error: 'Server not configured. Set VISION_API_KEY environment variable.' });
  }

  // Build request to Google Vision API
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`;

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
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => 'Vision API error');
      return res.status(r.status).json({ error: 'Vision API error', details: txt });
    }

    const data = await r.json();
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

    return res.status(200).json({ filename: filename || null, summaryText: summary, raw: resp });
  } catch (err) {
    console.error('Vision API request failed', err);
    return res.status(500).json({ error: 'Vision request failed', message: String(err) });
  }
}
