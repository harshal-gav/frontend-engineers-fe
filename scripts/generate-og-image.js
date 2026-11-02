#!/usr/bin/env node
/**
 * Script to generate a minimalist, authentic Open Graph (OG) image for FrontendEngineers.com
 * Color scheme matches the website's exact light theme:
 * Clean white/off-white background, Royal Blue (#2563eb), Slate text (#0f172a), Emerald badges (#166534).
 */

const { chromium } = require('playwright');
const path = require('path');

async function generateOgImage() {
  const browser = await chromium.launch();
  
  // 1200 x 630 is the universal OpenGraph standard (Twitter, LinkedIn, Slack, Discord)
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // 2x retina scale for razor-sharp typography
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 1200px;
      height: 630px;
      background: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 64px;
      position: relative;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Subtle technical dot grid pattern matching clean developer theme */
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
      background-size: 28px 28px;
      opacity: 0.55;
      pointer-events: none;
    }

    /* Soft ambient blue/emerald glow gradients in the corners */
    .glow-left {
      position: absolute;
      top: -140px;
      left: -140px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
      pointer-events: none;
    }

    .glow-right {
      position: absolute;
      bottom: -140px;
      right: -100px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(5, 150, 105, 0.06) 0%, rgba(255, 255, 255, 0) 70%);
      pointer-events: none;
    }

    /* Crisp card outline frame */
    .inner-frame {
      position: absolute;
      inset: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      pointer-events: none;
      box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.015);
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: #2563eb;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.02em;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }

    .brand-name {
      font-size: 23px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    /* Status Pill - Matches homepage: bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] */
    .status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      color: #166534;
      letter-spacing: 0.01em;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #16a34a;
      border-radius: 50%;
      box-shadow: 0 0 8px #22c55e;
    }

    /* Main Section */
    .main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 48px;
      position: relative;
      z-index: 10;
      margin: auto 0;
    }

    .left-content {
      flex: 1;
      max-width: 630px;
    }

    /* Category Pill - Matches homepage referral/category pill */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
      font-family: 'JetBrains Mono', monospace;
    }

    h1 {
      font-size: 53px;
      font-weight: 900;
      line-height: 1.08;
      letter-spacing: -0.04em;
      color: #0f172a;
      margin-bottom: 16px;
    }

    h1 span.highlight {
      color: #2563eb;
    }

    .tagline {
      font-size: 19px;
      line-height: 1.5;
      color: #475569;
      font-weight: 400;
      margin-bottom: 24px;
    }

    .tagline strong {
      color: #0f172a;
      font-weight: 700;
    }

    .tech-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tech-pill {
      padding: 5px 13px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      font-family: 'JetBrains Mono', monospace;
    }

    .tech-pill.accent {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
    }

    /* Stacked Cards Preview - Matches exact site job cards */
    .card-stack {
      position: relative;
      width: 410px;
      height: 270px;
    }

    .card-back {
      position: absolute;
      top: -24px;
      right: -16px;
      width: 395px;
      height: 210px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 18px 24px;
      opacity: 0.75;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }

    .card-front {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 405px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .company-badge {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .company-avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: #2563eb;
    }

    .company-info {
      display: flex;
      flex-direction: column;
    }

    .company-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .company-meta {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .verified-badge {
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 7px;
      color: #166534;
    }

    .job-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }

    .card-tags {
      display: flex;
      gap: 6px;
    }

    .card-tag {
      font-size: 11.5px;
      padding: 3px 9px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 13px;
      border-top: 1px solid #f1f5f9;
      font-size: 13px;
      color: #64748b;
    }

    .card-location {
      font-weight: 600;
      color: #059669;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .card-salary {
      font-weight: 700;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Footer Bar */
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      position: relative;
      z-index: 10;
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
    }

    .features-row {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #334155;
    }

    .check-icon {
      color: #2563eb;
      font-weight: 800;
    }

    .domain {
      font-family: 'JetBrains Mono', monospace;
      color: #2563eb;
      font-size: 13.5px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow-left"></div>
  <div class="glow-right"></div>
  <div class="inner-frame"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="logo-icon">FE</div>
      <div class="brand-name">FrontendEngineers.com</div>
    </div>
    <div class="status-pill">
      <div class="status-dot"></div>
      <span>850+ Verified Active Roles</span>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main">
    <div class="left-content">
      <div class="badge">
        <span>⚡ 100% REMOTE</span> • <span>ZERO GHOST LISTINGS</span>
      </div>
      <h1>
        Remote Frontend<br>
        <span class="highlight">Developer Jobs</span>
      </h1>
      <p class="tagline">
        <strong>Real remote frontend jobs. Zero ghost listings.</strong><br>
        Curated React, Next.js, TypeScript & Vue positions from remote-first companies worldwide.
      </p>
      <div class="tech-pills">
        <span class="tech-pill accent">React</span>
        <span class="tech-pill accent">Next.js</span>
        <span class="tech-pill accent">TypeScript</span>
        <span class="tech-pill">Vue</span>
        <span class="tech-pill">Angular</span>
        <span class="tech-pill">Tailwind</span>
      </div>
    </div>

    <!-- Stacked Real Card Preview -->
    <div class="card-stack">
      <!-- Back Card -->
      <div class="card-back">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 2px;">Techstars Startup • Remote</div>
        <div style="font-size: 15px; font-weight: 700; color: #334155;">Staff Frontend Architect</div>
      </div>

      <!-- Front Card -->
      <div class="card-front">
        <div class="card-top">
          <div class="company-badge">
            <div class="company-avatar">⚡</div>
            <div class="company-info">
              <span class="company-name">Remote-First Tech</span>
              <span class="company-meta">Verified Direct</span>
            </div>
          </div>
          <span class="verified-badge">✓ Verified Today</span>
        </div>
        <div class="job-title">Senior Frontend Engineer</div>
        <div class="card-tags">
          <span class="card-tag">Next.js 15</span>
          <span class="card-tag">React</span>
          <span class="card-tag">TypeScript</span>
        </div>
        <div class="card-footer">
          <span class="card-location">🌍 100% Remote</span>
          <span class="card-salary">$140k – $175k</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Bar -->
  <div class="footer-bar">
    <div class="features-row">
      <div class="feature-item">
        <span class="check-icon">✓</span> 100% Verified Listings
      </div>
      <div class="feature-item">
        <span class="check-icon">✓</span> Direct Employer Links
      </div>
      <div class="feature-item">
        <span class="check-icon">✓</span> Zero Middleman Portals
      </div>
    </div>
    <div class="domain">frontendengineers.com</div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(600);

  const publicDir = path.resolve(__dirname, '../public');
  const targetJpg = path.join(publicDir, 'og-image.jpg');
  const targetPng = path.join(publicDir, 'og-image.png');

  // Save both JPG (96% quality, crisp rendering) and PNG
  await page.screenshot({ path: targetPng, type: 'png' });
  await page.screenshot({ path: targetJpg, type: 'jpeg', quality: 96 });

  await browser.close();

  console.log('✅ Generated website-matching light theme OG image at:');
  console.log('   - ' + targetJpg);
  console.log('   - ' + targetPng);
}

generateOgImage().catch((err) => {
  console.error('❌ Failed to generate OG image:', err);
  process.exit(1);
});
