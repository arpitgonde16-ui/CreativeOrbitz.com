// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ PROJECT INQUIRIES API (/api/leads.js)
// ═══════════════════════════════════════════════════════════════════
const {
  supabase,
  isSupabaseConfigured,
  sanitizeInput,
  isValidEmail,
  checkRateLimit
} = require('./_supabase');

module.exports = async function handler(req, res) {
  // Set CORS and security headers
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
    
    // Parse body if string
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const name = sanitizeInput(body.name);
    const email = (body.email || '').trim().toLowerCase();
    const phone = sanitizeInput(body.phone);
    const company = sanitizeInput(body.company);
    const country = sanitizeInput(body.country);
    const service = sanitizeInput(body.service || body.selectedPlan || 'General Project');
    const budget = sanitizeInput(body.budget);
    const description = sanitizeInput(body.description || body.goals || body.message);
    const timeline = sanitizeInput(body.timeline);
    const referenceUrl = sanitizeInput(body.reference_url || body.channel);
    const source = sanitizeInput(body.source || 'website_project_modal');

    // Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Please provide a valid full name.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Rate limiting: max 3 submissions per IP/email per 20 seconds
    const rateLimitKey = `${ip}_${email}`;
    if (!checkRateLimit(rateLimitKey, 20000, 3)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
    }

    let leadId = null;

    if (isSupabaseConfigured()) {
      // 1. Insert into leads table
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([
          {
            name,
            email,
            phone,
            company,
            country,
            service,
            budget,
            message: description,
            source,
            status: 'new'
          }
        ])
        .select('id')
        .single();

      if (leadError) {
        console.error('[Supabase Error - Leads]:', leadError.message);
        return res.status(500).json({ error: 'Could not save your project request. Please try again or WhatsApp us.' });
      }

      leadId = leadData ? leadData.id : null;

      // 2. Insert into project_requests table
      const servicesArray = Array.isArray(body.services) && body.services.length > 0 
        ? body.services.map(s => sanitizeInput(s))
        : [service];

      const { error: projError } = await supabase
        .from('project_requests')
        .insert([
          {
            lead_id: leadId,
            project_type: service,
            services: servicesArray,
            description,
            budget,
            timeline,
            reference_url: referenceUrl,
            status: 'new'
          }
        ]);

      if (projError) {
        console.warn('[Supabase Warning - Project Requests]:', projError.message);
      }
    } else {
      console.log('[CreativeOrbitz Demo / Dev Mode] Lead received (Supabase not configured):', {
        name,
        email,
        service,
        budget,
        description
      });
      leadId = 'demo-' + Date.now();
    }

    // 3. Email Notification Dispatch (Resend API if configured)
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
            subject: `🚀 New Project Request: ${name} (${service})`,
            html: `
              <h2>New CreativeOrbitz Project Request</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone / WhatsApp:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Company:</strong> ${company || 'Not provided'}</p>
              <p><strong>Country:</strong> ${country || 'Not provided'}</p>
              <p><strong>Service:</strong> ${service}</p>
              <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
              <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p><strong>Channel / Reference:</strong> ${referenceUrl || 'Not provided'}</p>
              <p><strong>Description:</strong></p>
              <blockquote style="background:#f4f4f4;padding:12px;border-left:4px solid #FF5A1F;">${description || 'No description provided'}</blockquote>
              <p><em>Submitted via CreativeOrbitz Production Engine.</em></p>
            `
          })
        });
      } catch (emailErr) {
        console.warn('[Email Notification Dispatch Error]:', emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Project request received.',
      supporting: 'Our team will review your project and get back to you.',
      id: leadId
    });

  } catch (err) {
    console.error('[Server Error in /api/leads]:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};
