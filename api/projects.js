// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ PROJECTS API (/api/projects.js)
// ═══════════════════════════════════════════════════════════════════
const { supabase, isSupabaseConfigured } = require('./_supabase');

const FALLBACK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Hyper-Growth DTC Brand Campaign',
    category: 'Video Production',
    client: 'Aura Wellness',
    description: 'High-converting short-form reels and meta ad creatives that scaled subscriber acquisition.',
    thumbnail: 'assets/work-thumb-1.jpg',
    video_url: 'assets/videos/raw-after-editing.mp4',
    results: '+4.8X ROAS · 1.2M Organic Impressions',
    featured: true
  },
  {
    id: 'proj-2',
    title: 'AI UGC & Virtual Avatar Pipeline',
    category: 'AI Content',
    client: 'Nova Labs',
    description: 'Neural avatar synthesis and automated multi-language video ads.',
    thumbnail: 'assets/work-thumb-2.jpg',
    video_url: 'assets/videos/raw-after-editing.mp4',
    results: '34 AI Ad Variations Delivered in 48 Hours',
    featured: true
  },
  {
    id: 'proj-3',
    title: 'Personal Brand Viral Engine',
    category: 'Social Media Growth',
    client: 'Dr. K. Vance',
    description: 'Turned raw 60-minute podcast interviews into 25 high-retention viral reels monthly.',
    thumbnail: 'assets/work-thumb-3.jpg',
    video_url: 'assets/videos/raw-after-editing.mp4',
    results: '0 to 185k Instagram Followers in 90 Days',
    featured: true
  },
  {
    id: 'proj-4',
    title: 'Kinetic Brand Identity & Motion System',
    category: 'Creative & Branding',
    client: 'Kuro Robotics',
    description: 'Comprehensive design guidelines, 3D motion assets, and launch film.',
    thumbnail: 'assets/work-thumb-4.jpg',
    video_url: 'assets/videos/raw-after-editing.mp4',
    results: 'Featured on Product Hunt #1 Product of the Day',
    featured: false
  }
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, category, client, description, thumbnail, video_url, results, featured')
        .eq('published', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.status(200).json(data);
      }
    }

    // Return fallback projects if Supabase empty or unconfigured
    return res.status(200).json(FALLBACK_PROJECTS);
  } catch (err) {
    console.error('[Error in /api/projects]:', err);
    return res.status(200).json(FALLBACK_PROJECTS);
  }
};
