#!/usr/bin/env node
/**
 * Combined Social Media Multi-Poster (LinkedIn + Twitter/X)
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs both the LinkedIn Auto-Poster and the Twitter/X Auto-Poster in one command:
 *   1. Generates and publishes the 3 posts to LinkedIn (via LinkedIn REST API)
 *   2. Generates and publishes the 3 posts to Twitter/X (via Playwright with saved session)
 * 
 * Flags:
 *   --dry-run   - Preview generated posts on both platforms without publishing
 *   --headed    - Run Twitter Playwright browser in headed/visible mode
 * 
 * Usage:
 *   node scripts/post-all-socials.js
 *   node scripts/post-all-socials.js --dry-run
 *   npm run post:all
 *   npm run post:all:dry
 */

const { spawn } = require('child_process');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const IS_HEADED = process.argv.includes('--headed');

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  console.log('\n🌟 Combined Multi-Platform Social Poster (LinkedIn + Twitter/X)');
  console.log('═'.repeat(65));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE ENABLED — no posts will be published\n');

  const args = [];
  if (DRY_RUN) args.push('--dry-run');
  if (IS_HEADED) args.push('--headed');

  // 1. Post to LinkedIn
  console.log('\n[1/2] 🔷 Running LinkedIn Auto-Poster...');
  console.log('─'.repeat(65));
  try {
    await runScript(path.join(__dirname, 'post-to-linkedin.js'), DRY_RUN ? ['--dry-run'] : []);
    console.log('✅ LinkedIn stage completed successfully.');
  } catch (err) {
    console.error('❌ LinkedIn stage encountered an error:', err.message);
  }

  // 2. Post to Twitter/X
  console.log('\n[2/2] 🐦 Running Twitter/X Auto-Poster...');
  console.log('─'.repeat(65));
  try {
    await runScript(path.join(__dirname, 'post-to-twitter.js'), args);
    console.log('✅ Twitter/X stage completed successfully.');
  } catch (err) {
    console.error('❌ Twitter/X stage encountered an error:', err.message);
  }

  console.log('\n' + '═'.repeat(65));
  console.log('🎉 Combined posting run finished!');
  console.log('═'.repeat(65) + '\n');
}

main().catch((err) => {
  console.error('\n❌ Multi-poster fatal error:', err);
  process.exit(1);
});
