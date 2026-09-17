// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ GENERAL CONTACT API (/api/contact.js)
// ═══════════════════════════════════════════════════════════════════
const {
  supabase,
  isSupabaseConfigured,
  sanitizeInput,
  isValidEmail,
  checkRateLimit
} = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const name = sanitizeInput(body.name);
    const email = (body.email || '').trim().toLowerCase();
    const subject = sanitizeInput(body.subject || 'CreativeOrbitz Inquiry');
    const message = sanitizeInput(body.message);

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!message || message.length < 5) {
      return res.status(400).json({ error: 'Please enter a message (at least 5 characters).' });
    }

    const rateLimitKey = `${ip}_contact_${email}`;
    if (!checkRateLimit(rateLimitKey, 15000, 3)) {
      return res.status(429).json({ error: 'Too many messages sent. Please wait a moment.' });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name,
            email,
            subject,
            message,
            status: 'new'
          }
        ]);

      if (error) {
        console.error('[Supabase Error - Contact]:', error.message);
        return res.status(500).json({ error: 'Could not send message. Please try again or email us directly.' });
      }
    } else {
      console.log('[CreativeOrbitz Demo / Dev Mode] Contact message received:', { name, email, subject, message });
    }

    // Optional email alert
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'creativeorbitzz@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'notifications@creativeorbitz.com';

    if (resendApiKey && !resendApiKey.includes('your_resend')) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            subject: `📩 New Contact Message: ${name} — ${subject}`,
            html: `
              <h3>New Message from CreativeOrbitz Website</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            `
          })
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you for reaching out. We will get back to you shortly.'
    });

  } catch (err) {
    console.error('[Server Error in /api/contact]:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};
