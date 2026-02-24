// Simple serverless proxy for image generation with key rotation
// Supports OpenAI Images (provider=openai) and Google Generative (default)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, size = '1024x1024', n = 1 } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Field "prompt" is required' });
  }

  const keysString = process.env.IMAGE_API_KEYS || process.env.GENERATIVE_API_KEY || process.env.GEMINI_API_KEYS || '';
  const apiKeys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);

  if (apiKeys.length === 0) {
    console.error('No image API keys configured');
    return res.status(500).json({ error: 'Server configuration error: No image API keys.' });
  }

  const provider = (process.env.IMAGE_PROVIDER || 'gemini').toLowerCase();
  const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';

  let lastError = null;
  let success = false;
  let finalData = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];

    try {
      if (provider === 'openai') {
        // OpenAI Images API
        const url = 'https://api.openai.com/v1/images/generations';
        const body = { prompt, n, size };

        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify(body)
        });

        if (r.ok) {
          finalData = await r.json();
          success = true;
          break;
        }

        if (r.status === 429) {
          lastError = { status: 429, message: 'Rate limit', provider: 'openai', attempt: i };
          continue;
        }

        // try to read text body for better diagnostics
        const txt = await r.text().catch(() => '');
        let errB = {};
        try { errB = txt ? JSON.parse(txt) : {}; } catch (e) { errB = { text: txt }; }
        lastError = { status: r.status, statusText: r.statusText, provider: 'openai', attempt: i, details: errB };
        break;
      } else {
        // Gemini / Google Generative Images via model endpoint
        // Prefer model-specific endpoint when a model is provided: /v1beta/models/{model}:generateImage
        const model = (req.body && req.body.model) ? String(req.body.model).trim() : GEMINI_IMAGE_MODEL;

        // Construct model path: allow either 'models/NAME' or plain 'NAME'
        let modelPath = model;
        if (!modelPath.startsWith('models/')) {
          modelPath = `models/${modelPath}`;
        }

        // Use the model-specific generateImage endpoint (recommended)
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateImage?key=${key}`;

        // Gemini expects a prompt object and image config; we provide size as-is
        const body = {
          prompt: { text: prompt },
          image: { size }
        };

        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (r.ok) {
          // Typical Gemini image response may include `images`, `data`, `imageUri` or `artifacts`
          finalData = await r.json();
          success = true;
          break;
        }

        if (r.status === 404) {
          // Possibly wrong model name or API not enabled
          const txt404 = await r.text().catch(() => '');
          let detail = {};
          try { detail = txt404 ? JSON.parse(txt404) : {}; } catch(e) { detail = { text: txt404 }; }
          detail.hint = detail.hint || `Verify model name ('${GEMINI_IMAGE_MODEL}' or provided '${model}'), enable Generative AI API, and ensure the key has Image generation permission.`;
          lastError = { status: r.status, statusText: r.statusText, provider: 'gemini', attempt: i, details: detail };
          break;
        }

        if (r.status === 429) {
          lastError = { status: 429, message: 'Rate limit', provider: 'gemini', attempt: i };
          continue;
        }

        const txt = await r.text().catch(() => '');
        let errB = {};
        try { errB = txt ? JSON.parse(txt) : {}; } catch (e) { errB = { text: txt }; }
        lastError = { status: r.status, statusText: r.statusText, provider: 'gemini', attempt: i, details: errB };
        break;
      }
    } catch (err) {
      console.error(`Key ${i} network error`, err);
      lastError = { status: 500, message: String(err), provider: provider, attempt: i };
      // try next key
    }
  }

  if (success && finalData) {
    return res.status(200).json(finalData);
  }

  const message = lastError?.message || lastError?.details?.message || (lastError?.details ? JSON.stringify(lastError.details) : undefined) || 'Image generation failed';
  return res.status(lastError?.status || 500).json({ error: 'Image generation failed', message, details: lastError });
}
