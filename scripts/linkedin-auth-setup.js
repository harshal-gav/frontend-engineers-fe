#!/usr/bin/env node
/**
 * LinkedIn OAuth2 Setup Helper
 * 
 * Run this script ONCE to get a LinkedIn access token for your Page.
 * 
 * Prerequisites:
 *   1. Create a LinkedIn App at https://www.linkedin.com/developers/
 *   2. Request "Community Management API" access on the Products tab
 *   3. Add http://localhost:3000/callback as an Authorized Redirect URL
 *   4. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in your .env
 * 
 * Usage:
 *   node scripts/linkedin-auth-setup.js
 */

import 'dotenv/config';
import http from 'http';
import { URL } from 'url';
import { exec } from 'child_process';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
// Uses "Share on LinkedIn" product (w_member_social) — posts from personal profile
// openid + profile needed to fetch your member URN
const SCOPES = 'openid profile w_member_social';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env');
  console.error('\nAdd these to your .env file:');
  console.error('  LINKEDIN_CLIENT_ID=your_client_id');
  console.error('  LINKEDIN_CLIENT_SECRET=your_client_secret\n');
  process.exit(1);
}

const STATE = Math.random().toString(36).substring(2);

const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('state', STATE);

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

// Start a temp server to catch the OAuth callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);

  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h1>❌ Authorization failed</h1><p>${error}: ${url.searchParams.get('error_description')}</p>`);
    server.close();
    process.exit(1);
    return;
  }

  if (state !== STATE) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>❌ State mismatch — possible CSRF attack</h1>');
    server.close();
    process.exit(1);
    return;
  }

  try {
    const tokenData = await exchangeCodeForToken(code);

    // Fetch the user's LinkedIn member ID (person URN)
    let memberId = 'unknown';
    try {
      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        memberId = meData.sub; // This is the person ID
      }
    } catch (e) {
      console.warn('Could not fetch member ID:', e.message);
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html><body style="font-family:system-ui; max-width:600px; margin:40px auto; padding:20px;">
        <h1>✅ LinkedIn Authorization Successful!</h1>
        <p>Your access token and member ID have been printed in the terminal.</p>
        <p>Copy them and add to your GitHub Secrets.</p>
        <p><strong>Token expires in ${Math.round(tokenData.expires_in / 86400)} days.</strong></p>
        <p>You can close this tab now.</p>
      </body></html>
    `);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ SUCCESS! Here are your LinkedIn credentials:');
    console.log('═'.repeat(60));
    console.log(`\nAccess Token:\n${tokenData.access_token}\n`);
    console.log(`Member ID (Person URN): ${memberId}`);
    console.log('═'.repeat(60));
    console.log(`Token type: ${tokenData.token_type}`);
    console.log(`Expires in: ${Math.round(tokenData.expires_in / 86400)} days`);
    if (tokenData.refresh_token) {
      console.log(`\nRefresh Token: ${tokenData.refresh_token}`);
    }
    console.log('\n📋 Next steps:');
    console.log('  1. Go to your GitHub repo → Settings → Secrets → Actions');
    console.log(`  2. Add secret: LINKEDIN_ACCESS_TOKEN = <your token above>`);
    console.log(`  3. Add secret: LINKEDIN_PERSON_ID = ${memberId}`);
    console.log('  4. Add secret: GEMINI_API_KEY = <your Gemini API key>');
    console.log('');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>❌ Token exchange failed</h1><pre>${err.message}</pre>`);
    console.error('Token exchange error:', err);
  }

  setTimeout(() => {
    server.close();
    process.exit(0);
  }, 2000);
});

server.listen(3000, () => {
  console.log('\n🔑 LinkedIn OAuth Setup');
  console.log('═'.repeat(40));
  console.log('\n1. Opening your browser for LinkedIn authorization...');
  console.log('2. Log in and authorize the app');
  console.log('3. You will be redirected back here\n');
  console.log(`Auth URL: ${authUrl.toString()}\n`);

  // Open browser
  const openCmd =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${openCmd} "${authUrl.toString()}"`);
});
