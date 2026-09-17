// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ NEWSLETTER API (/api/newsletter.js)
// ═══════════════════════════════════════════════════════════════════
const {
  supabase,
  isSupabaseConfigured,
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
    const email = (body.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const rateLimitKey = `${ip}_newsletter_${email}`;
    if (!checkRateLimit(rateLimitKey, 10000, 2)) {
      return res.status(429).json({ error: 'Too many attempts. Please wait.' });
    }

    if (isSupabaseConfigured()) {
      // Upsert with ON CONFLICT DO NOTHING to prevent duplicate errors
      const { error } = await supabase
        .from('newsletter')
        .upsert([{ email }], { onConflict: 'email', ignoreDuplicates: true });

      if (error && error.code !== '23505') {
        console.error('[Supabase Error - Newsletter]:', error.message);
        return res.status(500).json({ error: 'Could not subscribe. Please try again.' });
      }
    } else {
      console.log('[CreativeOrbitz Demo / Dev Mode] Newsletter subscribed:', email);
    }

    return res.status(200).json({
      success: true,
      message: 'You are subscribed to CreativeOrbitz insights.'
    });

  } catch (err) {
    console.error('[Server Error in /api/newsletter]:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};
