import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Quick health check: allow GET for debugging route presence
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'send_email endpoint is present', envs: {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      FROM_EMAIL: !!process.env.FROM_EMAIL
    }});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html } = req.body || {};
  if (!to || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields: to and text/html' });
  }

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing SMTP configuration');
    return res.status(500).json({ error: 'Server configuration error: missing SMTP env vars' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: subject || 'Chatbot Conversation',
      text: text || undefined,
      html: html || undefined
    });

    return res.status(200).json({ ok: true, messageId: info.messageId || info.response });
  } catch (err) {
    console.error('Send email failed', err);
    return res.status(500).json({ error: 'Failed to send email', details: err && err.message });
  }
}
