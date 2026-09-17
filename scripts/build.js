// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ PRODUCTION BUILD VERIFIER (scripts/build.js)
// ═══════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
console.log('🚀 Running CreativeOrbitz Production Build Verification...');

let errors = 0;

function checkFile(relPath, required = true) {
  const full = path.join(ROOT, relPath);
  if (fs.existsSync(full)) {
    const stats = fs.statSync(full);
    console.log(`  ✓ ${relPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    if (required) {
      console.error(`  ✗ Missing required file: ${relPath}`);
      errors++;
    } else {
      console.warn(`  ! Optional file not found: ${relPath}`);
    }
  }
}

// 1. Check Core HTML & Configurations
console.log('\n1. Checking Core Frontend & Meta Files:');
checkFile('index.html');
checkFile('robots.txt');
checkFile('sitemap.xml');
checkFile('vercel.json');
checkFile('package.json');
checkFile('.gitignore');
checkFile('.env.example');

// 2. Check Assets
console.log('\n2. Checking Core Assets & 3D Engine:');
checkFile('assets/three.min.js');
checkFile('assets/videos/raw-after-editing.mp4');
checkFile('assets/videos/real-raw-before.mp4');

// 3. Check Serverless API Routes
console.log('\n3. Validating Serverless API Routes:');
const apiFiles = ['_supabase.js', 'leads.js', 'contact.js', 'newsletter.js', 'projects.js'];
apiFiles.forEach(f => {
  const rel = path.join('api', f);
  checkFile(rel);
  try {
    require(path.join(ROOT, rel));
    console.log(`    → ${f} syntax check passed.`);
  } catch (err) {
    console.error(`    ✗ ${f} failed to load:`, err.message);
    errors++;
  }
});

// 4. Check Supabase Migrations
console.log('\n4. Checking Database Schemas:');
checkFile('supabase/migrations/20260917000000_production_schema.sql');
checkFile('supabase/seed.sql');

if (errors === 0) {
  console.log('\n✨ Production build verification succeeded with ZERO errors! Ready for Vercel deployment.\n');
  process.exit(0);
} else {
  console.error(`\n💥 Production build failed with ${errors} error(s).\n`);
  process.exit(1);
}
