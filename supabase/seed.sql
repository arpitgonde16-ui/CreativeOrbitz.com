-- ═══════════════════════════════════════════════════════════════════
-- CREATIVEORBITZ SEED DATA
-- File: supabase/seed.sql
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.projects (title, category, client, description, thumbnail, video_url, results, featured, published)
VALUES
(
    'Hyper-Growth DTC Brand Campaign',
    'Video Production',
    'Aura Wellness',
    'High-converting short-form reels and meta ad creatives that scaled subscriber acquisition.',
    'assets/work-thumb-1.jpg',
    'assets/videos/raw-after-editing.mp4',
    '+4.8X ROAS · 1.2M Organic Impressions',
    true,
    true
),
(
    'AI UGC & Virtual Avatar Pipeline',
    'AI Content',
    'Nova Labs',
    'Neural avatar synthesis and automated multi-language video ads.',
    'assets/work-thumb-2.jpg',
    'assets/videos/raw-after-editing.mp4',
    '34 AI Ad Variations Delivered in 48 Hours',
    true,
    true
),
(
    'Personal Brand Viral Engine',
    'Social Media Growth',
    'Dr. K. Vance',
    'Turned raw 60-minute podcast interviews into 25 high-retention viral reels monthly.',
    'assets/work-thumb-3.jpg',
    'assets/videos/raw-after-editing.mp4',
    '0 to 185k Instagram Followers in 90 Days',
    true,
    true
),
(
    'Kinetic Brand Identity & Motion System',
    'Creative & Branding',
    'Kuro Robotics',
    'Comprehensive design guidelines, 3D motion assets, and launch film.',
    'assets/work-thumb-4.jpg',
    'assets/videos/raw-after-editing.mp4',
    'Featured on Product Hunt #1 Product of the Day',
    false,
    true
);
