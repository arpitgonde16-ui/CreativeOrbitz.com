// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ SUPABASE CLIENT HELPER (/api/_supabase.js)
// ═══════════════════════════════════════════════════════════════════
let createClient = null;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  // Handled gracefully if running in environment before npm install
}

const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key if present for server-side admin operations; fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (createClient && supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-ref')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  } catch (err) {
    console.warn('[CreativeOrbitz Backend] Could not initialize Supabase client:', err.message);
  }
}

function isSupabaseConfigured() {
  return supabase !== null;
}

// Input sanitizer helper to prevent XSS / malicious injections
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // strip dangerous HTML tags
    .slice(0, 5000);     // enforce reasonable length limit
}

// Email format validator
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) && email.length <= 254;
}

// In-memory rate limiting map for basic spam suppression
const rateLimitMap = new Map();
function checkRateLimit(key, windowMs = 15000, maxRequests = 3) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  
  rateLimitMap.set(key, record);
  return record.count <= maxRequests;
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  sanitizeInput,
  isValidEmail,
  checkRateLimit
};
